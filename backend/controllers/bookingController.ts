import { Request, Response } from "express";
import { bookingModel } from "../models/bookingModel";
import { petModel } from "../models/petModel";
import { serviceHistoryModel } from "../models/serviceHistoryModel";
import { supabaseAdmin } from "../config/supabaseAdmin";

/**
 * GET /api/bookings/admin/calendar
 * Returns bookings for all properties owned by the current user (proprietor / admin).
 * Also returns the proprietor's properties and the distinct service categories.
 * Query params:
 *   - property_id   (optional) filter by property
 *   - service_type  (optional) filter by service_type
 *   - status        (optional) filter by booking status
 */
export const adminCalendar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    console.log("[adminCalendar] userId:", userId, "role:", userRole);

    // 1. Get properties owned by this admin/proprietor (super_admin sees all)
    let propsQuery = supabaseAdmin
      .from("properties")
      .select("id, name, property_type")
      .eq("is_deleted", false);

    if (userRole !== "super_admin") {
      propsQuery = propsQuery.eq("owner_id", userId);
    }

    const { data: properties, error: propsErr } = await propsQuery.order("name");
    if (propsErr) throw propsErr;

    console.log("[adminCalendar] properties found:", (properties ?? []).length, (properties ?? []).map((p: any) => ({ id: p.id, name: p.name })));

    const propertyIds = (properties ?? []).map((p: any) => p.id);

    if (propertyIds.length === 0) {
      return res.json({ bookings: [], properties: [], serviceTypes: [] });
    }

    // 2. Get distinct service categories from property_services for those properties
    const { data: services, error: svcErr } = await supabaseAdmin
      .from("property_services")
      .select("category")
      .in("property_id", propertyIds)
      .eq("is_active", true)
      .eq("is_deleted", false);

    if (svcErr) throw svcErr;

    const serviceTypes = [...new Set((services ?? []).map((s: any) => s.category))].sort();

    // 2b. Get full service list (rooms/services) for these properties
    const { data: propertyServices, error: pSvcErr } = await supabaseAdmin
      .from("property_services")
      .select("id, property_id, name, category, price, capacity")
      .in("property_id", propertyIds)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .order("category")
      .order("name");

    if (pSvcErr) throw pSvcErr;

    // 3. Build bookings query
    let bookingsQuery = supabaseAdmin
      .from("bookings")
      .select("*, properties:property_id(name)")
      .in("property_id", propertyIds)
      .eq("is_deleted", false)
      .order("checkin", { ascending: true });

    // Optional filters
    const filterPropertyId = req.query.property_id as string | undefined;
    const filterServiceType = req.query.service_type as string | undefined;
    const filterStatus = req.query.status as string | undefined;

    if (filterPropertyId) {
      bookingsQuery = bookingsQuery.eq("property_id", filterPropertyId);
    }
    if (filterServiceType) {
      bookingsQuery = bookingsQuery.eq("service_type", filterServiceType);
    }
    if (filterStatus) {
      bookingsQuery = bookingsQuery.eq("status", filterStatus);
    }

    const { data: bookings, error: bookErr } = await bookingsQuery;
    if (bookErr) throw bookErr;

    // Flatten property name
    const mapped = (bookings ?? []).map((b: any) => ({
      ...b,
      property_name: b.properties?.name ?? null,
      properties: undefined,
    }));

    return res.json({
      bookings: mapped,
      properties: properties ?? [],
      serviceTypes,
      propertyServices: propertyServices ?? [],
    });
  } catch (err: any) {
    console.error("adminCalendar error:", err);
    return res.status(500).json({ error: "Failed to fetch calendar data.", details: err?.message || err });
  }
};

/**
 * POST /api/bookings/admin/walkin
 * Allows a proprietor / admin to create a walk-in or manual event.
 * Does NOT require a user_id in the body — it uses the current admin's id
 * as both user_id (owner of the booking record) and created_by.
 * Accepts a simpler payload than the full customer booking flow.
 */
