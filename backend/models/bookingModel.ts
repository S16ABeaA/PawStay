import { supabaseAdmin } from "../config/supabaseAdmin";

export interface BookingRow {
  id: string;
  property_id: string;
  user_id: string;
  pet_id: string | null;
  service_id: string | null;
  checkin: string;
  checkout: string | null;
  time_slot: string | null;
  pet_name: string | null;
  pet_type: string | null;
  pet_breed: string | null;
  pet_age: string | null;
  pet_weight: string | null;
  special_requirements: string | null;
  med_cert_url: string | null;
  vaccine_record_url: string | null;
  service_name: string | null;
  service_type: string | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  emergency_contact: string | null;
  subtotal: number | null;
  service_fee: number | null;
  total_price: number | null;
  payment_method: string | null;
  payment_status: string;
  payment_screenshot_url: string | null;
  room_name: string | null;
  status: string;
  notes: string | null;
  source: string;
  created_by: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export const bookingModel = {
  /** Create a new booking */
  async create(
    data: Omit<BookingRow, "id" | "is_deleted" | "created_at" | "updated_at" | "payment_status" | "status"> & {
      payment_status?: string;
      status?: string;
    }
  ): Promise<BookingRow> {
    const { data: row, error } = await supabaseAdmin
      .from("bookings")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return row;
  },

  /**
   * Atomically check availability and create a booking using a PostgreSQL
   * function with advisory locks. Prevents double-booking when two users
   * try to grab the last slot simultaneously.
   *
   * Throws an error whose message starts with "SLOT_UNAVAILABLE:" when
   * the slot/date is already at capacity.
   */
  async createAtomic(
    data: Record<string, unknown>,
    capacity: number
  ): Promise<BookingRow> {
    // Convert values to strings for the JSONB parameter (PG function expects text→cast)
    const bookingData: Record<string, string | null> = {};
    for (const [key, val] of Object.entries(data)) {
      bookingData[key] = val != null ? String(val) : null;
    }

    const { data: result, error } = await supabaseAdmin.rpc(
      "create_booking_if_available",
      {
        p_booking_data: bookingData,
        p_capacity: capacity,
      }
    );

    if (error) throw error;
    return result as BookingRow;
  },

  /** Get bookings for a user (with property name & image) */
  async getByUser(userId: string): Promise<(BookingRow & { property_name?: string; property_image?: string })[]> {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("*, properties:property_id(name, cover_image)")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Flatten the joined property data
    return (data ?? []).map((row: any) => ({
      ...row,
      property_name: row.properties?.name ?? null,
      property_image: row.properties?.cover_image ?? null,
      properties: undefined,
    }));
  },

  /** Get a single booking by id */
  async getById(bookingId: string, userId: string): Promise<BookingRow | null> {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data ?? null;
  },

  /**
   * Get booked time slots for a property on a specific date.
   * Returns an array of time_slot values that are already taken.
   */
  async getBookedTimeSlotsForDate(
    propertyId: string,
    date: string
  ): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("time_slot")
      .eq("property_id", propertyId)
      .eq("checkin", date)
      .is("checkout", null)
      .eq("is_deleted", false)
      .in("status", ["pending", "confirmed", "checked_in"]);

    if (error) throw error;
    return (data ?? [])
      .map((b: any) => b.time_slot)
      .filter((ts: string | null): ts is string => !!ts);
  },

  /**
   * Get fully-booked dates for a hotel (boarding) property within a date range.
   * Returns dates where ALL capacity is used up.
   */
  async getUnavailableDatesForHotel(
    propertyId: string,
    rangeStart: string,
    rangeEnd: string
  ): Promise<string[]> {
    // 1. Get boarding services with capacity for this property
    const { data: services, error: svcErr } = await supabaseAdmin
      .from("property_services")
      .select("id, capacity, category")
      .eq("property_id", propertyId)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .eq("category", "Boarding");

    if (svcErr) throw svcErr;

    // Also get property-level capacity as fallback
    const { data: propData, error: propErr } = await supabaseAdmin
      .from("properties")
      .select("capacity")
      .eq("id", propertyId)
      .single();

    if (propErr && propErr.code !== "PGRST116") throw propErr;
    const propertyCapacity = propData?.capacity ?? 5;

    // 2. Get overlapping bookings
    const { data: bookings, error: bookErr } = await supabaseAdmin
      .from("bookings")
      .select("service_id, checkin, checkout")
      .eq("property_id", propertyId)
      .eq("is_deleted", false)
      .in("status", ["pending", "confirmed", "checked_in"])
      .not("checkout", "is", null)
      .lt("checkin", rangeEnd)
      .gt("checkout", rangeStart);

    if (bookErr) throw bookErr;

    // 3. Build every date in range
    const dates: string[] = [];
    const cur = new Date(rangeStart);
    const end = new Date(rangeEnd);
    while (cur < end) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }

