import { supabaseAdmin } from "../config/supabaseAdmin";
import { supabaseClient } from "../config/supabaseClient";


export type HotelFilters = {
  location?: string;
  checkin?: string;
  checkout?: string;
  timeSlot?: string;          // for same-day services like grooming/vet
  petType?: string | string[];
  dogSize?: string | string[];
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
    const loc = filters.location.trim();
    if (loc) {
      const orParts: string[] = [];
      if (has("city"))     orParts.push(`city.ilike.%${loc}%`);
      if (has("location")) orParts.push(`location.ilike.%${loc}%`);
      if (has("address"))  orParts.push(`address.ilike.%${loc}%`);
      if (has("name"))     orParts.push(`name.ilike.%${loc}%`);

      if (orParts.length) {
        query = query.or(orParts.join(","));
      }
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

  // ── Pet type (multi-select) ──
  if (filters.petType) {
    const petTypes = (Array.isArray(filters.petType) ? filters.petType : [filters.petType]).filter(Boolean);
    if (petTypes.length > 0) {
      const hasOthers = petTypes.some(t => t.toLowerCase() === "others");
      const normalTypes = petTypes
        .filter(t => t.toLowerCase() !== "others")
        .map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());

      if (hasOthers && normalTypes.length === 0) {
        query = query.not("exotic_pet_types", "is", null);
      } else if (hasOthers && normalTypes.length > 0 && has("pet_types_accepted")) {
        const orParts = normalTypes.map(t => `pet_types_accepted.cs.{${t}}`);
        orParts.push("exotic_pet_types.not.is.null");
        query = query.or(orParts.join(","));
      } else if (normalTypes.length > 0 && has("pet_types_accepted")) {
        if (normalTypes.length === 1) {
          query = query.contains("pet_types_accepted", [normalTypes[0]]);
        } else {
          const orParts = normalTypes.map(t => `pet_types_accepted.cs.{${t}}`);
          query = query.or(orParts.join(","));
        }
      }
    }
  }

  // ── Dog Size (multi-select) ──
  if (filters.dogSize) {
    const dogSizes = (Array.isArray(filters.dogSize) ? filters.dogSize : [filters.dogSize]).filter(Boolean);
    const validSizes = dogSizes.map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());

    if (validSizes.length > 0 && has("dog_sizes")) {
      if (validSizes.length === 1) {
        query = query.contains("dog_sizes", [validSizes[0]]);
      } else {
        const orParts = validSizes.map(s => `dog_sizes.cs.{${s}}`);
        query = query.or(orParts.join(","));
      }
    }
  }

  // -- Availability filter --
  //
  // BOARDING (hotel): checkin + checkout present
  //   property_services.capacity = per-room-type capacity
  //   Check overlapping bookings per night; busiest night must be < capacity
  //   Property available if >= 1 boarding service has room on every night
  //
  // GROOMING / VET (appointment): only checkin present (no checkout)
  //   properties.capacity = total concurrent slots (staff/chairs)
  //   Count active bookings on that date (optionally scoped by timeSlot)
  //   Property available if total bookings < property.capacity
  //
  if (filters.checkin) {
    const checkin = filters.checkin;
    const checkout = filters.checkout;          // undefined for appointments
    const serviceCategory = filters.serviceCategory;

    const isBoarding = !!checkout;              // has checkout = overnight

    if (isBoarding) {
      // === BOARDING: per-service capacity ===

      // 1. Get boarding services with their capacity
      let svcQuery = supabaseAdmin
        .from("property_services")
        .select("id, property_id, capacity, category")
        .eq("is_active", true)
        .eq("is_deleted", false);

      if (serviceCategory) {
        svcQuery = svcQuery.eq("category", serviceCategory);
      } else {
        svcQuery = svcQuery.eq("category", "Boarding");
      }

      const { data: services, error: svcErr } = await svcQuery;
      if (svcErr) throw svcErr;
      if (!services?.length) return [];

      const serviceIds = services.map(s => s.id);

      // 2. Fetch ALL overlapping active bookings for those services
      const { data: bookings, error: bookErr } = await supabaseAdmin
        .from("bookings")
        .select("service_id, checkin, checkout")
        .in("service_id", serviceIds)
        .eq("is_deleted", false)
        .in("status", ["pending", "confirmed", "checked_in"])
        .lt("checkin", checkout)       // booking starts before our checkout
        .gt("checkout", checkin);      // booking ends after our checkin

      if (bookErr) throw bookErr;

      // 3. Build every night in the requested range
      const nights: string[] = [];
      {
        const cur = new Date(checkin);
        const end = new Date(checkout);
        while (cur < end) {
          nights.push(cur.toISOString().slice(0, 10));
          cur.setDate(cur.getDate() + 1);
        }
      }

      // 4. For each service, find the busiest night and check capacity
      const availablePropertyIds = new Set<string>();

      for (const svc of services) {
        const capacity = svc.capacity ?? 1;
        const svcBookings = (bookings ?? []).filter(
          (b: any) => b.service_id === svc.id
        );

        let full = false;
        for (const night of nights) {
          const nightStart = night;
          const nextDay = new Date(night);
          nextDay.setDate(nextDay.getDate() + 1);
          const nightEnd = nextDay.toISOString().slice(0, 10);

          // A booking occupies this night when:
          //   booking.checkin < nightEnd AND booking.checkout > nightStart
          const count = svcBookings.filter(
            (b: any) => b.checkin < nightEnd && b.checkout > nightStart
          ).length;

          if (count >= capacity) { full = true; break; }
        }

        if (!full) {
          availablePropertyIds.add(String(svc.property_id));
        }
      }

      if (availablePropertyIds.size === 0) return [];
      query = query.in("id", [...availablePropertyIds]);

    } else {
      // === GROOMING / VET: property-level capacity ===

      // 1. Count active appointment bookings per property on the date
      let bookingQuery = supabaseAdmin
        .from("bookings")
        .select("property_id")
        .eq("checkin", checkin)
        .eq("is_deleted", false)
        .in("status", ["pending", "confirmed", "checked_in"]);

      // Appointments have no checkout
      bookingQuery = bookingQuery.is("checkout", null);

      // Optionally narrow by time slot
      if (filters.timeSlot) {
        bookingQuery = bookingQuery.eq("time_slot", filters.timeSlot);
      }

      const { data: dayBookings, error: dayErr } = await bookingQuery;
      if (dayErr) throw dayErr;

      // 2. Tally bookings per property
      const countByProp: Record<string, number> = {};
      for (const b of dayBookings ?? []) {
        const pid = String(b.property_id);
        countByProp[pid] = (countByProp[pid] || 0) + 1;
      }

      // 3. Fetch candidate properties with their capacity column
      const { data: allProps, error: propErr } = await supabaseAdmin
        .from("properties")
        .select("id, capacity")
        .eq("status", "approved")
        .eq("is_deleted", false);

      if (propErr) throw propErr;

      const availablePropertyIds = (allProps ?? [])
        .filter((p: any) => {
          const cap = p.capacity ?? 1;           // default 1 if unset
          const booked = countByProp[String(p.id)] || 0;
          return booked < cap;
        })
        .map((p: any) => String(p.id));

      if (availablePropertyIds.length === 0) return [];
      query = query.in("id", availablePropertyIds);
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

  // ── COMBINED SERVICE FILTER (Category + Price) ──
  // This logic finds all properties that have at least one service 
  // matching the category AND the price range.
  if (filters.serviceCategory || filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    let svcQuery = supabaseAdmin
      .from("property_services")
      .select("property_id")
      .eq("is_active", true)
      .eq("is_deleted", false);

    if (filters.serviceCategory) {
      svcQuery = svcQuery.eq("category", filters.serviceCategory);
    }
    if (filters.minPrice !== undefined) {
      svcQuery = svcQuery.gte("price", filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      svcQuery = svcQuery.lte("price", filters.maxPrice);
    }

    const { data: svcRows, error: svcErr } = await svcQuery;
    if (svcErr) {
      console.error("[getProperties] service filter lookup", svcErr);
      throw svcErr;
    }

    // Get unique property IDs that matched the service criteria
    const matchedIds = [...new Set((svcRows ?? []).map((r) => String(r.property_id)))];
    
    // If no services matched the price/category, return empty immediately
    if (matchedIds.length === 0) return [];

    // Filter properties to only those that have matching services
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

  // Fisher-Yates shuffle for unbiased randomness
  for (let i = allIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
  }
  const selected = allIds.slice(0, Math.min(limit, allIds.length));
  const selectedIds = selected.map((row) => row.id);

  // Fetch full property data for selected IDs
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select(`
      *,
      property_amenities(
        amenity_id,
        amenities(amenity)
      ),
      property_services(
        id,
        name,
        category,
        price,
        description,
        is_active
      )
    `)
    .in("id", selectedIds);

  if (error) {
    console.error("[getRandomProperties]", error);
    throw error;
  }

  if (!data || data.length === 0) return [];

  // Enrich with cheapest service price
  return data.map((p: any) => {
    const activeServices = p.property_services?.filter((s: any) => s.is_active) || [];
    const cheapestPrice = activeServices.length > 0
      ? Math.min(...activeServices.map((s: any) => Number(s.price || 0)))
      : null;
    return {
      ...p,
      cheapest_service_price: cheapestPrice,
    };
  });
}

export async function getPropertyById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select(`
      *,
      property_amenities(
        amenity_id,
        amenities(amenity)
      ),
      property_services(
        id,
        name,
        category,
        price,
        description,
        is_active
      ),
      property_pricing(
        payment_options
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("[getPropertyById]", error);
    throw error;
  }

  if (!data) return null;

  // Get cheapest service price
  const activeServices = data.property_services?.filter((s: any) => s.is_active) || [];
  const cheapestPrice = activeServices.length > 0
    ? Math.min(...activeServices.map((s: any) => Number(s.price || 0)))
    : null;

  // Extract QR codes and accepted payment methods from property_pricing
  // Supabase may return property_pricing as an object (1-to-1) or array
  const rawPricing = (data as any).property_pricing;
  const pricingRow = Array.isArray(rawPricing) ? rawPricing[0] : rawPricing;
  const paymentOpts = pricingRow?.payment_options || {};

  return {
    ...data,
    cheapest_service_price: cheapestPrice,
    qrCodeGCash: paymentOpts.gcash_qr_url || null,
    qrCodePayMaya: paymentOpts.paymaya_qr_url || null,
    acceptedPaymentMethods: paymentOpts.accepted_methods || [],
  };
}
