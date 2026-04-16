import { backendApiClient } from "../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../schemas";
import { ToolContext, ToolDefinition } from "../types";
import { supabaseAdmin } from "../../config/supabaseAdmin";
import { matchesServiceCategory, resolveServiceIntent } from "./discovery/serviceTaxonomy";

export interface CreateBookingArgs {
  user_id?: string;
  property_id?: string;
  service_id?: string;
  service_name?: string;
  service_type?: string;
  pet_id?: string;
  pet_name?: string;
  pet_type?: string;
  pet_breed?: string;
  pet_age?: string;
  pet_weight?: string | number;
  special_requirements?: string;
  checkout?: string;
  date: string;
  time: string;
  payment_method?: string;
  reference_number?: string;
  amount_paid?: number | string;
  subtotal?: number | string;
  service_fee?: number | string;
  total_price?: number | string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  emergency_contact?: string;
}

interface CreateBookingResult {
  booking: {
    id: string | null;
    property_id: string | null;
    service_id: string | null;
    status: string | null;
    payment_status: string | null;
    total_price: number | null;
    checkin: string | null;
    time_slot: string | null;
  };
  message: string;
}

const asString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
};

const asNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const toIsoDate = (value: unknown): string | undefined => {
  const text = asString(value);
  if (!text) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
};

const normalizeTimeSlot = (value: unknown): string | undefined => {
  const raw = asString(value)?.toLowerCase();
  if (!raw) return undefined;

  const withMinutes = raw.match(/^(\d{1,2}):(\d{2})(?:\s*(am|pm))?$/i);
  if (withMinutes) {
    let hour = Number(withMinutes[1]);
    const minute = Number(withMinutes[2]);
    const meridian = withMinutes[3]?.toLowerCase();

    if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute < 0 || minute > 59) {
      return undefined;
    }

    if (meridian) {
      if (hour < 1 || hour > 12) return undefined;
      if (meridian === "am") {
        hour = hour === 12 ? 0 : hour;
      } else {
        hour = hour === 12 ? 12 : hour + 12;
      }
    }

    if (hour < 0 || hour > 23) return undefined;
    return `${hour}:${String(minute).padStart(2, "0")}`;
  }

  const withMeridianOnly = raw.match(/^(\d{1,2})\s*(am|pm)$/i);
  if (withMeridianOnly) {
    let hour = Number(withMeridianOnly[1]);
    const meridian = withMeridianOnly[2].toLowerCase();
    if (hour < 1 || hour > 12) return undefined;

    if (meridian === "am") {
      hour = hour === 12 ? 0 : hour;
    } else {
      hour = hour === 12 ? 12 : hour + 12;
    }

    return `${hour}:00`;
  }

  return undefined;
};

const toBookingServiceType = (value?: string): string | undefined => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return undefined;

  if (["hotel", "boarding", "accommodation", "stay"].includes(normalized)) return "boarding";
  if (["vet", "veterinary", "clinic", "consultation"].includes(normalized)) return "veterinary";
  if (["grooming", "groomer", "spa"].includes(normalized)) return "grooming";
  if (["daycare", "day care"].includes(normalized)) return "daycare";
  if (["transport", "pet taxi", "taxi"].includes(normalized)) return "transport";
  return normalized;
};

const sanitizePayload = (value: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));

const resolveService = async (args: CreateBookingArgs) => {
  const providedServiceId = asString(args.service_id);
  const providedPropertyId = asString(args.property_id);
  const providedServiceName = asString(args.service_name);
  const providedServiceType = asString(args.service_type);

  if (providedServiceId) {
    const { data } = await supabaseAdmin
      .from("property_services")
      .select("id, property_id, name, category")
      .eq("id", providedServiceId)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .limit(1)
      .maybeSingle();

    if (data) {
      return data;
    }
  }

  if (!providedPropertyId) {
    return null;
  }

  const { data: rows } = await supabaseAdmin
    .from("property_services")
    .select("id, property_id, name, category")
    .eq("property_id", providedPropertyId)
    .eq("is_active", true)
    .eq("is_deleted", false)
    .order("name", { ascending: true });

  const services = Array.isArray(rows) ? rows : [];
  if (!services.length) return null;

  if (providedServiceName) {
    const byName = services.find((service: any) =>
      String(service?.name || "")
        .toLowerCase()
        .includes(providedServiceName.toLowerCase()),
    );
    if (byName) return byName;
  }

  if (providedServiceType) {
    const byType = services.find((service: any) =>
      matchesServiceCategory(service?.category, providedServiceType),
    );
    if (byType) return byType;
  }

  return services[0];
};

