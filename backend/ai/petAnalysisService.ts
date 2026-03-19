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
  health_check?: {
    status: string;
    confidence: number;
    summary: string;
    estimated_age: {
      value: string | null;
      confidence: number;
    };
    estimated_weight: {
      value: string | null;
      confidence: number;
    };
    visible_signs: string[];
  };
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

const hasOwn = (obj: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validateParsedAnalysisShape = (
  parsed: Record<string, unknown>,
): { ok: true } | { ok: false; errors: string[] } => {
  const errorValue = String(parsed.error ?? "").trim();
  if (errorValue === "not_a_pet") {
    return { ok: true };
  }

  const errors: string[] = [];

  ["breed", "care", "health_flags", "health_check", "next_actions", "low_confidence"].forEach((key) => {
    if (!hasOwn(parsed, key)) {
      errors.push(`missing root key: ${key}`);
    }
  });

  const breed = parsed.breed;
  if (!isRecord(breed)) {
    errors.push("breed must be an object");
  } else {
    ["primary", "confidence", "alternatives", "description"].forEach((key) => {
      if (!hasOwn(breed, key)) errors.push(`missing breed.${key}`);
    });
  }

  if (!Array.isArray(parsed.care)) {
    errors.push("care must be an array");
  }

  if (!Array.isArray(parsed.health_flags)) {
    errors.push("health_flags must be an array");
  }

  const healthCheck = parsed.health_check;
  if (!isRecord(healthCheck)) {
    errors.push("health_check must be an object");
  } else {
    ["status", "confidence", "summary", "estimated_age", "estimated_weight", "visible_signs"].forEach((key) => {
      if (!hasOwn(healthCheck, key)) errors.push(`missing health_check.${key}`);
    });

    const estimatedAge = healthCheck.estimated_age;
    if (!isRecord(estimatedAge)) {
      errors.push("health_check.estimated_age must be an object");
    } else {
      ["value", "confidence"].forEach((key) => {
        if (!hasOwn(estimatedAge, key)) errors.push(`missing health_check.estimated_age.${key}`);
      });
    }

    const estimatedWeight = healthCheck.estimated_weight;
    if (!isRecord(estimatedWeight)) {
      errors.push("health_check.estimated_weight must be an object");
    } else {
      ["value", "confidence"].forEach((key) => {
        if (!hasOwn(estimatedWeight, key)) errors.push(`missing health_check.estimated_weight.${key}`);
      });
    }

    if (hasOwn(healthCheck, "visible_signs") && !Array.isArray(healthCheck.visible_signs)) {
      errors.push("health_check.visible_signs must be an array");
    }
  }

  if (!Array.isArray(parsed.next_actions)) {
    errors.push("next_actions must be an array");
  }

  if (typeof parsed.low_confidence !== "boolean") {
    errors.push("low_confidence must be a boolean");
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
};

const toNonEmptyString = (value: unknown): string => String(value ?? "").trim();

const normalizePetLabel = (value: string): string => {
  const raw = toNonEmptyString(value);
  if (!raw) return "your pet";
  const firstChunk = raw.split(",")[0]?.trim() || raw;
  const cleaned = firstChunk.replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.toLowerCase() === "unknown") return "your pet";
  return cleaned;
};

const dedupeLines = (items: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const value = toNonEmptyString(item);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
};

const isPositiveObservation = (value: string): boolean => {
  const v = toNonEmptyString(value).toLowerCase();
  if (!v) return true;
  const positiveTerms = [
    "clear eyes",
    "alert",
    "clean coat",
    "normal stance",
    "healthy",
    "active",
    "no visible",
    "normal",
    "bright eyes",
    "good posture",
  ];
  return positiveTerms.some((term) => v.includes(term));
};

const buildDescriptionFromClassifier = (primary: string): string => {
  if (!primary) return "Breed traits are estimated from image features.";
  return `${primary} detected from visual traits. Temperament and care needs can vary by lineage and environment.`;
};

const buildFallbackCareDetail = (
  category: string,
  summary: string,
  primaryBreed: string,
): string => {
  const petLabel = normalizePetLabel(primaryBreed);
  return `${summary} For ${petLabel}, follow a consistent routine and monitor response weekly. If symptoms worsen or behavior changes suddenly, consult a vet promptly.`;
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
  const petLabel = normalizePetLabel(fallbackPrimary);
  const summary = toNonEmptyString(input.healthCheck?.summary);
  const signs = Array.isArray(input.healthCheck?.visible_signs)
    ? dedupeLines(input.healthCheck?.visible_signs?.map((item) => toNonEmptyString(item)).filter(Boolean) ?? []).slice(0, 5)
    : [];
  const actions = Array.isArray(input.healthCheck?.recommended_actions)
    ? dedupeLines(input.healthCheck?.recommended_actions?.map((item) => toNonEmptyString(item)).filter(Boolean) ?? []).slice(0, 6)
    : [];

  const fromAction = (action: string, index: number): CareItem => ({
    category: index === 0 ? "Health action" : `Care step ${index + 1}`,
    icon: index === 0 ? "vet" : "grooming",
    priority: status === "urgent" || status === "injured" ? "high" : status === "minor_issue" ? "medium" : "low",
    summary: action,
    detail: `Monitor ${petLabel} closely for 24–48 hours and follow this step consistently. Contact a veterinarian if symptoms persist or worsen.`,
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
  const ageValueRaw = Number(input.healthCheck?.age_estimate?.value);
  const weightValueRaw = Number(input.healthCheck?.weight_estimate?.value);
  const ageValue = Number.isFinite(ageValueRaw) && ageValueRaw > 0 ? Math.round(ageValueRaw * 10) / 10 : null;
  const weightValue = Number.isFinite(weightValueRaw) && weightValueRaw > 0 ? Math.round(weightValueRaw * 10) / 10 : null;
  const ageUnit = toNonEmptyString(input.healthCheck?.age_estimate?.unit) || "years";
  const weightUnit = toNonEmptyString(input.healthCheck?.weight_estimate?.unit) || "kg";
  const ageRange = toNonEmptyString(input.healthCheck?.age_estimate?.range) || "unknown";
  const weightRange = toNonEmptyString(input.healthCheck?.weight_estimate?.range) || "unknown";
  const ageConfidence = normalizeConfidence(input.healthCheck?.age_estimate?.confidence, ageValue ? 45 : 0);
  const weightConfidence = normalizeConfidence(input.healthCheck?.weight_estimate?.confidence, weightValue ? 45 : 0);

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
    `age_estimate=${ageValue === null ? "unknown" : `${ageValue} ${ageUnit}`} (confidence=${ageConfidence}, range=${ageRange})`,
    `weight_estimate=${weightValue === null ? "unknown" : `${weightValue} ${weightUnit}`} (confidence=${weightConfidence}, range=${weightRange})`,
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

  const fallbackRiskFlags = Array.isArray(input.healthCheck?.recommended_actions)
    ? input.healthCheck.recommended_actions
        .map((item) => toNonEmptyString(item))
        .filter(Boolean)
        .slice(0, 6)
    : [];

  const healthFlags = dedupeLines(
    (modelHealthFlags.length > 0 ? modelHealthFlags : fallbackRiskFlags).filter(
      (item) => !isPositiveObservation(item),
    ),
  ).slice(0, 8);

  const parsedHealthCheck = (parsed.health_check ?? {}) as Record<string, unknown>;
  const inputAgeValueRaw = Number(input.healthCheck?.age_estimate?.value);
  const inputWeightValueRaw = Number(input.healthCheck?.weight_estimate?.value);
  const inputAgeRange = toNonEmptyString(input.healthCheck?.age_estimate?.range) ||
    (Number.isFinite(inputAgeValueRaw) && inputAgeValueRaw > 0
      ? `${Math.round(inputAgeValueRaw * 10) / 10} ${toNonEmptyString(input.healthCheck?.age_estimate?.unit) || "years"}`
      : "");
  const inputWeightRange = toNonEmptyString(input.healthCheck?.weight_estimate?.range) ||
    (Number.isFinite(inputWeightValueRaw) && inputWeightValueRaw > 0
      ? `${Math.round(inputWeightValueRaw * 10) / 10} ${toNonEmptyString(input.healthCheck?.weight_estimate?.unit) || "kg"}`
      : "");

  const healthCheck = {
    status: toNonEmptyString(parsedHealthCheck.status) || toNonEmptyString(input.healthCheck?.status) || "unclear",
    confidence: normalizeConfidence(
      parsedHealthCheck.confidence,
      normalizeConfidence(input.healthCheck?.confidence, 0),
    ),
    summary:
      toNonEmptyString(parsedHealthCheck.summary) ||
      toNonEmptyString(input.healthCheck?.summary) ||
      "Health check is available with limited detail.",
    estimated_age: {
      value: (() => {
        const raw = ((parsedHealthCheck.estimated_age ?? {}) as Record<string, unknown>).value;
        const parsedValue = toNonEmptyString(raw);
        return parsedValue || inputAgeRange || null;
      })(),
      confidence: normalizeConfidence(
        ((parsedHealthCheck.estimated_age ?? {}) as Record<string, unknown>).confidence,
        normalizeConfidence(input.healthCheck?.age_estimate?.confidence, 0),
      ),
    },
    estimated_weight: {
      value: (() => {
        const raw = ((parsedHealthCheck.estimated_weight ?? {}) as Record<string, unknown>).value;
        const parsedValue = toNonEmptyString(raw);
        return parsedValue || inputWeightRange || null;
      })(),
      confidence: normalizeConfidence(
        ((parsedHealthCheck.estimated_weight ?? {}) as Record<string, unknown>).confidence,
        normalizeConfidence(input.healthCheck?.weight_estimate?.confidence, 0),
      ),
    },
    visible_signs: Array.isArray(parsedHealthCheck.visible_signs)
      ? parsedHealthCheck.visible_signs.map((item) => toNonEmptyString(item)).filter(Boolean).slice(0, 8)
      : Array.isArray(input.healthCheck?.visible_signs)
        ? dedupeLines(
            input.healthCheck.visible_signs
              .map((item) => toNonEmptyString(item))
              .filter(Boolean),
          ).slice(0, 8)
        : [],
  };

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
    health_check: healthCheck,
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
    const baseSessionId = input.sessionId || `pet-analyzer-${Date.now()}`;

    let lastFailure = "AI response could not be parsed as JSON";

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const followUpInstruction = attempt === 0
        ? ""
        : "\n\nYour previous response was invalid. Return ONE valid JSON object only. No markdown, no prose, no comments. Include all required keys and use null for unknown values.";

      const result = await petPlatformAgent.run({
        sessionId: `${baseSessionId}-attempt-${attempt + 1}`,
        userMessage: `${userMessage}${followUpInstruction}`,
        userId: input.userId,
        authToken: input.authToken,
      });

      const parsed = extractJsonObject(result.reply);
      if (!parsed) {
        lastFailure = "AI response could not be parsed as JSON";
        continue;
      }

      const validation = validateParsedAnalysisShape(parsed);
      if (!validation.ok) {
        lastFailure = `AI JSON schema validation failed: ${validation.errors.join("; ")}`;
        continue;
      }

      return normalizeResult(parsed, primaryPrediction, primaryConfidence, alternatives, input);
    }

    throw new Error(lastFailure);
  },
};
