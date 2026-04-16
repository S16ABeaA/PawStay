import { SchemaType } from "@google/generative-ai";
import { ToolName } from "../types";

export type GeminiParameterSchema = Record<string, unknown>;

export const SUPPORTED_TOOL_NAMES: readonly ToolName[] = [
  "search_property",
  "get_service_details",
  "get_nearby_services",
  "search_services",
  "get_property_services",
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
  "modify_reservation",
  "get_cancellation_policy",
  "get_booking_summary",
  "get_provider_revenue",
  "get_user_profile",
  "update_user_preferences",
  "get_booking_history",
  "get_reviews",
  "summarize_reviews",
  "get_service_recommendations",
  "generate_personalized_recommendations",
  "suggest_alternative_services",
  "auto_match_specialist",
  "get_area_booking_trends",
  "analyze_booking_frequency",
  "predict_service_occupancy",
  "analyze_pet_photo",
  "get_vaccination_records",
  "analyze_pet_health_data",
  "extract_medical_data",
  "validate_record_authenticity",
  "generate_pet_care_predictions",
  "predict_grooming_cycle",
  "predict_wellness_milestones",
  "compile_pet_health_timeline",
  "record_diagnostic_history",
  "confirm_match",
  "create_reservation",
  "cancel_reservation",
  "auto_rebook_cancellation",
  "submit_review",
  "set_appointment_reminder",
  "notify_availability_change",
  "notify_service_availability",
  "notify_pet_needing_service",
  "notify_payment_dues",
  "get_faq_answer",
  "report_issue",
  "escalate_to_human",
  "geocode_address",
  "estimate_peak_travel_time",
  "give_business_recommendations",
  "recommend_strategies",
  "prescribe_recommendations_businesses",
] as const;

export const SUPPORTED_TOOLS = new Set<string>(SUPPORTED_TOOL_NAMES);

