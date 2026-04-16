import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";

const DEFAULT_LANGUAGE = "eng";
const DEFAULT_OCR_MODELS = [
  "gemini-3.1-flash-lite-preview",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
] as const;

const OCR_PROMPT = `You are an OCR engine. Extract all readable text from the image exactly as it appears.
Rules:
- Return only the extracted text.
- Do not add explanations, markdown, labels, or extra words.
- Preserve line breaks where possible.
- If no text is readable, return an empty string.`;

const normalizeLanguage = (language?: string): string => {
  const value = String(language || DEFAULT_LANGUAGE).trim().toLowerCase();
  return value || DEFAULT_LANGUAGE;
};

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
};

const getOcrModelCandidates = (): string[] => {
  const models = new Set<string>();

  const add = (raw: unknown) => {
    const value = String(raw || "").trim();
    if (!value) return;
    models.add(value);
  };

  add(process.env.GEMINI_OCR_MODEL);
  add(process.env.GEMINI_VISION_MODEL);
  add(process.env.GEMINI_MODEL);

  for (const fallback of DEFAULT_OCR_MODELS) {
    add(fallback);
  }

  return Array.from(models);
};

const isTransientGeminiBusyError = (error: unknown): boolean => {
  const message = String((error as any)?.message || error || "").toLowerCase();

  return (
    message.includes("503") ||
    message.includes("429") ||
    message.includes("service unavailable") ||
    message.includes("high demand") ||
    message.includes("resource exhausted") ||
    message.includes("overloaded") ||
    message.includes("temporarily unavailable")
  );
};

export const decodeBase64Image = (value: string): Buffer => {
  const input = String(value || "").trim();
  if (!input) {
    throw new Error("image_base64 is required");
  }

  const dataUrlMatch = input.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  const base64Payload = dataUrlMatch ? dataUrlMatch[1] : input;

  try {
    return Buffer.from(base64Payload, "base64");
  } catch {
    throw new Error("Invalid base64 image format");
  }
};

const getMimeTypeFromDataUrl = (value: string): string => {
  const input = String(value || "").trim();
  const match = input.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  return match?.[1] || "image/jpeg";
};

const cleanGeminiOcrText = (value: string): string => {
  const text = String(value || "").trim();
  if (!text) return "";

  const noFence = text.replace(/```(?:text|plaintext)?\n?/gi, "").replace(/```/g, "").trim();
  const noPrefix = noFence.replace(/^extracted text\s*:?\s*/i, "").trim();
  return noPrefix;
};

const runGeminiOcr = async (
  buffer: Buffer,
  mimeType: string,
  language?: string,
): Promise<{ text: string; language: string }> => {
  if (!buffer || buffer.length === 0) {
    throw new Error("Document content is empty");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const normalizedLanguage = normalizeLanguage(language);
  const modelCandidates = getOcrModelCandidates();
  const busyRetries = parsePositiveInt(process.env.GEMINI_OCR_BUSY_RETRIES, 2);
  const retryBaseMs = parsePositiveInt(process.env.GEMINI_OCR_RETRY_BASE_MS, 300);
  const client = new GoogleGenerativeAI(apiKey);

  const languageHint =
    normalizedLanguage && normalizedLanguage !== DEFAULT_LANGUAGE
      ? `Primary expected language code: ${normalizedLanguage}.`
      : "";

  let lastError: unknown = null;

  for (const modelName of modelCandidates) {
    const model = client.getGenerativeModel({ model: modelName });

    for (let attempt = 0; attempt <= busyRetries; attempt += 1) {
      try {
        const response = await model.generateContent([
          `${OCR_PROMPT}\n${languageHint}`.trim(),
          {
            inlineData: {
              data: buffer.toString("base64"),
              mimeType,
            },
          },
        ]);

        const rawText = response.response.text();
        const text = cleanGeminiOcrText(rawText);
        return { text, language: normalizedLanguage };
      } catch (error) {
        lastError = error;

        if (!isTransientGeminiBusyError(error)) {
          break;
        }

        if (attempt < busyRetries) {
          await wait(retryBaseMs * (attempt + 1));
        }
      }
    }
  }

  const lastMessage = String((lastError as any)?.message || "Unknown OCR error");
  throw new Error(
    `OCR failed after trying ${modelCandidates.join(", ")}. Last error: ${lastMessage}`,
  );
};

const normalizeImageMimeType = (mimeType?: string): string => {
  const value = String(mimeType || "").trim().toLowerCase();
  if (value.startsWith("image/")) return value;
  return "image/jpeg";
};

export const extractTextFromImageBuffer = async (
  imageBuffer: Buffer,
  mimeTypeOrLanguage?: string,
  language?: string,
): Promise<{ text: string; language: string }> => {
  const maybeMime = String(mimeTypeOrLanguage || "").trim().toLowerCase();
  const hasExplicitMime = maybeMime.startsWith("image/");

  const mimeType = hasExplicitMime
    ? normalizeImageMimeType(mimeTypeOrLanguage)
    : "image/jpeg";
  const resolvedLanguage = hasExplicitMime ? language : mimeTypeOrLanguage;

  return runGeminiOcr(imageBuffer, mimeType, resolvedLanguage);
};

export const extractTextFromBase64Image = async (
  imageBase64: string,
  language?: string,
): Promise<{ text: string; language: string }> => {
  const imageBuffer = decodeBase64Image(imageBase64);
  const mimeType = normalizeImageMimeType(getMimeTypeFromDataUrl(imageBase64));

  return runGeminiOcr(imageBuffer, mimeType, language);
};

export const decodeBase64Document = (
  value: string,
): { buffer: Buffer; mimeType: string } => {
  const input = String(value || "").trim();
  if (!input) {
    throw new Error("document_base64 is required");
  }

  const dataUrlMatch = input.match(/^data:([^;]+);base64,(.+)$/i);
  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1].toLowerCase(),
      buffer: Buffer.from(dataUrlMatch[2], "base64"),
    };
  }

  return {
    mimeType: "application/octet-stream",
    buffer: Buffer.from(input, "base64"),
  };
};

export const extractTextFromDocumentBuffer = async (
  fileBuffer: Buffer,
  mimeType: string,
  language?: string,
): Promise<{ text: string; language: string }> => {
  const safeMimeType = String(mimeType || "application/octet-stream").toLowerCase();

  if (safeMimeType === "text/plain") {
    // Parse plain text files directly to avoid unnecessary OCR latency.
    const text = String(fileBuffer.toString("utf8") || "").trim();
    if (text) {
      return { text, language: normalizeLanguage(language) };
    }
  }

  if (safeMimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    try {
      const extracted = await mammoth.extractRawText({ buffer: fileBuffer });
      const text = String(extracted.value || "").trim();
      if (text) {
        return { text, language: normalizeLanguage(language) };
      }
    } catch {
      // Fallback to OCR model path if parser fails.
    }
  }

  return runGeminiOcr(fileBuffer, safeMimeType, language);
};

export const extractTextFromBase64Document = async (
  documentBase64: string,
  language?: string,
): Promise<{ text: string; language: string; mimeType: string }> => {
  const { buffer, mimeType } = decodeBase64Document(documentBase64);
  const ocr = await runGeminiOcr(buffer, mimeType, language);
  return { ...ocr, mimeType };
};
