import { supabaseAdmin } from "../config/supabaseAdmin";

export interface Favorite {
  user_id: string;
  property_id: string | number;
}

export const favoriteModel = {
  create: async ({ user_id, property_id }: Favorite) => {
    // Guard against duplicates (no unique constraint on user_id + property_id in live DB)
    const already = await favoriteModel.exists(user_id, property_id);
    if (already) return { user_id, property_id, already_existed: true };

    const { data, error } = await supabaseAdmin
      .from("favorites")
      .insert({
        user_id,
        property_id,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  delete: async (user_id: string, property_id: string | number) => {
    const { error } = await supabaseAdmin
      .from("favorites")
      .delete()
      .eq("user_id", user_id)
      .eq("property_id", property_id);

    if (error) throw error;
  },

  findByUser: async (user_id: string) => {
    // Get favorites and join with properties + amenities for full card data
    const { data: favorites, error: favError } = await supabaseAdmin
      .from("favorites")
      .select("property_id, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (favError) throw favError;
    if (!favorites || favorites.length === 0) return [];

    const propertyIds = favorites.map((f) => f.property_id);

    // Fetch full property data with amenities
    const { data: properties, error: propError } = await supabaseAdmin
      .from("properties")
      .select(`
        *,
        property_amenities(
          amenity_id,
          amenities(amenity)
        )
      `)
      .in("id", propertyIds);

    if (propError) throw propError;

    // Attach cheapest service price per property and collect available service categories
    const { data: serviceRows, error: svcError } = await supabaseAdmin
      .from("property_services")
      .select("property_id, price, category")
      .in("property_id", propertyIds)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .order("price", { ascending: true });

    if (svcError) throw svcError;

    const cheapestByProperty = new Map<string, number>();
    const categoriesByProperty = new Map<string, Set<string>>();

    for (const row of serviceRows ?? []) {
      const pid = String(row.property_id);
      if (!cheapestByProperty.has(pid)) {
        cheapestByProperty.set(pid, Number(row.price ?? 0));
      }

      const cat = row.category ?? null;
      if (cat) {
        if (!categoriesByProperty.has(pid)) categoriesByProperty.set(pid, new Set());
        categoriesByProperty.get(pid)!.add(String(cat));
      }
    }

    return (properties ?? []).map((p: any) => ({
      ...p,
      cheapest_service_price: cheapestByProperty.get(String(p.id)) ?? null,
      service_categories: Array.from(categoriesByProperty.get(String(p.id)) ?? []),
    }));
  },

  exists: async (user_id: string, property_id: string | number) => {
    const { data, error } = await supabaseAdmin
      .from("favorites")
      .select("property_id")
      .eq("user_id", user_id)
      .eq("property_id", property_id)
      .maybeSingle();

    if (error) throw error;

    return !!data;
  },
};