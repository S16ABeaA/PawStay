const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

export interface AiChatRequest {
  message: string;
  sessionId?: string;
}

export interface AiChatResponse {
  message: string;
  usedTools: Array<{
    tool: string;
    args: Record<string, unknown>;
  }>;
  toolActivity?: Array<{
    tool: string;
    status: string;
  }>;
}

export const aiChatApi = {
  async chat(payload: AiChatRequest): Promise<AiChatResponse> {
    const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let detail = `status ${res.status}`;
      try {
        const body = await res.json();
        detail = body?.error ?? body?.message ?? detail;
      } catch {
        // response wasn't JSON — use status text
      }
      throw new Error(detail);
    }

    return res.json();
  },
};
