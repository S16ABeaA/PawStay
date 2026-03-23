// Mount in app.ts: app.use('/api/chat', require('./routes/chat'))
import { Router, Request, Response } from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp"; // Added: server-side in-memory image compression before storage upload
import { supabaseAdmin } from "../config/supabaseAdmin";
import { createSession, getMessageCount, persistMessage } from "../services/chatSessionService";
import { fetchPetContext, formatContextForPrompt } from "../services/contextService";
import { parseRecommendationBlock, saveRecommendation } from "../services/recommendationService";
import { runSummarization, summarizeIfNeeded } from "../services/summarizationService";
import { extractAndSaveHealthSummary } from "../services/healthExtractionService";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

function getAuthToken(req: Request): string | null {
  const headerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice("Bearer ".length).trim()
    : null;
  const cookieToken = (req.cookies?.["sb-access-token"] as string | undefined) || null;
  return headerToken || cookieToken;
}

async function resolveUserIdFromToken(authToken: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.getUser(authToken);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

function supabaseAnonClient(jwt: string): SupabaseClient {
  const supabaseUrl = process.env.PAW_STAY_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_PAW_STAY_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  return createClient(supabaseUrl || "", supabaseAnonKey || "", {
    global: {
      headers: { Authorization: `Bearer ${jwt}` },
    },
  });
}

router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const jwt = getAuthToken(req);
    if (!jwt) return res.status(401).json({ error: "Authorization header required" });

    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    if (!req.body.pet_id) {
      return res.status(400).json({ error: "pet_id is required" });
    }

    const sourceTypeInput = req.body.source_type;
    const sourceType = sourceTypeInput || "image";
    if (sourceTypeInput && sourceType !== "image" && sourceType !== "medical_record") {
      return res.status(400).json({ error: "source_type must be image or medical_record" });
    }

    let uploadBuffer = req.file.buffer; // Added: mutable buffer so we can switch to compressed bytes
    let uploadContentType = req.file.mimetype; // Added: mutable MIME so compressed images upload as JPEG
    let path = `${req.body.pet_id}/${Date.now()}-${req.file.originalname}`; // Added: mutable path so extension can change to .jpg

    if (req.file.mimetype.startsWith("image/")) { // Added: skip compression for PDFs and non-image uploads
      try {
        const compressed = await sharp(req.file.buffer)
          .resize({ width: 800, withoutEnlargement: true })
          .jpeg({ quality: 75 })
          .toBuffer();

        uploadBuffer = compressed; // Added: upload compressed bytes instead of original bytes
        uploadContentType = "image/jpeg"; // Added: force content type to JPEG for compressed images
        const baseName = req.file.originalname.replace(/\.[^.]+$/, ""); // Added: preserve name while replacing extension
        path = `${req.body.pet_id}/${Date.now()}-${baseName}.jpg`; // Added: ensure storage path and public URL use .jpg
      } catch (err: any) {
        console.warn("[chatUpload] compression failed, uploading original:", err.message); // Added: required fallback log when compression fails
      }
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from("pet-medical-files")
      .upload(path, uploadBuffer, { contentType: uploadContentType }); // Added: uses compressed/original fallback values

    if (uploadError) {
      throw new Error("Storage upload failed: " + uploadError.message);
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("pet-medical-files").getPublicUrl(path);

    const result = await extractAndSaveHealthSummary({
      petId: req.body.pet_id,
      fileBuffer: uploadBuffer, // Added: downstream health analysis uses actual uploaded bytes
      mimeType: uploadContentType, // Added: downstream health analysis gets matching MIME
      sourceType,
      fileUrl: publicUrl,
    });

    return res.status(200).json({
      health_summary_id: result.healthSummaryId,
      extracted_data: result.extractedData,
      health_check: result.healthCheckResult,
    });
  } catch (err: any) {
    console.error("[upload] pet_id:", req.body.pet_id, err.message);
    return res.status(500).json({
      error: "Upload and extraction failed",
      detail: err.message,
    });
  }
});

