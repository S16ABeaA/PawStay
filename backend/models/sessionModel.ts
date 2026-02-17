import { supabaseAdmin } from "../config/supabaseAdmin";

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const sessionModel = {
  createSession: async (userId: string) => {
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

    const { data, error } = await supabaseAdmin
      .from("sessions")
      .insert([{ user_id: userId, expires_at: expiresAt }])
      .select("id, user_id, expires_at")
      .single();

    if (error) throw error;

    return data;
  },

  getSessionById: async (sessionId: string) => {
    const { data, error } = await supabaseAdmin
      .from("sessions")
      .select("id, user_id, expires_at")
      .eq("id", sessionId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  isExpired: (session: Session) => {
    return new Date(session.expires_at) < new Date();
  },

  updateSessionExpiration: async (sessionId: string, expiresAt: string) => {
    const { error } = await supabaseAdmin
        .from("sessions")
        .update({ expires_at: expiresAt })
        .eq("id", sessionId);

    if (error) throw error;
},
//   deleteSession: async (sessionId: string) => {
//     const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
//     if (error) throw error;
//   },
};
