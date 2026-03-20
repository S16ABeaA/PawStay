import { supabaseAdmin } from "../config/supabaseAdmin";

export interface PetHealthRecordRow {
  id: string;
  pet_id: string;
  owner_id: string;
  version: number;
  compiled_record: Record<string, unknown>;
  raw_extracted_json: Record<string, unknown>;
  metadata: Record<string, unknown>;
  source_file_name: string | null;
  validation_status: "valid" | "incomplete" | "suspicious";
  ocr_confidence_score: number;
  created_at: string;
}

export const petHealthRecordModel = {
  async getPetByOwner(petId: string, ownerId: string): Promise<{ id: string; owner_id: string; name: string; species: string; breed: string; birthday: string | null; photo_url: string | null } | null> {
    const { data, error } = await supabaseAdmin
      .from("pets")
      .select("id, owner_id, name, species, breed, birthday, photo_url")
      .eq("id", petId)
      .eq("owner_id", ownerId)
      .eq("is_deleted", false)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  },

  async getLatestByPet(petId: string, ownerId: string): Promise<PetHealthRecordRow | null> {
    const { data, error } = await supabaseAdmin
      .from("pet_health_records")
      .select("*")
      .eq("pet_id", petId)
      .eq("owner_id", ownerId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  },

  async listByPet(petId: string, ownerId: string, limit = 50): Promise<PetHealthRecordRow[]> {
    const { data, error } = await supabaseAdmin
      .from("pet_health_records")
      .select("*")
      .eq("pet_id", petId)
      .eq("owner_id", ownerId)
      .order("version", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  },

  async getByPetVersion(petId: string, ownerId: string, version: number): Promise<PetHealthRecordRow | null> {
    const { data, error } = await supabaseAdmin
      .from("pet_health_records")
      .select("*")
      .eq("pet_id", petId)
      .eq("owner_id", ownerId)
      .eq("version", version)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  },

  async getNextVersion(petId: string, ownerId: string): Promise<number> {
    const latest = await this.getLatestByPet(petId, ownerId);
    return (latest?.version ?? 0) + 1;
  },

  async create(input: {
    petId: string;
    ownerId: string;
    compiledRecord: Record<string, unknown>;
    rawExtractedJson: Record<string, unknown>;
    metadata: Record<string, unknown>;
    sourceFileName?: string | null;
    validationStatus: "valid" | "incomplete" | "suspicious";
    ocrConfidenceScore: number;
  }): Promise<PetHealthRecordRow> {
    const version = await this.getNextVersion(input.petId, input.ownerId);

    const { data, error } = await supabaseAdmin
      .from("pet_health_records")
      .insert({
        pet_id: input.petId,
        owner_id: input.ownerId,
        version,
        compiled_record: input.compiledRecord,
        raw_extracted_json: input.rawExtractedJson,
        metadata: input.metadata,
        source_file_name: input.sourceFileName ?? null,
        validation_status: input.validationStatus,
        ocr_confidence_score: Math.max(0, Math.min(100, Math.round(input.ocrConfidenceScore))),
      })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },
};
