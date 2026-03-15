export type ToolName =
  | "search_services"
  | "get_reviews"
  | "create_booking"
  | "get_user_bookings"
  | "cancel_booking"
  | "get_provider_revenue";

export interface ToolContext {
  authToken?: string;
  requestId?: string;
  userMessage?: string;
}

export interface ToolDefinition<TArgs = Record<string, unknown>, TResult = unknown> {
  name: ToolName;
  description: string;
  inputSchema: string;
  run: (args: TArgs, context?: ToolContext) => Promise<TResult>;
}

export interface AgentMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolName?: ToolName;
}

export interface AgentRunInput {
  sessionId: string;
  userMessage: string;
  userId?: string;
  authToken?: string;
}

export interface AgentRunOutput {
  reply: string;
  usedTools: Array<{
    tool: ToolName;
    args: Record<string, unknown>;
  }>;
  /** Ordered log of tool calls made during the agentic loop */
  toolActivity?: Array<{
    tool: string;
    status: "completed" | "error";
  }>;
}
