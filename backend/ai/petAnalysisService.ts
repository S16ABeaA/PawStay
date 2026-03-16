import { petPlatformAgent } from "./agent";
import { PET_ANALYSIS_SYSTEM_PROMPT } from "./prompts/petAnalysisPrompt";

type Priority = "high" | "medium" | "low";
type ActionIntent = "find_vet" | "find_groomer" | "find_boarding" | "view_details" | "save_pet";

type CareItem = {
  category: string;
  icon: string;
  priority: Priority;
  summary: string;
  detail: string;
};

type NextAction = {
  label: string;
  intent: ActionIntent;
};

export interface AnalyzePetInput {
  sessionId?: string;
  detectedSpecies?: string;
  primaryPrediction?: string;
  primaryConfidence?: number;
  alternatives?: string[];
  ocrText?: string;
  descriptionHint?: string;
  userId?: string;
  authToken?: string;
}

export interface AnalyzePetResult {
  breed: {
    primary: string;
    confidence: number;
    alternatives: string[];
    description: string;
  };
  care: CareItem[];
  health_flags: string[];
  next_actions: NextAction[];
  low_confidence?: boolean;
  error?: string;
}

const allowedIntents: ActionIntent[] = [
  "find_vet",
  "find_groomer",
  "find_boarding",
  "view_details",
  "save_pet",
];

const allowedPriorities: Priority[] = ["high", "medium", "low"];

const normalizeConfidence = (value: unknown, fallback = 0): number => {
  const raw = Number(value);
  const normalizedRaw = Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw * 100 : raw;
  if (!Number.isFinite(normalizedRaw)) return fallback;
  return Math.max(0, Math.min(100, Math.round(normalizedRaw)));
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

const toNonEmptyString = (value: unknown): string => String(value ?? "").trim();

const buildDescriptionFromClassifier = (primary: string): string => {
  if (!primary) return "Breed traits are estimated from image features.";
  return `${primary} detected from visual traits. Temperament and care needs can vary by lineage and environment.`;
};

const buildFallbackCareDetail = (
  category: string,
  summary: string,
  primaryBreed: string,
): string => {
  return `${summary} For ${primaryBreed || "this pet"}, follow a consistent routine and monitor response weekly. If symptoms worsen or behavior changes suddenly, consult a vet promptly.`;
};

const buildPromptFromSignals = (input: AnalyzePetInput): string => {
  const primaryPrediction = toNonEmptyString(input.primaryPrediction) || "Unknown";
  const primaryConfidence = normalizeConfidence(input.primaryConfidence, 0);
  const alternatives = Array.isArray(input.alternatives)
    ? input.alternatives.map((item) => toNonEmptyString(item)).filter(Boolean).slice(0, 3)
    : [];
  const detectedSpecies = toNonEmptyString(input.detectedSpecies) || "unknown";
  const descriptionHint =
    toNonEmptyString(input.descriptionHint) || buildDescriptionFromClassifier(primaryPrediction);
  const ocrText = toNonEmptyString(input.ocrText).slice(0, 800);

  return [
    PET_ANALYSIS_SYSTEM_PROMPT,
    "",
    "Image analysis signals (from frontend vision + OCR):",
    `detected_species=${detectedSpecies}`,
    `primary_prediction=${primaryPrediction}`,
    `primary_confidence=${primaryConfidence}`,
    `alternatives=${alternatives.join(", ") || "none"}`,
    `description_hint=${descriptionHint}`,
    `ocr_text=${ocrText || "none"}`,
    "",
    "Return strict JSON only.",
  ].join("\n");
};

const normalizeResult = (
  parsed: Record<string, unknown>,
  fallbackPrimary: string,
  fallbackConfidence: number,
  fallbackAlternatives: string[],
): AnalyzePetResult => {
  const breedObj = (parsed.breed ?? {}) as Record<string, unknown>;

  const primary = toNonEmptyString(breedObj.primary) || fallbackPrimary;
  const confidence = normalizeConfidence(breedObj.confidence, fallbackConfidence);
  const alternatives = Array.isArray(breedObj.alternatives)
    ? breedObj.alternatives.map((item) => toNonEmptyString(item)).filter(Boolean).slice(0, 3)
    : fallbackAlternatives;
  const description =
    toNonEmptyString(breedObj.description) || buildDescriptionFromClassifier(primary || fallbackPrimary);

  const care = Array.isArray(parsed.care)
    ? parsed.care
        .map((item) => {
          const row = (item ?? {}) as Record<string, unknown>;
          const category = toNonEmptyString(row.category);
          const icon = toNonEmptyString(row.icon) || "vet";
          const priorityRaw = toNonEmptyString(row.priority).toLowerCase() as Priority;
          const priority = allowedPriorities.includes(priorityRaw) ? priorityRaw : "low";
          const summary = toNonEmptyString(row.summary);
          const detailRaw = toNonEmptyString(row.detail);
          const detail = detailRaw.length >= 80
            ? detailRaw
            : buildFallbackCareDetail(category, summary, fallbackPrimary);
          if (!category || !summary) return null;
          return { category, icon, priority, summary, detail } as CareItem;
        })
        .filter((item): item is CareItem => Boolean(item))
        .slice(0, 5)
    : [];

  const healthFlags = Array.isArray(parsed.health_flags)
    ? parsed.health_flags.map((item) => toNonEmptyString(item)).filter(Boolean).slice(0, 8)
    : [];

  const nextActions = Array.isArray(parsed.next_actions)
    ? parsed.next_actions
        .map((item) => {
          const row = (item ?? {}) as Record<string, unknown>;
          const label = toNonEmptyString(row.label);
          const intent = toNonEmptyString(row.intent) as ActionIntent;
          if (!allowedIntents.includes(intent)) return null;
          return { label: label || intent, intent } as NextAction;
        })
        .filter((item): item is NextAction => Boolean(item))
    : [];

  if (!nextActions.some((action) => action.intent === "find_vet")) {
    nextActions.push({ label: "Find a vet", intent: "find_vet" });
  }
  if (!nextActions.some((action) => action.intent === "find_groomer")) {
    nextActions.push({ label: "Find a groomer", intent: "find_groomer" });
  }
  if (!nextActions.some((action) => action.intent === "save_pet")) {
    nextActions.push({ label: "Save to My Pets", intent: "save_pet" });
  }

  const lowConfidence = Boolean(parsed.low_confidence) || confidence < 50;
  const error = toNonEmptyString(parsed.error);

  return {
    breed: {
      primary,
      confidence,
      alternatives,
      description,
    },
    care,
    health_flags: healthFlags,
    next_actions: nextActions,
    low_confidence: lowConfidence,
    ...(error ? { error } : {}),
  };
};

export const petAnalysisService = {
  async analyze(input: AnalyzePetInput): Promise<AnalyzePetResult> {
    const primaryPrediction = toNonEmptyString(input.primaryPrediction) || "Unknown";
    const primaryConfidence = normalizeConfidence(input.primaryConfidence, 0);
    const alternatives = Array.isArray(input.alternatives)
      ? input.alternatives.map((item) => toNonEmptyString(item)).filter(Boolean).slice(0, 3)
      : [];

    const userMessage = buildPromptFromSignals(input);
    const result = await petPlatformAgent.run({
      sessionId: input.sessionId || `pet-analyzer-${Date.now()}`,
      userMessage,
      userId: input.userId,
      authToken: input.authToken,
    });

    const parsed = extractJsonObject(result.reply);
    if (!parsed) {
      throw new Error("AI response could not be parsed as JSON");
    }

    return normalizeResult(parsed, primaryPrediction, primaryConfidence, alternatives);
  },
};
