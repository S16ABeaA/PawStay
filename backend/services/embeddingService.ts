import { GoogleGenerativeAI } from "@google/generative-ai";
import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../config/supabaseAdmin";

interface HealthSummaryLike {
  source_type?: string;
  extracted_data?: {
    conditions?: string[];
    medications?: string[];
    diet_notes?: string | null;
    vet_notes?: string | null;
    health_status?: string | null;
    recommended_actions?: string[];
  };
}

interface SaveEmbeddingArgs {
  petId: string;
  sourceId: string;
  sourceTable: string;
  content: string;
  vector: number[];
}

interface EmbedHealthSummaryArgs {
  petId: string;
  healthSummaryId: string;
  extractedData: Record<string, any>;
}

interface GetSemanticallySimilarSummariesArgs {
  petId: string;
  queryText: string;
  anonClient: SupabaseClient;
  matchCount?: number;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (err: any) {
    console.error("[embedding] generateEmbedding failed:", err.message);
    throw err;
  }
}

export function buildHealthSummaryContent(healthSummary: HealthSummaryLike): string {
  const extractedData = healthSummary?.extracted_data || {};

  return [
    `source: ${healthSummary?.source_type || "unknown"}`,
    `conditions: ${Array.isArray(extractedData.conditions) && extractedData.conditions.length ? extractedData.conditions.join(", ") : "none"}`,
    `medications: ${Array.isArray(extractedData.medications) && extractedData.medications.length ? extractedData.medications.join(", ") : "none"}`,
    `diet notes: ${extractedData.diet_notes || "none"}`,
    `vet notes: ${extractedData.vet_notes || "none"}`,
    `health status: ${extractedData.health_status || "unknown"}`,
    `recommended actions: ${Array.isArray(extractedData.recommended_actions) && extractedData.recommended_actions.length ? extractedData.recommended_actions.join(", ") : "none"}`,
  ].join("\n");
}

export async function saveEmbedding({
  petId,
  sourceId,
  sourceTable,
  content,
  vector,
}: SaveEmbeddingArgs) {
  const { data, error } = await supabaseAdmin
    .from("pet_embeddings")
    .upsert(
      {
        pet_id: petId,
        source_id: sourceId,
        source_table: sourceTable,
        content,
        embedding: vector,
      },
      {
        onConflict: "pet_id,source_id,source_table",
        ignoreDuplicates: true,
      },
    )
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to save embedding: ${error.message}`);
  }

  console.log("[embedding] saved embedding for source:", sourceId);
  return data || null;
}

export async function embedHealthSummary({
  petId,
  healthSummaryId,
  extractedData,
}: EmbedHealthSummaryArgs) {
  try {
    const content = buildHealthSummaryContent({
      source_type: extractedData?.source_type || "unknown",
      extracted_data: extractedData,
    });
    const vector = await generateEmbedding(content);
    const saved = await saveEmbedding({
      petId,
      sourceId: healthSummaryId,
      sourceTable: "pet_health_summaries",
      content,
      vector,
    });
    return saved;
  } catch (err: any) {
    console.error("[embedding] embedHealthSummary failed for:", healthSummaryId, err.message);
    return null;
  }
}

export async function getSemanticallySimilarSummaries({
  petId,
  queryText,
  anonClient,
  matchCount = 3,
}: GetSemanticallySimilarSummariesArgs): Promise<
  Array<{ source_id: string; content: string; similarity: number }>
> {
  try {
    const vector = await generateEmbedding(queryText);
    const { data, error } = await anonClient.rpc("match_pet_embeddings", {
      p_pet_id: petId,
      p_query_vector: vector,
      p_match_count: matchCount,
    });

    if (error) {
      console.error("[embedding] semantic search failed:", error.message);
      return [];
    }

    return Array.isArray(data)
      ? data.map((row: any) => ({
          source_id: String(row?.source_id || ""),
          content: String(row?.content || ""),
          similarity: Number(row?.similarity || 0),
        }))
      : [];
  } catch (err: any) {
    console.error("[embedding] semantic search failed:", err.message);
    return [];
  }
}
