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
  healthCheck?: {
    status?: string;
    injured?: boolean;
    confidence?: number;
    summary?: string;
    visible_signs?: string[];
    recommended_actions?: string[];
  };
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

const hasHealthCheckContext = (input: AnalyzePetInput): boolean => {
  const status = toNonEmptyString(input.healthCheck?.status);
  const summary = toNonEmptyString(input.healthCheck?.summary);
  const signs = Array.isArray(input.healthCheck?.visible_signs)
    ? input.healthCheck?.visible_signs?.filter(Boolean).length
    : 0;
  const actions = Array.isArray(input.healthCheck?.recommended_actions)
    ? input.healthCheck?.recommended_actions?.filter(Boolean).length
    : 0;
  return Boolean(status || summary || signs > 0 || actions > 0);
};

const buildHealthPrimaryCare = (
  input: AnalyzePetInput,
  fallbackPrimary: string,
  fallbackCare: CareItem[],
): CareItem[] => {
  const status = getHealthStatus(input);
  const summary = toNonEmptyString(input.healthCheck?.summary);
  const signs = Array.isArray(input.healthCheck?.visible_signs)
    ? input.healthCheck?.visible_signs?.map((item) => toNonEmptyString(item)).filter(Boolean).slice(0, 5)
    : [];
  const actions = Array.isArray(input.healthCheck?.recommended_actions)
    ? input.healthCheck?.recommended_actions?.map((item) => toNonEmptyString(item)).filter(Boolean).slice(0, 6)
    : [];

  const fromAction = (action: string, index: number): CareItem => ({
    category: index === 0 ? "Health action" : `Care step ${index + 1}`,
    icon: index === 0 ? "vet" : "grooming",
    priority: status === "urgent" || status === "injured" ? "high" : status === "minor_issue" ? "medium" : "low",
    summary: action,
    detail: `${action} Monitor ${fallbackPrimary || "your pet"} closely and contact a veterinarian if symptoms persist or worsen.`,
  });

  const signSnippet = signs.length > 0 ? `Visible signs: ${signs.join(", ")}.` : "";

  if (status === "urgent") {
    const items: CareItem[] = [
      {
        category: "Emergency veterinary care",
        icon: "vet",
        priority: "high",
        summary: "Seek immediate veterinary attention.",
        detail:
          `${summary || "Severe concerning signs were detected."} ${signSnippet} Keep your pet calm, avoid feeding unless instructed, and go to the nearest emergency vet now.`.trim(),
      },
      {
        category: "Stabilize safely",
        icon: "vet",
        priority: "high",
        summary: "Limit movement and prevent self-injury.",
        detail: "Restrict activity, avoid handling painful areas, and keep the pet warm and supervised while traveling to care.",
      },
      ...actions.slice(0, 3).map(fromAction),
    ];
    return items.slice(0, 5);
  }

  if (status === "injured") {
    const items: CareItem[] = [
      {
        category: "Injury care",
        icon: "vet",
        priority: "high",
        summary: "Arrange prompt vet assessment.",
        detail:
          `${summary || "Possible injury signs detected."} ${signSnippet} Clean only superficial dirt, avoid pressure on painful areas, and consult a vet as soon as possible.`.trim(),
      },
      {
        category: "Activity restriction",
        icon: "exercise",
        priority: "medium",
        summary: "Reduce movement for 24–48 hours.",
        detail: "Use a leash or confined rest area and monitor limping, swelling, bleeding, or reduced appetite.",
      },
      ...actions.slice(0, 3).map(fromAction),
    ];
    return items.slice(0, 5);
  }

  if (status === "minor_issue") {
    const items: CareItem[] = [
      {
        category: "Supportive care",
        icon: "vet",
        priority: "medium",
        summary: "Monitor symptoms and provide supportive home care.",
        detail:
          `${summary || "Minor visible concern detected."} ${signSnippet} Check behavior, appetite, hydration, and mobility daily; escalate to vet if worsening.`.trim(),
      },
      {
        category: "Hygiene and comfort",
        icon: "grooming",
        priority: "medium",
        summary: "Keep affected areas clean and dry.",
        detail: "Use gentle cleaning and avoid irritants; stop if discomfort increases and seek professional advice.",
      },
      ...actions.slice(0, 3).map(fromAction),
    ];
    return items.slice(0, 5);
  }

  if (status === "healthy") {
    const items: CareItem[] = [
      {
        category: "Preventive wellness",
        icon: "diet",
        priority: "low",
        summary: "No obvious injury seen; continue preventive care.",
        detail:
          `${summary || "No major external concerns were detected in this image."} Maintain regular nutrition, exercise, grooming, and scheduled vet checkups.`.trim(),
      },
      {
        category: "Routine monitoring",
        icon: "exercise",
        priority: "low",
        summary: "Track changes in appetite, coat, and mobility.",
        detail: "Re-check with a clearer image or vet exam if new symptoms appear.",
      },
      ...actions.slice(0, 3).map(fromAction),
    ];
    return items.slice(0, 5);
  }

  if (actions.length > 0) {
    return actions.slice(0, 5).map(fromAction);
  }

  return fallbackCare;
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
  const healthStatus = toNonEmptyString(input.healthCheck?.status) || "unknown";
  const healthConfidence = normalizeConfidence(input.healthCheck?.confidence, 0);
  const healthSummary = toNonEmptyString(input.healthCheck?.summary);
  const visibleSigns = Array.isArray(input.healthCheck?.visible_signs)
    ? input.healthCheck?.visible_signs?.map((item) => toNonEmptyString(item)).filter(Boolean).slice(0, 8)
    : [];
  const healthActions = Array.isArray(input.healthCheck?.recommended_actions)
    ? input.healthCheck?.recommended_actions?.map((item) => toNonEmptyString(item)).filter(Boolean).slice(0, 6)
    : [];
  const injured = Boolean(input.healthCheck?.injured);

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
    "Health-check signals (from image triage):",
    `health_status=${healthStatus}`,
    `health_confidence=${healthConfidence}`,
    `injured=${injured}`,
    `health_summary=${healthSummary || "none"}`,
    `visible_signs=${visibleSigns.join(", ") || "none"}`,
    `health_recommended_actions=${healthActions.join(" | ") || "none"}`,
    "",
    "Care recommendations MUST prioritize health-check findings when present.",
    "Return strict JSON only.",
  ].join("\n");
};