router.post("/message", async (req: Request, res: Response) => {
  const body = req.body || {};
  const message = body.message;
  const petIdFromBody = body.pet_id || body.petId;
  const sessionIdFromBody = body.session_id || body.sessionId;
  const userIdFromBody = body.user_id || body.userId;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  const jwt = getAuthToken(req);
  if (!jwt) return res.status(401).json({ error: "Authorization header required" });

  const anonClient = supabaseAnonClient(jwt);

  const resolvedUserId = (await resolveUserIdFromToken(jwt)) || userIdFromBody || null;
  if (!resolvedUserId) {
    return res.status(401).json({ error: "Unable to resolve authenticated user" });
  }

  let petId = petIdFromBody || null;

  let sessionId = sessionIdFromBody || null;

  try {
    if (sessionId) {
      const { data: existingSession, error: sessionLookupError } = await supabaseAdmin
        .from("chat_sessions")
        .select("id, user_id, pet_id")
        .eq("id", sessionId)
        .single();

      if (sessionLookupError || !existingSession) {
        return res.status(400).json({ error: "Invalid session_id" });
      }

      if (String(existingSession.user_id) !== String(resolvedUserId)) {
        return res.status(403).json({ error: "Session does not belong to this user" });
      }

      if (!petId) {
        petId = String(existingSession.pet_id);
      } else if (String(existingSession.pet_id) !== String(petId)) {
        return res.status(400).json({ error: "session_id does not match pet_id" });
      }
    }

    if (!sessionId) {
      if (!petId) {
        const { data: firstPet, error: firstPetError } = await supabaseAdmin
          .from("pets")
          .select("id")
          .eq("owner_id", resolvedUserId)
          .eq("is_deleted", false)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (firstPetError) {
          return res.status(500).json({ error: "Failed to resolve pet for chat" });
        }

        if (!firstPet?.id) {
          return res.status(400).json({ error: "No pets found for this user. Please add a pet first." });
        }

        petId = String(firstPet.id);
      }

      const { data: pet, error: petError } = await supabaseAdmin
        .from("pets")
        .select("name")
        .eq("id", petId)
        .eq("owner_id", resolvedUserId)
        .single();

      if (petError) {
        throw new Error("Failed to load pet for session creation: " + petError.message);
      }

      const session = await createSession({
        userId: resolvedUserId,
        petId,
        petName: pet?.name || "Pet",
      });
      sessionId = session.id;
    }

    await persistMessage({
      sessionId,
      petId,
      role: "user",
      content: message,
    });

    const context = await fetchPetContext({ petId, sessionId, anonClient, userMessage: message });
    const contextBlock = formatContextForPrompt(context);

    const systemPrompt = `You are a caring and knowledgeable pet health assistant with access to this pet's full history.

${contextBlock}

Instructions:
- Use the pet's history above to give specific, personalized advice
- Always remind the user that your advice does not replace a licensed veterinarian
- If you identify a clear, actionable recommendation (diet change, vet visit, medication follow-up, exercise plan, or grooming need), include it at the END of your response in this exact format:

<recommendation>
{
  "recommendation_type": "diet|medication_followup|exercise|grooming|vet_visit|general",
  "content": "Specific recommendation text",
  "rationale": "Why you recommend this based on the pet's history",
  "confidence": 0.85,
  "expires_days": 30
}
</recommendation>

Only include the <recommendation> block when genuinely useful and based on the pet's history. Never include it for greetings, general questions, or casual conversation.`;

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      {
        role: "model",
        parts: [
          {
            text: "Understood. I have the pet context and will provide personalized, history-aware advice.",
          },
        ],
      },
      ...((context?.chat?.messages || []).map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }))),
      { role: "user", parts: [{ text: message }] },
    ];

    let responseText = "";
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview",
      });
      const geminiResult = await model.generateContent({ contents });
      responseText = geminiResult.response.text();
    } catch (err: any) {
      console.error("[message] pet_id:", petId, "session_id:", sessionId, err.message);
      return res.status(500).json({ error: "AI response failed", session_id: sessionId });
    }

    const { cleanText, recommendation } = parseRecommendationBlock(responseText);

    await persistMessage({
      sessionId,
      petId,
      role: "assistant",
      content: cleanText,
    });

    if (recommendation !== null) {
      const healthSummaryIds = (context.health_summaries || []).map((h: any) => h.id);
      await saveRecommendation({
        petId,
        sessionId,
        recommendation,
        healthSummaryIds,
      });
    }

    const messageCount = await getMessageCount(sessionId);
    summarizeIfNeeded({ sessionId, petId, messageCount, anonClient });

    return res.status(200).json({
      session_id: sessionId,
      message: cleanText,
      recommendation: recommendation || null,
    });
  } catch (err: any) {
    console.error("[message] pet_id:", petId, "session_id:", sessionId, err.message);
    return res.status(500).json({
      error: err.message || "Message processing failed",
      session_id: sessionId,
    });
  }
});

router.post("/summarize", async (req: Request, res: Response) => {
  try {
    const jwt = getAuthToken(req);
    if (!jwt) return res.status(401).json({ error: "Authorization header required" });

    const { session_id, pet_id } = req.body || {};
    if (!session_id || !pet_id) {
      return res.status(400).json({ error: "session_id and pet_id are required" });
    }

    const anonClient = supabaseAnonClient(jwt);
    await runSummarization({ sessionId: session_id, anonClient });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