export const adminCreateWalkin = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Only proprietors / admins / super_admins can create walk-ins
    if (!["admin", "proprietor", "super_admin"].includes(userRole)) {
      return res.status(403).json({ error: "Only property owners or admins can add walk-in bookings." });
    }

    const {
      property_id,
      service_id,
      checkin,
      checkout,
      time_slot,
      pet_name,
      pet_type,
      pet_breed,
      pet_age,
      pet_weight,
      special_requirements,
      service_name,
      service_type,
      owner_name,
      owner_email,
      owner_phone,
      emergency_contact,
      subtotal,
      service_fee,
      total_price,
      payment_method,
      payment_status,
      notes,
      room_name,
      status: requestedStatus,
    } = req.body;

    if (!property_id || !checkin) {
      return res.status(400).json({ error: "Missing required fields: property_id, checkin." });
    }

    // Validate dates: checkout (end) must not be before checkin (start)
    if (checkout) {
      const checkinDate = new Date(checkin);
      const checkoutDate = new Date(checkout);
      if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format for checkin or checkout." });
      }
      if (checkoutDate.getTime() < checkinDate.getTime()) {
        return res.status(400).json({ error: "Checkout (end) cannot be before checkin (start)." });
      }
    }

    if (!pet_name || !owner_name) {
      return res.status(400).json({ error: "Missing required fields: pet_name, owner_name." });
    }

    // Verify the admin owns this property (super_admin can book on any)
    if (userRole !== "super_admin") {
      const { data: prop, error: propErr } = await supabaseAdmin
        .from("properties")
        .select("id")
        .eq("id", property_id)
        .eq("owner_id", userId)
        .single();

      if (propErr || !prop) {
        return res.status(403).json({ error: "You do not own this property." });
      }
    }

    // Resolve capacity for concurrency check
    const isBoarding = !!checkout;
    let capacity = 1;

    if (isBoarding) {
      const { data: services } = await supabaseAdmin
        .from("property_services")
        .select("capacity")
        .eq("property_id", property_id)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .eq("category", "Boarding");

      if (services && services.length > 0) {
        capacity = services.reduce((sum: number, s: any) => sum + (s.capacity ?? 1), 0);
      } else {
        const { data: propData } = await supabaseAdmin
          .from("properties")
          .select("capacity")
          .eq("id", property_id)
          .single();
        capacity = propData?.capacity ?? 5;
      }
    } else {
      const { data: propData } = await supabaseAdmin
        .from("properties")
        .select("capacity")
        .eq("id", property_id)
        .single();
      capacity = propData?.capacity ?? 5;
    }

    // Atomic check-and-insert — the admin's user_id is used as user_id for the record
    let booking;
    try {
      booking = await bookingModel.createAtomic(
        {
          property_id,
          user_id: userId,
          pet_id: null,
          service_id: service_id || null,
          checkin,
          checkout: checkout || null,
          time_slot: time_slot || null,
          pet_name: pet_name || null,
          pet_type: pet_type || null,
          pet_breed: pet_breed || null,
          pet_age: pet_age || null,
          pet_weight: pet_weight || null,
          special_requirements: special_requirements || null,
          med_cert_url: null,
          vaccine_record_url: null,
          service_name: service_name || null,
          service_type: service_type || null,
          owner_name: owner_name || null,
          owner_email: owner_email || null,
          owner_phone: owner_phone || null,
          emergency_contact: emergency_contact || null,
          subtotal: subtotal || null,
          service_fee: service_fee || null,
          total_price: total_price || null,
          payment_method: payment_method || null,
          payment_screenshot_url: null,
          notes: notes || null,
          source: "walkin",
          created_by: userId,
        },
        capacity
      );
    } catch (atomicErr: any) {
      const msg = atomicErr?.message || atomicErr?.details || "";
      if (msg.includes("SLOT_UNAVAILABLE")) {
        const detail = msg.split("SLOT_UNAVAILABLE:")[1]?.trim() || "This slot is no longer available.";
        return res.status(409).json({ error: detail, code: "SLOT_UNAVAILABLE" });
      }
      throw atomicErr;
    }

    // Optionally override status (walk-ins default to confirmed)
    const finalStatus = requestedStatus || "confirmed";
    const finalPaymentStatus = payment_status || "unpaid";

    if (finalStatus !== "pending" || finalPaymentStatus !== "unpaid") {
      const { error: updateErr } = await supabaseAdmin
        .from("bookings")
        .update({
          status: finalStatus,
          payment_status: finalPaymentStatus,
          ...(room_name ? { room_name } : {}),
        })
        .eq("id", booking.id);

      if (updateErr) {
        console.error("Failed to update walk-in status:", updateErr);
      } else {
        booking.status = finalStatus;
        booking.payment_status = finalPaymentStatus;
        if (room_name) booking.room_name = room_name;
      }
    }

    return res.status(201).json({ booking });
  } catch (err: any) {
    console.error("adminCreateWalkin error:", err);
    return res.status(500).json({ error: "Failed to create walk-in booking.", details: err?.message || err });
  }
};

