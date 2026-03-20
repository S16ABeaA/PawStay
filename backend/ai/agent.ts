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
import { sanitizeToolArgs, SUPPORTED_TOOLS, validateToolArgs } from "./schemas";
import { defaultTools } from "./tools";
import { AgentRunInput, AgentRunOutput, ToolDefinition, ToolName } from "./types";
import {
  geminiAgentLoop,
  getGeminiToolSchema,
  GeminiToolDeclaration,
} from "./geminiClient";

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

    if (this.isAddPetNavigationIntent(userMessage)) {
      const reply =
        "You can add your pet profile in **My Pets**. Tap here to continue: [Go to My Pets](/my-pets).";

      sessionMemory.append(sessionId, {
        role: "assistant",
        content: reply,
      });

      return {
        reply,
        usedTools: [],
        toolActivity: [],
      };
    }

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
      const toolName = name as ToolName;
      const safeArgs = sanitizeToolArgs(toolName, args);
      const validation = validateToolArgs(toolName, safeArgs);
      if (!validation.ok) {
        return { error: `Invalid arguments for ${name}: ${validation.errors.join(", ")}` };
      }

      try {
        return await tool.run(safeArgs, {
          authToken,
          userId,
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

      // Pass the reply through as-is — the LLM formats property names as
      // markdown links per the system prompt, and the frontend markdown
      // renderer is responsible for turning them into clickable hyperlinks.
      const reply = result.text;

      // Persist the assistant reply in session memory
      sessionMemory.append(sessionId, {
        role: "assistant",
        content: reply,
      });

      // Build usedTools from the activity log
      const usedTools = result.toolActivity.map((a) => ({
        tool: a.tool as ToolName,
        args: a.args,
      }));

      return {
        reply,
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

  private isAddPetNavigationIntent(message: string): boolean {
    const text = String(message || "").toLowerCase();
    if (!text) return false;

    const mentionsPet = /\bpet\b|\bpets\b/.test(text);
    const asksAddLocation =
      /\bwhere\b/.test(text) &&
      (/\badd\b/.test(text) || /\bcreate\b/.test(text) || /\bregister\b/.test(text));
    const directAddIntent =
      /\bhow\s+to\s+add\b/.test(text) ||
      /\badd\s+(a\s+)?(new\s+)?pet\b/.test(text) ||
      /\bcreate\s+(a\s+)?pet\b/.test(text) ||
      /\bregister\s+(a\s+)?pet\b/.test(text);

    return mentionsPet && (asksAddLocation || directAddIntent);
  }
}

export const petPlatformAgent = new PetPlatformAgent();