import { Request, Response } from "express";
import { bookingModel } from "../models/bookingModel";
import { petModel } from "../models/petModel";
import { serviceHistoryModel } from "../models/serviceHistoryModel";
import { supabaseAdmin } from "../config/supabaseAdmin";
import { notificationModel } from "../models/notificationModel";
import { getSuperAdminRecipients } from "../services/notificationRecipients";
import {
  batchSignStorageRefs,
  getSignedStorageUrl,
  parseDocumentField,
  parseStorageRef,
  uploadDataUrlToBucket,
} from "../utils/storageMedia";

const PROPERTY_IMAGE_BUCKET = "property-images";
const BOOKING_DOCUMENT_BUCKET = "booking-documents";
const BOOKING_PAYMENT_BUCKET = "booking-payments";

const toDocFieldValue = (values: string[]): string | null => {
  if (!values.length) return null;
  return values.length === 1 ? values[0] : JSON.stringify(values);
};

const collectBookingMediaRefs = (booking: any) => {
  const refs = [] as Array<{ bucket: string; path: string }>;

  const propertyRef = parseStorageRef(booking.property_image, PROPERTY_IMAGE_BUCKET);
  if (propertyRef) refs.push(propertyRef);

  const paymentRef = parseStorageRef(booking.payment_screenshot_url, BOOKING_PAYMENT_BUCKET);
  if (paymentRef) refs.push(paymentRef);

  const vaccineDocs = parseDocumentField(booking.vaccine_record_url).values;
  for (const doc of vaccineDocs) {
    const ref = parseStorageRef(doc, BOOKING_DOCUMENT_BUCKET);
    if (ref) refs.push(ref);
  }

  const medDocs = parseDocumentField(booking.med_cert_url).values;
  for (const doc of medDocs) {
    const ref = parseStorageRef(doc, BOOKING_DOCUMENT_BUCKET);
    if (ref) refs.push(ref);
  }

  return refs;
};

const signBookingMedia = (booking: any, signedMap: Record<string, string>) => {
  const vaccineDocs = parseDocumentField(booking.vaccine_record_url).values
    .map((url) => getSignedStorageUrl(url, signedMap, BOOKING_DOCUMENT_BUCKET))
    .filter((url): url is string => Boolean(url));

  const medDocs = parseDocumentField(booking.med_cert_url).values
    .map((url) => getSignedStorageUrl(url, signedMap, BOOKING_DOCUMENT_BUCKET))
    .filter((url): url is string => Boolean(url));

  return {
    ...booking,
    property_image: getSignedStorageUrl(booking.property_image, signedMap, PROPERTY_IMAGE_BUCKET),
    payment_screenshot_url: getSignedStorageUrl(booking.payment_screenshot_url, signedMap, BOOKING_PAYMENT_BUCKET),
    vaccine_record_url: toDocFieldValue(vaccineDocs),
    med_cert_url: toDocFieldValue(medDocs),
  };
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

    const createdBookingMediaRefs = collectBookingMediaRefs(booking);
    const createdBookingSignedMap = await batchSignStorageRefs(createdBookingMediaRefs);

    return res.status(201).json({ booking: signBookingMedia(booking, createdBookingSignedMap) });
  } catch (err: any) {
    console.error("adminCreateWalkin error:", err);
    return res.status(500).json({ error: "Failed to create walk-in booking.", details: err?.message || err });
  }
};

