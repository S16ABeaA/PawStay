import { supabaseAdmin } from "../../config/supabaseAdmin";
import { notificationModel } from "../../models/notificationModel";
import { dispatchPetCareNotificationsForPet } from "../../services/petCareNotificationJobs";
import { backendApiClient } from "../http/backendApiClient";
import { petHealthCheckService } from "../petHealthCheckService";
import { TOOL_INPUT_SCHEMA_TEXT } from "../schemas";
import { ToolContext, ToolDefinition } from "../types";
import { cancelBookingTool } from "./cancelBooking";
import { checkAvailabilityTool } from "./checkAvailability";
import { createBookingTool } from "./createBooking";
import { getBookingSummaryTool } from "./getBookingSummary";
import { getCancellationPolicyTool } from "./getCancellationPolicy";
import { getUserBookingsTool } from "./getUserBookings";
import { getPropertyServicesTool } from "./discovery/getPropertyServices";
import { searchServicesTool } from "./discovery/searchServices";
import { getPetProfileTool } from "./pets/getPetProfile";
import { getPetServiceHistoryTool } from "./pets/getPetServiceHistory";
import { predictNextBookingTool } from "./pets/predictNextBooking";

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

const asString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
};

const asNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const asBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  const text = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(text)) return true;
  if (["false", "0", "no", "off"].includes(text)) return false;
  return undefined;
};

const asStringArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) {
    const list = value.map((item) => String(item).trim()).filter(Boolean);
    return list.length > 0 ? list : undefined;
  }
  const text = String(value).trim();
  if (!text) return undefined;
  if (text.includes(",")) {
    const list = text
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return list.length > 0 ? list : undefined;
  }
  return [text];
};

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const normalizeUserType = (role: string | undefined): "pet_owner" | "business_owner" | "unknown" => {
  const value = String(role || "").toLowerCase();
  if (["proprietor", "admin", "super_admin"].includes(value)) return "business_owner";
  if (["customer", "user", "pet_owner"].includes(value)) return "pet_owner";
  return "unknown";
};

const normalizeServiceType = (value: string | undefined): string | undefined => {
  const text = String(value || "").trim().toLowerCase();
  if (!text || ["all", "any", "everything"].includes(text)) return undefined;
  if (["vet", "veterinary", "clinic", "health"].includes(text)) return "vet";
  if (["grooming", "groom", "spa"].includes(text)) return "grooming";
  if (["hotel", "boarding", "accommodation", "stay"].includes(text)) return "hotel";
  return text;
};

const toIsoDate = (value: unknown): string | undefined => {
  const text = asString(value);
  if (!text) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
};

const toIsoDateTime = (value: unknown): string | undefined => {
  const text = asString(value);
  if (!text) return undefined;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

const decodeImageBase64ToBuffer = (
  value: unknown,
): { buffer: Buffer; mimeType: string } | null => {
  const input = String(value || "").trim();
  if (!input) return null;

  const dataUrl = input.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i);
  if (dataUrl) {
    return {
      mimeType: String(dataUrl[1] || "image/jpeg").toLowerCase(),
      buffer: Buffer.from(dataUrl[2], "base64"),
    };
  }

  return {
    mimeType: "image/jpeg",
    buffer: Buffer.from(input, "base64"),
  };
};

const getLatestPetHealthRecordForOwner = async (petId: string, ownerId?: string) => {
  if (!petId || !ownerId) return null;

  const { data, error } = await supabaseAdmin
    .from("pet_health_records")
    .select("pet_id, created_at, validation_status, compiled_record, metadata")
    .eq("pet_id", petId)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const toDayName = (dayIndex: number): string => {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return names[dayIndex] || "Unknown";
};

const toServiceDemandLabel = (raw: string): string => {
  const value = String(raw || "").toLowerCase();
  if (value.includes("vet") || value.includes("vaccin") || value.includes("checkup")) return "veterinary";
  if (value.includes("groom")) return "grooming";
  if (value.includes("board") || value.includes("hotel")) return "boarding";
  return value || "other";
};

interface CurrentUserProfile {
  id: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  email?: string;
  phone?: string;
}

const getCurrentUserProfile = async (context?: ToolContext): Promise<CurrentUserProfile | null> => {
  if (!context?.authToken) return null;

  try {
    const response = await backendApiClient.request<any>("/api/auth/profile", {
      method: "GET",
      authToken: context.authToken,
    });

    const user = response?.user ?? response;
    const id = asString(user?.id);
    if (!id) return null;

    return {
      id,
      role: asString(user?.role),
      first_name: asString(user?.first_name),
      last_name: asString(user?.last_name),
      address: asString(user?.address),
      email: asString(user?.email),
      phone: asString(user?.phone),
    };
  } catch {
    return null;
  }
};

const resolveActorUserId = async (context?: ToolContext, preferredUserId?: string): Promise<string | undefined> => {
  const direct = asString(preferredUserId) || asString(context?.userId);
  if (direct) return direct;

  const profile = await getCurrentUserProfile(context);
  return profile?.id;
};

const inferPeakTrafficMultiplier = (date: Date): number => {
  const hour = date.getHours();
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;

  if (!isWeekend && ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20))) return 1.5;
  if (!isWeekend && ((hour >= 11 && hour <= 16) || (hour >= 21 && hour <= 22))) return 1.25;
  if (isWeekend && hour >= 10 && hour <= 20) return 1.2;
  return 1.0;
};

