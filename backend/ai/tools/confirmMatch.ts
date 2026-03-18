import { TOOL_INPUT_SCHEMA_TEXT } from "../schemas";
import { ToolContext, ToolDefinition } from "../types";

export interface ConfirmMatchArgs {
  intent: string;
  details?: string;
}

interface ConfirmMatchResult {
  confirmed: boolean;
  intent: string;
  message: string;
}

const hasExplicitConfirmation = (message?: string): boolean => {
  const text = String(message || "").toLowerCase();
  if (!text) return false;

  return /(\byes\b|\bconfirm\b|\bconfirmed\b|\bgo ahead\b|\bproceed\b|\bdo it\b|\bbook it\b|\bfinalize\b)/i.test(text);
};

export const confirmMatchTool: ToolDefinition<ConfirmMatchArgs, ConfirmMatchResult> = {
  name: "confirm_match",
  description: "Check whether the user explicitly confirmed before creating a reservation",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.confirm_match,
  run: async (args, context?: ToolContext) => {
    const confirmed = hasExplicitConfirmation(context?.userMessage);
    return {
      confirmed,
      intent: String(args?.intent || "create_booking"),
      message: confirmed
        ? "User confirmation detected. Safe to continue."
        : "No explicit confirmation detected yet. Ask the user to confirm before creating the reservation.",
    };
  },
};