/** GET /api/bookings/mine/today — proprietor's today's check-ins */
export const getTodayCheckInsForOwner = async (req: any, res: any) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const filterPropertyId = req.query.property_id as string | undefined;

    // Get properties owned by user
    let propsQuery = supabaseAdmin
      .from('properties')
      .select('id, name')
      .eq('owner_id', userId)
      .eq('is_deleted', false);

    if (filterPropertyId) propsQuery = propsQuery.eq('id', filterPropertyId);

    const { data: props, error: propsErr } = await propsQuery;

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
      .in('status', ['pending', 'confirmed'])
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

    const filterPropertyId = req.query.property_id as string | undefined;

    let propsQuery = supabaseAdmin
      .from('properties')
      .select('id')
      .eq('owner_id', userId)
      .eq('is_deleted', false);

    if (filterPropertyId) propsQuery = propsQuery.eq('id', filterPropertyId);

    const { data: props, error: propsErr } = await propsQuery;

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
    const filterPropertyId = req.query.property_id as string | undefined;

    let propsQuery = supabaseAdmin
      .from('properties')
      .select('id')
      .eq('owner_id', userId)
      .eq('is_deleted', false);

    if (filterPropertyId) propsQuery = propsQuery.eq('id', filterPropertyId);

    const { data: props, error: propsErr } = await propsQuery;
    if (propsErr) throw propsErr;
    const propertyIds = (props ?? []).map((p: any) => p.id);
    if (!propertyIds.length) return res.json({ bookings: [], total: 0 });

    // Build a count-aware query
    let query = supabaseAdmin
      .from('bookings')
      .select('id, user_id, pet_name, owner_name, owner_email, owner_phone, service_name, service_type, checkin, checkout, created_at, status, total_price, property_id, payment_method, reference_number, payment_screenshot_url, vaccine_record_url, med_cert_url', { count: 'exact' })
      .in('property_id', propertyIds)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (service) query = query.eq('service_type', service);

    const offset = (page - 1) * limit;
    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    // Collect user IDs from bookings that are missing email/phone so we can fill from profiles
    const missingInfoUserIds = Array.from(new Set(
      (data ?? [])
        .filter((b: any) => !b.owner_email || !b.owner_phone)
        .map((b: any) => b.user_id)
        .filter(Boolean)
    ));

    const profileMap = new Map<string, { email: string; phone: string }>();
    if (missingInfoUserIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, phone')
        .in('id', missingInfoUserIds);
      for (const p of profiles ?? []) {
        profileMap.set(String(p.id), { email: p.email || '', phone: p.phone || '' });
      }
    }

    // Normalize fields to match frontend expectations
    const normalized = (data ?? []).map((b: any) => {
      const profile = profileMap.get(String(b.user_id));
      return {
        id: b.id,
        pet_name: b.pet_name,
        owner_name: b.owner_name,
        owner_email: b.owner_email || profile?.email || '',
        owner_phone: b.owner_phone || profile?.phone || '',
        service_name: b.service_name,
        service_type: b.service_type,
        checkin: b.checkin,
        checkout: b.checkout,
        created_at: b.created_at,
        status: b.status,
        total_price: b.total_price,
        property_id: b.property_id,
        payment_method: b.payment_method,
        reference_number: b.reference_number,
        payment_screenshot_url: b.payment_screenshot_url,
        vaccine_record_url: b.vaccine_record_url,
        med_cert_url: b.med_cert_url,
      };
    });

    const mediaRefs = normalized.flatMap((booking: any) => collectBookingMediaRefs(booking));
    const signedMap = await batchSignStorageRefs(mediaRefs);
    const signedBookings = normalized.map((booking: any) => signBookingMedia(booking, signedMap));

    return res.json({ bookings: signedBookings, total: Number(count ?? signedBookings.length) });
  } catch (err: any) {
    console.error('listBookingsForOwner error:', err);
    return res.status(500).json({ error: 'Failed to list bookings.' });
  }
};

/** GET /api/bookings/mine/:id — get a single booking detail for the owner (with images) */
export const getBookingForOwner = async (req: any, res: any) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const bookingId = req.params.id;
    if (!bookingId) return res.status(400).json({ error: 'Missing booking ID' });

    // Get the owner's property IDs
    const { data: props, error: propsErr } = await supabaseAdmin
      .from('properties')
      .select('id')
      .eq('owner_id', userId)
      .eq('is_deleted', false);
    if (propsErr) throw propsErr;
    const propertyIds = (props ?? []).map((p: any) => p.id);
    if (!propertyIds.length) return res.status(404).json({ error: 'Booking not found' });

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .in('property_id', propertyIds)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) throw error;
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const mediaRefs = collectBookingMediaRefs(booking);
    const signedMap = await batchSignStorageRefs(mediaRefs);

    return res.json(signBookingMedia(booking, signedMap));
  } catch (err: any) {
    console.error('getBookingForOwner error:', err);
    return res.status(500).json({ error: 'Failed to get booking.' });
  }
};

