import { supabaseAdmin } from "../config/supabaseAdmin";

export interface Amenities {
  id: string;
  amenity: string;
  icon?: string;
}

export const AmenitiesModel = {
  createAmenity: async ({
    id,
    amenity,
    icon,
  }: Amenities) => {
    const { error } = await supabaseAdmin.from("amenities").insert([
      {
        id,
        amenity,
        icon,
      },
    ]);

    if(error) throw error;
  },
};