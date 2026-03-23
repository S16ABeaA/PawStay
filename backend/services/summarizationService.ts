import { SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "../config/supabaseAdmin";
import { updateSummary } from "./chatSessionService";

interface RunSummarizationArgs {
  sessionId: string;
  anonClient: SupabaseClient;
}

interface SummarizeIfNeededArgs {
  sessionId: string;
  petId: string;
  messageCount: number;
  anonClient: SupabaseClient;
}

export async function runSummarization({ sessionId, anonClient }: RunSummarizationArgs) {
  try {
    const { data: messages, error } = await supabaseAdmin
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(30);

    if (error) {
      throw new Error(error.message);
    }

    if (!messages || messages.length === 0) {
      return;
    }

    const formattedMessages = messages.map((m: any) => `${m.role}: ${m.content}`).join("\n");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview",
    });

    const prompt = `Summarize the following pet health conversation in 3-5 sentences. Focus on: health concerns mentioned, recommendations given, owner questions, and follow-up actions discussed. Be concise and factual. Do not include greetings or filler.

Conversation:
${formattedMessages}`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    await updateSummary({ sessionId, summary, anonClient });
  } catch (err: any) {
    console.error("[summarization] sessionId:", sessionId, err.message);
  }
}

export function summarizeIfNeeded({
  sessionId,
  petId,
  messageCount,
  anonClient,
}: SummarizeIfNeededArgs) {
  void petId;
  if (messageCount > 0 && messageCount % 15 === 0) {
    runSummarization({ sessionId, anonClient })
      .then(() => {})
      .catch((err: any) => console.error("[summarizeIfNeeded]", sessionId, err.message));
  }
}
