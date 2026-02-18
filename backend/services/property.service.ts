import { supabaseAdmin } from "../config/supabaseAdmin";
import { supabaseClient } from "../config/supabaseClient";


export type HotelFilters = {
  location?: string;
  checkin?: string;
  checkout?: string;
  petType?: string;
  dogSize?: string;
  propertyType?: string;
  serviceCategory?: string;  // per-service filter: Boarding, Grooming, Veterinary, etc.
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  amenities?: string[];
  keyword?: string;
  lat?: number;              // user latitude
  lng?: number;              // user longitude
  radiusKm?: number;         // search radius in km (default 10)
};

// ── Haversine distance (km) ──
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function getProperties(filters: HotelFilters = {}) {
  // Diagnostics: count + sample row
  // const { count: totalCount } = await supabase
  //   .from("properties")
  //   .select("id", { count: "exact", head: true });

  const { data: sample } = await supabaseAdmin
    .from("properties")
    .select("*")
    .limit(1);

  const columns = sample?.[0] ? Object.keys(sample[0]) : [];  
  const has = (col: string) => columns.includes(col);

  //console.log("[getProperties] Total count:", totalCount ?? "unknown");
  //console.log("[getProperties] Available columns:", columns);
  //console.log("[getProperties] Filters:", filters);

  let query = supabaseAdmin
    .from("properties")
    .select(`
      *,
      property_amenities(
        amenity_id,
        amenities(amenity)
      )
    `);

  // ── Location ──
  // When lat/lng are provided, skip text-based location filter
  // (geo filter is applied post-query below)
  if (filters.location && filters.lat == null) {
    const loc = filters.location;
    const orParts: string[] = [];
    if (has("city"))     orParts.push(`city.ilike.%${loc}%`);
    if (has("location")) orParts.push(`location.ilike.%${loc}%`);
    if (has("address"))  orParts.push(`address.ilike.%${loc}%`);
    if (has("name"))     orParts.push(`name.ilike.%${loc}%`);

    if (orParts.length) {
      query = query.or(orParts.join(","));
    }
  }

  // ── Keyword (name / description search) ──
  if (filters.keyword) {
    const kw = filters.keyword;
    const kwParts: string[] = [];
    if (has("name"))        kwParts.push(`name.ilike.%${kw}%`);
    if (has("description")) kwParts.push(`description.ilike.%${kw}%`);
    if (kwParts.length) {
      query = query.or(kwParts.join(","));
    }
  }

  // ── Property type ──
  if (filters.propertyType) {
    if (has("property_type")) {
      // Try array contains first (text[]), fall back to eq (text)
      const colSample = sample?.[0]?.property_type;
      if (Array.isArray(colSample)) {
        query = query.contains("property_type", [filters.propertyType]);
      } else {
        query = query.eq("property_type", filters.propertyType);
      }
    }
  }

  // ── Pet type ──
  if (filters.petType) {
    if (filters.petType === "others") {
      query = query.not("exotic_pet_types", "is", null);
    }

    else if (has("pet_types_accepted")) {
      const formatted =
        filters.petType.charAt(0).toUpperCase() +
        filters.petType.slice(1).toLowerCase();
      query = query.contains("pet_types_accepted", [formatted]);
    }
  }

// -- Dog Size --
 if (filters.dogSize) {
  const formatted =
    filters.dogSize.charAt(0).toUpperCase() +
    filters.dogSize.slice(1).toLowerCase();

    if (has("dog_sizes")) {
      query = query.contains("dog_sizes", [formatted]);
    }
}

  // ── Rating ──
  if (filters.rating !== undefined && filters.rating > 0) {
    if (has("rating")) {
      query = query.gte("rating", filters.rating);
    }
  }

  // ── Amenities (admin-managed) ──
  if (filters.amenities?.length) {
    const cleaned = filters.amenities.map((a) => a.trim()).filter(Boolean);

    const uuidRegex = /^[0-9a-f-]{36}$/i;
    const idCandidates = cleaned.filter((a) => uuidRegex.test(a));
    const nameCandidates = cleaned.filter((a) => !uuidRegex.test(a));

    let amenityIds = [...idCandidates];

    if (nameCandidates.length) {
      const { data: amenityRows } = await supabaseAdmin
        .from("amenities")
        .select("id, amenity")
        .in("amenity", nameCandidates);

      const resolved = amenityRows?.map((a) => a.id) ?? [];
      amenityIds = Array.from(new Set([...amenityIds, ...resolved]));
    }

    if (amenityIds.length) {
      let intersection: Set<string> | null = null;

      for (const amenityId of amenityIds) {
        const { data: rows } = await supabaseAdmin
          .from("property_amenities")
          .select("property_id")
          .eq("amenity_id", amenityId);

        const ids = new Set((rows ?? []).map((r) => String(r.property_id)));
        if (intersection === null) {
          intersection = ids;
        } else {
          const current: Set<string> = intersection as Set<string>;
          intersection = new Set<string>(
            [...current].filter((id: string) => ids.has(id))
          );
        }
      }

      const finalIds = intersection ? Array.from(intersection) : [];
      if (finalIds.length === 0) return [];

      query = query.in("id", finalIds);
    }
  }

  // ── Service category filter (per-service, not per-property) ──
  if (filters.serviceCategory) {
    const cat = filters.serviceCategory;
    let svcQuery = supabaseAdmin
      .from("property_services")
      .select("property_id, price")
      .eq("category", cat)
      .eq("is_active", true)
      .eq("is_deleted", false);

    // Scope price range to this category
    if (filters.minPrice !== undefined) svcQuery = svcQuery.gte("price", filters.minPrice);
    if (filters.maxPrice !== undefined) svcQuery = svcQuery.lte("price", filters.maxPrice);

    const { data: svcRows, error: svcErr } = await svcQuery;
    if (svcErr) { console.error("[getProperties] serviceCategory lookup", svcErr); throw svcErr; }

    const matchedIds = [...new Set((svcRows ?? []).map((r) => String(r.property_id)))];
    if (matchedIds.length === 0) return [];
    query = query.in("id", matchedIds);
  } else if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    // Price filter across all services when no category is specified
    let svcQuery = supabaseAdmin
      .from("property_services")
      .select("property_id")
      .eq("is_active", true)
      .eq("is_deleted", false);

    if (filters.minPrice !== undefined) svcQuery = svcQuery.gte("price", filters.minPrice);
    if (filters.maxPrice !== undefined) svcQuery = svcQuery.lte("price", filters.maxPrice);

    const { data: svcRows, error: svcErr } = await svcQuery;
    if (svcErr) { console.error("[getProperties] price filter lookup", svcErr); throw svcErr; }

    const matchedIds = [...new Set((svcRows ?? []).map((r) => String(r.property_id)))];
    if (matchedIds.length === 0) return [];
    query = query.in("id", matchedIds);
  }

  //── Status / soft delete (only if columns exist) ──
  if (has("status"))     query = query.eq("status", "approved");
  if (has("is_deleted")) query = query.eq("is_deleted", false);

  // ── Execute ──
  const { data, error } = await query;

  if (error) {
    console.error("[getProperties]", error);
    throw error;
  }

  let rows = data || [];
  if (rows.length === 0) return [];

  // ── Geo radius filter (post-query) ──
  if (filters.lat != null && filters.lng != null) {
    const radius = filters.radiusKm ?? 10;
    rows = rows.filter((p: any) => {
      if (p.latitude == null || p.longitude == null) return false;
      const dist = haversineDistance(
        filters.lat!,
        filters.lng!,
        Number(p.latitude),
        Number(p.longitude)
      );
      return dist <= radius;
    });

    if (rows.length === 0) return [];
  }

  // ── Cheapest service price per property (scoped by category when filtered) ──
  const propertyIds = rows.map((p: any) => p.id);

  let priceQuery = supabaseAdmin
    .from("property_services")
    .select("property_id, price")
    .in("property_id", propertyIds)
    .eq("is_active", true)
    .eq("is_deleted", false);

  // Scope cheapest price to the selected service category
  if (filters.serviceCategory) {
    priceQuery = priceQuery.eq("category", filters.serviceCategory);
  }

  priceQuery = priceQuery.order("price", { ascending: true });

  const { data: serviceRows, error: serviceError } = await priceQuery;

  if (serviceError) {
    console.error("[getProperties] service price lookup", serviceError);
    throw serviceError;
  }

  const cheapestByProperty = new Map<string, number>();
  for (const row of serviceRows ?? []) {
    const pid = String(row.property_id);
    if (!cheapestByProperty.has(pid)) {
      cheapestByProperty.set(pid, Number(row.price ?? 0));
    }
  }

  return rows.map((p: any) => ({
    ...p,
    cheapest_service_price: cheapestByProperty.get(String(p.id)) ?? null,
  }));
}

