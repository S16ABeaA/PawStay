import { GoogleGenerativeAI } from "@google/generative-ai";
import { PET_HEALTH_CHECK_PROMPT } from "./prompts/petHealthCheckPrompt";

export type PetHealthStatus = "healthy" | "minor_issue" | "injured" | "urgent" | "unclear";

export interface PetHealthCheckResult {
  status: PetHealthStatus;
  injured: boolean;
  confidence: number;
  summary: string;
  visible_signs: string[];
  recommended_actions: string[];
  disclaimer: string;
}

const allowedStatuses: PetHealthStatus[] = [
  "healthy",
  "minor_issue",
  "injured",
  "urgent",
  "unclear",
];

const toText = (value: unknown): string => String(value ?? "").trim();

const normalizeConfidence = (value: unknown, fallback = 0): number => {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return fallback;
  const normalized = raw >= 0 && raw <= 1 ? raw * 100 : raw;
  return Math.max(0, Math.min(100, Math.round(normalized)));
};

const extractJsonObject = (text: string): Record<string, unknown> | null => {
  const cleaned = String(text || "").replace(/```json|```/gi, "").trim();
  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
};

const fallbackResult = (reason = "Image quality is insufficient for reliable health triage."): PetHealthCheckResult => ({
  status: "unclear",
  injured: false,
  confidence: 25,
  summary: reason,
  visible_signs: [],
  recommended_actions: [
    "Retake a clear, well-lit full-body image",
    "Monitor appetite, energy, and mobility for 24 hours",
    "Consult a veterinarian if symptoms are present or worsen",
  ],
  disclaimer: "This is not a diagnosis. If you are concerned, consult a licensed veterinarian.",
});

const normalizeResult = (payload: Record<string, unknown>): PetHealthCheckResult => {
  const statusRaw = toText(payload.status) as PetHealthStatus;
  const status = allowedStatuses.includes(statusRaw) ? statusRaw : "unclear";
  const confidence = normalizeConfidence(payload.confidence, status === "unclear" ? 25 : 60);
  const summary =
    toText(payload.summary) ||
    (status === "healthy"
      ? "No obvious visible injury signs were detected from this image."
      : "Possible health concern detected from visible cues.");

  const visibleSigns = Array.isArray(payload.visible_signs)
    ? payload.visible_signs.map((item) => toText(item)).filter(Boolean).slice(0, 8)
    : [];

  const recommendedActions = Array.isArray(payload.recommended_actions)
    ? payload.recommended_actions.map((item) => toText(item)).filter(Boolean).slice(0, 6)
    : [];

  if (recommendedActions.length === 0) {
    recommendedActions.push(
      "Observe your pet for changes in appetite, behavior, and movement",
      "Seek veterinary care if symptoms appear or worsen",
    );
  }

  const disclaimer =
    toText(payload.disclaimer) ||
    "This is not a diagnosis. If you are concerned, consult a licensed veterinarian.";

  const injured =
    typeof payload.injured === "boolean"
      ? payload.injured
      : status === "injured" || status === "urgent";

  return {
    status,
    injured,
    confidence,
    summary,
    visible_signs: visibleSigns,
    recommended_actions: recommendedActions,
    disclaimer,
  };
};

export const petHealthCheckService = {
  async analyzeImage(imageBuffer: Buffer, mimeType = "image/jpeg", detectedSpecies?: string): Promise<PetHealthCheckResult> {
    if (!imageBuffer?.length) {
      throw new Error("image file is required");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const modelName =
      process.env.GEMINI_VISION_MODEL || process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const speciesHint = toText(detectedSpecies);

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: modelName });

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: mimeType || "image/jpeg",
      },
    } as const;

    try {
      const prompt = speciesHint
        ? `${PET_HEALTH_CHECK_PROMPT}\n\nSpecies hint: ${speciesHint}`
        : PET_HEALTH_CHECK_PROMPT;
      const response = await model.generateContent([prompt, imagePart]);
      const text = response.response.text();
      const parsed = extractJsonObject(text);
      if (!parsed) {
        return fallbackResult("The image could not be reliably interpreted for health triage.");
      }
      return normalizeResult(parsed);
    } catch {
      return fallbackResult("Health triage is temporarily unavailable for this image.");
    }
  },
};