const haversineKm = (
  originLat: number,
  originLng: number,
  destinationLat: number,
  destinationLng: number,
): number => {
  const R = 6371;
  const dLat = ((destinationLat - originLat) * Math.PI) / 180;
  const dLng = ((destinationLng - originLng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((originLat * Math.PI) / 180) *
      Math.cos((destinationLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

interface ParsedLocation {
  name: string;
  lat: number;
  lng: number;
}

const geocodeSingle = async (query: string): Promise<ParsedLocation | null> => {
  const response = await backendApiClient.request<any>("/api/location/search", {
    method: "GET",
    query: { q: query },
  });

  const locations = Array.isArray(response?.locations) ? response.locations : [];
  const first = locations[0];
  const lat = asNumber(first?.lat);
  const lng = asNumber(first?.lng);
  const name = asString(first?.name);

  if (!name || lat === undefined || lng === undefined) return null;
  return { name, lat, lng };
};

const summarizeSentiment = (texts: string[]): { sentiment: string; score: number } => {
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "friendly",
    "clean",
    "recommend",
    "love",
    "amazing",
    "helpful",
    "sulit",
    "maayos",
  ];
  const negativeWords = [
    "bad",
    "late",
    "dirty",
    "poor",
    "rude",
    "expensive",
    "worst",
    "hassle",
    "problem",
    "delay",
    "hindi",
  ];

  let score = 0;
  for (const text of texts) {
    const content = String(text || "").toLowerCase();
    for (const word of positiveWords) {
      if (content.includes(word)) score += 1;
    }
    for (const word of negativeWords) {
      if (content.includes(word)) score -= 1;
    }
  }

  if (score >= 3) return { sentiment: "positive", score };
  if (score <= -3) return { sentiment: "negative", score };
  return { sentiment: "mixed", score };
};

const createSimpleNotification = async (input: {
  userId: string;
  title: string;
  message: string;
  type?: "booking_reminder" | "system" | "info";
  link?: string;
  referenceId?: string;
  referenceType?: "booking" | "property" | "review" | "pet" | "support_ticket";
}) => {
  const referenceId = asString(input.referenceId);
  const safeReferenceId = referenceId && isUuid(referenceId) ? referenceId : undefined;

  const allowedReferenceTypes = new Set(["booking", "property", "review"]);
  const referenceType =
    input.referenceType && allowedReferenceTypes.has(input.referenceType)
      ? input.referenceType
      : undefined;

  return notificationModel.create({
    user_id: input.userId,
    type: input.type || "system",
    title: input.title,
    message: input.message,
    link: asString(input.link),
    reference_id: safeReferenceId,
    reference_type: referenceType,
  });
};

const queryAreaBookings = async (location: string | undefined, days: number) => {
  const safeDays = Math.max(1, Math.min(365, Number(days) || 30));
  const since = new Date(Date.now() - safeDays * MS_PER_DAY).toISOString();

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id, created_at, service_type, property_id, properties!inner(city, property_type)")
    .eq("is_deleted", false)
    .gte("created_at", since)
    .limit(100000);

  if (error) throw error;

  const rows = (data ?? []).filter((row: any) => {
    if (!location) return true;
    const city = asString((row as any)?.properties?.city) || "";
    return city.toLowerCase().includes(location.toLowerCase());
  });

  return { rows, safeDays };
};

const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed", "checked_in"] as const;

const toBookingServiceTypeFromCategory = (category?: string | null): string | undefined => {
  const value = String(category || "").trim().toLowerCase();
  if (!value) return undefined;
  if (value.includes("board")) return "boarding";
  if (value.includes("vet")) return "veterinary";
  if (value.includes("groom")) return "grooming";
  if (value.includes("daycare")) return "daycare";
  if (value.includes("transport")) return "transport";
  return value;
};

const addDaysToIsoDate = (isoDate: string, days: number): string => {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const diffNights = (checkin?: string | null, checkout?: string | null): number => {
  const inDate = String(checkin || "").trim();
  const outDate = String(checkout || "").trim();
  if (!inDate || !outDate) return 1;

  const inMs = Date.parse(`${inDate}T00:00:00.000Z`);
  const outMs = Date.parse(`${outDate}T00:00:00.000Z`);
  if (!Number.isFinite(inMs) || !Number.isFinite(outMs)) return 1;

  const days = Math.round((outMs - inMs) / (24 * 60 * 60 * 1000));
  return Math.max(1, days);
};

const getBoardingCapacityForProperty = async (propertyId: string): Promise<number> => {
  const { data: serviceRows, error: serviceErr } = await supabaseAdmin
    .from("property_services")
    .select("capacity")
    .eq("property_id", propertyId)
    .eq("is_active", true)
    .eq("is_deleted", false)
    .eq("category", "Boarding");

  if (serviceErr) throw serviceErr;

  const totalServiceCapacity = (serviceRows || []).reduce(
    (sum: number, row: any) => sum + (Number(row?.capacity) || 0),
    0,
  );
  if (totalServiceCapacity > 0) return totalServiceCapacity;

  const { data: propertyRow, error: propertyErr } = await supabaseAdmin
    .from("properties")
    .select("capacity")
    .eq("id", propertyId)
    .maybeSingle();

  if (propertyErr) throw propertyErr;
  return Number(propertyRow?.capacity || 0) || 5;
};

const hasBoardingCapacity = async (input: {
  propertyId: string;
  checkin: string;
  checkout: string;
  excludeBookingId: string;
}): Promise<boolean> => {
  const { propertyId, checkin, checkout, excludeBookingId } = input;
  const capacity = await getBoardingCapacityForProperty(propertyId);
  if (capacity <= 0) return false;

  const { data: bookings, error } = await supabaseAdmin
    .from("bookings")
    .select("checkin, checkout")
    .eq("property_id", propertyId)
    .eq("is_deleted", false)
    .in("status", [...ACTIVE_BOOKING_STATUSES])
    .neq("id", excludeBookingId)
    .not("checkout", "is", null)
    .lt("checkin", checkout)
    .gt("checkout", checkin);

  if (error) throw error;

  const rows = Array.isArray(bookings) ? bookings : [];
  for (let date = checkin; date < checkout; date = addDaysToIsoDate(date, 1)) {
    const nextDay = addDaysToIsoDate(date, 1);
    const occupied = rows.filter(
      (row: any) => String(row?.checkin || "") < nextDay && String(row?.checkout || "") > date,
    ).length;
    if (occupied >= capacity) {
      return false;
    }
  }

  return true;
};

const getAppointmentCapacityForProperty = async (propertyId: string): Promise<number> => {
  const { data: serviceRows, error: serviceErr } = await supabaseAdmin
    .from("property_services")
    .select("capacity")
    .eq("property_id", propertyId)
    .eq("is_active", true)
    .eq("is_deleted", false)
    .in("category", ["Grooming", "Veterinary"]);

  if (serviceErr) throw serviceErr;

  const totalServiceCapacity = (serviceRows || []).reduce(
    (sum: number, row: any) => sum + (Number(row?.capacity) || 0),
    0,
  );
  if (totalServiceCapacity > 0) return totalServiceCapacity;

  const { data: propertyRow, error: propertyErr } = await supabaseAdmin
    .from("properties")
    .select("capacity")
    .eq("id", propertyId)
    .maybeSingle();

  if (propertyErr) throw propertyErr;
  return Number(propertyRow?.capacity || 0) || 5;
};

const hasAppointmentSlotCapacity = async (input: {
  propertyId: string;
  checkin: string;
  timeSlot: string;
  excludeBookingId: string;
}): Promise<boolean> => {
  const { propertyId, checkin, timeSlot, excludeBookingId } = input;
  const capacity = await getAppointmentCapacityForProperty(propertyId);
  if (capacity <= 0) return false;

  const { data: bookingRows, error } = await supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("property_id", propertyId)
    .eq("checkin", checkin)
    .eq("time_slot", timeSlot)
    .eq("is_deleted", false)
    .in("status", [...ACTIVE_BOOKING_STATUSES])
    .is("checkout", null)
    .neq("id", excludeBookingId);

  if (error) throw error;

  const occupied = Array.isArray(bookingRows) ? bookingRows.length : 0;
  return occupied < capacity;
};

export const searchPropertyTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "search_property",
  description: "Alias of search_services using discovery filters such as location, amenities, rating, and price",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.search_property,
  run: async (args, context?: ToolContext) => {
    return searchServicesTool.run(
      {
        location: asString(args.location),
        service_type: asString(args.service_type),
        checkin: asString(args.checkin),
        checkout: asString(args.checkout),
        timeSlot: asString(args.timeSlot),
        petType: (args.petType as any) ?? (args.pet_type as any),
        dogSize: (args.dogSize as any) ?? (args.dog_size as any),
        propertyType: asString(args.propertyType),
        serviceCategory: asString(args.serviceCategory),
        minPrice: asNumber(args.minPrice),
        maxPrice: asNumber(args.maxPrice),
        rating: asNumber(args.rating),
        amenities: (args.amenities as any) ?? undefined,
        keyword: asString(args.keyword),
        lat: asNumber(args.lat),
        lng: asNumber(args.lng),
        radiusKm: asNumber(args.radiusKm),
      },
      context,
    );
  },
};

export const getNearbyServicesTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "get_nearby_services",
  description: "Find nearby services using location text and/or geo coordinates",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_nearby_services,
  run: async (args, context?: ToolContext) => {
    return searchServicesTool.run(
      {
        location: asString(args.location),
        service_type: asString(args.service_type),
        keyword: asString(args.keyword),
        lat: asNumber(args.lat),
        lng: asNumber(args.lng),
        radiusKm: asNumber(args.radiusKm) || 15,
      },
      context,
    );
  },
};

export const getServiceDetailsTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "get_service_details",
  description: "Get provider business info, pricing, amenities, certifications, and operating details",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_service_details,
  run: async (args, context?: ToolContext) => {
    let propertyId = asString(args.property_id);
    const propertyNameQuery = asString(args.property_name)?.toLowerCase();

    if (!propertyId) {
      const discovery = await getPropertyServicesTool.run(
        {
          service_type: normalizeServiceType(asString(args.service_type)),
          location: asString(args.location),
          keyword: asString(args.keyword),
        },
        context,
      );

      const candidates = Array.isArray((discovery as any)?.properties)
        ? (discovery as any).properties
        : [];

      if (propertyNameQuery) {
        const named = candidates.find((row: any) =>
          String(row?.name || "")
            .toLowerCase()
            .includes(propertyNameQuery),
        );
        propertyId = asString(named?.id);
      }

      if (!propertyId) {
        propertyId = asString(candidates[0]?.id);
      }
    }

    if (!propertyId) {
      return {
        found: false,
        message: "No matching provider found for service details.",
      };
    }

    const [propertyRes, servicesRes, reviewsRes] = await Promise.all([
      backendApiClient.request<any>(`/api/properties/${propertyId}`, { method: "GET" }).catch(() => null),
      backendApiClient
        .request<any>(`/api/properties/${propertyId}/services`, { method: "GET" })
        .catch(() => null),
      backendApiClient
        .request<any>(`/api/properties/${propertyId}/reviews`, { method: "GET" })
        .catch(() => null),
    ]);

    const property = (propertyRes as any)?.property || null;
    const services = Array.isArray((servicesRes as any)?.services) ? (servicesRes as any).services : [];
    const reviews = Array.isArray((reviewsRes as any)?.reviews) ? (reviewsRes as any).reviews : [];

    return {
      found: true,
      property_id: propertyId,
      property_name: asString(property?.name) || asString(args.property_name) || "Unknown provider",
      business_info: property,
      pricing: services.slice(0, 10).map((service: any) => ({
        service_id: asString(service?.id),
        service_name: asString(service?.name) || "Unnamed service",
        category: asString(service?.category),
        price: asNumber(service?.price),
      })),
      amenities: Array.isArray(property?.amenities) ? property.amenities : [],
      certifications: Array.isArray(property?.certifications)
        ? property.certifications
        : Array.isArray(property?.licenses)
          ? property.licenses
          : [],
      hours: property?.hours || property?.business_hours || null,
      average_rating:
        asNumber((reviewsRes as any)?.avgRating) || asNumber(property?.rating) || 0,
      review_count:
        Number((reviewsRes as any)?.total || property?.review_count || reviews.length || 0),
      services,
      message: "Service details retrieved successfully.",
    };
  },
};

export const modifyReservationTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "modify_reservation",
  description: "Modify an existing reservation (reschedule date/time and/or change service)",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.modify_reservation,
  run: async (args, context?: ToolContext) => {
    const actorUserId = await resolveActorUserId(context, asString(args.user_id));
    if (!actorUserId) {
      return {
        modified: false,
        error: "Please log in to modify a reservation.",
      };
    }

    const bookingId = asString(args.booking_id);
    const date = toIsoDate(args.date);
    const time = asString(args.time) || asString(args.time_slot);
    const serviceId = asString(args.service_id);

    if (!bookingId) {
      return {
        modified: false,
        error: "booking_id is required",
      };
    }

    const { data: currentBooking, error: bookingErr } = await supabaseAdmin
      .from("bookings")
      .select("id, user_id, property_id, service_id, service_name, service_type, checkin, checkout, time_slot, status")
      .eq("id", bookingId)
      .eq("user_id", actorUserId)
      .eq("is_deleted", false)
      .maybeSingle();

    if (bookingErr) {
      throw bookingErr;
    }

    if (!currentBooking) {
      return {
        modified: false,
        error: "Booking not found for this user.",
      };
    }

    const bookingStatus = String(currentBooking.status || "").toLowerCase();
    if (["cancelled", "completed", "checked_out", "no_show"].includes(bookingStatus)) {
      return {
        modified: false,
        error: `Booking cannot be modified because it is already ${bookingStatus}.`,
      };
    }

    const summary = await getBookingSummaryTool.run({ booking_id: bookingId }, context);

    if (!date && !time && !serviceId) {
      return {
        modified: false,
        booking_id: bookingId,
        booking_summary: summary,
        message: "Please provide at least one change (date, time, or service_id).",
      };
    }

    const nextCheckin = date || String(currentBooking.checkin || "");
    const currentCheckout = asString(currentBooking.checkout);
    const currentTimeSlot = asString(currentBooking.time_slot);
    const isBoarding = Boolean(currentCheckout);

    let nextCheckout = currentCheckout;
    if (isBoarding && date && currentCheckout) {
      const nights = diffNights(String(currentBooking.checkin || ""), currentCheckout);
      nextCheckout = addDaysToIsoDate(nextCheckin, nights);
    }

    const nextTimeSlot = isBoarding ? null : (time || currentTimeSlot);

    if (!isBoarding && !nextTimeSlot) {
      return {
        modified: false,
        error: "time is required for appointment-type reservations.",
      };
    }

    if (isBoarding && nextCheckout && nextCheckout <= nextCheckin) {
      return {
        modified: false,
        error: "checkout must be after checkin.",
      };
    }

    if (isBoarding && nextCheckout) {
      const available = await hasBoardingCapacity({
        propertyId: String(currentBooking.property_id),
        checkin: nextCheckin,
        checkout: nextCheckout,
        excludeBookingId: bookingId,
      });

      if (!available) {
        return {
          modified: false,
          booking_id: bookingId,
          booking_summary: summary,
          error: "The selected boarding dates are no longer available.",
        };
      }
    }

    if (!isBoarding && nextTimeSlot) {
      const available = await hasAppointmentSlotCapacity({
        propertyId: String(currentBooking.property_id),
        checkin: nextCheckin,
        timeSlot: nextTimeSlot,
        excludeBookingId: bookingId,
      });

      if (!available) {
        return {
          modified: false,
          booking_id: bookingId,
          booking_summary: summary,
          error: `The selected time slot (${nextTimeSlot}) is no longer available.`,
        };
      }
    }

    let nextServiceId = serviceId || asString(currentBooking.service_id) || null;
    let nextServiceName = asString(currentBooking.service_name);
    let nextServiceType = asString(currentBooking.service_type);

    if (serviceId) {
      const { data: serviceRow, error: serviceErr } = await supabaseAdmin
        .from("property_services")
        .select("id, name, category")
        .eq("id", serviceId)
        .eq("property_id", currentBooking.property_id)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .maybeSingle();

      if (serviceErr) {
        throw serviceErr;
      }

      if (!serviceRow) {
        return {
          modified: false,
          booking_id: bookingId,
          booking_summary: summary,
          error: "The selected service is not available for this property.",
        };
      }

      nextServiceId = String(serviceRow.id);
      nextServiceName = asString(serviceRow.name);
      nextServiceType =
        toBookingServiceTypeFromCategory(asString(serviceRow.category)) ||
        nextServiceType;
    }

    const changes: Record<string, unknown> = {
      checkin: nextCheckin,
      service_id: nextServiceId,
      service_name: nextServiceName,
      service_type: nextServiceType,
      updated_at: new Date().toISOString(),
    };

    if (isBoarding) {
      changes.checkout = nextCheckout;
      changes.time_slot = null;
    } else {
      changes.time_slot = nextTimeSlot;
    }

    const { data: updatedBooking, error: updateErr } = await supabaseAdmin
      .from("bookings")
      .update(changes)
      .eq("id", bookingId)
      .eq("user_id", actorUserId)
      .eq("is_deleted", false)
      .select()
      .single();

    if (updateErr) {
      throw updateErr;
    }

    return {
      modified: true,
      booking_id: bookingId,
      booking_summary: await getBookingSummaryTool.run({ booking_id: bookingId }, context),
      booking: updatedBooking,
      requested_changes: {
        date: nextCheckin,
        time: nextTimeSlot,
        service_id: nextServiceId,
      },
      message: "Reservation updated successfully.",
    };
  },
};

export const analyzePetPhotoTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "analyze_pet_photo",
  description: "Analyze pet image signals (breed and visible health cues) or fall back to pet health records",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.analyze_pet_photo,
  run: async (args, context?: ToolContext) => {
    const decoded = decodeImageBase64ToBuffer((args as any).image_base64 ?? (args as any).imageBase64);

    if (decoded && decoded.buffer.length > 0) {
      const analysis = await petHealthCheckService.analyzeImage(decoded.buffer, decoded.mimeType);
      return {
        source: "image",
        analysis,
        message: "Photo analysis completed.",
      };
    }

    const petId = asString(args.pet_id) || asString(args.id);
    if (!petId) {
      return {
        error: "Provide image_base64 or pet_id for analyze_pet_photo.",
      };
    }

    const recordAnalysis = await analyzePetHealthDataTool.run({ pet_id: petId }, context);
    return {
      source: "records",
      pet_id: petId,
      analysis: recordAnalysis,
      message: "Used the latest pet health record because no image payload was provided.",
    };
  },
};