export async function getRandomProperties(limit: number = 6) {
  // Fetch all approved, non-deleted property IDs
  let idQuery = supabaseAdmin
    .from("properties")
    .select("id");

  // Check columns dynamically (same pattern as getProperties)
  const { data: sample } = await supabaseAdmin
    .from("properties")
    .select("*")
    .limit(1);

  const columns = sample?.[0] ? Object.keys(sample[0]) : [];
  const has = (col: string) => columns.includes(col);

  if (has("status")) idQuery = idQuery.eq("status", "approved");
  if (has("is_deleted")) idQuery = idQuery.eq("is_deleted", false);

  const { data: allIds, error: idError } = await idQuery;

  if (idError) {
    console.error("[getRandomProperties]", idError);
    throw idError;
  }

  if (!allIds || allIds.length === 0) return [];

  // Shuffle and pick `limit` random IDs
  const shuffled = allIds.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(limit, shuffled.length));
  const selectedIds = selected.map((row) => row.id);

  // Fetch full property data for selected IDs
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select(`
      *,
      property_amenities(
        amenity_id,
        amenities(amenity)
      )
    `)
    .in("id", selectedIds);

  if (error) {
    console.error("[getRandomProperties]", error);
    throw error;
  }

  const rows = data || [];
  if (rows.length === 0) return [];

  // Attach cheapest service price
  const propertyIds = rows.map((p: any) => p.id);

  const { data: serviceRows, error: serviceError } = await supabaseAdmin
    .from("property_services")
    .select("property_id, price")
    .in("property_id", propertyIds)
    .eq("is_active", true)
    .eq("is_deleted", false)
    .order("price", { ascending: true });

  if (serviceError) {
    console.error("[getRandomProperties] service price lookup", serviceError);
    throw serviceError;
  }

  const cheapestByProperty = new Map<string, number>();
  for (const row of serviceRows ?? []) {
    const pid = String(row.property_id);
    if (!cheapestByProperty.has(pid)) {
      cheapestByProperty.set(pid, Number(row.price ?? 0));
    }
  }

  return rows.map((p: any) => ({
    ...p,
    cheapest_service_price: cheapestByProperty.get(String(p.id)) ?? null,
  }));
}
