import { SchemaType } from "@google/generative-ai";
import { ToolName } from "../types";

export type GeminiParameterSchema = Record<string, unknown>;

export const SUPPORTED_TOOL_NAMES: readonly ToolName[] = [
  "search_services",
  "get_review_count",
  "read_image_text",
  "get_pets",
  "get_pet_profile",
  "get_pet_service_history",
  "predict_next_booking",
  "create_booking",
  "get_user_bookings",
  "cancel_booking",
  "check_availability",
  "get_cancellation_policy",
  "get_booking_summary",
  "get_provider_revenue",
] as const;

export const SUPPORTED_TOOLS = new Set<string>(SUPPORTED_TOOL_NAMES);

export const TOOL_INPUT_SCHEMA_TEXT: Record<ToolName, string> = {
  search_services:
    "{ location?: string, service_type?: string, checkin?: string, checkout?: string, timeSlot?: string, petType?: string|string[], dogSize?: string|string[], propertyType?: string, serviceCategory?: string, minPrice?: number, maxPrice?: number, rating?: number, amenities?: string|string[], keyword?: string, lat?: number, lng?: number, radiusKm?: number }",
  get_review_count: "{ propertyId: string }",
  read_image_text: "{ image_base64: string, language?: string }",
  get_pets: "{}",
  get_pet_profile: "{ pet_id: string }",
  get_pet_service_history: "{ pet_id?: string, pet_name?: string }",
  predict_next_booking: "{ pet_id?: string, pet_name?: string, include_breed_recommendations?: boolean, include_health_recommendations?: boolean, include_booking_pattern?: boolean }",
  create_booking: "{ user_id: string, service_id: string, date: string, time: string }",
  get_user_bookings: "{}",
  cancel_booking: "{ booking_id: string }",
  check_availability: "{ property_id: string, date: string, time_slots?: string[] }",
  get_cancellation_policy: "{ property_id?: string, property_name?: string }",
  get_booking_summary: "{ booking_id?: string }",
  get_provider_revenue: "{ provider_id: string, month?: string }",
};

