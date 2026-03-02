import { Request, Response } from "express";
import { bookingModel } from "../models/bookingModel";
import { petModel } from "../models/petModel";
import { serviceHistoryModel } from "../models/serviceHistoryModel";
import { supabaseAdmin } from "../config/supabaseAdmin";
import { notificationModel } from "../models/notificationModel";

/** GET /api/bookings/mine/today — proprietor's today's check-ins */
export const getTodayCheckInsForOwner = async (req: any, res: any) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Get properties owned by user
    const { data: props, error: propsErr } = await supabaseAdmin
      .from('properties')
      .select('id, name')
      .eq('owner_id', userId)
      .eq('is_deleted', false);

    if (propsErr) throw propsErr;
    const propertyIds = (props ?? []).map((p: any) => p.id);
    if (!propertyIds.length) return res.json({ checkIns: [] });

    const today = new Date().toISOString().slice(0, 10);

    const { data: bookings, error: bookErr } = await supabaseAdmin
      .from('bookings')
      .select('id, pet_name, owner_name, time_slot, room_name, service_name, property_id, status')
      .in('property_id', propertyIds)
      .eq('is_deleted', false)
      .eq('checkin', today)
      .in('status', ['pending', 'confirmed', 'checked_in'])
      .order('time_slot', { ascending: true });

    if (bookErr) throw bookErr;

    const propMap = new Map((props ?? []).map((p: any) => [p.id, p.name]));

    const checkIns = (bookings ?? []).map((b: any) => ({
      id: b.id,
      pet: b.pet_name || 'Unknown',
      owner: b.owner_name || '',
      time: b.time_slot ? b.time_slot.slice(0,5) : '',
      room: b.room_name || propMap.get(b.property_id) || '',
      service: b.service_name || '',
      propertyId: b.property_id,
      status: b.status,
    }));

    return res.json({ checkIns });
  } catch (err: any) {
    console.error('getTodayCheckInsForOwner error:', err);
    return res.status(500).json({ error: 'Failed to fetch today\'s check-ins.' });
  }
};

/** GET /api/bookings/mine/recent — recent bookings for proprietor's properties */
export const getRecentBookingsForOwner = async (req: any, res: any) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { data: props, error: propsErr } = await supabaseAdmin
      .from('properties')
      .select('id')
      .eq('owner_id', userId)
      .eq('is_deleted', false);

    if (propsErr) throw propsErr;
    const propertyIds = (props ?? []).map((p: any) => p.id);
    if (!propertyIds.length) return res.json({ bookings: [] });

    const { data: bookings, error: bookErr } = await supabaseAdmin
      .from('bookings')
      .select('id, pet_name, owner_name, service_name, checkin, created_at, status, total_price')
      .in('property_id', propertyIds)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(6);

    if (bookErr) throw bookErr;

    const out = (bookings ?? []).map((b: any) => ({
      id: b.id,
      pet: b.pet_name || 'Unknown',
      owner: b.owner_name || '',
      service: b.service_name || '',
      date: b.checkin || (b.created_at ? b.created_at.slice(0,10) : ''),
      status: b.status || '',
      total_price: b.total_price ?? null,
    }));

    return res.json({ bookings: out });
  } catch (err: any) {
    console.error('getRecentBookingsForOwner error:', err);
    return res.status(500).json({ error: 'Failed to fetch recent bookings.' });
  }
};

/** GET /api/bookings/mine/list — paginated bookings for proprietor's properties */
export const listBookingsForOwner = async (req: any, res: any) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const status = req.query.status as string | undefined;
    const service = req.query.service as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;

    const { data: props, error: propsErr } = await supabaseAdmin
      .from('properties')
      .select('id')
      .eq('owner_id', userId)
      .eq('is_deleted', false);
    if (propsErr) throw propsErr;
    const propertyIds = (props ?? []).map((p: any) => p.id);
    if (!propertyIds.length) return res.json({ bookings: [], total: 0 });

    // Build a count-aware query
    let query = supabaseAdmin
      .from('bookings')
      .select('id, pet_name, owner_name, service_name, service_type, checkin, checkout, created_at, status, total_price, property_id', { count: 'exact' })
      .in('property_id', propertyIds)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (service) query = query.eq('service_type', service);

    const offset = (page - 1) * limit;
    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    // Normalize fields to match frontend expectations
    const normalized = (data ?? []).map((b: any) => ({
      id: b.id,
      pet_name: b.pet_name,
      owner_name: b.owner_name,
      service_name: b.service_name,
      service_type: b.service_type,
      checkin: b.checkin,
      checkout: b.checkout,
      created_at: b.created_at,
      status: b.status,
      total_price: b.total_price,
      property_id: b.property_id,
    }));

    return res.json({ bookings: normalized, total: Number(count ?? normalized.length) });
  } catch (err: any) {
    console.error('listBookingsForOwner error:', err);
    return res.status(500).json({ error: 'Failed to list bookings.' });
  }
};

