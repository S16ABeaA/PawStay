/**
 * geminiClient.ts — Gemini 2.5 Flash agentic client
 *
 * Uses the @google/generative-ai SDK with function-calling support.
 * Implements a full agentic loop: LLM call → tool calls → execute → feed results back → repeat
 * until the model emits a final text response (or the iteration cap is reached).
 */

import {
  GoogleGenerativeAI,
  Content,
  SchemaType,
  FunctionDeclaration,
  Part,
  Tool,
} from "@google/generative-ai";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GeminiToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface GeminiFunctionCall {
  name: string;
  args: Record<string, unknown>;
}

export interface GeminiLoopResult {
  /** The final natural-language reply from the model */
  text: string;
  /** Ordered log of every tool invocation that happened during the loop */
  toolActivity: Array<{
    tool: string;
    args: Record<string, unknown>;
    result: unknown;
  }>;
}

/* ------------------------------------------------------------------ */
/*  Tool schema builder — converts our simple tool defs into Gemini    */
/*  FunctionDeclaration format                                         */
/* ------------------------------------------------------------------ */

const buildToolDeclarations = (
  tools: GeminiToolDeclaration[],
): Tool[] => {
  const functionDeclarations: FunctionDeclaration[] = tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters as any,
  }));
  return [{ functionDeclarations }];
};

/* ------------------------------------------------------------------ */
/*  Gemini function-calling parameter schemas per tool                  */
/* ------------------------------------------------------------------ */

export const getGeminiToolSchema = (toolName: string): Record<string, unknown> => {
  switch (toolName) {
    case "search_services":
      return {
        type: SchemaType.OBJECT,
        properties: {
          location: {
            type: SchemaType.STRING,
            description: "City, area, or location keyword (e.g. Manila, Quezon City)",
          },
          service_type: {
            type: SchemaType.STRING,
            description: "Service category: boarding, grooming, walking, sitting, veterinary",
          },
        },
      };
    case "create_booking":
      return {
        type: SchemaType.OBJECT,
        properties: {
          user_id: { type: SchemaType.STRING, description: "User ID" },
          service_id: { type: SchemaType.STRING, description: "Service/property ID" },
          date: { type: SchemaType.STRING, description: "Booking date YYYY-MM-DD" },
          time: { type: SchemaType.STRING, description: "Booking time HH:mm" },
        },
        required: ["user_id", "service_id", "date", "time"],
      };
    case "get_user_bookings":
      return {
        type: SchemaType.OBJECT,
        properties: {
          user_id: { type: SchemaType.STRING, description: "User ID" },
        },
        required: ["user_id"],
      };
    case "cancel_booking":
      return {
        type: SchemaType.OBJECT,
        properties: {
          booking_id: { type: SchemaType.STRING, description: "Booking ID to cancel" },
        },
        required: ["booking_id"],
      };
    case "get_provider_revenue":
      return {
        type: SchemaType.OBJECT,
        properties: {
          provider_id: { type: SchemaType.STRING, description: "Provider user ID" },
          month: { type: SchemaType.STRING, description: "Month as YYYY-MM" },
        },
        required: ["provider_id"],
      };
    default:
      return {
        type: SchemaType.OBJECT,
        properties: {},
      };
  }
};

/* ------------------------------------------------------------------ */
/*  Agentic loop                                                       */
/* ------------------------------------------------------------------ */

const MAX_ITERATIONS = 10;

/**
 * Run the Gemini agentic loop.
 *
 * @param systemPrompt  - System-level instructions
 * @param history       - Multi-turn conversation history so far
 * @param toolDefs      - Available tool declarations
 * @param executeTool   - Callback that executes a tool and returns the result
 */
export const geminiAgentLoop = async (
  systemPrompt: string,
  history: Content[],
  toolDefs: GeminiToolDeclaration[],
  executeTool: (name: string, args: Record<string, unknown>) => Promise<unknown>,
): Promise<GeminiLoopResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  // Initialise Gemini client
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
    tools: buildToolDeclarations(toolDefs),
  });

  // Start a chat session with existing conversation history
  const chat = model.startChat({ history });

  const toolActivity: GeminiLoopResult["toolActivity"] = [];

  // The last user message is the latest entry in history; we send an empty
  // string to trigger the model since history already contains the user turn.
  // Actually, we need to call sendMessage with at least a space to trigger.
  // But the SDK's startChat expects us to call sendMessage for a new turn.
  // Since we already put the user message in `history`, we kick-start by
  // sending a synthetic "continue" that the model treats as a noop.
  // NOTE: the proper way is to NOT include the last user turn in history
  // and instead pass it via sendMessage. The caller should handle this.

  // We expect the caller puts the latest user message as the last item.
  // Pop it to send via sendMessage.
  const lastUserContent = history[history.length - 1];
  const conversationHistory = history.slice(0, -1);

  // Re-create chat with the history minus last message
  const chatSession = model.startChat({ history: conversationHistory });

  // Extract text from the last user message
  const lastUserText =
    lastUserContent?.parts
      ?.map((p: Part) => ("text" in p ? p.text : ""))
      .join("") || "Hello";

  // ---- Agentic Loop ----
  // Keep calling the model until it returns a text-only response (no tool calls)
  // or we hit the max iteration limit.
  let iteration = 0;
  let currentInput: string | Part[] = lastUserText;

  while (iteration < MAX_ITERATIONS) {
    iteration++;

    // Send message to Gemini
    const response = await chatSession.sendMessage(currentInput);
    const candidate = response.response.candidates?.[0];
    if (!candidate) {
      return { text: "I'm sorry, I couldn't generate a response.", toolActivity };
    }

    const parts = candidate.content?.parts ?? [];

    // Check for function calls in the response
    const functionCalls = parts.filter(
      (p: Part) => "functionCall" in p && p.functionCall,
    );

    // If no function calls, we have the final text response — exit loop
    if (functionCalls.length === 0) {
      const textParts = parts
        .filter((p: Part) => "text" in p && p.text)
        .map((p: Part) => ("text" in p ? p.text : ""))
        .join("");
      return { text: textParts || "Done!", toolActivity };
    }

    // Execute each tool call (supports parallel tool calls)
    const functionResponseParts: Part[] = [];

    for (const fc of functionCalls) {
      const call = (fc as any).functionCall as GeminiFunctionCall;
      const toolName = call.name;
      const toolArgs = call.args ?? {};

      console.log(`[gemini-agent] Calling tool: ${toolName}`, toolArgs);

      let toolResult: unknown;
      try {
        toolResult = await executeTool(toolName, toolArgs);
      } catch (err: any) {
        toolResult = { error: err?.message ?? "Tool execution failed" };
      }

      // Track activity for the frontend
      toolActivity.push({ tool: toolName, args: toolArgs, result: toolResult });

      // Build the function response part to feed back to Gemini
      functionResponseParts.push({
        functionResponse: {
          name: toolName,
          response: toolResult as any,
        },
      } as Part);
    }

    // Feed all tool results back to the model for the next iteration
    currentInput = functionResponseParts;
  }

  // If we exhausted iterations, return whatever we have
  return {
    text: "I've completed several steps but reached my processing limit. Please try again or ask a simpler question.",
    toolActivity,
  };
};
