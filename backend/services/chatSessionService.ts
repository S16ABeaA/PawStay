import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../config/supabaseAdmin";

interface CreateSessionArgs {
  userId: string;
  petId: string;
  petName: string;
}

interface PersistMessageArgs {
  sessionId: string;
  petId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
}

interface UpdateSummaryArgs {
  sessionId: string;
  summary: string;
  anonClient: SupabaseClient;
}

export async function createSession({ userId, petId, petName }: CreateSessionArgs) {
  const date = new Date().toISOString().slice(0, 10);
  const title = `Chat – ${petName} – ${date}`;

  const { data, error } = await supabaseAdmin
    .from("chat_sessions")
    .insert({
      user_id: userId,
      pet_id: petId,
      title,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create chat session: ${error.message}`);
  }

  return data;
}

export async function persistMessage({
  sessionId,
  petId,
  role,
  content,
  metadata = {},
}: PersistMessageArgs) {
  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      pet_id: petId,
      role,
      content,
      metadata,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to persist message: ${error.message}`);
  }

  return data;
}

export async function getMessageCount(sessionId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (error) {
    throw new Error(`Failed to get message count: ${error.message}`);
  }

  return Number(count || 0);
}

export async function updateSummary({ sessionId, summary, anonClient }: UpdateSummaryArgs) {
  const { error } = await anonClient.rpc("update_session_summary", {
    p_session_id: sessionId,
    p_summary: summary,
  });

  if (error) {
    throw new Error(`Failed to update session summary: ${error.message}`);
  }
}