/** POST /api/bookings/:id/status — owner can change booking status (confirm/cancel) */
export const updateBookingStatusForOwner = async (req: any, res: any) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const bookingId = req.params.id as string;
    const newStatus = req.body?.status as string;
    if (!bookingId || !newStatus) return res.status(400).json({ error: 'Missing parameters' });

    // Fetch booking and property owner
    const { data: booking, error: bookErr } = await supabaseAdmin
      .from('bookings')
      .select('id, property_id, status')
      .eq('id', bookingId)
      .eq('is_deleted', false)
      .single();
    if (bookErr) throw bookErr;

    const { data: prop, error: propErr } = await supabaseAdmin
      .from('properties')
      .select('id, owner_id')
      .eq('id', booking.property_id)
      .single();
    if (propErr) throw propErr;

    if (String(prop.owner_id) !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Only allow certain transitions
    const allowed = ['confirmed', 'cancelled'];
    if (!allowed.includes(newStatus)) return res.status(400).json({ error: 'Invalid status' });

    const { data: updated, error: updErr } = await supabaseAdmin
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId)
      .select()
      .single();

    if (updErr) throw updErr;

    return res.json({ booking: updated });
  } catch (err: any) {
    console.error('updateBookingStatusForOwner error:', err);
    return res.status(500).json({ error: 'Failed to update booking status.' });
  }
};

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
      
    // ── Validate & sanitize price fields ──
    const parsedSubtotal = subtotal != null ? Number(subtotal) : null;
    const parsedServiceFee = service_fee != null ? Number(service_fee) : null;
    const parsedTotalPrice = total_price != null ? Number(total_price) : null;

    if (parsedSubtotal != null && (isNaN(parsedSubtotal) || parsedSubtotal < 0)) {
      return res.status(400).json({ error: "Invalid subtotal value." });
    }
    if (parsedServiceFee != null && (isNaN(parsedServiceFee) || parsedServiceFee < 0)) {
      return res.status(400).json({ error: "Invalid service_fee value." });
    }
    if (parsedTotalPrice != null && (isNaN(parsedTotalPrice) || parsedTotalPrice < 0)) {
      return res.status(400).json({ error: "Invalid total_price value." });
    }

    // ── Validate amount_paid must exactly equal total_price ──
    const parsedAmountPaid = amount_paid != null ? Number(amount_paid) : null;
    if (parsedAmountPaid != null && parsedTotalPrice != null && Math.round(parsedAmountPaid * 100) !== Math.round(parsedTotalPrice * 100)) {
      return res.status(400).json({ error: `Amount paid (₱${parsedAmountPaid.toFixed(2)}) must exactly match the total price (₱${parsedTotalPrice.toFixed(2)}).` });
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

    // ── Server-side price verification ──
    // Map service_type to property_services category
    const categoryMap: Record<string, string> = {
      boarding: "Boarding",
      grooming: "Grooming",
      veterinary: "Veterinary",
      daycare: "Daycare",
      transport: "Transport",
    };
    const serviceCategory = categoryMap[service_type?.toLowerCase() ?? ""] || null;

    // Look up the actual base price from the database
    let lookupQuery = supabaseAdmin
      .from("property_services")
      .select("price, name, category")
      .eq("property_id", resolvedPropertyId)
      .eq("is_active", true)
      .eq("is_deleted", false);

    if (service_id) {
      lookupQuery = lookupQuery.eq("id", service_id);
    } else if (serviceCategory) {
      lookupQuery = lookupQuery.eq("category", serviceCategory);
    }

    const { data: matchedServices } = await lookupQuery;

    let expectedBasePrice: number | null = null;

    if (matchedServices && matchedServices.length > 0) {
      // If service_name is provided, try to match by name; otherwise take the first
      const exactMatch = service_name
        ? matchedServices.find((s: any) => s.name === service_name)
        : null;
      expectedBasePrice = Number((exactMatch ?? matchedServices[0]).price);
    }

    if (expectedBasePrice != null && !isNaN(expectedBasePrice)) {
      // Compute expected prices using the same formula as the frontend
      const dogSizeMultiplier =
        serviceCategory === "Grooming" && pet_type === "dog" && dog_size
          ? ({ small: 1.0, medium: 1.15, large: 1.30, giant: 1.50 } as Record<string, number>)[dog_size] ?? 1.0
          : 1.0;

      const priceWithDogSize = expectedBasePrice * dogSizeMultiplier;

      let nights = 1;
      if (isBoarding && checkin && checkout) {
        const checkinMs = new Date(checkin).getTime();
        const checkoutMs = new Date(checkout).getTime();
        nights = Math.max(1, Math.ceil((checkoutMs - checkinMs) / (1000 * 60 * 60 * 24)));
      }

      const expectedSubtotal = isBoarding ? priceWithDogSize * nights : priceWithDogSize;
      const expectedServiceFee = Math.round(expectedSubtotal * 0.10 * 100) / 100;
      const expectedTotal = Math.round((expectedSubtotal + expectedServiceFee) * 100) / 100;

      // Compare using integer cents to avoid floating-point drift
      if (parsedTotalPrice != null && Math.round(parsedTotalPrice * 100) !== Math.round(expectedTotal * 100)) {
        return res.status(400).json({
          error: "Price mismatch: the total price you submitted does not match the expected price. Please refresh and try again.",
          expected_total: expectedTotal,
          submitted_total: parsedTotalPrice,
        });
      }

      if (parsedSubtotal != null && Math.round(parsedSubtotal * 100) !== Math.round(expectedSubtotal * 100)) {
        return res.status(400).json({
          error: "Price mismatch: the subtotal you submitted does not match the expected subtotal. Please refresh and try again.",
          expected_subtotal: expectedSubtotal,
          submitted_subtotal: parsedSubtotal,
        });
      }
    }

    // Compute final price fields (use server-computed values when possible)
    const finalSubtotal = parsedSubtotal;
    const finalServiceFee = parsedServiceFee ?? (finalSubtotal != null ? Math.round(finalSubtotal * 0.10 * 100) / 100 : null);
    const finalTotalPrice = parsedTotalPrice ?? (finalSubtotal != null && finalServiceFee != null ? Math.round((finalSubtotal + finalServiceFee) * 100) / 100 : null);

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
          subtotal: finalSubtotal,
          service_fee: finalServiceFee,
          total_price: finalTotalPrice,
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

    // ── Send notification to the customer ──
    try {
      const svcLabel = service_name || service_type || "your service";
      await notificationModel.create({
        user_id: userId,
        type: "booking_confirmed",
        title: "Booking Confirmed",
        message: `Your booking for ${svcLabel} on ${new Date(checkin).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} has been submitted successfully.`,
        link: "/my-bookings",
        reference_id: booking.id,
        reference_type: "booking",
      });
    } catch (notifErr) {
      console.error("Failed to create booking notification:", notifErr);
    }

    // ── Notify property owner ──
    try {
      const { data: property } = await supabaseAdmin
        .from("properties")
        .select("owner_id, name")
        .eq("id", resolvedPropertyId)
        .single();

      if (property?.owner_id) {
        const svcLabel = service_name || service_type || "a service";
        await notificationModel.create({
          user_id: property.owner_id,
          type: "booking_confirmed",
          title: "New Booking Received",
          message: `A new booking for ${svcLabel} at ${property.name || "your property"} on ${new Date(checkin).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} has been placed.`,
          link: "/admin/bookings",
          reference_id: booking.id,
          reference_type: "booking",
        });
      }
    } catch (notifErr) {
      console.error("Failed to create owner notification:", notifErr);
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