/** POST /api/bookings — create a new booking */
export const createBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const {
      property_id,
      pet_id,          // null if new pet
      service_id,
      checkin,
      checkout,
      time_slot,
      pet_name,
      pet_type,
      pet_breed,
      pet_age,
      pet_weight,
      special_requirements,
      med_cert_url,
      vaccine_record_url,
      service_name,
      service_type,
      owner_name,
      owner_email,
      owner_phone,
      emergency_contact,
      subtotal,
      service_fee,
      total_price,
      payment_method,
      reference_number,
      amount_paid,
      payment_screenshot_url,
      // New pet fields (when no pet_id)
      new_pet_species,
      new_pet_birthday,
      new_pet_photo_url,
      new_pet_notes,
      dog_size,
    } = req.body;

    if (!property_id || !checkin) {
      return res.status(400).json({ error: "Missing required fields: property_id, checkin." });
    }

    // Validate dates: checkout (end) must not be before checkin (start)
    if (checkout) {
      const checkinDate = new Date(checkin);
      const checkoutDate = new Date(checkout);
      if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format for checkin or checkout." });
      }
      if (checkoutDate.getTime() < checkinDate.getTime()) {
        return res.status(400).json({ error: "Checkout (end) cannot be before checkin (start)." });
      }
    }

    // Validate property_id is a valid UUID format; if not, try to find a matching property
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let resolvedPropertyId = property_id;

    if (!uuidRegex.test(property_id)) {
      // Non-UUID property_id (e.g. from demo/hardcoded detail pages) — find the first approved property as fallback
      const { data: fallbackProp } = await supabaseAdmin
        .from("properties")
        .select("id")
        .eq("status", "approved")
        .limit(1)
        .single();

      if (!fallbackProp) {
        return res.status(400).json({ error: "No properties available for booking. Please try again later." });
      }
      resolvedPropertyId = fallbackProp.id;
      console.log(`Resolved non-UUID property_id "${property_id}" → fallback ${resolvedPropertyId}`);
    } else {
      // Verify the UUID property exists
      const { data: propertyExists, error: propCheckErr } = await supabaseAdmin
        .from("properties")
        .select("id")
        .eq("id", property_id)
        .single();

      if (propCheckErr || !propertyExists) {
        // Fallback to first approved property
        const { data: fallbackProp } = await supabaseAdmin
          .from("properties")
          .select("id")
          .eq("status", "approved")
          .limit(1)
          .single();

        if (!fallbackProp) {
          return res.status(400).json({ error: "The selected property does not exist and no fallback is available." });
        }
        resolvedPropertyId = fallbackProp.id;
        console.log(`Property ${property_id} not found → fallback ${resolvedPropertyId}`);
      }
    }

    // ── Resolve capacity for concurrency check ──
    const isBoarding = !!checkout;
    let capacity = 1;

    if (isBoarding) {
      // Get total boarding capacity (sum of boarding service capacities, or property-level)
      const { data: services } = await supabaseAdmin
        .from("property_services")
        .select("capacity")
        .eq("property_id", resolvedPropertyId)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .eq("category", "Boarding");

      if (services && services.length > 0) {
        capacity = services.reduce((sum: number, s: any) => sum + (s.capacity ?? 1), 0);
      } else {
        const { data: prop } = await supabaseAdmin
          .from("properties")
          .select("capacity")
          .eq("id", resolvedPropertyId)
          .single();
        capacity = prop?.capacity ?? 5;
      }
    } else {
      // Appointment: use property-level capacity
      const { data: prop } = await supabaseAdmin
        .from("properties")
        .select("capacity")
        .eq("id", resolvedPropertyId)
        .single();
      capacity = prop?.capacity ?? 5;
    }

    let resolvedPetId = pet_id || null;

    // If no pet_id provided but pet details given, create a new pet
    if (!resolvedPetId && pet_name) {
      try {
        const newPet = await petModel.create(userId, {
          name: pet_name,
          species: new_pet_species || pet_type || "Dog",
          breed: pet_breed || "",
          birthday: new_pet_birthday || new Date().toISOString().split("T")[0],
          weight: parseFloat(pet_weight) || 0,
          photo_url: new_pet_photo_url || null,
          notes: new_pet_notes || special_requirements || null,
        });
        resolvedPetId = newPet.id;
      } catch (petErr) {
        console.error("Failed to create pet during booking:", petErr);
      }
    }

    // ── Atomic check-and-insert (concurrency-safe via PG advisory locks) ──
    let booking;
    try {
      booking = await bookingModel.createAtomic(
        {
          property_id: resolvedPropertyId,
          user_id: userId,
          pet_id: resolvedPetId,
          service_id: service_id || null,
          checkin,
          checkout: checkout || null,
          time_slot: time_slot || null,
          pet_name: pet_name || null,
          pet_type: pet_type || null,
          pet_breed: pet_breed || null,
          pet_age: pet_age || null,
          pet_weight: pet_weight || null,
          special_requirements: special_requirements || null,
          med_cert_url: med_cert_url || null,
          vaccine_record_url: vaccine_record_url || null,
          service_name: service_name || null,
          service_type: service_type || null,
          owner_name: owner_name || null,
          owner_email: owner_email || null,
          owner_phone: owner_phone || null,
          emergency_contact: emergency_contact || null,
          subtotal: subtotal || null,
          service_fee: service_fee || null,
          total_price: total_price || null,
          payment_method: payment_method || null,
          payment_screenshot_url: payment_screenshot_url || null,
          notes: null,
          source: "web",
          created_by: null,
        },
        capacity
      );
    } catch (atomicErr: any) {
      const msg = atomicErr?.message || atomicErr?.details || "";
      if (msg.includes("SLOT_UNAVAILABLE")) {
        // Extract the human-readable part after "SLOT_UNAVAILABLE:"
        const detail = msg.split("SLOT_UNAVAILABLE:")[1]?.trim() || "This slot is no longer available.";
        return res.status(409).json({
          error: detail,
          code: "SLOT_UNAVAILABLE",
        });
      }
      throw atomicErr; // re-throw unexpected errors
    }

    // Create a service history entry for the pet if we have a pet ID and service info
    if (resolvedPetId && service_type) {
      const serviceTypeMap: Record<string, string> = {
        boarding: "other",
        grooming: "grooming",
        veterinary: "checkup",
        daycare: "other",
        transport: "other",
      };
      try {
        await serviceHistoryModel.create({
          pet_id: resolvedPetId,
          booking_id: booking.id,
          service_type: serviceTypeMap[service_type] || "other",
          service_name: service_name || service_type,
          performed_at: checkin,
          notes: special_requirements || null,
        });
      } catch (shErr) {
        console.error("Failed to create service history:", shErr);
      }
    }

    return res.status(201).json({ booking });
  } catch (err: any) {
    console.error("createBooking error:", err);
    return res.status(500).json({ error: "Failed to create booking.", details: err?.message || err });
  }
};