export const TOOL_INPUT_SCHEMA_TEXT: Record<string, string> = {
  search_property:
    "{ location?: string, service_type?: string, checkin?: string, checkout?: string, timeSlot?: string, petType?: string|string[], dogSize?: string|string[], propertyType?: string, serviceCategory?: string, minPrice?: number, maxPrice?: number, rating?: number, amenities?: string|string[], keyword?: string, lat?: number, lng?: number, radiusKm?: number }",
  get_service_details:
    "{ property_id?: string, property_name?: string, service_type?: string, location?: string, keyword?: string }",
  get_nearby_services:
    "{ location?: string, service_type?: string, keyword?: string, lat?: number, lng?: number, radiusKm?: number }",
  search_services:
    "{ location?: string, service_type?: string, checkin?: string, checkout?: string, timeSlot?: string, petType?: string|string[], dogSize?: string|string[], propertyType?: string, serviceCategory?: string, minPrice?: number, maxPrice?: number, rating?: number, amenities?: string|string[], keyword?: string, lat?: number, lng?: number, radiusKm?: number }",
  get_property_services: "{ service_type?: string, location?: string, keyword?: string }",
  get_review_count: "{ propertyId: string }",
  read_image_text: "{ image_base64: string, language?: string }",
  get_pets: "{}",
  get_pet_profile: "{ pet_id: string }",
  get_pet_service_history: "{ pet_id?: string, pet_name?: string }",
  predict_next_booking: "{ pet_id?: string, pet_name?: string, include_breed_recommendations?: boolean, include_health_recommendations?: boolean, include_booking_pattern?: boolean }",
  create_booking:
    "{ date: string, time?: string, property_id?: string, service_id?: string, service_name?: string, service_type?: string, pet_id?: string, pet_name?: string, pet_type?: string, pet_breed?: string, special_requirements?: string, checkout?: string, payment_method?: string, reference_number?: string, amount_paid?: number, subtotal?: number, service_fee?: number, total_price?: number }",
  get_user_bookings: "{}",
  cancel_booking: "{ booking_id: string }",
  check_availability: "{ property_id: string, date: string, time_slots?: string[] }",
  modify_reservation: "{ booking_id: string, date?: string, time?: string, service_id?: string }",
  get_cancellation_policy: "{ property_id?: string, property_name?: string }",
  get_booking_summary: "{ booking_id?: string }",
  get_provider_revenue: "{ provider_id?: string, month?: string }",
  get_user_profile: "{}",
  update_user_preferences:
    "{ preferred_location?: string, preferred_service_types?: string[], notification_settings?: { newBookings?: boolean, bookingReminders?: boolean, newReviews?: boolean, marketingUpdates?: boolean } }",
  get_booking_history: "{}",
  get_reviews: "{ property_id: string }",
  summarize_reviews: "{ property_id?: string, reviews?: { rating?: number, comment?: string }[] }",
  get_service_recommendations:
    "{ service_type?: string, location?: string, pet_type?: string|string[], keyword?: string }",
  generate_personalized_recommendations: "{ limit?: number }",
  suggest_alternative_services:
    "{ location?: string, service_type?: string, keyword?: string, unavailable_property_id?: string }",
  auto_match_specialist:
    "{ pet_condition?: string, service_type?: string, location?: string, keyword?: string }",
  get_area_booking_trends: "{ location?: string, days?: number }",
  analyze_booking_frequency: "{ location?: string, days?: number }",
  predict_service_occupancy:
    "{ property_id?: string, provider_id?: string, date?: string, location?: string, service_type?: string, keyword?: string }",
  analyze_pet_photo: "{ image_base64?: string, pet_id?: string, pet_name?: string }",
  get_vaccination_records: "{ pet_id?: string, pet_name?: string }",
  analyze_pet_health_data: "{ pet_id: string }",
  extract_medical_data: "{ pet_id: string }",
  validate_record_authenticity: "{ pet_id: string }",
  generate_pet_care_predictions: "{ pet_id?: string, pet_name?: string }",
  predict_grooming_cycle: "{ pet_id?: string, pet_name?: string }",
  predict_wellness_milestones: "{ pet_id?: string, pet_name?: string }",
  compile_pet_health_timeline: "{ pet_id: string }",
  record_diagnostic_history: "{ pet_id: string }",
  confirm_match:
    "{ provider_id?: string, provider_name?: string, service_id?: string, service?: string, date?: string, time?: string, price?: number }",
  create_reservation:
    "{ date: string, time?: string, service_id?: string, property_id?: string, provider_id?: string, service_name?: string, service_type?: string, pet_id?: string, pet_name?: string, checkout?: string, special_requirements?: string, payment_method?: string }",
  cancel_reservation: "{ booking_id: string }",
  auto_rebook_cancellation:
    "{ date: string, time?: string, service_id?: string, property_id?: string, provider_id?: string, service_name?: string, service_type?: string, pet_id?: string, pet_name?: string, checkout?: string, special_requirements?: string, payment_method?: string }",
  submit_review: "{ booking_id: string, rating: number, comment?: string }",
  set_appointment_reminder:
    "{ user_id?: string, booking_id?: string, provider_name?: string, appointment_datetime?: string, mode?: 'pre-appointment'|'review_prompt', date?: string, time?: string }",
  notify_availability_change:
    "{ user_id?: string, provider_name?: string, date?: string, status?: string, link?: string }",
  notify_service_availability:
    "{ user_id?: string, provider_name?: string, status?: string, link?: string }",
  notify_pet_needing_service:
    "{ user_id?: string, pet_id?: string, pet_name?: string, service?: string, last_appointment_date?: string }",
  notify_payment_dues: "{ user_id?: string, amount?: number, due_date?: string, link?: string }",
  get_faq_answer: "{ question: string }",
  report_issue: "{ issue_type: string, description: string, booking_id?: string, priority?: string }",
  escalate_to_human: "{ reason?: string, description?: string }",
  geocode_address: "{ query?: string, address?: string, location?: string }",
  estimate_peak_travel_time: "{ origin: string, destination: string, departure_time?: string }",
  give_business_recommendations: "{ property_id?: string }",
  recommend_strategies: "{ property_id?: string, location?: string, date?: string, days?: number }",
  prescribe_recommendations_businesses: "{ location?: string, days?: number }",
};

