import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../config/supabaseAdmin";
import { getSemanticallySimilarSummaries } from "./embeddingService";

interface FetchPetContextArgs {
  petId: string;
  sessionId: string | null;
  anonClient: SupabaseClient;
  userMessage?: string | null;
}

interface HealthSummary {
  id?: string;
  source_type?: string;
  extracted_data?: {
    conditions?: string[];
    medications?: string[];
    diet_notes?: string;
    vet_notes?: string;
  };
  date?: string;
  semantic?: boolean;
}

interface ServiceHistoryItem {
  service_type?: string;
  service_name?: string;
  notes?: string;
  date?: string;
}

interface RecommendationItem {
  type?: string;
  content?: string;
  confidence?: number | string;
  expires_at?: string | null;
}

interface ChatMessageItem {
  role?: string;
  content?: string;
  created_at?: string;
}

interface PetContext {
  pet?: {
    name?: string;
    species?: string;
    breed?: string;
    birthday?: string;
    weight?: number | string;
    notes?: string;
  };
  health_summaries?: HealthSummary[];
  service_history?: ServiceHistoryItem[];
  recommendations?: RecommendationItem[];
  chat?: {
    summary?: string;
    messages?: ChatMessageItem[];
  };
}

export async function fetchPetContext({
  petId,
  sessionId,
  anonClient,
  userMessage = null,
}: FetchPetContextArgs) {
  const enrichWithSemanticMatches = async (baseContext: PetContext): Promise<PetContext> => {
    const normalizedMessage = String(userMessage || "").trim();
    if (!normalizedMessage) return baseContext;

    const semanticMatches = await getSemanticallySimilarSummaries({
      petId,
      queryText: normalizedMessage,
      anonClient,
      matchCount: 3,
    });

    if (!Array.isArray(semanticMatches) || semanticMatches.length === 0) {
      return baseContext;
    }

    const sourceIds = semanticMatches
      .map((match) => String(match.source_id || "").trim())
      .filter(Boolean);

    if (sourceIds.length === 0) {
      return baseContext;
    }

    const { data: semanticRows, error: semanticRowsError } = await supabaseAdmin
      .from("pet_health_summaries")
      .select("id, source_type, extracted_data, created_at")
      .in("id", sourceIds);

    if (semanticRowsError) {
      return baseContext;
    }

    const existingSummaries = Array.isArray(baseContext.health_summaries)
      ? baseContext.health_summaries
      : [];
    const recentIds = new Set(existingSummaries.map((summary) => String(summary.id || "")));

    const uniqueSemantic = (Array.isArray(semanticRows) ? semanticRows : [])
      .filter((row: any) => !recentIds.has(String(row.id || "")))
      .map((row: any) => ({
        id: row.id,
        source_type: row.source_type,
        extracted_data: row.extracted_data,
        date: row.created_at,
        semantic: true,
      }));

    return {
      ...baseContext,
      health_summaries: [...existingSummaries, ...uniqueSemantic].slice(0, 6),
    };
  };

  const { data, error } = await anonClient.rpc("get_pet_context", {
    p_pet_id: petId,
    p_session_id: sessionId ?? null,
    p_message_limit: 10,
    p_health_limit: 3,
    p_service_limit: 5,
    p_recommendation_limit: 5,
  });

  if (error) {
    const message = String(error.message || "");
    const isMissingIsDeletedColumn =
      message.toLowerCase().includes("column \"is_deleted\" does not exist") ||
      message.toLowerCase().includes("column is_deleted does not exist");

    if (!isMissingIsDeletedColumn) {
      throw new Error(`Failed to fetch pet context: ${error.message}`);
    }

    const [{ data: pet, error: petError }, { data: health, error: healthError }, { data: history, error: historyError }, { data: recommendations, error: recommendationError }] = await Promise.all([
      anonClient
        .from("pets")
        .select("id, name, species, breed, birthday, weight, notes")
        .eq("id", petId)
        .maybeSingle(),
      anonClient
        .from("pet_health_summaries")
        .select("id, source_type, extracted_data, created_at")
        .eq("pet_id", petId)
        .order("created_at", { ascending: false })
        .limit(3),
      anonClient
        .from("pet_service_history")
        .select("service_type, service_name, notes, performed_at")
        .eq("pet_id", petId)
        .order("performed_at", { ascending: false })
        .limit(5),
      anonClient
        .from("pet_recommendations")
        .select("id, recommendation_type, content, confidence, expires_at, status, created_at")
        .eq("pet_id", petId)
        .eq("status", "active")
        .or("expires_at.is.null,expires_at.gt.now()")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (petError || healthError || historyError || recommendationError) {
      const root = petError || healthError || historyError || recommendationError;
      throw new Error(`Failed to fetch pet context: ${root?.message || message}`);
    }

    let chatSummary: string | null = "";
    let chatMessages: Array<{ role?: string; content?: string; created_at?: string }> = [];

    if (sessionId) {
      const [{ data: session, error: sessionError }, { data: messages, error: messageError }] =
        await Promise.all([
          anonClient
            .from("chat_sessions")
            .select("summary")
            .eq("id", sessionId)
            .maybeSingle(),
          anonClient
            .from("chat_messages")
            .select("role, content, created_at")
            .eq("session_id", sessionId)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

      if (sessionError || messageError) {
        const root = sessionError || messageError;
        throw new Error(`Failed to fetch pet context: ${root?.message || message}`);
      }

      chatSummary = session?.summary ?? "";
      chatMessages = Array.isArray(messages) ? [...messages].reverse() : [];
    }

    const fallbackContext = {
      pet: pet || undefined,
      health_summaries: Array.isArray(health)
        ? health.map((h: any) => ({
            id: h.id,
            source_type: h.source_type,
            extracted_data: h.extracted_data,
            date: h.created_at,
          }))
        : [],
      service_history: Array.isArray(history)
        ? history.map((s: any) => ({
            service_type: s.service_type,
            service_name: s.service_name,
            notes: s.notes,
            date: s.performed_at,
          }))
        : [],
      recommendations: Array.isArray(recommendations)
        ? recommendations.map((r: any) => ({
            id: r.id,
            type: r.recommendation_type,
            content: r.content,
            confidence: r.confidence,
            expires_at: r.expires_at,
            status: r.status,
            created_at: r.created_at,
          }))
        : [],
      chat: {
        summary: chatSummary || "",
        messages: chatMessages,
      },
    } as PetContext;

    return enrichWithSemanticMatches(fallbackContext);
  }

  if (!data) {
    throw new Error("Failed to fetch pet context: RPC returned null data");
  }

  return enrichWithSemanticMatches(data as PetContext);
}

export function formatContextForPrompt(context: PetContext): string {
  const pet = context?.pet || {};
  const healthSummaries = Array.isArray(context?.health_summaries) ? context.health_summaries : [];
  const serviceHistory = Array.isArray(context?.service_history) ? context.service_history : [];
  const recommendations = Array.isArray(context?.recommendations) ? context.recommendations : [];
  const chat = context?.chat || {};

  const petLine = `Pet: ${pet.name || "Unknown"}, ${pet.species || "unknown species"}, ${pet.breed || "breed unknown"}, born ${pet.birthday || "unknown"}, ${pet.weight || "?"}kg`;
  const notesLine = `Notes: ${pet.notes || "none"}`;

  const healthLines = healthSummaries.length
    ? healthSummaries.map((item) => {
        const extracted = item?.extracted_data || {};
        const conditions = Array.isArray(extracted.conditions) && extracted.conditions.length
          ? extracted.conditions.join(", ")
          : "none";
        const medications = Array.isArray(extracted.medications) && extracted.medications.length
          ? extracted.medications.join(", ")
          : "none";
        const label = item?.semantic ? "[relevant record]" : "[recent record]";
        const readableDate = item?.date ? new Date(item.date).toDateString() : "unknown date";
        return `- ${label} ${readableDate}: ${item?.source_type || "unknown"} — conditions: ${conditions}, medications: ${medications}, diet: ${extracted.diet_notes || "none"}, vet notes: ${extracted.vet_notes || "none"}`;
      })
    : ["None on record."];

  const serviceLines = serviceHistory.length
    ? serviceHistory.map(
        (item) =>
          `- ${item?.date || "unknown date"}: ${item?.service_type || "unknown"} — ${item?.service_name || "unknown service"} | ${item?.notes || "no notes"}`,
      )
    : ["None on record."];

  const recommendationLines = recommendations.length
    ? recommendations.map((item) => {
        const confidenceNumber = Number(item?.confidence);
        const confidencePercent = Number.isFinite(confidenceNumber)
          ? `${(confidenceNumber * 100).toFixed(0)}%`
          : "0%";
        const expiry = item?.expires_at ? new Date(item.expires_at).toDateString() : "no expiry";
        return `- [${item?.type || "general"}] ${item?.content || ""} (confidence: ${confidencePercent}, expires: ${expiry})`;
      })
    : ["None yet."];

  return [
    petLine,
    notesLine,
    "",
    "Recent health records:",
    ...healthLines,
    "",
    "Service history:",
    ...serviceLines,
    "",
    "Active recommendations:",
    ...recommendationLines,
    "",
    "Conversation summary so far:",
    chat?.summary || "No summary yet.",
  ].join("\n");
}
