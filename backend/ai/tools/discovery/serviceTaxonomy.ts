type ServiceDefinition = {
  /** Canonical service category stored in property_services.category */
  category: string;
  /** Optional property type hint for properties.property_type filtering */
  propertyType?: string;
  /** Search aliases/synonyms used in prompts */
  aliases: string[];
};

const BASE_SERVICE_DEFINITIONS: Record<string, ServiceDefinition> = {
  hotel: {
    category: "Boarding",
    propertyType: "hotel",
    aliases: ["hotel", "boarding", "pet hotel", "accommodation", "stay"],
  },
  vet: {
    category: "Veterinary",
    propertyType: "veterinary",
    aliases: ["vet", "veterinary", "clinic", "checkup", "consultation"],
  },
  grooming: {
    category: "Grooming",
    propertyType: "grooming",
    aliases: ["grooming", "groomer", "pet spa", "bath", "haircut"],
  },
  daycare: {
    category: "Daycare",
    aliases: ["daycare", "day care", "pet daycare"],
  },
  transport: {
    category: "Transport",
    aliases: ["transport", "pet transport", "pet taxi", "taxi"],
  },
  shelter: {
    category: "Shelter",
    aliases: ["shelter", "animal shelter", "rescue", "adoption"],
  },
  training: {
    category: "Training",
    aliases: ["training", "obedience", "behavior training"],
  },
  walking: {
    category: "Walking",
    aliases: ["walking", "dog walking", "walker"],
  },
  sitting: {
    category: "Pet Sitting",
    aliases: ["sitting", "pet sitting", "pet sitter"],
  },
};

const normalizeToken = (value: unknown): string =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const titleCaseWords = (value: string): string =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const parseEnvDefinitions = (): Record<string, ServiceDefinition> => {
  const raw = String(process.env.AI_SERVICE_TYPE_ALIASES_JSON || "").trim();
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, any>;
    const output: Record<string, ServiceDefinition> = {};

    for (const [key, value] of Object.entries(parsed)) {
      const normalizedKey = normalizeToken(key);
      if (!normalizedKey || !value || typeof value !== "object") continue;

      const category = String(value.category || "").trim();
      if (!category) continue;

      const aliases = Array.isArray(value.aliases)
        ? value.aliases
            .map((item: unknown) => String(item || "").trim())
            .filter(Boolean)
        : [];

      output[normalizedKey] = {
        category,
        propertyType: String(value.propertyType || "").trim() || undefined,
        aliases,
      };
    }

    return output;
  } catch {
    return {};
  }
};

const SERVICE_DEFINITIONS: Record<string, ServiceDefinition> = {
  ...BASE_SERVICE_DEFINITIONS,
  ...parseEnvDefinitions(),
};

const aliasToKey = new Map<string, string>();
for (const [key, definition] of Object.entries(SERVICE_DEFINITIONS)) {
  aliasToKey.set(normalizeToken(key), key);
  for (const alias of definition.aliases) {
    aliasToKey.set(normalizeToken(alias), key);
  }
}

const sortedAliases = Array.from(aliasToKey.keys()).sort((a, b) => b.length - a.length);

export interface ResolvedServiceIntent {
  requested: string;
  normalized: string;
  canonicalKey?: string;
  category?: string;
  propertyType?: string;
  isKnown: boolean;
}

export const isAllServicesRequest = (value?: string): boolean => {
  const token = normalizeToken(value);
  return !token || ["all", "any", "everything", "any service"].includes(token);
};

export const resolveServiceIntent = (input?: string): ResolvedServiceIntent => {
  const requested = String(input || "").trim();
  const normalized = normalizeToken(requested);

  if (isAllServicesRequest(requested)) {
    return {
      requested,
      normalized,
      canonicalKey: "all",
      isKnown: true,
    };
  }

  const directKey = aliasToKey.get(normalized);
  if (directKey) {
    const definition = SERVICE_DEFINITIONS[directKey];
    return {
      requested,
      normalized,
      canonicalKey: directKey,
      category: definition.category,
      propertyType: definition.propertyType,
      isKnown: true,
    };
  }

  for (const alias of sortedAliases) {
    if (!alias) continue;
    const pattern = new RegExp(`(^|\\b)${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}(\\b|$)`, "i");
    if (!pattern.test(normalized)) continue;

    const key = aliasToKey.get(alias);
    if (!key) continue;

    const definition = SERVICE_DEFINITIONS[key];
    return {
      requested,
      normalized,
      canonicalKey: key,
      category: definition.category,
      propertyType: definition.propertyType,
      isKnown: true,
    };
  }

  // Unknown category fallback: preserve user intent in a normalized title-case label.
  return {
    requested,
    normalized,
    category: normalized ? titleCaseWords(normalized) : undefined,
    isKnown: false,
  };
};

export const inferServiceTypeFromText = (text?: string): string | undefined => {
  const normalized = normalizeToken(text);
  if (!normalized) return undefined;

  for (const alias of sortedAliases) {
    if (!alias) continue;
    const pattern = new RegExp(`(^|\\b)${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}(\\b|$)`, "i");
    if (!pattern.test(normalized)) continue;

    const key = aliasToKey.get(alias);
    if (!key) continue;

    // Return the key so downstream resolution remains deterministic.
    return key;
  }

  return undefined;
};

export const matchesServiceCategory = (category: unknown, requestedServiceType?: string): boolean => {
  const categoryToken = normalizeToken(category);
  if (!categoryToken) return false;

  if (isAllServicesRequest(requestedServiceType)) {
    return true;
  }

  const requested = resolveServiceIntent(requestedServiceType);
  const actual = resolveServiceIntent(String(category || ""));

  if (requested.canonicalKey && actual.canonicalKey) {
    return requested.canonicalKey === actual.canonicalKey;
  }

  if (requested.category && normalizeToken(requested.category) === categoryToken) {
    return true;
  }

  return (
    categoryToken.includes(requested.normalized) ||
    requested.normalized.includes(categoryToken)
  );
};

export const getAllKnownServiceAliases = (): string[] => Array.from(aliasToKey.keys());
