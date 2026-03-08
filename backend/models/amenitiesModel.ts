import { supabaseAdmin } from "../config/supabaseAdmin";

export interface Amenities {
  id: string;
  amenity: string;
  category?: string;
  service_types?: string[];
  is_active?: boolean;
}

export const AmenitiesModel = {
  createAmenity: async ({
    id,
    amenity,
    category,
    service_types,
    is_active,
  }: Amenities) => {
    const { error } = await supabaseAdmin.from("amenities").insert([
      {
        id,
        amenity,
        category,
        service_types,
        is_active,
      },
    ]);

    if(error) throw error;
  },
  listAmenities: async (opts?: { is_active?: boolean }) => {
    let q = supabaseAdmin.from("amenities").select("id, amenity, category, service_types, is_active");
    if (opts?.is_active !== undefined) q = q.eq("is_active", opts.is_active) as typeof q;
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },
  getById: async (id: string) => {
    const { data, error } = await supabaseAdmin.from("amenities").select("id, amenity, category, service_types, is_active").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  updateAmenity: async (id: string, fields: Partial<Amenities & { category?: string; service_types?: string[]; is_active?: boolean; }>) => {
    const { error } = await supabaseAdmin.from("amenities").update(fields).eq("id", id);
    if (error) throw error;
  },
  deleteAmenity: async (id: string) => {
    const { error } = await supabaseAdmin.from("amenities").delete().eq("id", id);
    if (error) throw error;
  },
};