const resolvePet = async (args: CreateBookingArgs, context?: ToolContext) => {
  const providedPetId = asString(args.pet_id);
  const providedPetName = asString(args.pet_name);

  const response = await backendApiClient.request<any>("/api/pets", {
    method: "GET",
    authToken: context?.authToken,
  });

  const pets = Array.isArray(response?.pets) ? response.pets : [];

  if (providedPetId) {
    const byId = pets.find((pet: any) => String(pet?.id || "") === providedPetId);
    if (byId) return byId;
  }

  if (providedPetName) {
    const byName = pets.find((pet: any) =>
      String(pet?.name || "").toLowerCase() === providedPetName.toLowerCase(),
    );
    if (byName) return byName;
  }

  return pets[0] || null;
};

export const createBookingTool: ToolDefinition<CreateBookingArgs, CreateBookingResult> = {
  name: "create_booking",
  description: "Create a booking for a user and service",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.create_booking,
  run: async (args, context?: ToolContext) => {
    if (!context?.authToken) {
      throw new Error("Please sign in to create a reservation.");
    }

    const checkinDate = toIsoDate(args.date);
    const timeSlot = normalizeTimeSlot(args.time);
    const checkout = toIsoDate(args.checkout) || asString(args.checkout);

    if (!checkinDate || (!timeSlot && !checkout)) {
      throw new Error("date is required, and time is required for same-day appointment bookings.");
    }

    const service = await resolveService(args);
    const propertyId = asString(args.property_id) || asString((service as any)?.property_id);
    const serviceId = asString(args.service_id) || asString((service as any)?.id);
    const serviceName = asString(args.service_name) || asString((service as any)?.name);

    const resolvedIntent = resolveServiceIntent(
      asString(args.service_type) || asString((service as any)?.category),
    );
    const bookingServiceType =
      toBookingServiceType(asString(args.service_type)) ||
      toBookingServiceType(asString((service as any)?.category)) ||
      toBookingServiceType(resolvedIntent.canonicalKey) ||
      "other";

    if (!propertyId) {
      throw new Error("property_id or a valid service_id is required to create a booking.");
    }

    // Lightweight validation before creation for appointment-style bookings.
    if (!checkout && timeSlot) {
      const availability = await backendApiClient.request<any>(
        `/api/bookings/availability/${propertyId}`,
        {
          method: "GET",
          query: {
            date: checkinDate,
            type:
              bookingServiceType === "boarding"
                ? "hotel"
                : bookingServiceType === "veterinary"
                  ? "veterinary"
                  : bookingServiceType === "grooming"
                    ? "grooming"
                    : undefined,
          },
        },
      );

      const availableSlots = Array.isArray(availability?.availableSlots)
        ? availability.availableSlots
            .map((slot: unknown): string | undefined => normalizeTimeSlot(slot) || asString(slot))
            .filter((slot: string | undefined): slot is string => Boolean(slot))
        : [];

      if (availableSlots.length > 0 && !availableSlots.includes(timeSlot)) {
        throw new Error(`The selected time slot (${timeSlot}) is no longer available.`);
      }
    }

    const pet = await resolvePet(args, context);
    if (!pet) {
      throw new Error("No pet profile found. Please add a pet first before creating a reservation.");
    }

    const payload = sanitizePayload({
      property_id: propertyId,
      pet_id: asString(pet?.id),
      service_id: serviceId,
      checkin: checkinDate,
      checkout: checkout || null,
      time_slot: checkout ? null : timeSlot,
      pet_name: asString(args.pet_name) || asString(pet?.name),
      pet_type: asString(args.pet_type) || asString(pet?.species),
      pet_breed: asString(args.pet_breed) || asString(pet?.breed),
      pet_age: asString(args.pet_age),
      pet_weight: asString(args.pet_weight) || asString(pet?.weight),
      special_requirements: asString(args.special_requirements),
      service_name: serviceName,
      service_type: bookingServiceType,
      owner_name: asString(args.owner_name),
      owner_email: asString(args.owner_email),
      owner_phone: asString(args.owner_phone),
      emergency_contact: asString(args.emergency_contact),
      subtotal: asNumber(args.subtotal),
      service_fee: asNumber(args.service_fee),
      total_price: asNumber(args.total_price),
      payment_method: asString(args.payment_method),
      reference_number: asString(args.reference_number),
      amount_paid: asNumber(args.amount_paid),
    });

    const response = await backendApiClient.request<any>("/api/bookings", {
      method: "POST",
      body: payload,
      authToken: context?.authToken,
    });

    const booking = response?.booking ?? response?.data ?? response;
    return {
      booking: {
        id: booking?.id ?? null,
        property_id: booking?.property_id ?? propertyId ?? null,
        service_id: booking?.service_id ?? serviceId ?? null,
        status: booking?.status ?? null,
        payment_status: booking?.payment_status ?? null,
        total_price: typeof booking?.total_price === "number" ? booking.total_price : (Number(booking?.total_price) || null),
        checkin: booking?.checkin ?? null,
        time_slot: booking?.time_slot ?? timeSlot ?? null,
      },
      message: response?.message ?? "Booking request submitted.",
    };
  },
};