    // 4. Determine total capacity
    let totalCapacity: number;
    if (services && services.length > 0) {
      totalCapacity = services.reduce((sum: number, s: any) => sum + (s.capacity ?? 1), 0);
    } else {
      totalCapacity = propertyCapacity;
    }

    // 5. For each date, count overlapping bookings
    const unavailable: string[] = [];
    for (const dateStr of dates) {
      const nextDay = new Date(dateStr);
      nextDay.setDate(nextDay.getDate() + 1);
      const nightEnd = nextDay.toISOString().slice(0, 10);

      const count = (bookings ?? []).filter(
        (b: any) => b.checkin < nightEnd && b.checkout > dateStr
      ).length;

      if (count >= totalCapacity) {
        unavailable.push(dateStr);
      }
    }

    return unavailable;
  },

  /**
   * Get the capacity and current booking count for a property on a date.
   * Used for appointment-based services (grooming/vet).
   * Checks both property_services capacity (sum of Grooming + Veterinary) and
   * property-level capacity, using whichever is available.
   */
  async getCapacityForDate(
    propertyId: string,
    date: string
  ): Promise<{ capacity: number; booked: number }> {
    // First check service-level capacity for appointment categories
    const { data: services } = await supabaseAdmin
      .from("property_services")
      .select("capacity, category")
      .eq("property_id", propertyId)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .in("category", ["Grooming", "Veterinary"]);

    let capacity: number;
    if (services && services.length > 0) {
      // Sum service-level capacities (how many concurrent appointments per slot)
      capacity = services.reduce((sum: number, s: any) => sum + (s.capacity ?? 1), 0);
    } else {
      // Fallback to property-level capacity
      const { data: propData } = await supabaseAdmin
        .from("properties")
        .select("capacity")
        .eq("id", propertyId)
        .single();

      capacity = propData?.capacity ?? 5;
    }

    const { data: bookings, error } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("property_id", propertyId)
      .eq("checkin", date)
      .is("checkout", null)
      .eq("is_deleted", false)
      .in("status", ["pending", "confirmed", "checked_in"]);

    if (error) throw error;

    return { capacity, booked: (bookings ?? []).length };
  },

  /**
   * Get per-slot booking counts for a property on a specific date.
   * Returns a map of time_slot → count of active bookings.
   */
  async getSlotCountsForDate(
    propertyId: string,
    date: string
  ): Promise<Record<string, number>> {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("time_slot")
      .eq("property_id", propertyId)
      .eq("checkin", date)
      .is("checkout", null)
      .eq("is_deleted", false)
      .in("status", ["pending", "confirmed", "checked_in"]);

    if (error) throw error;

    const slotCounts: Record<string, number> = {};
    for (const b of data ?? []) {
      if (b.time_slot) {
        slotCounts[b.time_slot] = (slotCounts[b.time_slot] || 0) + 1;
      }
    }
    return slotCounts;
  },

  /**
   * Update a booking's status (admin action).
   * When autoMarkPaidOnConfirm is true, confirming a booking also marks
   * unpaid bookings as paid and stamps paid_at.
   * When autoMarkCashPaidOnComplete is true, completing a cash booking also
   * marks unpaid bookings as paid and stamps paid_at.
   */
  async updateStatus(
    bookingId: string,
    status: string,
    options?: { autoMarkPaidOnConfirm?: boolean; autoMarkCashPaidOnComplete?: boolean }
  ): Promise<BookingRow> {
    if (status === "confirmed" && options?.autoMarkPaidOnConfirm) {
      const { data: promoted, error: promotedError } = await supabaseAdmin
        .from("bookings")
        .update({
          status,
          payment_status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
        .eq("is_deleted", false)
        .or("payment_status.is.null,payment_status.eq.unpaid")
        .select()
        .single();

      if (!promotedError && promoted) return promoted;
      if (promotedError && (promotedError as any)?.code !== "PGRST116") throw promotedError;
    }

    if (status === "completed" && options?.autoMarkCashPaidOnComplete) {
      const { data: completedPaid, error: completedPaidError } = await supabaseAdmin
        .from("bookings")
        .update({
          status,
          payment_status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
        .eq("is_deleted", false)
        .eq("payment_method", "cash")
        .or("payment_status.is.null,payment_status.eq.unpaid")
        .select()
        .single();

      if (!completedPaidError && completedPaid) return completedPaid;
      if (completedPaidError && (completedPaidError as any)?.code !== "PGRST116") throw completedPaidError;
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({ status })
      .eq("id", bookingId)
      .eq("is_deleted", false)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** Soft-delete a booking */
  async softDelete(bookingId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({ is_deleted: true })
      .eq("id", bookingId);

    if (error) throw error;
  },
};