/** POST /api/bookings/:id/status — owner can change booking status (confirm/complete/cancel) */
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
      .select('id, property_id, status, user_id, payment_method, payment_status, service_name, service_type, checkin, total_price')
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
    const allowed = ['confirmed', 'completed', 'cancelled'];
    if (!allowed.includes(newStatus)) return res.status(400).json({ error: 'Invalid status' });

    const updateData: Record<string, any> = { status: newStatus };

    // Business rule: cash bookings become paid once proprietor confirms.
    if (
      (newStatus === 'confirmed' || newStatus === 'completed') &&
      booking.payment_method === 'cash' &&
      (!booking.payment_status || booking.payment_status === 'unpaid')
    ) {
      updateData.payment_status = 'paid';
      updateData.paid_at = new Date().toISOString();
    }

    const { data: updated, error: updErr } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single();

    if (updErr) throw updErr;

    try {
      const svcLabel = booking.service_name || booking.service_type || 'your service';
      const dateStr = new Date(booking.checkin).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const STATUS_NOTIF: Record<string, { type: string; title: string; message: string }> = {
        confirmed: {
          type: 'booking_confirmed',
          title: 'Booking Confirmed',
          message: `Your booking for ${svcLabel} on ${dateStr} has been confirmed.`,
        },
        completed: {
          type: 'system',
          title: 'Booking Completed',
          message: `Your booking for ${svcLabel} on ${dateStr} has been marked as completed.`,
        },
        cancelled: {
          type: 'booking_cancelled',
          title: 'Booking Cancelled',
          message: `Your booking for ${svcLabel} on ${dateStr} has been cancelled.`,
        },
      };

      const notif = STATUS_NOTIF[newStatus];
      if (notif) {
        await notificationModel.create({
          user_id: booking.user_id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          link: '/my-bookings',
          reference_id: bookingId,
          reference_type: 'booking',
        });
      }

      if (updateData.payment_status === 'paid') {
        await notificationModel.create({
          user_id: booking.user_id,
          type: 'payment_received',
          title: 'Payment Confirmed',
          message: `Your cash payment of ₱${Number(booking.total_price || 0).toFixed(2)} has been marked as paid.`,
          link: '/my-bookings',
          reference_id: bookingId,
          reference_type: 'booking',
        });
      }
    } catch (notifErr) {
      console.error('Failed to create owner status-change notification:', notifErr);
    }

    return res.json({ booking: updated });
  } catch (err: any) {
    console.error('updateBookingStatusForOwner error:', err);
    return res.status(500).json({ error: 'Failed to update booking status.' });
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
      // Appointment: check service-level capacity for grooming/vet first, then property-level
      const { data: appointmentServices } = await supabaseAdmin
        .from("property_services")
        .select("capacity")
        .eq("property_id", resolvedPropertyId)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .in("category", ["Grooming", "Veterinary"]);

      if (appointmentServices && appointmentServices.length > 0) {
        capacity = appointmentServices.reduce((sum: number, s: any) => sum + (s.capacity ?? 1), 0);
      } else {
        const { data: prop } = await supabaseAdmin
          .from("properties")
          .select("capacity")
          .eq("id", resolvedPropertyId)
          .single();
        capacity = prop?.capacity ?? 5;
      }
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

    // ── Server-side price verification ──
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

    const uploadBase = `bookings/${userId}/${Date.now()}`;
    const vaccineParsed = parseDocumentField(vaccine_record_url ?? null).values;
    const medParsed = parseDocumentField(med_cert_url ?? null).values;

    const uploadedVaccineDocs: string[] = [];
    for (let idx = 0; idx < vaccineParsed.length; idx += 1) {
      const source = vaccineParsed[idx];
      if (!source) continue;
      if (/^data:/i.test(source)) {
        const uploadedPath = await uploadDataUrlToBucket(
          source,
          BOOKING_DOCUMENT_BUCKET,
          `${uploadBase}/vaccine-${idx + 1}`
        );
        if (uploadedPath) uploadedVaccineDocs.push(uploadedPath);
      } else {
        uploadedVaccineDocs.push(source);
      }
    }

    const uploadedMedDocs: string[] = [];
    for (let idx = 0; idx < medParsed.length; idx += 1) {
      const source = medParsed[idx];
      if (!source) continue;
      if (/^data:/i.test(source)) {
        const uploadedPath = await uploadDataUrlToBucket(
          source,
          BOOKING_DOCUMENT_BUCKET,
          `${uploadBase}/medical-${idx + 1}`
        );
        if (uploadedPath) uploadedMedDocs.push(uploadedPath);
      } else {
        uploadedMedDocs.push(source);
      }
    }

    let uploadedPaymentProof: string | null = payment_screenshot_url || null;
    if (uploadedPaymentProof && /^data:/i.test(uploadedPaymentProof)) {
      uploadedPaymentProof = await uploadDataUrlToBucket(
        uploadedPaymentProof,
        BOOKING_PAYMENT_BUCKET,
        `${uploadBase}/payment-proof`
      );
    }

    const finalVaccineRecordUrl = toDocFieldValue(uploadedVaccineDocs);
    const finalMedCertUrl = toDocFieldValue(uploadedMedDocs);

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
          med_cert_url: finalMedCertUrl,
          vaccine_record_url: finalVaccineRecordUrl,
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
          reference_number: reference_number || null,
          payment_screenshot_url: uploadedPaymentProof,
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
        type: "info",
        title: "Booking Submitted",
        message: `Your booking for ${svcLabel} on ${new Date(checkin).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} has been submitted and is awaiting confirmation.`,
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
          type: "payment_received",
          title: "New Booking — Action Required",
          message: `A new booking for ${svcLabel} at ${property.name || "your property"} on ${new Date(checkin).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} needs confirmation.`,
          link: "/admin/bookings",
          reference_id: booking.id,
          reference_type: "booking",
        });
      }
    } catch (notifErr) {
      console.error("Failed to create owner notification:", notifErr);
    }

    // ── Notify super admins for high-value bookings (> PHP 500) ──
    try {
      if ((finalTotalPrice ?? 0) > 500) {
        const superAdmins = await getSuperAdminRecipients();
        const { data: property } = await supabaseAdmin
          .from("properties")
          .select("name")
          .eq("id", resolvedPropertyId)
          .single();

        for (const admin of superAdmins) {
          await notificationModel.create({
            user_id: admin.id,
            type: "system",
            title: "High-Value Booking Alert",
            message: `A high-value booking worth PHP ${Number(finalTotalPrice).toFixed(2)} was created for ${property?.name || "a property"}.`,
            link: "/superadmin",
            reference_id: booking.id,
            reference_type: "booking",
          });
        }
      }
    } catch (notifErr) {
      console.error("Failed to create high-value booking notifications:", notifErr);
    }

    return res.status(201).json({ booking });
  } catch (err: any) {
    console.error("createBooking error:", err);
    return res.status(500).json({ error: "Failed to create booking.", details: err?.message || err });
  }
};

