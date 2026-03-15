import { Request, Response } from "express";
import { petPlatformAgent } from "../ai/agent";

interface ChatRequestBody {
  message?: string;
  sessionId?: string;
}

export const aiController = {
  /**
   * POST /api/ai/chat
   * Example body:
   * {
   *   "message": "Find dog grooming near me"
   * }
   */
  chat: async (req: Request, res: Response) => {
    try {
      const { message, sessionId }: ChatRequestBody = req.body ?? {};

      if (!message || !message.trim()) {
        return res.status(400).json({ error: "message is required" });
      }

      const authHeader = req.headers.authorization;
      const authToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : undefined;

      const userId = (req as any).user?.id as string | undefined;

      const result = await petPlatformAgent.run({
        sessionId: sessionId ?? `anon-${Date.now()}`,
        userMessage: message,
        userId,
        authToken,
      });

      return res.json({
        message: result.reply,
        usedTools: result.usedTools,
        toolActivity: result.toolActivity ?? [],
      });
    } catch (error: any) {
      console.error("ai chat error:", error);
      return res.status(500).json({
        error: "Failed to process AI chat request",
        details: error?.message ?? "Unknown error",
      });
    }
  },
};
