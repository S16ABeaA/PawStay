import { backendApiClient } from "../../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../../schemas";
import { ToolDefinition } from "../../types";
import {
  inferServiceTypeFromText,
  resolveServiceIntent,
} from "./serviceTaxonomy";

export interface SearchServicesArgs {
  location?: string;
  service_type?: string;
  serviceType?: string;
  checkIn?: string;
  checkin?: string;
  checkout?: string;
  checkOut?: string;
  timeSlot?: string;
  time_slot?: string;
  petType?: string | string[];
  pet?: string | string[];
  dogSize?: string | string[];
  dogsize?: string | string[];
  propertyType?: string;
  type?: string;
  serviceCategory?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  rating?: number | string;
  amenities?: string | string[];
  keyword?: string;
  lat?: number | string;
  lng?: number | string;
  radiusKm?: number | string;
}

interface SearchServiceItem {
  id: string;
  name: string;
  city: string | null;
  rating: number | null;
  review_count: number | null;
  totalReviews: number | null;
  price: number | null;
}

interface SearchServicesResult {
  total: number;
  properties: SearchServiceItem[];
}

const asString = (v: any): string | undefined => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
};

const asNumber = (v: any): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const normalizeStringOrArray = (v: any): string | string[] | undefined => {
  if (v === undefined || v === null) return undefined;
  if (Array.isArray(v)) {
    const items = v.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
    return items.length === 1 ? items[0] : (items.length > 0 ? items : undefined);
  }
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return undefined;
    if (s.includes(',')) {
      const items = s.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
      return items.length === 1 ? items[0] : (items.length > 0 ? items : undefined);
    }
    return s.toLowerCase();
  }
  return String(v).trim().toLowerCase();
};

const normalizeAmenities = (v: any): string[] | undefined => {
  if (v === undefined || v === null) return undefined;
  if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
  return undefined;
};

const toQueryString = (v: string | string[] | undefined): string | undefined => {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v.join(",") : v;
};

export const searchServicesTool: ToolDefinition<SearchServicesArgs, SearchServicesResult> = {
  name: "search_services",
  description: "Search pet services by location, service type, dates, pet filters, price, amenities, and geo radius",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.search_services,
  run: async (args, context) => {
    // If caller didn't provide a location or service_type, try to infer from the user's message
    const msg = String(context?.userMessage ?? "").trim();

    const inferLocationFromMessage = (text: string): string | undefined => {
      if (!text) return undefined;
      // match "near <place>" or "in <place>"
      const near = text.match(/\bnear\s+([a-zA-Z\s]+)/i);
      if (near && near[1]) return near[1].trim();
      const inn = text.match(/\bin\s+([a-zA-Z\s]+)/i);
      if (inn && inn[1]) return inn[1].trim();
      return undefined;
    };

    const inferredLocation = inferLocationFromMessage(msg);
    const inferredService = inferServiceTypeFromText(msg);

    const source = (args || {}) as SearchServicesArgs & Record<string, any>;

    const finalLocation = asString(source.location) || inferredLocation;
    const finalServiceText =
      asString(source.service_type) ||
      asString(source.serviceType) ||
      inferredService;
    const explicitCategory = asString(source.serviceCategory);

    const resolvedFromServiceType = resolveServiceIntent(finalServiceText);
    const resolvedFromCategory = resolveServiceIntent(explicitCategory);

    const resolvedCategory =
      explicitCategory
        ? resolvedFromCategory.category
        : resolvedFromServiceType.category;

    const resolvedPropertyType =
      asString(source.propertyType || source.type)?.toLowerCase() ||
      resolvedFromServiceType.propertyType;

    const response = await backendApiClient.request<any>("/api/properties/search", {
      method: "GET",
      query: {
        location: finalLocation,
        checkin: asString(source.checkin || source.checkIn),
        checkout: asString(source.checkout || source.checkOut),
        timeSlot: asString(source.timeSlot || source.time_slot),
        petType: toQueryString(normalizeStringOrArray(source.petType || source.pet)),
        dogSize: toQueryString(normalizeStringOrArray(source.dogSize || source.dogsize)),
        propertyType: resolvedPropertyType,
        serviceCategory: resolvedCategory,
        minPrice: asNumber(source.minPrice),
        maxPrice: asNumber(source.maxPrice),
        rating: asNumber(source.rating),
        amenities: toQueryString(normalizeAmenities(source.amenities)),
        keyword: asString(source.keyword),
        lat: asNumber(source.lat),
        lng: asNumber(source.lng),
        radiusKm: asNumber(source.radiusKm),
      },
    });

    const rows = Array.isArray(response?.properties) ? response.properties : [];

    // Sort by rating (highest first). Treat missing or unparsable ratings as 0.
    rows.sort((a: any, b: any) => {
      const ra = typeof a?.rating === "number" ? a.rating : (Number(a?.rating) || 0);
      const rb = typeof b?.rating === "number" ? b.rating : (Number(b?.rating) || 0);
      return rb - ra;
    });

    return {
      total: rows.length,
      properties: rows.slice(0, 5).map((row: any) => ({
        id: String(row?.id ?? ""),
        name: String(row?.name ?? "Unknown"),
        city: row?.city ?? row?.location ?? null,
        rating: typeof row?.rating === "number" ? row.rating : (Number(row?.rating) || null),
        review_count:
          typeof row?.review_count === "number"
            ? row.review_count
            : (Number(row?.review_count ?? row?.reviewCount) || null),
        totalReviews:
          typeof row?.review_count === "number"
            ? row.review_count
            : (Number(row?.review_count ?? row?.reviewCount) || null),
        price:
          typeof row?.cheapest_service_price === "number"
            ? row.cheapest_service_price
            : (typeof row?.price === "number"
              ? row.price
              : (Number(row?.cheapest_service_price ?? row?.price ?? row?.base_price) || null)),
      })),
    };
  },
};