/** GET /api/bookings — list user's bookings */
export const listBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const bookings = await bookingModel.getByUser(userId);
    return res.json({ bookings });
  } catch (err: any) {
    console.error("listBookings error:", err);
    return res.status(500).json({ error: "Failed to fetch bookings." });
  }
};

/** GET /api/bookings/:id — get one booking */
export const getBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const booking = await bookingModel.getById(req.params.id as string, userId);
    if (!booking) return res.status(404).json({ error: "Booking not found." });

    return res.json({ booking });
  } catch (err: any) {
    console.error("getBooking error:", err);
    return res.status(500).json({ error: "Failed to fetch booking." });
  }
};

/**
 * GET /api/bookings/availability/:propertyId
 * Query params:
 *   - date: single date (YYYY-MM-DD) for grooming/vet time-slot availability
 *   - rangeStart & rangeEnd: for hotel unavailable dates (YYYY-MM-DD)
 *   - type: "hotel" | "grooming" | "veterinary"
 */
export const checkAvailability = async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.propertyId as string;
    const date = req.query.date as string | undefined;
    const rangeStart = req.query.rangeStart as string | undefined;
    const rangeEnd = req.query.rangeEnd as string | undefined;
    const type = req.query.type as string | undefined;

    if (!propertyId) {
      return res.status(400).json({ error: "Missing propertyId." });
    }

    // Hotel: return unavailable dates in range
    if (type === "hotel") {
      if (!rangeStart || !rangeEnd) {
        return res.status(400).json({ error: "Missing rangeStart or rangeEnd for hotel availability." });
      }
      const unavailableDates = await bookingModel.getUnavailableDatesForHotel(
        propertyId,
        rangeStart,
        rangeEnd
      );
      return res.json({ unavailableDates });
    }

    // Grooming/Vet: return booked time slots for a date
    if (!date) {
      return res.status(400).json({ error: "Missing date parameter." });
    }

    const bookedSlots = await bookingModel.getBookedTimeSlotsForDate(propertyId, date);
    const capacityInfo = await bookingModel.getCapacityForDate(propertyId, date);

    // All time slots
    const allSlots = ["9:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

    // Count bookings per slot
    const slotCounts: Record<string, number> = {};
    for (const slot of bookedSlots) {
      slotCounts[slot] = (slotCounts[slot] || 0) + 1;
    }

    // A slot is unavailable if the number of bookings for that slot >= capacity
    const unavailableSlots = allSlots.filter(
      (slot) => (slotCounts[slot] || 0) >= capacityInfo.capacity
    );
    const availableSlots = allSlots.filter(
      (slot) => (slotCounts[slot] || 0) < capacityInfo.capacity
    );

    return res.json({
      date,
      capacity: capacityInfo.capacity,
      totalBooked: capacityInfo.booked,
      unavailableSlots,
      availableSlots,
    });
  } catch (err: any) {
    console.error("checkAvailability error:", err);
    return res.status(500).json({ error: "Failed to check availability.", details: err?.message || err });
  }
};