export const GEMINI_TOOL_SCHEMAS: Record<ToolName, GeminiParameterSchema> = {
  search_services: {
    type: SchemaType.OBJECT,
    properties: {
      location: {
        type: SchemaType.STRING,
        description: "City, area, or location keyword (e.g. Manila, Quezon City)",
      },
      service_type: {
        type: SchemaType.STRING,
        description: "Service category: boarding, grooming, veterinary",
      },
      petType: { type: SchemaType.STRING, description: "Pet type (dog, cat, etc.)" },
      petTypeOptions: { type: SchemaType.ARRAY, description: "Array of pet types", items: { type: SchemaType.STRING } },
      dogSize: { type: SchemaType.STRING, description: "Dog size (small, medium, large)" },
      dogSizeOptions: { type: SchemaType.ARRAY, description: "Array of dog sizes", items: { type: SchemaType.STRING } },
      minPrice: { type: SchemaType.NUMBER, description: "Minimum price filter" },
      maxPrice: { type: SchemaType.NUMBER, description: "Maximum price filter" },
      rating: { type: SchemaType.NUMBER, description: "Minimum rating filter" },
      amenities: { type: SchemaType.STRING, description: "Comma-separated list of amenities" },
      keyword: { type: SchemaType.STRING, description: "Search keyword" },
      lat: { type: SchemaType.NUMBER, description: "Latitude for geo search" },
      lng: { type: SchemaType.NUMBER, description: "Longitude for geo search" },
      radiusKm: { type: SchemaType.NUMBER, description: "Search radius in kilometers" },
    },
  },
  get_review_count: {
    type: SchemaType.OBJECT,
    properties: {
      propertyId: {
        type: SchemaType.STRING,
        description: "Property ID to fetch review stats for",
      },
    },
    required: ["propertyId"],
  },
  read_image_text: {
    type: SchemaType.OBJECT,
    properties: {
      image_base64: {
        type: SchemaType.STRING,
        description: "Image data as a base64 string (data URL or raw base64)",
      },
      language: {
        type: SchemaType.STRING,
        description: "OCR language code, default is eng",
      },
    },
    required: ["image_base64"],
  },
  get_pets: {
    type: SchemaType.OBJECT,
    properties: {},
  },
  get_pet_profile: {
    type: SchemaType.OBJECT,
    properties: {
      pet_id: {
        type: SchemaType.STRING,
        description: "Pet profile ID",
      },
    },
    required: ["pet_id"],
  },
  get_pet_service_history: {
    type: SchemaType.OBJECT,
    properties: {
      pet_id: {
        type: SchemaType.STRING,
        description: "Pet profile ID",
      },
      pet_name: {
        type: SchemaType.STRING,
        description: "Exact pet name when ID is unknown",
      },
    },
  },
  predict_next_booking: {
    type: SchemaType.OBJECT,
    properties: {
      pet_id: {
        type: SchemaType.STRING,
        description: "Pet profile ID",
      },
      pet_name: {
        type: SchemaType.STRING,
        description: "Exact pet name when ID is unknown",
      },
      include_breed_recommendations: {
        type: SchemaType.BOOLEAN,
        description: "Include breed-specific service recommendations (default: true)",
      },
      include_health_recommendations: {
        type: SchemaType.BOOLEAN,
        description: "Include health-related service recommendations (default: true)",
      },
      include_booking_pattern: {
        type: SchemaType.BOOLEAN,
        description: "Analyze historical booking patterns (default: true)",
      },
    },
  },
  create_booking: {
    type: SchemaType.OBJECT,
    properties: {
      user_id: { type: SchemaType.STRING, description: "User ID" },
      service_id: { type: SchemaType.STRING, description: "Service/property ID" },
      date: { type: SchemaType.STRING, description: "Booking date YYYY-MM-DD" },
      time: { type: SchemaType.STRING, description: "Booking time HH:mm" },
    },
    required: ["user_id", "service_id", "date", "time"],
  },
  get_user_bookings: {
    type: SchemaType.OBJECT,
    properties: {},
  },
  cancel_booking: {
    type: SchemaType.OBJECT,
    properties: {
      booking_id: { type: SchemaType.STRING, description: "Booking ID to cancel" },
    },
    required: ["booking_id"],
  },
  check_availability: {
    type: SchemaType.OBJECT,
    properties: {
      property_id: { type: SchemaType.STRING, description: "Property ID to check availability for" },
      date: { type: SchemaType.STRING, description: "Date to check availability (YYYY-MM-DD)" },
      time_slots: {
        type: SchemaType.ARRAY,
        description: "Optional array of time slots to check (e.g., ['09:00', '14:00'])",
        items: { type: SchemaType.STRING },
      },
    },
    required: ["property_id", "date"],
  },
  get_cancellation_policy: {
    type: SchemaType.OBJECT,
    properties: {
      property_id: { type: SchemaType.STRING, description: "Property ID to get cancellation policy for" },
      property_name: { type: SchemaType.STRING, description: "Property name (can be partial) to search for cancellation policy by name instead of ID" },
    },
  },
  get_booking_summary: {
    type: SchemaType.OBJECT,
    properties: {
      booking_id: { type: SchemaType.STRING, description: "Booking ID to get summary for. If not provided, retrieves the most recent booking for the authenticated user." },
    },
  },
  get_provider_revenue: {
    type: SchemaType.OBJECT,
    properties: {
      provider_id: { type: SchemaType.STRING, description: "Provider user ID" },
      month: { type: SchemaType.STRING, description: "Month as YYYY-MM" },
    },
    required: ["provider_id"],
  },
};

export const getGeminiToolSchemaByName = (toolName: string): GeminiParameterSchema => {
  if (toolName in GEMINI_TOOL_SCHEMAS) {
    return GEMINI_TOOL_SCHEMAS[toolName as ToolName];
  }

  return {
    type: SchemaType.OBJECT,
    properties: {},
  };
};

const asString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const str = String(value).trim();
  return str || undefined;
};

