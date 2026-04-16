import { NextFunction, Request, Response } from "express";

type PrimitiveType = "string" | "number" | "boolean" | "email" | "uuid";

type FieldRule = {
  type: PrimitiveType | "enum" | "string[]";
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enumValues?: readonly string[];
  sanitize?: boolean;
  allowHtml?: boolean;
  maxItems?: number;
};

export type ValidationSchema = Record<string, FieldRule>;

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sanitizeString = (value: string, allowHtml = false): string => {
  const withoutNullBytes = value.replace(/\0/g, "");
  const withoutControls = withoutNullBytes.replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  const compact = normalizeWhitespace(withoutControls);
  return allowHtml ? compact : escapeHtml(compact);
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const looksLikeShellPayload = (value: string): boolean => {
  const shellMeta = /(`|\$\(|\|\||&&|\|\s*[a-zA-Z]|;\s*[a-zA-Z])/;
  const commandWords = /\b(?:bash|sh|zsh|curl|wget|rm|cat|chmod|chown|node|npm|pnpm|yarn)\b/i;
  return shellMeta.test(value) && commandWords.test(value);
};

const inspectPayload = (input: unknown, depth = 0): boolean => {
  if (depth > 8) return false;

  if (typeof input === "string") {
    if (input.length > 5000) return false;
    if (looksLikeShellPayload(input)) return false;
    return true;
  }

  if (Array.isArray(input)) {
    if (input.length > 200) return false;
    return input.every((item) => inspectPayload(item, depth + 1));
  }

  if (isPlainObject(input)) {
    for (const [key, value] of Object.entries(input)) {
      if (FORBIDDEN_KEYS.has(key)) return false;
      if (key.startsWith("$") || key.includes(".")) return false;
      if (!inspectPayload(value, depth + 1)) return false;
    }
  }

  return true;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return null;
};

const validateField = (key: string, value: unknown, rule: FieldRule): { ok: boolean; value?: unknown; error?: string } => {
  if (value === undefined || value === null || value === "") {
    if (rule.required) return { ok: false, error: `${key} is required` };
    return { ok: true, value: undefined };
  }

  if (rule.type === "string") {
    if (typeof value !== "string") return { ok: false, error: `${key} must be a string` };
    const sanitized = rule.sanitize === false ? value.trim() : sanitizeString(value, rule.allowHtml === true);
    if (rule.minLength !== undefined && sanitized.length < rule.minLength) {
      return { ok: false, error: `${key} is too short` };
    }
    if (rule.maxLength !== undefined && sanitized.length > rule.maxLength) {
      return { ok: false, error: `${key} is too long` };
    }
    if (rule.pattern && !rule.pattern.test(sanitized)) {
      return { ok: false, error: `${key} has invalid format` };
    }
    return { ok: true, value: sanitized };
  }

  if (rule.type === "email") {
    if (typeof value !== "string") return { ok: false, error: `${key} must be a string` };
    const sanitized = sanitizeString(value.toLowerCase());
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    if (!emailRegex.test(sanitized)) return { ok: false, error: `${key} must be a valid email` };
    if (rule.maxLength !== undefined && sanitized.length > rule.maxLength) {
      return { ok: false, error: `${key} is too long` };
    }
    return { ok: true, value: sanitized };
  }

  if (rule.type === "uuid") {
    if (typeof value !== "string") return { ok: false, error: `${key} must be a string` };
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const sanitized = value.trim();
    if (!uuidRegex.test(sanitized)) return { ok: false, error: `${key} must be a valid UUID` };
    return { ok: true, value: sanitized };
  }

  if (rule.type === "number") {
    const num = toNumber(value);
    if (num === null) return { ok: false, error: `${key} must be a number` };
    if (rule.min !== undefined && num < rule.min) return { ok: false, error: `${key} is too small` };
    if (rule.max !== undefined && num > rule.max) return { ok: false, error: `${key} is too large` };
    return { ok: true, value: num };
  }

  if (rule.type === "boolean") {
    if (typeof value === "boolean") return { ok: true, value };
    if (value === "true") return { ok: true, value: true };
    if (value === "false") return { ok: true, value: false };
    return { ok: false, error: `${key} must be a boolean` };
  }

  if (rule.type === "enum") {
    if (typeof value !== "string") return { ok: false, error: `${key} must be a string` };
    const sanitized = sanitizeString(value);
    if (!rule.enumValues || !rule.enumValues.includes(sanitized)) {
      return { ok: false, error: `${key} must be one of: ${(rule.enumValues || []).join(", ")}` };
    }
    return { ok: true, value: sanitized };
  }

  if (rule.type === "string[]") {
    if (!Array.isArray(value)) return { ok: false, error: `${key} must be an array of strings` };
    if (rule.maxItems !== undefined && value.length > rule.maxItems) {
      return { ok: false, error: `${key} has too many items` };
    }
    const out: string[] = [];
    for (const item of value) {
      if (typeof item !== "string") return { ok: false, error: `${key} must contain only strings` };
      const sanitized = sanitizeString(item, rule.allowHtml === true);
      if (rule.pattern && !rule.pattern.test(sanitized)) return { ok: false, error: `${key} contains invalid value` };
      if (rule.maxLength !== undefined && sanitized.length > rule.maxLength) return { ok: false, error: `${key} contains value that is too long` };
      out.push(sanitized);
    }
    return { ok: true, value: out };
  }

  return { ok: false, error: `${key} has unsupported validation type` };
};

const validateSource = (
  source: Record<string, unknown>,
  schema: ValidationSchema,
  allowUnknown: boolean
): { ok: boolean; data?: Record<string, unknown>; errors?: string[] } => {
  const errors: string[] = [];
  const data: Record<string, unknown> = {};

  for (const [key, rule] of Object.entries(schema)) {
    const result = validateField(key, source[key], rule);
    if (!result.ok) {
      errors.push(result.error || `${key} is invalid`);
      continue;
    }
    if (result.value !== undefined) data[key] = result.value;
  }

  if (!allowUnknown) {
    for (const key of Object.keys(source)) {
      if (!Object.prototype.hasOwnProperty.call(schema, key)) {
        errors.push(`${key} is not allowed`);
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, data };
};

const validateRequestPart = (
  accessor: "body" | "query" | "params",
  schema: ValidationSchema,
  options?: { allowUnknown?: boolean }
) => {
  const allowUnknown = options?.allowUnknown ?? false;

  return (req: Request, res: Response, next: NextFunction) => {
    const source = (req[accessor] || {}) as Record<string, unknown>;
    const result = validateSource(source, schema, allowUnknown);

    if (!result.ok) {
      return res.status(400).json({
        error: "Invalid input",
        details: result.errors,
      });
    }

    req[accessor] = result.data as any;
    return next();
  };
};

export const validateBody = (schema: ValidationSchema, options?: { allowUnknown?: boolean }) =>
  validateRequestPart("body", schema, options);

export const validateQuery = (schema: ValidationSchema, options?: { allowUnknown?: boolean }) =>
  validateRequestPart("query", schema, options);

export const validateParams = (schema: ValidationSchema, options?: { allowUnknown?: boolean }) =>
  validateRequestPart("params", schema, options);

export const inputFirewall = (req: Request, res: Response, next: NextFunction) => {
  if (!inspectPayload(req.params) || !inspectPayload(req.query) || !inspectPayload(req.body)) {
    return res.status(400).json({
      error: "Malformed or potentially unsafe input detected",
    });
  }

  return next();
};