/** GET /api/bookings/:id/payment-status — check payment status of a booking */
export const checkPaymentStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const bookingId = req.params.id as string;
    if (!bookingId) return res.status(400).json({ error: "Missing booking id" });

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select("id, property_id, service_name, service_type, checkin, payment_status, payment_method, total_price, paid_at, status")
      .eq("id", bookingId)
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    if (!booking) return res.status(404).json({ error: "Booking not found." });

    const shouldAutoSettleCash =
      booking.payment_method === "cash" &&
      (!booking.payment_status || booking.payment_status === "unpaid") &&
      ["confirmed", "completed", "checked_in", "checked_out"].includes(booking.status);

    if (shouldAutoSettleCash) {
      const nowIso = new Date().toISOString();
      const { error: settleErr } = await supabaseAdmin
        .from("bookings")
        .update({ payment_status: "paid", paid_at: nowIso })
        .eq("id", bookingId)
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .eq("payment_method", "cash")
        .or("payment_status.is.null,payment_status.eq.unpaid");

      if (!settleErr) {
        booking.payment_status = "paid";
        booking.paid_at = nowIso;
      }
    }

    // Notify proprietor when customer checks payment status from My Bookings.
    try {
      const { data: property } = await supabaseAdmin
        .from("properties")
        .select("owner_id, name")
        .eq("id", booking.property_id)
        .single();

      if (property?.owner_id) {
        const svcLabel = booking.service_name || booking.service_type || "a booking";
        const statusLabel = booking.payment_status === "paid"
          ? "paid"
          : booking.payment_status === "partially_refunded"
            ? "partially refunded"
            : booking.payment_status || "unpaid";

        await notificationModel.create({
          user_id: property.owner_id,
          type: "info",
          title: "Customer Checked Payment",
          message: `A customer checked payment status for ${svcLabel} (${new Date(booking.checkin).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}). Current status: ${statusLabel}.`,
          link: "/admin/bookings",
          reference_id: booking.id,
          reference_type: "booking",
        });
      }
    } catch (notifErr) {
      console.error("Failed to create check-payment notification:", notifErr);
    }

    return res.json({
      id: booking.id,
      payment_status: booking.payment_status,
      payment_method: booking.payment_method,
      total_price: booking.total_price,
      paid_at: booking.paid_at,
      booking_status: booking.status,
    });
  } catch (err: any) {
    console.error("checkPaymentStatus error:", err);
    return res.status(500).json({ error: "Failed to check payment status." });
  }
};

/** PATCH /api/bookings/admin/:id/payment — update payment status (admin/owner) */
export const adminUpdatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (!["admin", "proprietor", "super_admin"].includes(userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const bookingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!bookingId) return res.status(400).json({ error: "Missing booking id" });

    const { payment_status } = req.body;
    const validStatuses = ["unpaid", "paid", "refunded", "partially_refunded"];
    if (!payment_status || !validStatuses.includes(payment_status)) {
      return res.status(400).json({ error: `Invalid payment_status. Must be one of: ${validStatuses.join(", ")}` });
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

    const updateData: Record<string, any> = { payment_status };
    if (payment_status === "paid") {
      updateData.paid_at = new Date().toISOString();
    }

    const { data: updated, error } = await supabaseAdmin
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId)
      .select()
      .single();

    if (error) throw error;

    // Notify customer about payment status change
    try {
      const { data: bookingData } = await supabaseAdmin
        .from("bookings")
        .select("user_id, service_name, service_type")
        .eq("id", bookingId)
        .single();

      if (bookingData?.user_id) {
        const svcLabel = bookingData.service_name || bookingData.service_type || "your service";
        const statusLabel = payment_status === "paid" ? "confirmed" : payment_status === "refunded" ? "refunded" : payment_status;

        await notificationModel.create({
          user_id: bookingData.user_id,
          type: payment_status === "paid" ? "payment_received" : "info",
          title: `Payment ${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}`,
          message: `Your payment for ${svcLabel} has been marked as ${statusLabel}.`,
          link: "/my-bookings",
          reference_id: bookingId,
          reference_type: "booking",
        });
      }
    } catch (notifErr) {
      console.error("Failed to create payment notification:", notifErr);
    }

    return res.json({ booking: updated });
  } catch (err: any) {
    console.error("adminUpdatePaymentStatus error:", err);
    return res.status(500).json({ error: "Failed to update payment status.", details: err?.message || err });
  }
};