export const sanitizeToolArgs = (
  tool: ToolName,
  args: Record<string, unknown>,
): Record<string, unknown> => {
  switch (tool) {
    case "search_services":
        return {
          location: asString(args.location),
          service_type: asString(args.service_type),
          petType: asString(args.petType) || asString(args.pet_type) || asString(args.pet),
          petTypeOptions: Array.isArray(args.petType) ? args.petType : undefined,
          dogSize: asString(args.dogSize) || asString(args.dogsize),
          dogSizeOptions: Array.isArray(args.dogSize) ? args.dogSize : undefined,
          minPrice: args.minPrice !== undefined ? Number(args.minPrice) : undefined,
          maxPrice: args.maxPrice !== undefined ? Number(args.maxPrice) : undefined,
          rating: args.rating !== undefined ? Number(args.rating) : undefined,
          amenities: asString(args.amenities),
          keyword: asString(args.keyword),
          lat: args.lat !== undefined ? Number(args.lat) : undefined,
          lng: args.lng !== undefined ? Number(args.lng) : undefined,
          radiusKm: args.radiusKm !== undefined ? Number(args.radiusKm) : undefined,
        };
    case "get_review_count":
      return {
        propertyId: asString(args.propertyId) || asString(args.property_id),
      };
    case "read_image_text":
      return {
        image_base64: asString(args.image_base64) || asString(args.imageBase64),
        language: asString(args.language),
      };
    case "get_pets":
      return {};
    case "get_pet_profile":
      return {
        pet_id: asString(args.pet_id) || asString(args.id),
      };
    case "get_pet_service_history":
      return {
        pet_id: asString(args.pet_id) || asString(args.id),
        pet_name: asString(args.pet_name) || asString(args.name),
      };
    case "predict_next_booking":
      return {
        pet_id: asString(args.pet_id) || asString(args.id),
        pet_name: asString(args.pet_name) || asString(args.name),
        include_breed_recommendations: args.include_breed_recommendations !== undefined ? Boolean(args.include_breed_recommendations) : undefined,
        include_health_recommendations: args.include_health_recommendations !== undefined ? Boolean(args.include_health_recommendations) : undefined,
        include_booking_pattern: args.include_booking_pattern !== undefined ? Boolean(args.include_booking_pattern) : undefined,
      };
    case "create_booking":
      return {
        user_id: asString(args.user_id),
        service_id: asString(args.service_id),
        date: asString(args.date),
        time: asString(args.time),
      };
    case "get_user_bookings":
      return {};
    case "cancel_booking":
      return { booking_id: asString(args.booking_id) };
    case "check_availability":
      return {
        property_id: asString(args.property_id),
        date: asString(args.date),
        time_slots: Array.isArray(args.time_slots) ? args.time_slots : undefined,
      };
    case "get_cancellation_policy":
      return {
        property_id: asString(args.property_id),
      };
    case "get_booking_summary":
      return {
        booking_id: asString(args.booking_id) || undefined,
      };
    case "get_provider_revenue":
      return {
        provider_id: asString(args.provider_id),
        month: asString(args.month),
      };
    default:
      return {};
  }
};

export const validateToolArgs = (
  tool: ToolName,
  args: Record<string, unknown>,
): { ok: true } | { ok: false; errors: string[] } => {
  const requiredString = (key: string) => {
    const value = args[key];
    return typeof value === "string" && value.trim().length > 0;
  };

  const errors: string[] = [];

  switch (tool) {
    case "search_services":
      return { ok: true };
    case "get_review_count":
      if (!requiredString("propertyId")) errors.push("propertyId is required");
      break;
    case "read_image_text":
      if (!requiredString("image_base64")) errors.push("image_base64 is required");
      break;
    case "get_pets":
      return { ok: true };
    case "get_pet_profile":
      if (!requiredString("pet_id")) errors.push("pet_id is required");
      break;
    case "get_pet_service_history":
      if (!requiredString("pet_id") && !requiredString("pet_name")) {
        errors.push("pet_id or pet_name is required");
      }
      break;
    case "predict_next_booking":
      if (!requiredString("pet_id") && !requiredString("pet_name")) {
        errors.push("pet_id or pet_name is required");
      }
      break;
    case "create_booking": {
      if (!requiredString("user_id")) errors.push("user_id is required");
      if (!requiredString("service_id")) errors.push("service_id is required");
      if (!requiredString("date")) {
        errors.push("date is required");
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(String(args.date))) {
        errors.push("date must be YYYY-MM-DD");
      }

      if (!requiredString("time")) {
        errors.push("time is required");
      } else if (!/^\d{2}:\d{2}$/.test(String(args.time))) {
        errors.push("time must be HH:mm");
      }
      break;
    }
    case "get_user_bookings":
      // no required arguments — operates on the authenticated user's bookings
      break;
    case "cancel_booking":
      if (!requiredString("booking_id")) errors.push("booking_id is required");
      break;
    case "check_availability":
      if (!requiredString("property_id")) errors.push("property_id is required");
      if (!requiredString("date")) {
        errors.push("date is required");
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(String(args.date))) {
        errors.push("date must be YYYY-MM-DD");
      }
      break;
    case "get_cancellation_policy":
      if (!requiredString("property_id")) errors.push("property_id is required");
      break;
    case "get_booking_summary":
      // booking_id is optional - if not provided, will retrieve most recent booking
      break;
    case "get_provider_revenue":
      if (!requiredString("provider_id")) errors.push("provider_id is required");
      if (
        args.month !== undefined &&
        args.month !== null &&
        !/^\d{4}-\d{2}$/.test(String(args.month))
      ) {
        errors.push("month must be YYYY-MM when provided");
      }
      break;
    default:
      errors.push("Unsupported tool");
      break;
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
};
