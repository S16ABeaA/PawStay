import { supabaseAdmin } from "../config/supabaseAdmin";

interface RecommendationPayload {
  recommendation_type: string;
  content: string;
  rationale?: string;
  confidence?: number;
  expires_days?: number;
}

interface SaveRecommendationArgs {
  petId: string;
  sessionId: string;
  recommendation: RecommendationPayload;
  healthSummaryIds?: string[];
}

export function parseRecommendationBlock(responseText: string): {
  cleanText: string;
  recommendation: RecommendationPayload | null;
} {
  const text = String(responseText || "");
  const match = text.match(/<recommendation>([\s\S]*?)<\/recommendation>/);

  if (!match) {
    return { cleanText: text, recommendation: null };
  }

  const fullBlock = match[0];
  const inner = match[1] || "";

  try {
    const recommendation = JSON.parse(inner.trim()) as RecommendationPayload;
    const cleanText = text.replace(fullBlock, "").trim();
    return { cleanText, recommendation };
  } catch (err: any) {
    console.warn("[recommendation] Failed to parse recommendation block:", err.message);
    return { cleanText: text, recommendation: null };
  }
}

export async function saveRecommendation({
  petId,
  sessionId,
  recommendation,
  healthSummaryIds,
}: SaveRecommendationArgs) {
  const allowedTypes = [
    "diet",
    "medication_followup",
    "exercise",
    "grooming",
    "vet_visit",
    "general",
  ];

  if (!allowedTypes.includes(recommendation?.recommendation_type)) {
    throw new Error("Invalid recommendation_type: " + recommendation?.recommendation_type);
  }

  const confidence = Math.min(1, Math.max(0, Number(recommendation?.confidence) || 0));
  const expiresAt = new Date(
    Date.now() + (Number(recommendation?.expires_days) || 30) * 86400000,
  ).toISOString();

  const payload = {
    pet_id: petId,
    session_id: sessionId,
    recommendation_type: recommendation.recommendation_type,
    content: recommendation.content,
    rationale: recommendation.rationale || null,
    confidence,
    model: "gemini-3.1-flash-lite-preview",
    model_version: "v1beta",
    based_on_ids: healthSummaryIds || [],
    expires_at: expiresAt,
    disclaimer: "AI-generated guidance; not a substitute for professional veterinary advice.",
    status: "active",
  };

  const { data, error } = await supabaseAdmin
    .from("pet_recommendations")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save recommendation: ${error.message}`);
  }

  return data;
}