export const getVaccinationRecordsTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "get_vaccination_records",
  description: "Retrieve vaccination history from compiled records, with service-history fallback",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_vaccination_records,
  run: async (args, context?: ToolContext) => {
    const petId = asString(args.pet_id) || asString(args.id);
    const petName = asString(args.pet_name) || asString(args.name);

    if (!petId && !petName) {
      return { error: "pet_id or pet_name is required" };
    }

    if (petId && context?.userId) {
      const latest = await getLatestPetHealthRecordForOwner(petId, context.userId).catch(() => null);
      const extracted = (latest as any)?.compiled_record?.pet_profile?.extracted || {};
      const vaccines = Array.isArray(extracted?.vaccines)
        ? extracted.vaccines.map((row: any) => ({
            name: asString(row?.name) || "Unknown vaccine",
            date: asString(row?.date) || null,
            next_due_date: asString(row?.next_due_date) || null,
            notes: asString(row?.notes) || null,
          }))
        : [];

      if (vaccines.length > 0) {
        return {
          pet_id: petId,
          source: "compiled_record",
          total: vaccines.length,
          vaccines,
          message: "Vaccination records retrieved from compiled diagnostic history.",
        };
      }
    }

    const history = await getPetServiceHistoryTool.run(
      {
        pet_id: petId,
        pet_name: petName,
      },
      context,
    );

    const vaccineHistory = Array.isArray((history as any)?.history)
      ? (history as any).history.filter((row: any) => {
          const notes = String(row?.notes || "").toLowerCase();
          const service = String(row?.serviceName || row?.type || "").toLowerCase();
          return notes.includes("vaccine") || notes.includes("vaccin") || service.includes("vaccin");
        })
      : [];

    return {
      pet: (history as any)?.pet,
      source: "service_history",
      total: vaccineHistory.length,
      records: vaccineHistory,
      message:
        vaccineHistory.length > 0
          ? "Vaccination-related records were found in service history."
          : "No vaccination records were found for this pet yet.",
    };
  },
};

export const extractMedicalDataTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "extract_medical_data",
  description: "Extract structured medical signals from the latest compiled pet diagnostic record",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.extract_medical_data,
  run: async (args, context?: ToolContext) => {
    const petId = asString(args.pet_id) || asString(args.id);
    if (!petId) return { error: "pet_id is required" };

    const latest = await getLatestPetHealthRecordForOwner(petId, context?.userId).catch(() => null);
    if (!latest) {
      return {
        pet_id: petId,
        extracted_data: null,
        message: "No compiled diagnostic record found for this pet.",
      };
    }

    const extracted = (latest as any)?.compiled_record?.pet_profile?.extracted || {};
    return {
      pet_id: petId,
      analyzed_at: (latest as any)?.created_at,
      extracted_data: extracted,
      message: "Structured medical data extracted from the latest diagnostic record.",
    };
  },
};

export const validateRecordAuthenticityTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "validate_record_authenticity",
  description: "Return latest diagnostic validation status and confidence indicators",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.validate_record_authenticity,
  run: async (args, context?: ToolContext) => {
    const petId = asString(args.pet_id) || asString(args.id);
    if (!petId) return { error: "pet_id is required" };

    const latest = await getLatestPetHealthRecordForOwner(petId, context?.userId).catch(() => null);
    if (!latest) {
      return {
        pet_id: petId,
        validation_status: "no_data",
        confidence_score: 0,
        message: "No diagnostic record found to validate.",
      };
    }

    const compiled = (latest as any)?.compiled_record || {};
    const summary = (compiled as any)?.diagnostic_summary || {};

    return {
      pet_id: petId,
      validation_status: asString((latest as any)?.validation_status) || "unknown",
      confidence_score: Number(summary?.overall_confidence_score || 0),
      flagged_fields: Number(summary?.flagged_fields || 0),
      validation: (compiled as any)?.validation || {},
      message: "Record authenticity assessment retrieved.",
    };
  },
};