const getHealthStatus = (input: AnalyzePetInput): string =>
  toNonEmptyString(input.healthCheck?.status).toLowerCase();

const applyHealthDrivenCare = (care: CareItem[], input: AnalyzePetInput): CareItem[] => {
  const status = getHealthStatus(input);
  const summary = toNonEmptyString(input.healthCheck?.summary);
  const signs = Array.isArray(input.healthCheck?.visible_signs)
    ? input.healthCheck?.visible_signs?.map((item) => toNonEmptyString(item)).filter(Boolean)
    : [];
  const actions = Array.isArray(input.healthCheck?.recommended_actions)
    ? input.healthCheck?.recommended_actions?.map((item) => toNonEmptyString(item)).filter(Boolean)
    : [];

  if (status === "urgent" || status === "injured") {
    const urgentItem: CareItem = {
      category: "Immediate health care",
      icon: "vet",
      priority: "high",
      summary:
        status === "urgent"
          ? "Urgent signs detected. Seek veterinary care immediately."
          : "Possible injury detected. Arrange prompt veterinary assessment.",
      detail:
        summary ||
        "Keep your pet calm and restrict activity. Avoid home treatment for open wounds or breathing issues. Contact a veterinarian now.",
    };
    return [urgentItem, ...care].slice(0, 5);
  }

  if (status === "minor_issue") {
    const monitorItem: CareItem = {
      category: "Recovery monitoring",
      icon: "vet",
      priority: "medium",
      summary: "Minor issue signs detected. Monitor closely and follow supportive care.",
      detail:
        actions[0] ||
        "Monitor appetite, energy, gait, and skin/coat changes daily. If symptoms worsen in 24–48 hours, consult a veterinarian.",
    };
    return [monitorItem, ...care].slice(0, 5);
  }

  if (status === "healthy" && care.length > 0) {
    const first = care[0];
    if (first.priority === "high") {
      first.priority = "medium";
    }
  }

  if (signs.length > 0 && care.length > 0) {
    care[0].detail = `${care[0].detail} Observed signs: ${signs.slice(0, 3).join(", ")}.`;
  }

  return care;
};

const normalizeResult = (
  parsed: Record<string, unknown>,
  fallbackPrimary: string,
  fallbackConfidence: number,
  fallbackAlternatives: string[],
  input: AnalyzePetInput,
): AnalyzePetResult => {
  const breedObj = (parsed.breed ?? {}) as Record<string, unknown>;

  const primary = toNonEmptyString(breedObj.primary) || fallbackPrimary;
  const confidence = normalizeConfidence(breedObj.confidence, fallbackConfidence);
  const alternatives = Array.isArray(breedObj.alternatives)
    ? breedObj.alternatives.map((item) => toNonEmptyString(item)).filter(Boolean).slice(0, 3)
    : fallbackAlternatives;
  const description =
    toNonEmptyString(breedObj.description) || buildDescriptionFromClassifier(primary || fallbackPrimary);

  const careBase = Array.isArray(parsed.care)
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

  const care = hasHealthCheckContext(input)
    ? buildHealthPrimaryCare(input, fallbackPrimary, careBase)
    : applyHealthDrivenCare(careBase, input);

  const modelHealthFlags = Array.isArray(parsed.health_flags)
    ? parsed.health_flags.map((item) => toNonEmptyString(item)).filter(Boolean).slice(0, 8)
    : [];

  const healthSignalFlags = Array.isArray(input.healthCheck?.visible_signs)
    ? input.healthCheck?.visible_signs?.map((item) => toNonEmptyString(item)).filter(Boolean).slice(0, 8)
    : [];

  const healthFlags = Array.from(new Set([...healthSignalFlags, ...modelHealthFlags])).slice(0, 8);

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

  const status = getHealthStatus(input);
  if (status === "urgent" || status === "injured") {
    const vetAction = nextActions.find((action) => action.intent === "find_vet");
    if (vetAction) {
      vetAction.label = "Find a vet now";
    } else {
      nextActions.unshift({ label: "Find a vet now", intent: "find_vet" });
    }
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

    return normalizeResult(parsed, primaryPrediction, primaryConfidence, alternatives, input);
  },
};