/** GET /api/bookings — list user's bookings */
export const listBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const bookings = await bookingModel.getByUser(userId);

    const shouldSettle = (bookings ?? []).filter(
      (b: any) =>
        b.payment_method === "cash" &&
        (!b.payment_status || b.payment_status === "unpaid") &&
        ["confirmed", "completed", "checked_in", "checked_out"].includes(b.status)
    );

    if (shouldSettle.length > 0) {
      const ids = shouldSettle.map((b: any) => b.id);
      const nowIso = new Date().toISOString();

      await supabaseAdmin
        .from("bookings")
        .update({ payment_status: "paid", paid_at: nowIso })
        .in("id", ids)
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .eq("payment_method", "cash")
        .or("payment_status.is.null,payment_status.eq.unpaid");

      for (const b of bookings as any[]) {
        if (ids.includes(b.id)) {
          b.payment_status = "paid";
          b.paid_at = nowIso;
        }
      }
    }

    const mediaRefs = (bookings ?? []).flatMap((booking: any) => collectBookingMediaRefs(booking));
    const signedMap = await batchSignStorageRefs(mediaRefs);
    const signedBookings = (bookings ?? []).map((booking: any) => signBookingMedia(booking, signedMap));

    return res.json({ bookings: signedBookings });
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

    const mediaRefs = collectBookingMediaRefs(booking);
    const signedMap = await batchSignStorageRefs(mediaRefs);

    return res.json({ booking: signBookingMedia(booking, signedMap) });
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

    const capacityInfo = await bookingModel.getCapacityForDate(propertyId, date);
    const slotCounts = await bookingModel.getSlotCountsForDate(propertyId, date);

    // All time slots
    const allSlots = ["9:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

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
      slotsRemaining: Object.fromEntries(
        allSlots.map((slot) => [slot, Math.max(0, capacityInfo.capacity - (slotCounts[slot] || 0))])
      ),
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

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
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

    const updated = await bookingModel.updateStatus(bookingId, status, {
      autoMarkPaidOnConfirm: true,
      autoMarkCashPaidOnComplete: true,
    });

    // ── Notify the customer about the status change ──
    try {
      // Fetch the full booking to get user_id and service info
      const { data: bookingData } = await supabaseAdmin
        .from('bookings')
        .select('user_id, service_name, service_type, checkin, property_id')
        .eq('id', bookingId)
        .single();

      if (bookingData?.user_id) {
        const svcLabel = bookingData.service_name || bookingData.service_type || 'your service';
        const dateStr = new Date(bookingData.checkin).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const STATUS_NOTIF: Record<string, { type: string; title: string; message: string }> = {
          confirmed:   { type: 'booking_confirmed',  title: 'Booking Confirmed',  message: `Your booking for ${svcLabel} on ${dateStr} has been confirmed.` },
          completed:   { type: 'booking_completed',  title: 'Booking Completed',  message: `Your booking for ${svcLabel} on ${dateStr} has been marked as completed.` },
          cancelled:   { type: 'booking_cancelled',  title: 'Booking Cancelled',   message: `Your booking for ${svcLabel} on ${dateStr} has been cancelled.` },
        };

        const notif = STATUS_NOTIF[status];
        if (notif) {
          await notificationModel.create({
            user_id: bookingData.user_id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            link: '/my-bookings',
            reference_id: bookingId,
            reference_type: 'booking',
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to create admin status-change notification:', notifErr);
    }

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

const loadFinalizedBookings = async () => {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id, property_id, service_fee, service_type, finalized_at, status, payment_status, payment_method, checkin, checkout, pet_name, created_at")
    .eq("is_deleted", false)
    .in("status", ["completed", "checked_out"])
    .neq("payment_status", "refunded")
    .not("finalized_at", "is", null)
    .limit(100000);

  if (error) throw error;
  return data ?? [];
};

export const getTotalRevenue = async (_req: Request, res: Response) => {
  try {
    const bookings = await loadFinalizedBookings();
    const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (parseFloat(b.service_fee) || 0), 0);
    return res.json({ totalRevenue: Math.round(totalRevenue * 100) / 100, currency: "PHP" });
  } catch (err: any) {
    console.error("getTotalRevenue error:", err);
    return res.status(500).json({ error: "Failed to fetch total revenue.", details: err?.message || err });
  }
};

export const getRevenueByServiceType = async (_req: Request, res: Response) => {
  try {
    const bookings = await loadFinalizedBookings();
    const map = new Map<string, { revenue: number; count: number }>();

    bookings.forEach((b: any) => {
      const key = b.service_type || "other";
      const row = map.get(key) || { revenue: 0, count: 0 };
      row.revenue += parseFloat(b.service_fee) || 0;
      row.count += 1;
      map.set(key, row);
    });

    const breakdown = Array.from(map.entries())
      .map(([serviceType, value]) => ({
        serviceType,
        revenue: Math.round(value.revenue * 100) / 100,
        count: value.count,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return res.json({ breakdown, currency: "PHP" });
  } catch (err: any) {
    console.error("getRevenueByServiceType error:", err);
    return res.status(500).json({ error: "Failed to fetch service-type revenue.", details: err?.message || err });
  }
};

export const getRevenueByProperty = async (_req: Request, res: Response) => {
  try {
    const bookings = await loadFinalizedBookings();
    const propertyIds = [...new Set(bookings.map((b: any) => b.property_id).filter(Boolean))];

    const { data: properties, error: propsErr } = await supabaseAdmin
      .from("properties")
      .select("id, name")
      .in("id", propertyIds.length ? propertyIds : ["00000000-0000-0000-0000-000000000000"]);
    if (propsErr) throw propsErr;

    const propNameMap = new Map((properties ?? []).map((p: any) => [p.id, p.name]));
    const agg = new Map<string, { revenue: number; count: number }>();

    bookings.forEach((b: any) => {
      const key = b.property_id;
      const row = agg.get(key) || { revenue: 0, count: 0 };
      row.revenue += parseFloat(b.service_fee) || 0;
      row.count += 1;
      agg.set(key, row);
    });

    const breakdown = Array.from(agg.entries())
      .map(([propertyId, value]) => ({
        propertyId,
        propertyName: propNameMap.get(propertyId) || "Unknown Property",
        revenue: Math.round(value.revenue * 100) / 100,
        count: value.count,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return res.json({ breakdown, currency: "PHP" });
  } catch (err: any) {
    console.error("getRevenueByProperty error:", err);
    return res.status(500).json({ error: "Failed to fetch property revenue.", details: err?.message || err });
  }
};

export const getRevenueByLocation = async (_req: Request, res: Response) => {
  try {
    const bookings = await loadFinalizedBookings();
    const propertyIds = [...new Set(bookings.map((b: any) => b.property_id).filter(Boolean))];

    const { data: properties, error: propsErr } = await supabaseAdmin
      .from("properties")
      .select("id, city")
      .in("id", propertyIds.length ? propertyIds : ["00000000-0000-0000-0000-000000000000"]);
    if (propsErr) throw propsErr;

    const cityMap = new Map((properties ?? []).map((p: any) => [p.id, p.city || "Unknown City"]));
    const agg = new Map<string, { revenue: number; count: number }>();

    bookings.forEach((b: any) => {
      const city = cityMap.get(b.property_id) || "Unknown City";
      const row = agg.get(city) || { revenue: 0, count: 0 };
      row.revenue += parseFloat(b.service_fee) || 0;
      row.count += 1;
      agg.set(city, row);
    });

    const breakdown = Array.from(agg.entries())
      .map(([city, value]) => ({
        city,
        revenue: Math.round(value.revenue * 100) / 100,
        count: value.count,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return res.json({ breakdown, currency: "PHP" });
  } catch (err: any) {
    console.error("getRevenueByLocation error:", err);
    return res.status(500).json({ error: "Failed to fetch location revenue.", details: err?.message || err });
  }
};

export const getRevenueByTimePeriod = async (_req: Request, res: Response) => {
  try {
    const bookings = await loadFinalizedBookings();
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(dayStart);
    weekStart.setDate(dayStart.getDate() - dayStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const sumSince = (start: Date) =>
      bookings
        .filter((b: any) => new Date(b.finalized_at).getTime() >= start.getTime())
        .reduce((sum: number, b: any) => sum + (parseFloat(b.service_fee) || 0), 0);

    const countSince = (start: Date) =>
      bookings.filter((b: any) => new Date(b.finalized_at).getTime() >= start.getTime()).length;

    return res.json({
      daily: {
        revenue: Math.round(sumSince(dayStart) * 100) / 100,
        count: countSince(dayStart),
        period: "Today",
      },
      weekly: {
        revenue: Math.round(sumSince(weekStart) * 100) / 100,
        count: countSince(weekStart),
        period: "This Week",
      },
      monthly: {
        revenue: Math.round(sumSince(monthStart) * 100) / 100,
        count: countSince(monthStart),
        period: "This Month",
      },
      currency: "PHP",
    });
  } catch (err: any) {
    console.error("getRevenueByTimePeriod error:", err);
    return res.status(500).json({ error: "Failed to fetch revenue by period.", details: err?.message || err });
  }
};

export const getRevenuePeriodComparison = async (_req: Request, res: Response) => {
  try {
    const bookings = await loadFinalizedBookings();
    const now = new Date();

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
    const prevQuarterStart = new Date(now.getFullYear(), quarterStartMonth - 3, 1);

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);

    const sumInRange = (start: Date, end: Date) =>
      bookings
        .filter((b: any) => {
          const t = new Date(b.finalized_at).getTime();
          return t >= start.getTime() && t < end.getTime();
        })
        .reduce((sum: number, b: any) => sum + (parseFloat(b.service_fee) || 0), 0);

    const calc = (current: number, previous: number) => {
      if (!previous) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const monthlyCurrent = sumInRange(monthStart, now);
    const monthlyPrevious = sumInRange(prevMonthStart, monthStart);
    const quarterlyCurrent = sumInRange(quarterStart, now);
    const quarterlyPrevious = sumInRange(prevQuarterStart, quarterStart);
    const yearlyCurrent = sumInRange(yearStart, now);
    const yearlyPrevious = sumInRange(prevYearStart, yearStart);

    return res.json({
      monthly: {
        current: Math.round(monthlyCurrent * 100) / 100,
        previous: Math.round(monthlyPrevious * 100) / 100,
        percentageChange: Math.round(calc(monthlyCurrent, monthlyPrevious) * 100) / 100,
        period: "Month vs Previous Month",
      },
      quarterly: {
        current: Math.round(quarterlyCurrent * 100) / 100,
        previous: Math.round(quarterlyPrevious * 100) / 100,
        percentageChange: Math.round(calc(quarterlyCurrent, quarterlyPrevious) * 100) / 100,
        period: "Quarter vs Previous Quarter",
      },
      yearly: {
        current: Math.round(yearlyCurrent * 100) / 100,
        previous: Math.round(yearlyPrevious * 100) / 100,
        percentageChange: Math.round(calc(yearlyCurrent, yearlyPrevious) * 100) / 100,
        period: "Year vs Previous Year",
      },
      currency: "PHP",
    });
  } catch (err: any) {
    console.error("getRevenuePeriodComparison error:", err);
    return res.status(500).json({ error: "Failed to fetch revenue comparison.", details: err?.message || err });
  }
};

export const getRevenueMonthlySeries = async (_req: Request, res: Response) => {
  try {
    const bookings = await loadFinalizedBookings();
    const now = new Date();
    const months = Array.from({ length: 12 }).map((_, index) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        revenue: 0,
      };
    });

    const monthMap = new Map(months.map((m) => [m.key, m]));
    bookings.forEach((b: any) => {
      const d = new Date(b.finalized_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const row = monthMap.get(key);
      if (row) row.revenue += parseFloat(b.service_fee) || 0;
    });

    const series = months.map((m) => ({
      year: m.year,
      month: m.month,
      label: m.label,
      revenue: Math.round(m.revenue * 100) / 100,
    }));

    return res.json({ series, currency: "PHP" });
  } catch (err: any) {
    console.error("getRevenueMonthlySeries error:", err);
    return res.status(500).json({ error: "Failed to fetch monthly revenue series.", details: err?.message || err });
  }
};

export const getReceivables = async (req: Request, res: Response) => {
  try {
    const { status = "all", search = "", sort = "amount_desc" } = req.query as Record<string, string>;

    let bookingsQuery = supabaseAdmin
      .from("bookings")
      .select("id, property_id, service_fee, status, payment_status, payment_method, service_type, pet_name, checkin, checkout, created_at, finalized_at")
      .eq("is_deleted", false)
      .neq("payment_status", "refunded")
      .not("finalized_at", "is", null)
      .limit(100000);

    if (status && status !== "all") {
      bookingsQuery = bookingsQuery.eq("status", status);
    } else {
      bookingsQuery = bookingsQuery.in("status", ["completed", "checked_out"]);
    }

    const { data: bookings, error: bookingsErr } = await bookingsQuery;
    if (bookingsErr) throw bookingsErr;

    const propertyIds = [...new Set((bookings ?? []).map((b: any) => b.property_id).filter(Boolean))];
    if (propertyIds.length === 0) {
      return res.json({
        summary: { totalPayables: 0, totalSettled: 0, outstandingPayables: 0, propertiesWithBalance: 0 },
        properties: [],
      });
    }

    const { data: properties, error: propsErr } = await supabaseAdmin
      .from("properties")
      .select("id, name, owner_id")
      .in("id", propertyIds)
      .eq("is_deleted", false);
    if (propsErr) throw propsErr;

    const ownerIds = [...new Set((properties ?? []).map((p: any) => p.owner_id).filter(Boolean))];
    const { data: owners, error: ownersErr } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", ownerIds.length ? ownerIds : ["00000000-0000-0000-0000-000000000000"]);
    if (ownersErr) throw ownersErr;

    const { data: settlements, error: setErr } = await supabaseAdmin
      .from("proprietor_settlements")
      .select("property_id, amount, status")
      .in("property_id", propertyIds)
      .limit(100000);
    if (setErr) throw setErr;

    const propertyMap = new Map((properties ?? []).map((p: any) => [p.id, p]));
    const ownerMap = new Map((owners ?? []).map((o: any) => [o.id, o]));

    const settledByProperty: Record<string, number> = {};
    (settlements ?? []).forEach((s: any) => {
      if (s.status === "completed") {
        settledByProperty[s.property_id] =
          (settledByProperty[s.property_id] || 0) + (parseFloat(s.amount) || 0);
      }
    });

    let rows = propertyIds.map((propertyId) => {
      const prop = propertyMap.get(propertyId);
      const owner = ownerMap.get(prop?.owner_id);
      const propBookings = (bookings ?? []).filter((b: any) => b.property_id === propertyId);
      const totalPayable = propBookings.reduce((sum: number, b: any) => sum + (parseFloat(b.service_fee) || 0), 0);
      const totalSettled = settledByProperty[propertyId] || 0;
      const outstanding = Math.max(0, Math.round((totalPayable - totalSettled) * 100) / 100);

      return {
        propertyId,
        propertyName: prop?.name || "Unknown Property",
        ownerId: prop?.owner_id || null,
        ownerName: [owner?.first_name, owner?.last_name].filter(Boolean).join(" ") || "Unknown Owner",
        ownerEmail: owner?.email || "",
        bookingCount: propBookings.length,
        totalPayable: Math.round(totalPayable * 100) / 100,
        totalSettled: Math.round(totalSettled * 100) / 100,
        outstandingPayable: outstanding,
        oldestFinalized: propBookings
          .map((b: any) => b.finalized_at)
          .filter(Boolean)
          .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime())[0] || null,
        bookings: propBookings.map((b: any) => ({
          id: b.id,
          checkin: b.checkin,
          checkout: b.checkout,
          serviceType: b.service_type,
          paymentMethod: b.payment_method,
          paymentStatus: b.payment_status,
          petName: b.pet_name,
          status: b.status,
          serviceFee: parseFloat(b.service_fee) || 0,
          settledAmount: 0,
          outstandingAmount: parseFloat(b.service_fee) || 0,
          createdAt: b.created_at,
        })),
      };
    });

    if (search?.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.propertyName.toLowerCase().includes(q) ||
          r.ownerName.toLowerCase().includes(q) ||
          r.ownerEmail.toLowerCase().includes(q)
      );
    }

    rows.sort((a: any, b: any) => {
      switch (sort) {
        case "amount_asc":
          return a.outstandingPayable - b.outstandingPayable;
        case "oldest":
          return new Date(a.oldestFinalized || 0).getTime() - new Date(b.oldestFinalized || 0).getTime();
        case "name":
          return a.propertyName.localeCompare(b.propertyName);
        case "amount_desc":
        default:
          return b.outstandingPayable - a.outstandingPayable;
      }
    });

    const summary = {
      totalPayables: Math.round(rows.reduce((s: number, r: any) => s + (r.totalPayable || 0), 0) * 100) / 100,
      totalSettled: Math.round(rows.reduce((s: number, r: any) => s + (r.totalSettled || 0), 0) * 100) / 100,
      outstandingPayables:
        Math.round(rows.reduce((s: number, r: any) => s + (r.outstandingPayable || 0), 0) * 100) / 100,
      propertiesWithBalance: rows.filter((r: any) => r.outstandingPayable > 0).length,
    };

    return res.json({ summary, properties: rows, currency: "PHP" });
  } catch (err: any) {
    console.error("getReceivables error:", err);
    return res.status(500).json({ error: "Failed to fetch receivables.", details: err?.message || err });
  }
};