export const predictGroomingCycleTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "predict_grooming_cycle",
  description: "Predict upcoming grooming needs from pet-care forecast outputs",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.predict_grooming_cycle,
  run: async (args, context?: ToolContext) => {
    const prediction = await generatePetCarePredictionsTool.run(args, context);
    const upcoming = Array.isArray((prediction as any)?.upcoming_needs)
      ? (prediction as any).upcoming_needs
      : [];

    const groomingCycles = upcoming.filter((item: any) => {
      const service = String(item?.service || "").toLowerCase();
      return service.includes("groom");
    });

    return {
      pet: (prediction as any)?.pet,
      grooming_cycle: groomingCycles,
      confidence_level: (prediction as any)?.confidence_level,
      message:
        groomingCycles.length > 0
          ? "Predicted grooming cycle generated from pet-care history."
          : "No strong grooming cycle signal detected yet.",
    };
  },
};

export const predictWellnessMilestonesTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "predict_wellness_milestones",
  description: "Predict wellness milestones from upcoming pet-care needs",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.predict_wellness_milestones,
  run: async (args, context?: ToolContext) => {
    const prediction = await generatePetCarePredictionsTool.run(args, context);
    const upcoming = Array.isArray((prediction as any)?.upcoming_needs)
      ? (prediction as any).upcoming_needs
      : [];

    const milestones = upcoming.map((item: any) => ({
      title: asString(item?.service) || "Care milestone",
      expected_window: asString(item?.suggested_window) || "Not specified",
      likelihood: Number(item?.likelihood || 0),
      rationale: asString(item?.reason) || "Derived from history and profile.",
    }));

    return {
      pet: (prediction as any)?.pet,
      wellness_milestones: milestones,
      confidence_level: (prediction as any)?.confidence_level,
      message: milestones.length
        ? "Wellness milestones generated successfully."
        : "No wellness milestones available yet.",
    };
  },
};

export const compilePetHealthTimelineTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "compile_pet_health_timeline",
  description: "Compile chronological diagnostic history from latest pet record",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.compile_pet_health_timeline,
  run: async (args, context?: ToolContext) => {
    const petId = asString(args.pet_id) || asString(args.id);
    if (!petId) return { error: "pet_id is required" };

    const latest = await getLatestPetHealthRecordForOwner(petId, context?.userId).catch(() => null);
    if (!latest) {
      return {
        pet_id: petId,
        timeline: [],
        message: "No compiled diagnostic record found for timeline generation.",
      };
    }

    const compiled = (latest as any)?.compiled_record || {};
    const timeline = Array.isArray((compiled as any)?.timeline?.timeline)
      ? (compiled as any).timeline.timeline
      : [];

    return {
      pet_id: petId,
      generated_at: (latest as any)?.created_at,
      timeline,
      total_events: timeline.length,
      message:
        timeline.length > 0
          ? "Pet health timeline compiled successfully."
          : "No timeline events were found in the latest record.",
    };
  },
};

export const recordDiagnosticHistoryTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "record_diagnostic_history",
  description: "Alias for compiled diagnostic timeline retrieval",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.record_diagnostic_history,
  run: async (args, context?: ToolContext) => {
    return compilePetHealthTimelineTool.run(args, context);
  },
};

export const getUserProfileTool: ToolDefinition<Record<string, never>, any> = {
  name: "get_user_profile",
  description: "Get current account profile, including role and user type",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_user_profile,
  run: async (_args, context?: ToolContext) => {
    const profile = await getCurrentUserProfile(context);
    if (!profile) {
      return {
        authenticated: false,
        user_type: "unknown",
        message: "User is not authenticated.",
      };
    }

    return {
      authenticated: true,
      user: profile,
      role: profile.role || "customer",
      user_type: normalizeUserType(profile.role),
      message: "Profile retrieved successfully.",
    };
  },
};

export const updateUserPreferencesTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "update_user_preferences",
  description: "Update preferred location, service types, and notification settings",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.update_user_preferences,
  run: async (args, context?: ToolContext) => {
    const actorUserId = await resolveActorUserId(context);
    if (!actorUserId) {
      return {
        updated: false,
        message: "Please log in to update preferences.",
      };
    }

    const preferredLocation = asString(args.preferred_location) || asString(args.location);
    const preferredServiceTypes = asStringArray(args.preferred_service_types);
    const notificationSettings =
      (typeof args.notification_settings === "object" && args.notification_settings !== null
        ? (args.notification_settings as Record<string, unknown>)
        : {}) || {};

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("notification_prefs")
      .eq("id", actorUserId)
      .maybeSingle();

    if (profileErr) {
      throw profileErr;
    }

    const existingPrefs =
      profile?.notification_prefs && typeof profile.notification_prefs === "object"
        ? { ...(profile.notification_prefs as Record<string, unknown>) }
        : {};

    const applied: Record<string, unknown> = {};

    const notificationPayload = {
      newBookings: asBoolean(notificationSettings.newBookings),
      bookingReminders: asBoolean(notificationSettings.bookingReminders),
      newReviews: asBoolean(notificationSettings.newReviews),
      marketingUpdates: asBoolean(notificationSettings.marketingUpdates),
    };

    const hasNotificationUpdate = Object.values(notificationPayload).some((value) => value !== undefined);

    if (hasNotificationUpdate) {
      Object.entries(notificationPayload).forEach(([key, value]) => {
        if (value !== undefined) {
          existingPrefs[key] = value;
        }
      });
      applied.notification_settings = notificationPayload;
    }

    if (preferredServiceTypes && preferredServiceTypes.length > 0) {
      existingPrefs.preferred_service_types = preferredServiceTypes;
      applied.preferred_service_types = preferredServiceTypes;
    }

    if (preferredLocation) {
      existingPrefs.preferred_location = preferredLocation;
      applied.preferred_location = preferredLocation;
    }

    const shouldUpdateProfile =
      Boolean(preferredLocation) ||
      hasNotificationUpdate ||
      Boolean(preferredServiceTypes && preferredServiceTypes.length > 0);

    if (shouldUpdateProfile) {
      const profileUpdate: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (preferredLocation) {
        profileUpdate.address = preferredLocation;
      }

      if (hasNotificationUpdate || (preferredServiceTypes && preferredServiceTypes.length > 0) || preferredLocation) {
        profileUpdate.notification_prefs = existingPrefs;
      }

      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdate)
        .eq("id", actorUserId);

      if (updateErr) {
        throw updateErr;
      }
    }

    return {
      updated: Object.keys(applied).length > 0,
      saved: applied,
      message:
        Object.keys(applied).length > 0
          ? "Preferences updated successfully."
          : "No valid preference updates were provided.",
    };
  },
};

export const getBookingHistoryTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "get_booking_history",
  description: "Get upcoming and past bookings for the current user",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_booking_history,
  run: async (_args, context?: ToolContext) => {
    const base = await getUserBookingsTool.run({}, context);
    const rows = Array.isArray(base?.bookings) ? base.bookings : [];
    const today = new Date().toISOString().slice(0, 10);

    const upcoming = rows
      .filter((row: any) => {
        const checkin = asString(row?.checkin);
        return Boolean(checkin && checkin >= today);
      })
      .sort((a: any, b: any) => String(a.checkin || "").localeCompare(String(b.checkin || "")));

    const past = rows
      .filter((row: any) => {
        const checkin = asString(row?.checkin);
        return Boolean(checkin && checkin < today);
      })
      .sort((a: any, b: any) => String(b.checkin || "").localeCompare(String(a.checkin || "")));

    return {
      total: rows.length,
      upcoming,
      past,
    };
  },
};

export const getReviewsTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "get_reviews",
  description: "Get average rating, total reviews, and recent review snippets for a property",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_reviews,
  run: async (args) => {
    const propertyId = asString(args.property_id) || asString(args.propertyId);
    if (!propertyId) {
      return {
        error: "property_id is required",
      };
    }

    const response = await backendApiClient.request<any>(
      `/api/reviews/property/${encodeURIComponent(propertyId)}`,
      { method: "GET" },
    );

    const reviews = Array.isArray(response?.reviews) ? response.reviews : [];
    const avgRating = asNumber(response?.avgRating) || 0;

    return {
      property_id: propertyId,
      average_rating: avgRating,
      total_count: Number(response?.total || reviews.length || 0),
      recent_reviews: reviews.slice(0, 3).map((review: any) => ({
        id: asString(review?.id),
        rating: asNumber(review?.rating) || 0,
        comment: asString(review?.comment) || "",
        author: asString(review?.author) || "Anonymous",
        created_at: asString(review?.created_at),
      })),
      reviews,
    };
  },
};

export const summarizeReviewsTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "summarize_reviews",
  description: "Generate a factual sentiment summary from existing reviews",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.summarize_reviews,
  run: async (args) => {
    const inlineReviews = Array.isArray(args.reviews) ? args.reviews : undefined;
    const propertyId = asString(args.property_id) || asString(args.propertyId);

    let reviews: any[] = [];
    if (inlineReviews) {
      reviews = inlineReviews as any[];
    } else if (propertyId) {
      const response = await backendApiClient.request<any>(
        `/api/reviews/property/${encodeURIComponent(propertyId)}`,
        { method: "GET" },
      );
      reviews = Array.isArray(response?.reviews) ? response.reviews : [];
    }

    if (!reviews.length) {
      return {
        sentiment: "insufficient_data",
        summary: "Not enough reviews available to summarize.",
        review_count: 0,
      };
    }

    const comments = reviews.map((review: any) => asString(review?.comment) || "").filter(Boolean);
    const sentiment = summarizeSentiment(comments);

    const averageRating =
      reviews.reduce((sum: number, review: any) => sum + (asNumber(review?.rating) || 0), 0) /
      reviews.length;

    return {
      review_count: reviews.length,
      average_rating: Number(averageRating.toFixed(2)),
      sentiment: sentiment.sentiment,
      sentiment_score: sentiment.score,
      summary:
        sentiment.sentiment === "positive"
          ? "Most feedback is positive, with frequent mentions of good service and staff friendliness."
          : sentiment.sentiment === "negative"
            ? "Recent feedback shows consistent concerns that may need provider follow-up."
            : "Feedback is mixed, with both positive and negative experiences mentioned.",
    };
  },
};

