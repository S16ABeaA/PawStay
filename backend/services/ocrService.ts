import { createWorker } from "tesseract.js";

const DEFAULT_LANGUAGE = "eng";

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

export const extractTextFromImageBuffer = async (
  imageBuffer: Buffer,
  language?: string,
): Promise<{ text: string; language: string }> => {
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("Image content is empty");
  }

  const normalizedLanguage = normalizeLanguage(language);
  const worker = await createWorker(normalizedLanguage);

  try {
    const result = await worker.recognize(imageBuffer);
    const text = String(result?.data?.text ?? "").trim();
    return { text, language: normalizedLanguage };
  } finally {
    await worker.terminate();
  }
};

export const extractTextFromBase64Image = async (
  imageBase64: string,
  language?: string,
): Promise<{ text: string; language: string }> => {
  const imageBuffer = decodeBase64Image(imageBase64);
  return extractTextFromImageBuffer(imageBuffer, language);
};
