import { Request, Response } from "express";
import { bookingModel } from "../models/bookingModel";
import { petModel } from "../models/petModel";
import { serviceHistoryModel } from "../models/serviceHistoryModel";
import { supabaseAdmin } from "../config/supabaseAdmin";

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

      // Allow a small tolerance (₱0.02) for floating-point rounding
      const tolerance = 0.02;

      if (parsedTotalPrice != null && Math.abs(parsedTotalPrice - expectedTotal) > tolerance) {
        return res.status(400).json({
          error: "Price mismatch: the total price you submitted does not match the expected price. Please refresh and try again.",
          expected_total: expectedTotal,
          submitted_total: parsedTotalPrice,
        });
      }

      if (parsedSubtotal != null && Math.abs(parsedSubtotal - expectedSubtotal) > tolerance) {
        return res.status(400).json({
          error: "Price mismatch: the subtotal you submitted does not match the expected subtotal. Please refresh and try again.",
          expected_subtotal: expectedSubtotal,
          submitted_subtotal: parsedSubtotal,
        });
      }
    }

    // Compute final price fields (use server-computed values when possible)
    const finalSubtotal = parsedSubtotal;
    const finalServiceFee = parsedServiceFee ?? (parsedSubtotal != null ? Math.round(parsedSubtotal * 0.10 * 100) / 100 : null);
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