/**
 * PATCH /api/bookings/admin/:id/status
 * Update a booking's status (confirm, check-in, complete, cancel).
 * Only the property owner or super_admin can do this.
 */
export const adminUpdateBookingStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (!["admin", "proprietor", "super_admin"].includes(userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!bookingId) return res.status(400).json({ error: "Missing booking id" });
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "checked_in", "checked_out", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    // Verify ownership (unless super_admin)
    if (userRole !== "super_admin") {
      const { data: booking } = await supabaseAdmin
        .from("bookings")
        .select("property_id, properties:property_id(owner_id)")
        .eq("id", bookingId)
        .single();

      if (!booking || (booking as any).properties?.owner_id !== userId) {
        return res.status(403).json({ error: "You do not own this booking's property." });
      }
    }

    const updated = await bookingModel.updateStatus(bookingId, status);
    return res.json({ booking: updated });
  } catch (err: any) {
    console.error("adminUpdateBookingStatus error:", err);
    return res.status(500).json({ error: "Failed to update booking status.", details: err?.message || err });
  }
};

/**
 * DELETE /api/bookings/admin/:id
 * Soft-delete a booking. Only the property owner or super_admin.
 */
export const adminDeleteBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (!["admin", "proprietor", "super_admin"].includes(userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!bookingId) return res.status(400).json({ error: "Missing booking id" });

    // Verify ownership (unless super_admin)
    if (userRole !== "super_admin") {
      const { data: booking } = await supabaseAdmin
        .from("bookings")
        .select("property_id, properties:property_id(owner_id)")
        .eq("id", bookingId)
        .single();

      if (!booking || (booking as any).properties?.owner_id !== userId) {
        return res.status(403).json({ error: "You do not own this booking's property." });
      }
    }

    await bookingModel.softDelete(bookingId);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("adminDeleteBooking error:", err);
    return res.status(500).json({ error: "Failed to delete booking.", details: err?.message || err });
  }
};