export const GEMINI_TOOL_SCHEMAS: Record<string, GeminiParameterSchema> = {
  search_property: {
    type: SchemaType.OBJECT,
    properties: {
      location: { type: SchemaType.STRING, description: "City, area, or location keyword" },
      service_type: { type: SchemaType.STRING, description: "Service category" },
      keyword: { type: SchemaType.STRING, description: "Search keyword" },
      lat: { type: SchemaType.NUMBER, description: "Latitude for geo search" },
      lng: { type: SchemaType.NUMBER, description: "Longitude for geo search" },
      radiusKm: { type: SchemaType.NUMBER, description: "Search radius in kilometers" },
    },
  },
  get_service_details: {
    type: SchemaType.OBJECT,
    properties: {
      property_id: { type: SchemaType.STRING, description: "Property ID" },
      property_name: { type: SchemaType.STRING, description: "Property name" },
      service_type: { type: SchemaType.STRING, description: "Service category" },
      location: { type: SchemaType.STRING, description: "City or area" },
      keyword: { type: SchemaType.STRING, description: "Search keyword" },
    },
  },
  get_nearby_services: {
    type: SchemaType.OBJECT,
    properties: {
      location: { type: SchemaType.STRING, description: "City or area" },
      service_type: { type: SchemaType.STRING, description: "Service category" },
      keyword: { type: SchemaType.STRING, description: "Search keyword" },
      lat: { type: SchemaType.NUMBER, description: "Latitude" },
      lng: { type: SchemaType.NUMBER, description: "Longitude" },
      radiusKm: { type: SchemaType.NUMBER, description: "Search radius in kilometers" },
    },
  },
  search_services: {
    type: SchemaType.OBJECT,
    properties: {
      location: {
        type: SchemaType.STRING,
        description: "City, area, or location keyword (e.g. Manila, Quezon City)",
      },
      service_type: {
        type: SchemaType.STRING,
        description: "Service category or intent keyword (e.g., hotel, vet, grooming, shelter, transport)",
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
  get_property_services: {
    type: SchemaType.OBJECT,
    properties: {
      service_type: {
        type: SchemaType.STRING,
        description: "Optional service category or alias (e.g., hotel, vet, grooming, shelter, transport). Defaults to all services.",
      },
      location: {
        type: SchemaType.STRING,
        description: "Optional city or area",
      },
      keyword: {
        type: SchemaType.STRING,
        description: "Optional keyword filter",
      },
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
      user_id: { type: SchemaType.STRING, description: "Optional user ID override" },
      property_id: { type: SchemaType.STRING, description: "Property ID" },
      service_id: { type: SchemaType.STRING, description: "Service ID" },
      service_name: { type: SchemaType.STRING, description: "Service display name" },
      service_type: { type: SchemaType.STRING, description: "Service category" },
      pet_id: { type: SchemaType.STRING, description: "Pet ID" },
      pet_name: { type: SchemaType.STRING, description: "Pet name when ID is unknown" },
      pet_type: { type: SchemaType.STRING, description: "Pet species/type" },
      pet_breed: { type: SchemaType.STRING, description: "Pet breed" },
      checkout: { type: SchemaType.STRING, description: "Checkout date for boarding stays (YYYY-MM-DD)" },
      special_requirements: { type: SchemaType.STRING, description: "Special care notes" },
      date: { type: SchemaType.STRING, description: "Booking date YYYY-MM-DD" },
      time: { type: SchemaType.STRING, description: "Booking time HH:mm" },
      payment_method: { type: SchemaType.STRING, description: "Payment method" },
      reference_number: { type: SchemaType.STRING, description: "Payment reference number" },
      amount_paid: { type: SchemaType.NUMBER, description: "Amount paid" },
      subtotal: { type: SchemaType.NUMBER, description: "Subtotal amount" },
      service_fee: { type: SchemaType.NUMBER, description: "Service fee amount" },
      total_price: { type: SchemaType.NUMBER, description: "Total amount" },
    },
    required: ["date"],
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
  modify_reservation: {
    type: SchemaType.OBJECT,
    properties: {
      booking_id: { type: SchemaType.STRING, description: "Booking ID to modify" },
      date: { type: SchemaType.STRING, description: "New date YYYY-MM-DD" },
      time: { type: SchemaType.STRING, description: "New time HH:mm" },
      service_id: { type: SchemaType.STRING, description: "Optional replacement service ID" },
    },
    required: ["booking_id"],
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
      provider_id: { type: SchemaType.STRING, description: "Optional provider user ID (defaults to authenticated owner)" },
      month: { type: SchemaType.STRING, description: "Month as YYYY-MM" },
    },
  },
  get_user_profile: {
    type: SchemaType.OBJECT,
    properties: {},
  },
  update_user_preferences: {
    type: SchemaType.OBJECT,
    properties: {
      preferred_location: { type: SchemaType.STRING, description: "Preferred city or address" },
      preferred_service_types: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: "Preferred service categories",
      },
      notification_settings: {
        type: SchemaType.OBJECT,
        description: "Notification preference toggles",
      },
    },
  },
  get_booking_history: {
    type: SchemaType.OBJECT,
    properties: {},
  },
  get_reviews: {
    type: SchemaType.OBJECT,
    properties: {
      property_id: { type: SchemaType.STRING, description: "Property ID" },
    },
    required: ["property_id"],
  },
  summarize_reviews: {
    type: SchemaType.OBJECT,
    properties: {
      property_id: { type: SchemaType.STRING, description: "Property ID" },
      reviews: {
        type: SchemaType.ARRAY,
        description: "Optional inline reviews",
        items: { type: SchemaType.OBJECT },
      },
    },
  },
  get_service_recommendations: {
    type: SchemaType.OBJECT,
    properties: {
      service_type: { type: SchemaType.STRING, description: "Service category" },
      location: { type: SchemaType.STRING, description: "City or area" },
      pet_type: { type: SchemaType.STRING, description: "Pet type" },
      keyword: { type: SchemaType.STRING, description: "Search keyword" },
    },
  },
  generate_personalized_recommendations: {
    type: SchemaType.OBJECT,
    properties: {
      limit: { type: SchemaType.NUMBER, description: "Maximum recommendations" },
    },
  },
  suggest_alternative_services: {
    type: SchemaType.OBJECT,
    properties: {
      location: { type: SchemaType.STRING, description: "City or area" },
      service_type: { type: SchemaType.STRING, description: "Service category" },
      keyword: { type: SchemaType.STRING, description: "Search keyword" },
      unavailable_property_id: {
        type: SchemaType.STRING,
        description: "Property ID to exclude",
      },
    },
  },
  auto_match_specialist: {
    type: SchemaType.OBJECT,
    properties: {
      pet_condition: { type: SchemaType.STRING, description: "Condition or concern" },
      service_type: { type: SchemaType.STRING, description: "Desired service type" },
      location: { type: SchemaType.STRING, description: "City or area" },
      keyword: { type: SchemaType.STRING, description: "Additional filters" },
    },
  },
  get_area_booking_trends: {
    type: SchemaType.OBJECT,
    properties: {
      location: { type: SchemaType.STRING, description: "Target area" },
      days: { type: SchemaType.NUMBER, description: "Time window in days" },
    },
  },
  analyze_booking_frequency: {
    type: SchemaType.OBJECT,
    properties: {
      location: { type: SchemaType.STRING, description: "Target area" },
      days: { type: SchemaType.NUMBER, description: "Time window in days" },
    },
  },
  predict_service_occupancy: {
    type: SchemaType.OBJECT,
    properties: {
      property_id: { type: SchemaType.STRING, description: "Property ID" },
      provider_id: { type: SchemaType.STRING, description: "Provider ID alias" },
      date: { type: SchemaType.STRING, description: "Target date YYYY-MM-DD" },
      location: { type: SchemaType.STRING, description: "Area if property unknown" },
      service_type: { type: SchemaType.STRING, description: "Service category" },
      keyword: { type: SchemaType.STRING, description: "Search keyword" },
    },
  },
  analyze_pet_photo: {
    type: SchemaType.OBJECT,
    properties: {
      image_base64: { type: SchemaType.STRING, description: "Optional image payload" },
      pet_id: { type: SchemaType.STRING, description: "Pet ID" },
      pet_name: { type: SchemaType.STRING, description: "Pet name" },
    },
  },
  get_vaccination_records: {
    type: SchemaType.OBJECT,
    properties: {
      pet_id: { type: SchemaType.STRING, description: "Pet ID" },
      pet_name: { type: SchemaType.STRING, description: "Pet name" },
    },
  },
  analyze_pet_health_data: {
    type: SchemaType.OBJECT,
    properties: {
      pet_id: { type: SchemaType.STRING, description: "Pet ID" },
    },
    required: ["pet_id"],
  },
  extract_medical_data: {
    type: SchemaType.OBJECT,
    properties: {
      pet_id: { type: SchemaType.STRING, description: "Pet ID" },
    },
    required: ["pet_id"],
  },
  validate_record_authenticity: {
    type: SchemaType.OBJECT,
    properties: {
      pet_id: { type: SchemaType.STRING, description: "Pet ID" },
    },
    required: ["pet_id"],
  },
  generate_pet_care_predictions: {
    type: SchemaType.OBJECT,
    properties: {
      pet_id: { type: SchemaType.STRING, description: "Pet ID" },
      pet_name: { type: SchemaType.STRING, description: "Pet name" },
    },
  },
  predict_grooming_cycle: {
    type: SchemaType.OBJECT,
    properties: {
      pet_id: { type: SchemaType.STRING, description: "Pet ID" },
      pet_name: { type: SchemaType.STRING, description: "Pet name" },
    },
  },
  predict_wellness_milestones: {
    type: SchemaType.OBJECT,
    properties: {
      pet_id: { type: SchemaType.STRING, description: "Pet ID" },
      pet_name: { type: SchemaType.STRING, description: "Pet name" },
    },
  },
  compile_pet_health_timeline: {
    type: SchemaType.OBJECT,
    properties: {
      pet_id: { type: SchemaType.STRING, description: "Pet ID" },
    },
    required: ["pet_id"],
  },
  record_diagnostic_history: {
    type: SchemaType.OBJECT,
    properties: {
      pet_id: { type: SchemaType.STRING, description: "Pet ID" },
    },
    required: ["pet_id"],
  },
  confirm_match: {
    type: SchemaType.OBJECT,
    properties: {
      provider_id: { type: SchemaType.STRING, description: "Provider ID" },
      provider_name: { type: SchemaType.STRING, description: "Provider name" },
      service_id: { type: SchemaType.STRING, description: "Service ID" },
      service: { type: SchemaType.STRING, description: "Service name" },
      date: { type: SchemaType.STRING, description: "Appointment date" },
      time: { type: SchemaType.STRING, description: "Appointment time" },
      price: { type: SchemaType.NUMBER, description: "Quoted price" },
    },
  },
  create_reservation: {
    type: SchemaType.OBJECT,
    properties: {
      user_id: { type: SchemaType.STRING, description: "User ID" },
      service_id: { type: SchemaType.STRING, description: "Service ID" },
      property_id: { type: SchemaType.STRING, description: "Property ID" },
      provider_id: { type: SchemaType.STRING, description: "Provider/Property ID alias" },
      service_name: { type: SchemaType.STRING, description: "Service name" },
      service_type: { type: SchemaType.STRING, description: "Service category" },
      pet_id: { type: SchemaType.STRING, description: "Pet ID" },
      pet_name: { type: SchemaType.STRING, description: "Pet name" },
      checkout: { type: SchemaType.STRING, description: "Checkout date for boarding" },
      special_requirements: { type: SchemaType.STRING, description: "Special care notes" },
      payment_method: { type: SchemaType.STRING, description: "Payment method" },
      date: { type: SchemaType.STRING, description: "Booking date YYYY-MM-DD" },
      time: { type: SchemaType.STRING, description: "Booking time HH:mm" },
    },
    required: ["date"],
  },
  cancel_reservation: {
    type: SchemaType.OBJECT,
    properties: {
      booking_id: { type: SchemaType.STRING, description: "Booking ID" },
    },
    required: ["booking_id"],
  },
  auto_rebook_cancellation: {
    type: SchemaType.OBJECT,
    properties: {
      user_id: { type: SchemaType.STRING, description: "User ID" },
      service_id: { type: SchemaType.STRING, description: "Alternative service ID" },
      property_id: { type: SchemaType.STRING, description: "Alternative property ID" },
      provider_id: { type: SchemaType.STRING, description: "Alternative provider/property alias" },
      service_name: { type: SchemaType.STRING, description: "Service name" },
      service_type: { type: SchemaType.STRING, description: "Service category" },
      pet_id: { type: SchemaType.STRING, description: "Pet ID" },
      pet_name: { type: SchemaType.STRING, description: "Pet name" },
      checkout: { type: SchemaType.STRING, description: "Checkout date for boarding" },
      special_requirements: { type: SchemaType.STRING, description: "Special care notes" },
      payment_method: { type: SchemaType.STRING, description: "Payment method" },
      date: { type: SchemaType.STRING, description: "Booking date YYYY-MM-DD" },
      time: { type: SchemaType.STRING, description: "Booking time HH:mm" },
    },
    required: ["date"],
  },
  submit_review: {
    type: SchemaType.OBJECT,
    properties: {
      booking_id: { type: SchemaType.STRING, description: "Booking ID" },
      rating: { type: SchemaType.NUMBER, description: "Rating from 1 to 5" },
      comment: { type: SchemaType.STRING, description: "Optional review comment" },
    },
    required: ["booking_id", "rating"],
  },
  set_appointment_reminder: {
    type: SchemaType.OBJECT,
    properties: {
      user_id: { type: SchemaType.STRING, description: "User ID" },
      booking_id: { type: SchemaType.STRING, description: "Booking ID" },
      provider_name: { type: SchemaType.STRING, description: "Provider name" },
      appointment_datetime: {
        type: SchemaType.STRING,
        description: "Appointment datetime in ISO format",
      },
      mode: {
        type: SchemaType.STRING,
        description: "pre-appointment or review_prompt",
      },
    },
  },
  notify_availability_change: {
    type: SchemaType.OBJECT,
    properties: {
      user_id: { type: SchemaType.STRING, description: "Target user ID" },
      provider_name: { type: SchemaType.STRING, description: "Provider name" },
      date: { type: SchemaType.STRING, description: "Slot date" },
      status: { type: SchemaType.STRING, description: "opened or closed" },
      link: { type: SchemaType.STRING, description: "Navigation link" },
    },
  },
  notify_service_availability: {
    type: SchemaType.OBJECT,
    properties: {
      user_id: { type: SchemaType.STRING, description: "Target user ID" },
      provider_name: { type: SchemaType.STRING, description: "Provider name" },
      status: { type: SchemaType.STRING, description: "open, closed, fully booked" },
      link: { type: SchemaType.STRING, description: "Navigation link" },
    },
  },
  notify_pet_needing_service: {
    type: SchemaType.OBJECT,
    properties: {
      user_id: { type: SchemaType.STRING, description: "Target user ID" },
      pet_id: { type: SchemaType.STRING, description: "Pet ID" },
      pet_name: { type: SchemaType.STRING, description: "Pet name" },
      service: { type: SchemaType.STRING, description: "Suggested service" },
      last_appointment_date: { type: SchemaType.STRING, description: "Last appointment date" },
    },
  },
  notify_payment_dues: {
    type: SchemaType.OBJECT,
    properties: {
      user_id: { type: SchemaType.STRING, description: "Target proprietor ID" },
      amount: { type: SchemaType.NUMBER, description: "Due amount" },
      due_date: { type: SchemaType.STRING, description: "Due date" },
      link: { type: SchemaType.STRING, description: "Payment page link" },
    },
  },
  get_faq_answer: {
    type: SchemaType.OBJECT,
    properties: {
      question: { type: SchemaType.STRING, description: "FAQ question" },
    },
    required: ["question"],
  },
  report_issue: {
    type: SchemaType.OBJECT,
    properties: {
      issue_type: { type: SchemaType.STRING, description: "Issue category" },
      description: { type: SchemaType.STRING, description: "Issue description" },
      booking_id: { type: SchemaType.STRING, description: "Optional booking ID" },
      priority: { type: SchemaType.STRING, description: "Low, Medium, High, Urgent" },
    },
    required: ["issue_type", "description"],
  },
  escalate_to_human: {
    type: SchemaType.OBJECT,
    properties: {
      reason: { type: SchemaType.STRING, description: "Escalation reason" },
      description: { type: SchemaType.STRING, description: "Escalation details" },
    },
  },
  geocode_address: {
    type: SchemaType.OBJECT,
    properties: {
      query: { type: SchemaType.STRING, description: "Address text to resolve" },
      address: { type: SchemaType.STRING, description: "Address alias" },
      location: { type: SchemaType.STRING, description: "Location alias" },
    },
  },
  estimate_peak_travel_time: {
    type: SchemaType.OBJECT,
    properties: {
      origin: { type: SchemaType.STRING, description: "Origin address" },
      destination: { type: SchemaType.STRING, description: "Destination address" },
      departure_time: {
        type: SchemaType.STRING,
        description: "Optional departure datetime",
      },
    },
    required: ["origin", "destination"],
  },
  give_business_recommendations: {
    type: SchemaType.OBJECT,
    properties: {
      property_id: { type: SchemaType.STRING, description: "Optional property filter" },
    },
  },
  recommend_strategies: {
    type: SchemaType.OBJECT,
    properties: {
      property_id: { type: SchemaType.STRING, description: "Optional property filter" },
      location: { type: SchemaType.STRING, description: "Target area" },
      date: { type: SchemaType.STRING, description: "Target date" },
      days: { type: SchemaType.NUMBER, description: "Demand analysis window" },
    },
  },
  prescribe_recommendations_businesses: {
    type: SchemaType.OBJECT,
    properties: {
      location: { type: SchemaType.STRING, description: "Target area" },
      days: { type: SchemaType.NUMBER, description: "Observation window" },
    },
  },
};

export const getGeminiToolSchemaByName = (toolName: string): GeminiParameterSchema => {
  if (toolName in GEMINI_TOOL_SCHEMAS) {
    return GEMINI_TOOL_SCHEMAS[toolName];
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
    case "search_property":
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
    case "get_service_details":
      return {
        property_id: asString(args.property_id) || asString(args.id),
        property_name: asString(args.property_name) || asString(args.name),
        service_type: asString(args.service_type),
        location: asString(args.location),
        keyword: asString(args.keyword),
      };
    case "get_nearby_services":
      return {
        location: asString(args.location),
        service_type: asString(args.service_type),
        keyword: asString(args.keyword),
        lat: args.lat !== undefined ? Number(args.lat) : undefined,
        lng: args.lng !== undefined ? Number(args.lng) : undefined,
        radiusKm: args.radiusKm !== undefined ? Number(args.radiusKm) : undefined,
      };
    case "get_property_services":
      return {
        service_type: asString(args.service_type) || "all",
        location: asString(args.location),
        keyword: asString(args.keyword),
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
        property_id: asString(args.property_id) || asString(args.provider_id),
        service_id: asString(args.service_id),
        service_name: asString(args.service_name) || asString(args.service),
        service_type: asString(args.service_type),
        pet_id: asString(args.pet_id),
        pet_name: asString(args.pet_name),
        pet_type: asString(args.pet_type),
        pet_breed: asString(args.pet_breed),
        checkout: asString(args.checkout),
        special_requirements: asString(args.special_requirements),
        date: asString(args.date),
        time: asString(args.time) || asString(args.time_slot),
        payment_method: asString(args.payment_method),
        reference_number: asString(args.reference_number),
        amount_paid: args.amount_paid !== undefined ? Number(args.amount_paid) : undefined,
        subtotal: args.subtotal !== undefined ? Number(args.subtotal) : undefined,
        service_fee: args.service_fee !== undefined ? Number(args.service_fee) : undefined,
        total_price: args.total_price !== undefined ? Number(args.total_price) : undefined,
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
    case "modify_reservation":
      return {
        booking_id: asString(args.booking_id),
        date: asString(args.date),
        time: asString(args.time),
        service_id: asString(args.service_id),
      };
    case "get_cancellation_policy":
      return {
        property_id: asString(args.property_id),
        property_name: asString(args.property_name),
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
    case "analyze_pet_photo":
      return {
        image_base64: asString(args.image_base64) || asString(args.imageBase64),
        pet_id: asString(args.pet_id) || asString(args.id),
        pet_name: asString(args.pet_name) || asString(args.name),
      };
    case "get_vaccination_records":
      return {
        pet_id: asString(args.pet_id) || asString(args.id),
        pet_name: asString(args.pet_name) || asString(args.name),
      };
    case "extract_medical_data":
    case "validate_record_authenticity":
    case "compile_pet_health_timeline":
    case "record_diagnostic_history":
      return {
        pet_id: asString(args.pet_id) || asString(args.id),
      };
    case "predict_grooming_cycle":
    case "predict_wellness_milestones":
      return {
        pet_id: asString(args.pet_id) || asString(args.id),
        pet_name: asString(args.pet_name) || asString(args.name),
      };
    case "create_reservation":
    case "auto_rebook_cancellation":
      return {
        user_id: asString(args.user_id),
        property_id: asString(args.property_id) || asString(args.provider_id),
        provider_id: asString(args.provider_id),
        service_id: asString(args.service_id),
        service_name: asString(args.service_name) || asString(args.service),
        service_type: asString(args.service_type),
        pet_id: asString(args.pet_id),
        pet_name: asString(args.pet_name),
        checkout: asString(args.checkout),
        special_requirements: asString(args.special_requirements),
        payment_method: asString(args.payment_method),
        date: asString(args.date),
        time: asString(args.time) || asString(args.time_slot),
      };
    case "cancel_reservation":
      return {
        booking_id: asString(args.booking_id),
      };
    default:
      return { ...args };
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
    case "search_property":
    case "search_services":
      return { ok: true };
    case "get_service_details":
    case "get_nearby_services":
      return { ok: true };
    case "get_property_services": {
      break;
    }
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
      if (!requiredString("service_id") && !requiredString("property_id")) {
        errors.push("service_id or property_id is required");
      }
      if (!requiredString("date")) {
        errors.push("date is required");
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(String(args.date))) {
        errors.push("date must be YYYY-MM-DD");
      }

      const hasCheckout = requiredString("checkout");
      if (!requiredString("time") && !hasCheckout) {
        errors.push("time is required unless checkout is provided");
      } else if (requiredString("time") && !/^(?:\d{1,2}:\d{2}|\d{1,2}\s*(?:am|pm))$/i.test(String(args.time).trim())) {
        errors.push("time must be HH:mm or h[:mm] am/pm");
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
    case "modify_reservation":
      if (!requiredString("booking_id")) errors.push("booking_id is required");
      break;
    case "get_cancellation_policy":
      if (!requiredString("property_id") && !requiredString("property_name")) {
        errors.push("property_id or property_name is required");
      }
      break;
    case "get_booking_summary":
      // booking_id is optional - if not provided, will retrieve most recent booking
      break;
    case "get_provider_revenue":
      if (
        args.month !== undefined &&
        args.month !== null &&
        !/^\d{4}-\d{2}$/.test(String(args.month))
      ) {
        errors.push("month must be YYYY-MM when provided");
      }
      break;
    case "get_reviews":
      if (!requiredString("property_id") && !requiredString("propertyId")) {
        errors.push("property_id is required");
      }
      break;
    case "get_vaccination_records":
      if (!requiredString("pet_id") && !requiredString("pet_name")) {
        errors.push("pet_id or pet_name is required");
      }
      break;
    case "analyze_pet_health_data":
      if (!requiredString("pet_id")) errors.push("pet_id is required");
      break;
    case "extract_medical_data":
    case "validate_record_authenticity":
    case "compile_pet_health_timeline":
    case "record_diagnostic_history":
      if (!requiredString("pet_id")) errors.push("pet_id is required");
      break;
    case "create_reservation":
    case "auto_rebook_cancellation": {
      if (!requiredString("service_id") && !requiredString("property_id") && !requiredString("provider_id")) {
        errors.push("service_id, property_id, or provider_id is required");
      }
      if (!requiredString("date")) {
        errors.push("date is required");
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(String(args.date))) {
        errors.push("date must be YYYY-MM-DD");
      }
      const hasCheckout = requiredString("checkout");
      if (!requiredString("time") && !hasCheckout) {
        errors.push("time is required unless checkout is provided");
      } else if (requiredString("time") && !/^(?:\d{1,2}:\d{2}|\d{1,2}\s*(?:am|pm))$/i.test(String(args.time).trim())) {
        errors.push("time must be HH:mm or h[:mm] am/pm");
      }
      break;
    }
    case "cancel_reservation":
      if (!requiredString("booking_id")) errors.push("booking_id is required");
      break;
    case "submit_review":
      if (!requiredString("booking_id")) errors.push("booking_id is required");
      if (args.rating === undefined || args.rating === null || Number.isNaN(Number(args.rating))) {
        errors.push("rating is required");
      }
      break;
    case "report_issue":
      if (!requiredString("issue_type")) errors.push("issue_type is required");
      if (!requiredString("description")) errors.push("description is required");
      break;
    case "estimate_peak_travel_time":
      if (!requiredString("origin")) errors.push("origin is required");
      if (!requiredString("destination")) errors.push("destination is required");
      break;
    case "get_faq_answer":
      if (!requiredString("question") && !requiredString("query")) {
        errors.push("question is required");
      }
      break;
    default:
      // New tools without strict argument constraints pass through.
      break;
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
};
