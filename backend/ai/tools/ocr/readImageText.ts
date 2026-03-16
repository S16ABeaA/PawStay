import { TOOL_INPUT_SCHEMA_TEXT } from "../../schemas";
import { ToolDefinition } from "../../types";
import { extractTextFromBase64Image } from "../../../services/ocrService";

export interface ReadImageTextArgs {
  image_base64?: string;
  language?: string;
}

interface ReadImageTextResult {
  text: string;
  language: string;
  characters: number;
}

export const readImageTextTool: ToolDefinition<ReadImageTextArgs, ReadImageTextResult> = {
  name: "read_image_text",
  description: "Extract readable text from a base64 image using OCR",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.read_image_text,
  run: async (args) => {
    const imageBase64 = String(args?.image_base64 || "").trim();
    if (!imageBase64) {
      throw new Error("image_base64 is required");
    }

    const { text, language } = await extractTextFromBase64Image(imageBase64, args?.language);

    return {
      text,
      language,
      characters: text.length,
    };
  },
};
