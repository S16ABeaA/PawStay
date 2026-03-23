import { supabaseAdmin } from "../config/supabaseAdmin";
import { petHealthCheckService } from "../ai/petHealthCheckService";
import { embedHealthSummary } from "./embeddingService";

interface ExtractAndSaveHealthSummaryArgs {
  petId: string;
  fileBuffer: Buffer;
  mimeType: string;
  sourceType: "image" | "medical_record";
  fileUrl: string;
}

export async function extractAndSaveHealthSummary({
  petId,
  fileBuffer,
  mimeType,
  sourceType,
  fileUrl,
}: ExtractAndSaveHealthSummaryArgs) {
  const result = await petHealthCheckService.analyzeImage(fileBuffer, mimeType);

  const extractedData = {
    weight_kg: result.weight_estimate?.value ?? null,
    conditions: result.visible_signs ?? [],
    medications: [],
    diet_notes: null,
    vet_notes: result.summary ?? null,
    next_vet_date: null,
    health_status: result.status,
    confidence: result.confidence,
    breed_estimate: result.breed_estimate,
    age_estimate: result.age_estimate,
    recommended_actions: result.recommended_actions ?? [],
  };

  const { data: row, error } = await supabaseAdmin
    .from("pet_health_summaries")
    .insert({
      pet_id: petId,
      source_type: sourceType,
      file_url: fileUrl,
      extracted_data: extractedData,
    })
    .select()
    .single();

  if (error) {
    throw new Error("Failed to save health summary: " + error.message);
  }

  embedHealthSummary({
    petId,
    healthSummaryId: row.id,
    extractedData: {
      ...extractedData,
      source_type: sourceType,
    },
  }).catch((err: any) =>
    console.error("[healthExtraction] embedding fire-and-forget failed:", err.message),
  );

  return {
    healthSummaryId: row.id,
    extractedData,
    healthCheckResult: result,
  };
}