export const getServiceRecommendationsTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "get_service_recommendations",
  description: "Recommend providers based on location, service type, and optional pet filters",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_service_recommendations,
  run: async (args, context?: ToolContext) => {
    const serviceType = asString(args.service_type) || asString(args.serviceType);
    const location = asString(args.location);
    const keyword = asString(args.keyword);

    const result = await searchServicesTool.run(
      {
        location,
        service_type: serviceType,
        petType: (args.pet_type as string | string[] | undefined) || (args.petType as string | string[] | undefined),
        keyword,
      },
      context,
    );

    return {
      query: {
        location,
        service_type: serviceType,
        keyword,
      },
      total: result.total,
      recommendations: result.properties,
    };
  },
};

export const generatePersonalizedRecommendationsTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "generate_personalized_recommendations",
  description: "Fetch personalized provider recommendations for the logged-in user",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.generate_personalized_recommendations,
  run: async (args, context?: ToolContext) => {
    if (!context?.authToken) {
      return {
        personalized: false,
        message: "Please log in to get personalized recommendations.",
      };
    }

    const limit = Math.max(1, Math.min(12, Number(asNumber(args.limit) || 6)));

    const response = await backendApiClient.request<any>("/api/properties/recommended", {
      method: "GET",
      authToken: context.authToken,
      query: {
        limit,
      },
    });

    const rows = Array.isArray(response?.properties)
      ? response.properties
      : Array.isArray(response)
        ? response
        : [];

    return {
      personalized: true,
      total: rows.length,
      recommendations: rows,
    };
  },
};

export const suggestAlternativeServicesTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "suggest_alternative_services",
  description: "Suggest similar alternatives when a preferred provider is unavailable",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.suggest_alternative_services,
  run: async (args, context?: ToolContext) => {
    const unavailablePropertyId = asString(args.unavailable_property_id) || asString(args.exclude_property_id);

    const result = await searchServicesTool.run(
      {
        location: asString(args.location),
        service_type: asString(args.service_type),
        keyword: asString(args.keyword),
      },
      context,
    );

    const filtered = result.properties.filter((item) => {
      const id = asString((item as any)?.id);
      return !unavailablePropertyId || id !== unavailablePropertyId;
    });

    return {
      total: filtered.length,
      alternatives: filtered.slice(0, 5),
    };
  },
};

export const autoMatchSpecialistTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "auto_match_specialist",
  description: "Automatically match to a suitable specialist provider",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.auto_match_specialist,
  run: async (args) => {
    const condition = asString(args.pet_condition) || asString(args.condition) || "";
    const inferredType = condition.match(/injur|vomit|diarr|fever|rash|wound|health|medical/i)
      ? "vet"
      : undefined;

    const serviceType = normalizeServiceType(asString(args.service_type) || inferredType);

    const response = await getPropertyServicesTool.run({
      service_type: serviceType,
      location: asString(args.location),
      keyword: asString(args.keyword),
    });

    const candidates = Array.isArray(response?.properties) ? response.properties : [];
    const match = candidates[0];

    if (!match) {
      return {
        matched: false,
        message: "No specialist match found for the given criteria.",
      };
    }

    const primaryService = Array.isArray(match.services) && match.services.length > 0 ? match.services[0] : null;

    return {
      matched: true,
      service_type: serviceType || "all",
      match: {
        provider_id: match.id,
        provider_name: match.name,
        location: match.city,
        rating: match.rating,
        service_name: primaryService?.name || null,
        estimated_price: primaryService?.price ?? match.price ?? null,
      },
      candidates_count: candidates.length,
    };
  },
};

export const getAreaBookingTrendsTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "get_area_booking_trends",
  description: "Retrieve booking demand trends in a specific area",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_area_booking_trends,
  run: async (args) => {
    const location = asString(args.location) || asString(args.area);
    const days = Number(asNumber(args.days) || 30);

    const { rows, safeDays } = await queryAreaBookings(location, days);

    const dailyMap = new Map<string, number>();
    const serviceMap = new Map<string, number>();

    for (const row of rows) {
      const createdAt = new Date((row as any).created_at);
      if (Number.isNaN(createdAt.getTime())) continue;

      const dayKey = createdAt.toISOString().slice(0, 10);
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + 1);

      const serviceType = toServiceDemandLabel(asString((row as any).service_type) || "");
      serviceMap.set(serviceType, (serviceMap.get(serviceType) || 0) + 1);
    }

    const daily_bookings = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const top_service_types = Array.from(serviceMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([service_type, count]) => ({ service_type, count }));

    return {
      area: location || "all",
      days: safeDays,
      total_bookings: rows.length,
      daily_bookings,
      top_service_types,
    };
  },
};

export const analyzeBookingFrequencyTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "analyze_booking_frequency",
  description: "Analyze booking frequency and identify peak demand windows",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.analyze_booking_frequency,
  run: async (args) => {
    const location = asString(args.location) || asString(args.area);
    const days = Number(asNumber(args.days) || 30);

    const { rows, safeDays } = await queryAreaBookings(location, days);

    const byWeekday = new Map<number, number>();
    const byHour = new Map<number, number>();
    const byDate = new Map<string, number>();

    for (const row of rows) {
      const createdAt = new Date((row as any).created_at);
      if (Number.isNaN(createdAt.getTime())) continue;

      const day = createdAt.getDay();
      const hour = createdAt.getHours();
      const dateKey = createdAt.toISOString().slice(0, 10);

      byWeekday.set(day, (byWeekday.get(day) || 0) + 1);
      byHour.set(hour, (byHour.get(hour) || 0) + 1);
      byDate.set(dateKey, (byDate.get(dateKey) || 0) + 1);
    }

    const peakDayEntry = Array.from(byWeekday.entries()).sort(([, a], [, b]) => b - a)[0];
    const peakHourEntry = Array.from(byHour.entries()).sort(([, a], [, b]) => b - a)[0];

    const averageDailyBookings =
      byDate.size > 0
        ? Number(
            (
              Array.from(byDate.values()).reduce((sum, value) => sum + value, 0) /
              byDate.size
            ).toFixed(2),
          )
        : 0;

    return {
      area: location || "all",
      days: safeDays,
      peak_day: peakDayEntry ? toDayName(peakDayEntry[0]) : "No data",
      peak_day_bookings: peakDayEntry ? peakDayEntry[1] : 0,
      peak_hour: peakHourEntry ? `${String(peakHourEntry[0]).padStart(2, "0")}:00` : "No data",
      peak_hour_bookings: peakHourEntry ? peakHourEntry[1] : 0,
      average_daily_bookings: averageDailyBookings,
      weekday_distribution: Array.from(byWeekday.entries())
        .sort(([a], [b]) => a - b)
        .map(([dayIndex, bookings]) => ({
          day: toDayName(dayIndex),
          bookings,
        })),
      hourly_distribution: Array.from(byHour.entries())
        .sort(([a], [b]) => a - b)
        .map(([hour, bookings]) => ({
          hour,
          bookings,
        })),
    };
  },
};

export const predictServiceOccupancyTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "predict_service_occupancy",
  description: "Forecast slot occupancy for a provider based on current bookings and capacity",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.predict_service_occupancy,
  run: async (args, context?: ToolContext) => {
    let propertyId = asString(args.property_id) || asString(args.provider_id);
    const date = toIsoDate(args.date) || new Date().toISOString().slice(0, 10);

    if (!propertyId) {
      const discovery = await searchServicesTool.run(
        {
          location: asString(args.location),
          service_type: asString(args.service_type),
          keyword: asString(args.keyword),
        },
        context,
      );
      propertyId = asString(discovery?.properties?.[0]?.id);
    }

    if (!propertyId) {
      return {
        available: false,
        message: "No provider found to forecast occupancy.",
      };
    }

    const availability = await checkAvailabilityTool.run(
      {
        property_id: propertyId,
        date,
      },
      context,
    );

    const totalCapacity = Number(availability?.total_capacity || 0);
    const bookedCount = Number(availability?.booked_count || 0);
    const occupancyRate = totalCapacity > 0 ? Number(((bookedCount / totalCapacity) * 100).toFixed(1)) : 0;

    const predictedStatus =
      occupancyRate >= 95
        ? "fully_booked"
        : occupancyRate >= 75
          ? "high_demand"
          : occupancyRate >= 40
            ? "moderate"
            : "available";

    return {
      property_id: propertyId,
      property_name: availability?.property_name,
      date,
      occupancy_rate: occupancyRate,
      predicted_status: predictedStatus,
      total_capacity: totalCapacity,
      booked_count: bookedCount,
      remaining_capacity: Math.max(0, totalCapacity - bookedCount),
      message: `${availability?.property_name || "Provider"} is expected to be ${predictedStatus.replace(/_/g, " ")} on ${date}.`,
    };
  },
};

