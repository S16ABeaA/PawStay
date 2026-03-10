import { backendApiClient } from "../http/backendApiClient";
import { ToolDefinition } from "../types";

export interface SearchServicesArgs {
  location?: string;
  service_type?: string;
}

interface SearchServiceItem {
  id: string;
  name: string;
  city: string | null;
  rating: number | null;
  price: number | null;
}

interface SearchServicesResult {
  total: number;
  properties: SearchServiceItem[];
}

const normalizeServiceCategory = (serviceType?: string): string | undefined => {
  if (!serviceType) return undefined;
  const value = serviceType.trim().toLowerCase();

  // Map common chat terms to backend categories used by property search
  if (["hotel", "boarding", "pet hotel"].includes(value)) return "Boarding";
  if (["grooming", "groomer", "spa"].includes(value)) return "Grooming";
  if (["vet", "veterinary", "clinic"].includes(value)) return "Veterinary";
  if (["walking", "dog walking", "walker"].includes(value)) return "Walking";
  if (["sitting", "pet sitting", "sitter"].includes(value)) return "Pet Sitting";

  // Fallback: title-case arbitrary value
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const searchServicesTool: ToolDefinition<SearchServicesArgs, SearchServicesResult> = {
  name: "search_services",
  description: "Search pet services by location and service type",
  inputSchema: "{ location?: string, service_type?: string }",
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

    const inferServiceTypeFromMessage = (text: string): string | undefined => {
      const t = text.toLowerCase();
      if (/\bgroom/.test(t)) return "Grooming";
      if (/\bboard|boarding|hotel/.test(t)) return "Boarding";
      if (/\bvet|clinic|veterin/.test(t)) return "Veterinary";
      if (/walk/.test(t)) return "Walking";
      if (/sit|sitter/.test(t)) return "Pet Sitting";
      return undefined;
    };

    const inferredLocation = inferLocationFromMessage(msg);
    const inferredService = inferServiceTypeFromMessage(msg);

    const finalLocation = (args.location && String(args.location).trim()) || inferredLocation;
    const finalService = (args.service_type && String(args.service_type).trim()) || inferredService;

    const response = await backendApiClient.request<any>("/api/properties/search", {
      method: "GET",
      query: {
        location: finalLocation,
        serviceCategory: normalizeServiceCategory(finalService),
      },
    });

    const rows = Array.isArray(response?.properties) ? response.properties : [];
    return {
      total: rows.length,
      properties: rows.slice(0, 5).map((row: any) => ({
        id: String(row?.id ?? ""),
        name: String(row?.name ?? "Unknown"),
        city: row?.city ?? row?.location ?? null,
        rating: typeof row?.rating === "number" ? row.rating : (Number(row?.rating) || null),
        price: typeof row?.price === "number" ? row.price : (Number(row?.price ?? row?.base_price) || null),
      })),
    };
  },
};
