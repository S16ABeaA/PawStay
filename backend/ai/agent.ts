/**
 * agent.ts — PawStay Agentic AI Assistant (Gemini 2.5 Flash)
 *
 * Implements a full agentic loop:
 *   1. Convert session history to Gemini Content format
 *   2. Call geminiAgentLoop which handles: LLM → tool calls → execute → feed back → repeat
 *   3. Return the final natural-language reply + tool activity log
 *
 * The agent keeps calling Gemini until:
 *   - The model returns a text-only response (no more tool calls), OR
 *   - The max iteration limit (10) is reached
 *
 * Full conversation history is passed every turn for multi-turn context.
 */

import { Content } from "@google/generative-ai";
import { sessionMemory } from "./memory/sessionMemory";
import { PET_PLATFORM_SYSTEM_PROMPT } from "./prompts/systemPrompt";
import { defaultTools } from "./tools";
import { AgentRunInput, AgentRunOutput, ToolDefinition, ToolName } from "./types";
import {
  geminiAgentLoop,
  getGeminiToolSchema,
  GeminiToolDeclaration,
} from "./geminiClient";

/* ------------------------------------------------------------------ */
/*  Supported tool names for validation                                */
/* ------------------------------------------------------------------ */

const SUPPORTED_TOOLS: Set<string> = new Set<string>([
  "search_services",
  "create_booking",
  "get_user_bookings",
  "cancel_booking",
  "get_provider_revenue",
]);

/* ------------------------------------------------------------------ */
/*  Agent class                                                        */
/* ------------------------------------------------------------------ */

export class PetPlatformAgent {
  private toolMap: Map<ToolName, ToolDefinition<any, any>>;

  constructor(tools: ToolDefinition<any, any>[] = defaultTools) {
    this.toolMap = new Map(tools.map((tool) => [tool.name, tool]));
  }

  /** List all registered tools */
  listTools(): ToolDefinition<any, any>[] {
    return Array.from(this.toolMap.values());
  }

  /**
   * Main entry point — run the agentic loop for a user message.
   */
  async run(input: AgentRunInput): Promise<AgentRunOutput> {
    const { sessionId, userMessage, userId, authToken } = input;

    // --------------------------------------------------
    // 1. Persist the user message in session memory
    // --------------------------------------------------
    sessionMemory.append(sessionId, { role: "user", content: userMessage });

    // --------------------------------------------------
    // 2. Build Gemini conversation history from session
    // --------------------------------------------------
    const history = this.buildGeminiHistory(sessionId);

    // --------------------------------------------------
    // 3. Build Gemini tool declarations from our tools
    // --------------------------------------------------
    const toolDefs: GeminiToolDeclaration[] = this.listTools().map((t) => ({
      name: t.name,
      description: t.description,
      parameters: getGeminiToolSchema(t.name),
    }));

    // --------------------------------------------------
    // 4. Define the tool executor callback
    //    This is called by geminiAgentLoop each time the
    //    model decides to invoke a tool.
    // --------------------------------------------------
    const executeTool = async (
      name: string,
      args: Record<string, unknown>,
    ): Promise<unknown> => {
      if (!SUPPORTED_TOOLS.has(name)) {
        return { error: `Unknown tool: ${name}` };
      }
      const tool = this.toolMap.get(name as ToolName);
      if (!tool) return { error: `Tool not configured: ${name}` };

      // Sanitize args to only allow expected fields
      const safeArgs = this.sanitizeArgs(name as ToolName, args);

      try {
        return await tool.run(safeArgs, {
          authToken,
          userMessage, // pass original message for context-aware tools
        });
      } catch (err: any) {
        return { error: err?.message ?? "Tool execution failed" };
      }
    };

    // --------------------------------------------------
    // 5. Run the Gemini agentic loop
    //    This keeps calling the model until it returns
    //    a final text response with no more tool calls,
    //    or the max iteration cap is hit.
    // --------------------------------------------------
    try {
      const result = await geminiAgentLoop(
        PET_PLATFORM_SYSTEM_PROMPT,
        history,
        toolDefs,
        executeTool,
      );

      // Persist the assistant reply in session memory
      sessionMemory.append(sessionId, {
        role: "assistant",
        content: result.text,
      });

      // Build usedTools from the activity log
      const usedTools = result.toolActivity.map((a) => ({
        tool: a.tool as ToolName,
        args: a.args,
      }));

      return {
        reply: result.text,
        usedTools,
        toolActivity: result.toolActivity.map((a) => ({
          tool: a.tool,
          status: "completed" as const,
        })),
      };
    } catch (err: any) {
      const short = err?.message ?? String(err ?? "Agent error");
      console.warn(`[agent] Gemini loop failed: ${short}`);

      const fallbackReply =
        "I'm having trouble connecting to my AI backend right now. Please try again in a moment!";
      sessionMemory.append(sessionId, {
        role: "assistant",
        content: fallbackReply,
      });
      return { reply: fallbackReply, usedTools: [] };
    }
  }

  /**
   * Convert our session memory (AgentMessage[]) into Gemini's Content[] format.
   *
   * Gemini expects: { role: "user" | "model", parts: [{ text }] }
   * We skip system messages (handled via systemInstruction) and tool messages
   * (those are managed internally by the Gemini chat session).
   */
  private buildGeminiHistory(sessionId: string): Content[] {
    const messages = sessionMemory.get(sessionId);
    const contents: Content[] = [];

    for (const msg of messages) {
      if (msg.role === "system" || msg.role === "tool") continue;

      if (msg.role === "user") {
        contents.push({ role: "user", parts: [{ text: msg.content }] });
      } else if (msg.role === "assistant") {
        contents.push({ role: "model", parts: [{ text: msg.content }] });
      }
    }

    return contents;
  }

  /**
   * Sanitize tool arguments to only include expected fields.
   * Prevents prompt injection of unexpected parameters.
   */
  private sanitizeArgs(
    tool: ToolName,
    args: Record<string, unknown>,
  ): Record<string, unknown> {
    const asString = (value: unknown): string | undefined => {
      if (value === undefined || value === null) return undefined;
      const str = String(value).trim();
      return str || undefined;
    };

    switch (tool) {
      case "search_services":
        return {
          location: asString(args.location),
          service_type: asString(args.service_type),
        };
      case "create_booking":
        return {
          user_id: asString(args.user_id),
          service_id: asString(args.service_id),
          date: asString(args.date),
          time: asString(args.time),
        };
      case "get_user_bookings":
        return { user_id: asString(args.user_id) };
      case "cancel_booking":
        return { booking_id: asString(args.booking_id) };
      case "get_provider_revenue":
        return {
          provider_id: asString(args.provider_id),
          month: asString(args.month),
        };
      default:
        return {};
    }
  }
}

export const petPlatformAgent = new PetPlatformAgent();