export const analyzePetHealthDataTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "analyze_pet_health_data",
  description: "Assess pet diagnostic records and identify current risk flags",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.analyze_pet_health_data,
  run: async (args, context?: ToolContext) => {
    const petId = asString(args.pet_id);
    const ownerId = asString(context?.userId);

    if (!petId) {
      return { error: "pet_id is required" };
    }

    if (!ownerId) {
      return {
        pet_id: petId,
        status: "unknown",
        message: "Authentication context is required to analyze pet health data.",
      };
    }

    const { data: record, error } = await supabaseAdmin
      .from("pet_health_records")
      .select("pet_id, created_at, validation_status, compiled_record, metadata")
      .eq("pet_id", petId)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!record) {
      return {
        pet_id: petId,
        status: "no_data",
        message: "No health record found yet. Please complete your pet profile and upload records.",
      };
    }

    const compiled = (record as any).compiled_record || {};
    const summary = (compiled as any).diagnostic_summary || {};
    const validationStatus = String((record as any).validation_status || "unknown").toLowerCase();
    const flaggedFields = Number(summary.flagged_fields || 0);

    const riskLevel =
      validationStatus === "suspicious" || flaggedFields >= 3
        ? "high"
        : validationStatus === "incomplete" || flaggedFields > 0
          ? "medium"
          : "low";

    return {
      pet_id: petId,
      analyzed_at: (record as any).created_at,
      validation_status: validationStatus,
      risk_level: riskLevel,
      flagged_fields: flaggedFields,
      confidence_score: Number(summary.overall_confidence_score || 0),
      recommendation_count: Number(summary.recommendation_count || 0),
      message:
        riskLevel === "high"
          ? "Potential health record concerns were detected. Please consult a licensed veterinarian immediately."
          : riskLevel === "medium"
            ? "Some care gaps were identified. A follow-up service is recommended soon."
            : "Current health record looks stable with no major flags.",
    };
  },
};

export const generatePetCarePredictionsTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "generate_pet_care_predictions",
  description: "Predict upcoming pet care needs from profile and service history",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.generate_pet_care_predictions,
  run: async (args, context?: ToolContext) => {
    const prediction = await predictNextBookingTool.run(
      {
        pet_id: asString(args.pet_id),
        pet_name: asString(args.pet_name),
        include_booking_pattern: true,
        include_breed_recommendations: true,
        include_health_recommendations: true,
      },
      context,
    );

    const predictions = Array.isArray((prediction as any)?.predictions)
      ? (prediction as any).predictions
      : [];

    return {
      pet: (prediction as any)?.pet,
      confidence_level: (prediction as any)?.confidence_level,
      upcoming_needs: predictions.map((item: any) => ({
        service: asString(item?.service_type) || "General care",
        likelihood: Number(item?.likelihood || 0),
        reason: asString(item?.reasoning) || "Based on service history and pet profile.",
        suggested_window: asString(item?.recommended_date_range),
      })),
      analysis: (prediction as any)?.analysis,
      message: (prediction as any)?.message,
    };
  },
};

export const confirmMatchTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "confirm_match",
  description: "Present matched provider details and wait for explicit user confirmation",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.confirm_match,
  run: async (args) => {
    return {
      awaiting_confirmation: true,
      match: {
        provider_id: asString(args.provider_id),
        provider_name: asString(args.provider_name),
        service_id: asString(args.service_id),
        service: asString(args.service),
        date: toIsoDate(args.date),
        time: asString(args.time),
        price: asNumber(args.price),
      },
      prompt:
        "Please confirm if you want me to proceed with this booking. Reply with yes to continue.",
    };
  },
};

export const createReservationTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "create_reservation",
  description: "Create a reservation after user confirms provider and slot",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.create_reservation,
  run: async (args, context?: ToolContext) => {
    const userId = await resolveActorUserId(context, asString(args.user_id));
    const propertyId = asString(args.property_id) || asString(args.provider_id);
    const serviceId = asString(args.service_id);
    const serviceName = asString(args.service_name) || asString(args.service);
    const serviceType = asString(args.service_type);
    const petId = asString(args.pet_id);
    const petName = asString(args.pet_name);
    const specialRequirements = asString(args.special_requirements);
    const checkout = toIsoDate(args.checkout);
    const paymentMethod = asString(args.payment_method);
    const date = toIsoDate(args.date);
    const time = asString(args.time) || asString(args.time_slot);

    if ((!serviceId && !propertyId) || !date || !time) {
      return {
        created: false,
        error: "service_id or property_id/provider_id, date, and time are required",
      };
    }

    const result = await createBookingTool.run(
      {
        user_id: userId,
        property_id: propertyId,
        service_id: serviceId,
        service_name: serviceName,
        service_type: serviceType,
        pet_id: petId,
        pet_name: petName,
        special_requirements: specialRequirements,
        checkout,
        date,
        time,
        payment_method: paymentMethod,
      },
      context,
    );

    return {
      created: true,
      reservation: result.booking,
      message: result.message,
    };
  },
};

export const cancelReservationTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "cancel_reservation",
  description: "Cancel an existing reservation",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.cancel_reservation,
  run: async (args, context?: ToolContext) => {
    const bookingId = asString(args.booking_id);
    if (!bookingId) {
      return {
        cancelled: false,
        error: "booking_id is required",
      };
    }

    const result = await cancelBookingTool.run({ booking_id: bookingId }, context);
    return {
      cancelled: true,
      booking: result.booking,
      message: result.message,
    };
  },
};

export const autoRebookCancellationTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "auto_rebook_cancellation",
  description: "Automatically create a replacement reservation after cancellation",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.auto_rebook_cancellation,
  run: async (args, context?: ToolContext) => {
    const userId = await resolveActorUserId(context, asString(args.user_id));
    const propertyId = asString(args.property_id) || asString(args.provider_id);
    const serviceId = asString(args.service_id);
    const serviceName = asString(args.service_name) || asString(args.service);
    const serviceType = asString(args.service_type);
    const petId = asString(args.pet_id);
    const petName = asString(args.pet_name);
    const specialRequirements = asString(args.special_requirements);
    const checkout = toIsoDate(args.checkout);
    const paymentMethod = asString(args.payment_method);
    const date = toIsoDate(args.date);
    const time = asString(args.time) || asString(args.time_slot);

    if ((!serviceId && !propertyId) || !date || !time) {
      return {
        rebooked: false,
        error: "service_id or property_id/provider_id, date, and time are required",
      };
    }

    const result = await createBookingTool.run(
      {
        user_id: userId,
        property_id: propertyId,
        service_id: serviceId,
        service_name: serviceName,
        service_type: serviceType,
        pet_id: petId,
        pet_name: petName,
        special_requirements: specialRequirements,
        checkout,
        date,
        time,
        payment_method: paymentMethod,
      },
      context,
    );

    return {
      rebooked: true,
      reservation: result.booking,
      message: result.message,
    };
  },
};

export const submitReviewTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "submit_review",
  description: "Submit a post-service rating and review",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.submit_review,
  run: async (args, context?: ToolContext) => {
    if (!context?.authToken) {
      return {
        submitted: false,
        message: "Please log in to submit a review.",
      };
    }

    const bookingId = asString(args.booking_id);
    const rating = asNumber(args.rating);
    const comment = asString(args.comment) || "";

    if (!bookingId || !rating) {
      return {
        submitted: false,
        error: "booking_id and rating are required",
      };
    }

    const response = await backendApiClient.request<any>("/api/reviews", {
      method: "POST",
      authToken: context.authToken,
      body: {
        booking_id: bookingId,
        rating,
        comment,
      },
    });

    return {
      submitted: true,
      review: response?.review ?? response,
      message: response?.message || "Review submitted successfully.",
    };
  },
};

export const setAppointmentReminderTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "set_appointment_reminder",
  description: "Set appointment reminder notifications",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.set_appointment_reminder,
  run: async (args, context?: ToolContext) => {
    const userId = await resolveActorUserId(context, asString(args.user_id));
    if (!userId) {
      return {
        scheduled: false,
        message: "Unable to set reminder without a user context.",
      };
    }

    const bookingId = asString(args.booking_id);
    const providerName = asString(args.provider_name) || "your provider";
    const appointmentDateTime =
      toIsoDateTime(args.appointment_datetime) || `${toIsoDate(args.date) || new Date().toISOString().slice(0, 10)}T${asString(args.time) || "09:00"}:00.000Z`;

    const mode = asString(args.mode) || "pre-appointment";
    const baseDate = new Date(appointmentDateTime);
    const reminders =
      mode === "review_prompt"
        ? [new Date(baseDate.getTime() + MS_PER_DAY)]
        : [new Date(baseDate.getTime() - MS_PER_DAY), new Date(baseDate.getTime() - 2 * MS_PER_HOUR)];

    const reminderText =
      mode === "review_prompt"
        ? `Review prompt for your ${providerName} appointment is set.`
        : `Pre-appointment reminders for ${providerName} have been set.`;

    const created = await createSimpleNotification({
      userId,
      type: mode === "review_prompt" ? "info" : "booking_reminder",
      title: mode === "review_prompt" ? "Review Reminder Scheduled" : "Appointment Reminder Scheduled",
      message: reminderText,
      link: bookingId ? `/my-bookings?bookingId=${bookingId}` : "/my-bookings",
      referenceId: bookingId,
      referenceType: bookingId ? "booking" : undefined,
    });

    return {
      scheduled: true,
      mode,
      reminder_times: reminders.map((item) => item.toISOString()),
      notification_id: created.id,
      message: "Appointment reminders have been set.",
    };
  },
};

export const notifyAvailabilityChangeTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "notify_availability_change",
  description: "Notify users when watched slots open or close",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.notify_availability_change,
  run: async (args, context?: ToolContext) => {
    const userId = await resolveActorUserId(context, asString(args.user_id));
    if (!userId) {
      return {
        notified: false,
        message: "No user context available for availability notification.",
      };
    }

    const provider = asString(args.provider_name) || "provider";
    const date = toIsoDate(args.date) || "the selected date";
    const status = asString(args.status) || "changed";

    const created = await createSimpleNotification({
      userId,
      type: "info",
      title: "Slot Availability Update",
      message: `A slot you were watching at ${provider} on ${date} has ${status}.`,
      link: asString(args.link) || "/my-bookings",
    });

    return {
      notified: true,
      notification_id: created.id,
      message: `Availability update sent for ${provider}.`,
    };
  },
};

export const notifyServiceAvailabilityTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "notify_service_availability",
  description: "Notify users about provider service availability status",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.notify_service_availability,
  run: async (args, context?: ToolContext) => {
    const userId = await resolveActorUserId(context, asString(args.user_id));
    if (!userId) {
      return {
        notified: false,
        message: "No user context available for service availability notification.",
      };
    }

    const provider = asString(args.provider_name) || "provider";
    const status = asString(args.status) || "updated";

    const created = await createSimpleNotification({
      userId,
      type: "info",
      title: "Service Availability Status",
      message: `Heads up - ${provider} is currently ${status}.`,
      link: asString(args.link) || "/my-bookings",
    });

    return {
      notified: true,
      notification_id: created.id,
      message: `Service availability notification sent for ${provider}.`,
    };
  },
};

export const notifyPetNeedingServiceTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "notify_pet_needing_service",
  description: "Notify user when pet is due for care",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.notify_pet_needing_service,
  run: async (args, context?: ToolContext) => {
    const userId = await resolveActorUserId(context, asString(args.user_id));
    const petId = asString(args.pet_id);

    if (userId && petId && isUuid(petId)) {
      const created = await dispatchPetCareNotificationsForPet(petId, userId);
      return {
        notified: true,
        generated_notifications: created,
        message: created > 0 ? "Pet care notifications generated." : "No new pet care notifications were needed.",
      };
    }

    if (!userId) {
      return {
        notified: false,
        message: "No user context available for pet care notification.",
      };
    }

    const petName = asString(args.pet_name) || "your pet";
    const service = asString(args.service) || "a care service";
    const lastDate = toIsoDate(args.last_appointment_date) || "unknown date";

    const created = await createSimpleNotification({
      userId,
      type: "system",
      title: "Pet Care Reminder",
      message: `${petName} may be due for ${service}. Last appointment was ${lastDate}.`,
      link: "/my-pets",
    });

    return {
      notified: true,
      notification_id: created.id,
      message: "Pet care reminder sent.",
    };
  },
};

export const notifyPaymentDuesTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "notify_payment_dues",
  description: "Notify proprietor about upcoming platform dues",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.notify_payment_dues,
  run: async (args, context?: ToolContext) => {
    const userId = await resolveActorUserId(context, asString(args.user_id));
    if (!userId) {
      return {
        notified: false,
        message: "No user context available for payment due notification.",
      };
    }

    const amount = asNumber(args.amount) || 0;
    const dueDate = toIsoDate(args.due_date) || new Date().toISOString().slice(0, 10);

    const created = await createSimpleNotification({
      userId,
      type: "system",
      title: "Platform Fee Due",
      message: `Your monthly platform fee of PHP ${amount.toFixed(2)} is due on ${dueDate}.`,
      link: asString(args.link) || "/settings",
    });

    return {
      notified: true,
      notification_id: created.id,
      message: "Payment due reminder sent.",
    };
  },
};

export const getFaqAnswerTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "get_faq_answer",
  description: "Answer common platform questions using built-in FAQ knowledge",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_faq_answer,
  run: async (args, context?: ToolContext) => {
    const question = (asString(args.question) || asString(args.query) || "").toLowerCase();

    if (!question) {
      return {
        resolved: false,
        answer: "Please share your question so I can help.",
      };
    }

    if (context?.authToken && /(support|ticket|issue|case)\b/i.test(question)) {
      try {
        const tickets = await backendApiClient.request<any[]>("/api/support/tickets", {
          method: "GET",
          authToken: context.authToken,
        });

        const rows = Array.isArray(tickets) ? tickets : [];
        const activeStatuses = new Set(["open", "pending", "in progress", "in_progress"]);
        const openCount = rows.filter((row) =>
          activeStatuses.has(String(row?.status || "").toLowerCase()),
        ).length;
        const latest = rows[0];

        return {
          resolved: true,
          source: "support_tickets",
          answer:
            rows.length > 0
              ? `You currently have ${rows.length} ticket${rows.length === 1 ? "" : "s"}, with ${openCount} still active. Your latest ticket is ${String(latest?.ticket_number || latest?.id || "") || "(unavailable)"} with status ${String(latest?.status || "Unknown")}.`
              : "You currently have no support tickets on record.",
          ticket_count: rows.length,
          active_ticket_count: openCount,
        };
      } catch {
        // Fall through to generic FAQ handling.
      }
    }

    if (context?.authToken && /(booking|reservation|appointment)\b/i.test(question)) {
      try {
        const bookingSnapshot = await getUserBookingsTool.run({}, context);
        const bookings = Array.isArray(bookingSnapshot?.bookings) ? bookingSnapshot.bookings : [];
        const total = Number(bookingSnapshot?.total || bookings.length || 0);
        const active = bookings.filter((row: any) => {
          const status = String(row?.status || "").toLowerCase();
          return ["pending", "confirmed", "checked_in"].includes(status);
        }).length;

        return {
          resolved: true,
          source: "bookings",
          answer:
            total > 0
              ? `You currently have ${total} booking${total === 1 ? "" : "s"}, with ${active} active right now.`
              : "You don't have any bookings yet.",
          booking_count: total,
          active_booking_count: active,
        };
      } catch {
        // Fall through to generic FAQ handling.
      }
    }

    const faqBank: Array<{ keywords: string[]; answer: string }> = [
      {
        keywords: ["book", "reservation", "appointment"],
        answer:
          "To book a service, choose a provider, check available slots, confirm your preferred schedule, and complete your reservation in the app.",
      },
      {
        keywords: ["cancel", "refund", "policy"],
        answer:
          "Cancellation and refund terms depend on the provider's policy. Open your booking details to see the exact policy before cancelling.",
      },
      {
        keywords: ["payment", "gcash", "paymaya"],
        answer:
          "You can pay using supported methods shown during checkout. Payment status updates appear in your booking details once confirmed.",
      },
      {
        keywords: ["profile", "account", "preferences"],
        answer:
          "You can update account details and preferences in your profile and settings pages, including notification options.",
      },
    ];

    const match = faqBank.find((item) => item.keywords.some((keyword) => question.includes(keyword)));

    if (!match) {
      return {
        resolved: false,
        answer:
          "I could not find a direct FAQ answer for that yet. I can connect you with our support team for help.",
      };
    }

    return {
      resolved: true,
      answer: match.answer,
    };
  },
};

export const reportIssueTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "report_issue",
  description: "Create a support ticket for platform issues or complaints",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.report_issue,
  run: async (args, context?: ToolContext) => {
    if (!context?.authToken) {
      return {
        reported: false,
        message: "Please log in to report an issue.",
      };
    }

    const issueType = asString(args.issue_type) || "General Issue";
    const description = asString(args.description) || "No description provided.";
    const bookingId = asString(args.booking_id);
    const priority = asString(args.priority) || "Medium";

    const message = bookingId
      ? `${description}\n\nRelated Booking ID: ${bookingId}`
      : description;

    const ticket = await backendApiClient.request<any>("/api/support/tickets", {
      method: "POST",
      authToken: context.authToken,
      body: {
        subject: issueType,
        message,
        priority,
      },
    });

    return {
      reported: true,
      reference_id: asString(ticket?.ticket_number) || asString(ticket?.id),
      ticket,
      message: "Issue report submitted successfully.",
    };
  },
};

export const escalateToHumanTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "escalate_to_human",
  description: "Escalate unresolved concern to human support",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.escalate_to_human,
  run: async (args, context?: ToolContext) => {
    const reason = asString(args.reason) || asString(args.description) || "User requested human assistance.";

    if (!context?.authToken) {
      return {
        escalated: true,
        message:
          "I'm connecting you with our support team. You'll be redirected to our support ticket page.",
        redirect_path: "/help-center",
        note: reason,
      };
    }

    try {
      const ticket = await backendApiClient.request<any>("/api/support/tickets", {
        method: "POST",
        authToken: context.authToken,
        body: {
          subject: "Escalation Request",
          message: reason,
          priority: "High",
        },
      });

      return {
        escalated: true,
        ticket_id: asString(ticket?.id),
        reference_id: asString(ticket?.ticket_number) || asString(ticket?.id),
        message:
          "I'm connecting you with our support team. You'll be redirected to our support ticket page.",
        redirect_path: "/help-center",
      };
    } catch {
      return {
        escalated: true,
        message:
          "I'm connecting you with our support team. You'll be redirected to our support ticket page.",
        redirect_path: "/help-center",
      };
    }
  },
};

