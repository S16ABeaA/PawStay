import { Request, Response } from "express";
import { petPlatformAgent } from "../ai/agent";
import { petAnalysisService } from "../ai/petAnalysisService";
import { petHealthCheckService } from "../ai/petHealthCheckService";
import { extractTextFromBase64Image, extractTextFromDocumentBuffer, extractTextFromImageBuffer } from "../services/ocrService";

interface ChatRequestBody {
  message?: string;
  sessionId?: string;
}

interface AnalyzePetRequestBody {
  sessionId?: string;
  detectedSpecies?: string;
  primaryPrediction?: string;
  primaryConfidence?: number;
  alternatives?: string[];
  ocrText?: string;
  descriptionHint?: string;
  healthCheck?: {
    status?: string;
    injured?: boolean;
    confidence?: number;
    summary?: string;
    visible_signs?: string[];
    recommended_actions?: string[];
    age_estimate?: {
      value?: number | null;
      unit?: string;
      confidence?: number;
      range?: string;
      method?: string;
      note?: string;
    };
    weight_estimate?: {
      value?: number | null;
      unit?: string;
      confidence?: number;
      range?: string;
      method?: string;
      note?: string;
    };
  };
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const getLowerName = (name: string | undefined): string => String(name || "").trim().toLowerCase();

const getUploadKind = (file?: Express.Multer.File): "image" | "pdf" | "txt" | "docx" | "unsupported" => {
  if (!file) return "unsupported";

  const mime = String(file.mimetype || "").toLowerCase();
  const name = getLowerName(file.originalname);

  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (mime === "text/plain" || name.endsWith(".txt")) return "txt";
  if (mime === DOCX_MIME || name.endsWith(".docx")) return "docx";

  return "unsupported";
};

export const aiController = {
  /**
   * POST /api/ai/chat
   * Example body:
   * {
   *   "message": "Find dog grooming near me"
   * }
   */
  chat: async (req: Request, res: Response) => {
    try {
      const { message, sessionId }: ChatRequestBody = req.body ?? {};

      if (!message || !message.trim()) {
        return res.status(400).json({ error: "message is required" });
      }

      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length).trim()
        : undefined;
      const cookieToken = req.cookies?.["sb-access-token"] as string | undefined;
      const authToken = bearerToken || cookieToken;

      const userId = (req as any).user?.id as string | undefined;

      const result = await petPlatformAgent.run({
        sessionId: sessionId ?? `anon-${Date.now()}`,
        userMessage: message,
        userId,
        authToken,
      });

      return res.json({
        message: result.reply,
        usedTools: result.usedTools,
        toolActivity: result.toolActivity ?? [],
      });
    } catch (error: any) {
      console.error("ai chat error:", error);
      return res.status(500).json({
        error: "Failed to process AI chat request",
        details: error?.message ?? "Unknown error",
      });
    }
  },

  /**
   * POST /api/ai/ocr
   * Accepts multipart file input (`image`) or JSON body with `imageBase64`
   */
  ocr: async (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as { imageBase64?: string; language?: string };
      const uploadedFile = (req as any).file as Express.Multer.File | undefined;

      const language = String(body.language || "eng").trim() || "eng";

      if (uploadedFile?.buffer?.length) {
        const uploadKind = getUploadKind(uploadedFile);
        if (uploadKind === "unsupported") {
          return res.status(400).json({
            error: "Unsupported file type. Allowed: images, PDF, TXT, DOCX",
          });
        }

        const mimeType = String(uploadedFile.mimetype || "application/octet-stream").toLowerCase();
        const normalizedMime = uploadKind === "txt"
          ? "text/plain"
          : uploadKind === "docx"
            ? DOCX_MIME
            : mimeType;

        const result = uploadKind === "image"
          ? await extractTextFromImageBuffer(uploadedFile.buffer, language)
          : await extractTextFromDocumentBuffer(uploadedFile.buffer, normalizedMime, language);
        return res.json({
          text: result.text,
          language: result.language,
          characters: result.text.length,
        });
      }

      const imageBase64 = String(body.imageBase64 || "").trim();
      if (!imageBase64) {
        return res.status(400).json({ error: "image file or imageBase64 is required" });
      }

      const result = await extractTextFromBase64Image(imageBase64, language);
      return res.json({
        text: result.text,
        language: result.language,
        characters: result.text.length,
      });
    } catch (error: any) {
      console.error("ai ocr error:", error);
      return res.status(500).json({
        error: "Failed to process OCR request",
        details: error?.message ?? "Unknown error",
      });
    }
  },

  analyzePet: async (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as AnalyzePetRequestBody;

      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length).trim()
        : undefined;
      const cookieToken = req.cookies?.["sb-access-token"] as string | undefined;
      const authToken = bearerToken || cookieToken;
      const userId = (req as any).user?.id as string | undefined;

      const result = await petAnalysisService.analyze({
        sessionId: body.sessionId,
        detectedSpecies: body.detectedSpecies,
        primaryPrediction: body.primaryPrediction,
        primaryConfidence: body.primaryConfidence,
        alternatives: Array.isArray(body.alternatives) ? body.alternatives : [],
        ocrText: body.ocrText,
        descriptionHint: body.descriptionHint,
        healthCheck: body.healthCheck,
        userId,
        authToken,
      });

      return res.json(result);
    } catch (error: any) {
      console.error("ai pet-analysis error:", error);
      return res.status(500).json({
        error: "Failed to process pet analysis request",
        details: error?.message ?? "Unknown error",
      });
    }
  },

  healthCheck: async (req: Request, res: Response) => {
    try {
      const uploadedFile = (req as any).file as Express.Multer.File | undefined;
      const detectedSpecies = String(req.body?.detectedSpecies || "").trim();

      if (!uploadedFile?.buffer?.length) {
        return res.status(400).json({ error: "image file is required" });
      }

      const result = await petHealthCheckService.analyzeImage(
        uploadedFile.buffer,
        uploadedFile.mimetype,
        detectedSpecies,
      );

      return res.json(result);
    } catch (error: any) {
      console.error("ai health-check error:", error);
      return res.status(500).json({
        error: "Failed to process pet health check request",
        details: error?.message ?? "Unknown error",
      });
    }
  },
};
