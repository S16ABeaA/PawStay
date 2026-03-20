import { supabaseAdmin } from "../config/supabaseAdmin";

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string;
  birthday: string;
  weight: number;
  photo_url: string | null;
  notes: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export const petModel = {
  /** Get all non-deleted pets for a specific user */
  async getByOwner(ownerId: string): Promise<Pet[]> {
    const { data, error } = await supabaseAdmin
      .from("pets")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /** Get a single pet by id (only if owned by the user) */
  async getById(petId: string, ownerId: string): Promise<Pet | null> {
    const { data, error } = await supabaseAdmin
      .from("pets")
      .select("*")
      .eq("id", petId)
      .eq("owner_id", ownerId)
      .eq("is_deleted", false)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
    return data ?? null;
  },

  /** Get a single pet by owner and pet name (case-insensitive) */
  async getByOwnerAndName(ownerId: string, name: string): Promise<Pet | null> {
    const { data, error } = await supabaseAdmin
      .from("pets")
      .select("*")
      .eq("owner_id", ownerId)
      .ilike("name", name)
      .eq("is_deleted", false)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data ?? null;
  },

  /** Create a new pet */
  async create(
    ownerId: string,
    pet: { name: string; species: string; breed: string; birthday: string; weight: number; photo_url?: string; notes?: string }
  ): Promise<Pet> {
    const { data, error } = await supabaseAdmin
      .from("pets")
      .insert({ ...pet, owner_id: ownerId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** Update an existing pet (only if owned by the user) */
  async update(
    petId: string,
    ownerId: string,
    updates: Partial<Pick<Pet, "name" | "species" | "breed" | "birthday" | "weight" | "photo_url" | "notes">>
  ): Promise<Pet> {
    const { data, error } = await supabaseAdmin
      .from("pets")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", petId)
      .eq("owner_id", ownerId)
      .eq("is_deleted", false)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** Soft-delete a pet (only if owned by the user) */
  async softDelete(petId: string, ownerId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from("pets")
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq("id", petId)
      .eq("owner_id", ownerId);

    if (error) throw error;
  },
};