export const geocodeAddressTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "geocode_address",
  description: "Normalize a location text into geocoded city coordinates",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.geocode_address,
  run: async (args) => {
    const query = asString(args.query) || asString(args.address) || asString(args.location);
    if (!query) {
      return {
        resolved: false,
        error: "query is required",
      };
    }

    const response = await backendApiClient.request<any>("/api/location/search", {
      method: "GET",
      query: {
        q: query,
      },
    });

    const locations = Array.isArray(response?.locations) ? response.locations : [];
    const normalized = locations.map((item: any) => ({
      name: asString(item?.name),
      lat: asNumber(item?.lat),
      lng: asNumber(item?.lng),
    }));

    return {
      resolved: normalized.length > 0,
      query,
      location: normalized[0] || null,
      candidates: normalized.slice(0, 5),
      ambiguous: normalized.length > 1,
    };
  },
};

export const estimatePeakTravelTimeTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "estimate_peak_travel_time",
  description: "Estimate travel distance and time between origin and destination",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.estimate_peak_travel_time,
  run: async (args) => {
    const originText = asString(args.origin);
    const destinationText = asString(args.destination);

    if (!originText || !destinationText) {
      return {
        estimated: false,
        error: "origin and destination are required",
      };
    }

    const [origin, destination] = await Promise.all([
      geocodeSingle(originText),
      geocodeSingle(destinationText),
    ]);

    if (!origin || !destination) {
      return {
        estimated: false,
        error: "Unable to geocode one or both addresses.",
      };
    }

    const distanceKm = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng);
    const travelDate = toIsoDateTime(args.departure_time) ? new Date(String(args.departure_time)) : new Date();

    const trafficMultiplier = inferPeakTrafficMultiplier(travelDate);
    const baselineSpeedKmh = 30;
    const effectiveSpeed = Math.max(8, baselineSpeedKmh / trafficMultiplier);
    const estimatedMinutes = Math.max(1, Math.round((distanceKm / effectiveSpeed) * 60));

    const suggestedDeparture = new Date(travelDate.getTime() - estimatedMinutes * 60 * 1000).toISOString();

    return {
      estimated: true,
      origin,
      destination,
      distance_km: Number(distanceKm.toFixed(2)),
      estimated_travel_minutes: estimatedMinutes,
      traffic_multiplier: Number(trafficMultiplier.toFixed(2)),
      suggested_departure_time: suggestedDeparture,
      traffic_level:
        trafficMultiplier >= 1.5
          ? "heavy"
          : trafficMultiplier >= 1.25
            ? "moderate"
            : "light",
    };
  },
};

export const giveBusinessRecommendationsTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "give_business_recommendations",
  description: "Provide business performance snapshot and top growth insight",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.give_business_recommendations,
  run: async (args, context?: ToolContext) => {
    if (!context?.authToken) {
      return {
        available: false,
        message: "Please log in as a business owner to view recommendations.",
      };
    }

    const propertyId = asString(args.property_id);

    const stats = await backendApiClient.request<any>("/api/properties/mine/stats", {
      method: "GET",
      authToken: context.authToken,
      query: {
        property_id: propertyId,
      },
    });

    const occupancy = Number(stats?.occupancy || 0);
    const avgRating = Number(stats?.avgRating || 0);
    const totalBookings = Number(stats?.totalBookings || 0);
    const revenue = Number(stats?.revenue || 0);

    let topInsight = "Keep monitoring bookings and maintain service quality.";
    if (occupancy >= 85) {
      topInsight = "Your occupancy is high. Consider adding more slots or extending operating hours.";
    } else if (avgRating > 0 && avgRating < 4.2) {
      topInsight = "Your rating can improve with faster response times and proactive post-service follow-ups.";
    } else if (totalBookings < 20) {
      topInsight = "Booking volume is still low. Consider a weekday promo to attract first-time clients.";
    }

    return {
      booking_volume_trend: {
        total_bookings: totalBookings,
      },
      revenue_summary: {
        total_revenue: Number(revenue.toFixed(2)),
      },
      competitor_comparison: {
        note: "Competitor comparison is currently limited. Use area booking trends for nearby demand context.",
      },
      top_actionable_insight: topInsight,
      occupancy,
      avg_rating: avgRating,
    };
  },
};

export const recommendStrategiesTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "recommend_strategies",
  description: "Recommend pricing, promo, and scheduling strategies using demand signals",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.recommend_strategies,
  run: async (args, context?: ToolContext) => {
    const location = asString(args.location);
    const propertyId = asString(args.property_id);

    const [trends, frequency, occupancy] = await Promise.all([
      getAreaBookingTrendsTool.run({ location, days: asNumber(args.days) || 30 }),
      analyzeBookingFrequencyTool.run({ location, days: asNumber(args.days) || 30 }),
      predictServiceOccupancyTool.run({ property_id: propertyId, date: toIsoDate(args.date) }, context),
    ]);

    const strategies: string[] = [];

    const peakDay = asString((frequency as any)?.peak_day);
    const peakHour = asString((frequency as any)?.peak_hour);
    const occupancyRate = Number((occupancy as any)?.occupancy_rate || 0);

    if (peakDay && peakHour && peakDay !== "No data" && peakHour !== "No data") {
      strategies.push(`Prioritize premium slots on ${peakDay} around ${peakHour} when demand is highest.`);
    }

    if (occupancyRate >= 80) {
      strategies.push("High occupancy detected - test small price increases on peak windows while protecting repeat customers.");
    } else {
      strategies.push("Offer limited weekday bundles to improve off-peak utilization.");
    }

    const topService = Array.isArray((trends as any)?.top_service_types)
      ? (trends as any).top_service_types[0]
      : undefined;
    if (topService?.service_type) {
      strategies.push(`Top demand in your area is ${topService.service_type}; feature this service in your storefront and promos.`);
    }

    return {
      market_inputs: {
        trends,
        frequency,
        occupancy,
      },
      strategies,
    };
  },
};

export const prescribeRecommendationsBusinessesTool: ToolDefinition<Record<string, unknown>, any> = {
  name: "prescribe_recommendations_businesses",
  description: "Map local health demand signals into service opportunities for proprietors",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.prescribe_recommendations_businesses,
  run: async (args) => {
    const location = asString(args.location);
    const days = Number(asNumber(args.days) || 90);

    const { rows } = await queryAreaBookings(location, days);

    const serviceDemand = new Map<string, number>();
    for (const row of rows) {
      const serviceType = toServiceDemandLabel(asString((row as any).service_type) || "");
      serviceDemand.set(serviceType, (serviceDemand.get(serviceType) || 0) + 1);
    }

    const rankedDemand = Array.from(serviceDemand.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([service_type, count]) => ({ service_type, count }));

    const conditionToService = rankedDemand.map((item) => {
      if (item.service_type === "veterinary") {
        return {
          common_issue: "Preventive and clinical pet health checks",
          relevant_service: "Veterinary consultations and diagnostics",
          demand_count: item.count,
        };
      }

      if (item.service_type === "grooming") {
        return {
          common_issue: "Coat and skin maintenance concerns",
          relevant_service: "Routine grooming and skin-care packages",
          demand_count: item.count,
        };
      }

      return {
        common_issue: "Pet care support and temporary stay needs",
        relevant_service: "Boarding and day-care services",
        demand_count: item.count,
      };
    });

    return {
      area: location || "all",
      observation_window_days: days,
      local_health_demand_signals: rankedDemand,
      service_opportunity_mapping: conditionToService,
      suggested_service_gaps: conditionToService.slice(0, 3),
    };
  },
};

// Aliases to existing implementations for compatibility with the Pawly policy vocabulary.
export const createReservationAliasTool = createReservationTool;
export const cancelReservationAliasTool = cancelReservationTool;

export const pawlyTools: ToolDefinition<any, any>[] = [
  searchPropertyTool,
  getServiceDetailsTool,
  getNearbyServicesTool,
  getUserProfileTool,
  updateUserPreferencesTool,
  getBookingHistoryTool,
  getReviewsTool,
  summarizeReviewsTool,
  getServiceRecommendationsTool,
  generatePersonalizedRecommendationsTool,
  suggestAlternativeServicesTool,
  autoMatchSpecialistTool,
  getAreaBookingTrendsTool,
  analyzeBookingFrequencyTool,
  predictServiceOccupancyTool,
  analyzePetPhotoTool,
  getVaccinationRecordsTool,
  analyzePetHealthDataTool,
  extractMedicalDataTool,
  validateRecordAuthenticityTool,
  generatePetCarePredictionsTool,
  predictGroomingCycleTool,
  predictWellnessMilestonesTool,
  compilePetHealthTimelineTool,
  recordDiagnosticHistoryTool,
  modifyReservationTool,
  confirmMatchTool,
  createReservationTool,
  cancelReservationTool,
  autoRebookCancellationTool,
  submitReviewTool,
  setAppointmentReminderTool,
  notifyAvailabilityChangeTool,
  notifyServiceAvailabilityTool,
  notifyPetNeedingServiceTool,
  notifyPaymentDuesTool,
  getFaqAnswerTool,
  reportIssueTool,
  escalateToHumanTool,
  geocodeAddressTool,
  estimatePeakTravelTimeTool,
  giveBusinessRecommendationsTool,
  recommendStrategiesTool,
  prescribeRecommendationsBusinessesTool,
  // Keep existing core tools accessible under this richer policy.
  getPetProfileTool,
  checkAvailabilityTool,
  getCancellationPolicyTool,
  getBookingSummaryTool,
];
