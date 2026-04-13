import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";

const DEFAULT_LANGUAGE = "eng";

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
  const modelName =
    process.env.GEMINI_OCR_MODEL || process.env.GEMINI_VISION_MODEL || process.env.GEMINI_MODEL || "gemini-1.5-flash";

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: modelName });

  const languageHint =
    normalizedLanguage && normalizedLanguage !== DEFAULT_LANGUAGE
      ? `Primary expected language code: ${normalizedLanguage}.`
      : "";

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
};

export const extractTextFromImageBuffer = async (
  imageBuffer: Buffer,
  language?: string,
): Promise<{ text: string; language: string }> => {
  return runGeminiOcr(imageBuffer, "image/jpeg", language);
};

export const extractTextFromBase64Image = async (
  imageBase64: string,
  language?: string,
): Promise<{ text: string; language: string }> => {
  const imageBuffer = decodeBase64Image(imageBase64);
  const mimeType = getMimeTypeFromDataUrl(imageBase64);

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
