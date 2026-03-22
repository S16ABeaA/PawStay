import { backendApiClient } from "../../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../../schemas";
import { ToolDefinition } from "../../types";

export interface GetPropertyServicesArgs {
  service_type: "hotel" | "vet" | "grooming" | "all";
  location?: string;
  keyword?: string;
}

interface PropertyServiceItem {
  id: string;
  name: string;
  city: string | null;
  rating: number | null;
  review_count: number | null;
  totalReviews: number | null;
  price: number | null;
  service_type: "hotel" | "vet" | "grooming" | "all";
  services: {
    id: string;
    name: string;
    category: string | null;
    description: string | null;
    price: number | null;
  }[];
}

interface GetPropertyServicesResult {
  service_type: "hotel" | "vet" | "grooming" | "all";
  total: number;
  properties: PropertyServiceItem[];
}

const normalizeServiceType = (
  serviceType: string,
): "hotel" | "vet" | "grooming" | "all" => {
  const value = String(serviceType || "").trim().toLowerCase();
  if (value === "vet" || value === "veterinary") return "vet";
  if (value === "grooming" || value === "groomer") return "grooming";
  if (value === "hotel" || value === "boarding" || value === "accommodation") return "hotel";
  if (value === "all") return "all";
  return "all";
};

const resolvePropertyType = (serviceType: "hotel" | "vet" | "grooming" | "all") => {
  if (serviceType === "hotel") return "hotel";
  if (serviceType === "grooming") return "grooming";
  if (serviceType === "vet") return "veterinary";
  return undefined;
};

const resolveServiceCategory = (serviceType: "hotel" | "vet" | "grooming" | "all") => {
  if (serviceType === "hotel") return "Boarding";
  if (serviceType === "grooming") return "Grooming";
  if (serviceType === "vet") return "Veterinary";
  return undefined;
};

export const getPropertyServicesTool: ToolDefinition<GetPropertyServicesArgs, GetPropertyServicesResult> = {
  name: "get_property_services",
  description:
    "Retrieves properties and their actual service list filtered by a required service_type (hotel, vet, grooming, or all).",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_property_services,
  run: async (args) => {
    const serviceType = normalizeServiceType(args?.service_type || "all");

    const response = await backendApiClient.request<any>("/api/properties/search", {
      method: "GET",
      query: {
        location: args?.location,
        keyword: args?.keyword,
        propertyType: resolvePropertyType(serviceType),
        serviceCategory: resolveServiceCategory(serviceType),
      },
    });

    const rows = Array.isArray(response?.properties) ? response.properties : [];

    rows.sort((a: any, b: any) => {
      const ra = typeof a?.rating === "number" ? a.rating : Number(a?.rating) || 0;
      const rb = typeof b?.rating === "number" ? b.rating : Number(b?.rating) || 0;
      return rb - ra;
    });

    const topRows = rows.slice(0, 10);

    const categoryFilter = resolveServiceCategory(serviceType)?.toLowerCase();

    const propertiesWithServices = await Promise.all(
      topRows.map(async (row: any) => {
        const propertyId = String(row?.id ?? "");

        let services: any[] = [];
        if (propertyId) {
          try {
            const servicesResponse = await backendApiClient.request<any>(
              `/api/properties/${propertyId}/services`,
              {
                method: "GET",
              },
            );
            const rawServices = Array.isArray(servicesResponse?.services)
              ? servicesResponse.services
              : [];

            services = categoryFilter
              ? rawServices.filter((svc: any) =>
                  String(svc?.category || "")
                    .trim()
                    .toLowerCase()
                    .includes(categoryFilter),
                )
              : rawServices;
          } catch {
            services = [];
          }
        }

        return {
          id: propertyId,
          name: String(row?.name ?? "Unknown"),
          city: row?.city ?? row?.location ?? null,
          rating: typeof row?.rating === "number" ? row.rating : Number(row?.rating) || null,
          review_count:
            typeof row?.review_count === "number"
              ? row.review_count
              : Number(row?.review_count ?? row?.reviewCount) || null,
          totalReviews:
            typeof row?.review_count === "number"
              ? row.review_count
              : Number(row?.review_count ?? row?.reviewCount) || null,
          price:
            typeof row?.cheapest_service_price === "number"
              ? row.cheapest_service_price
              : typeof row?.price === "number"
                ? row.price
                : Number(row?.cheapest_service_price ?? row?.price ?? row?.base_price) || null,
          service_type: serviceType,
          services: services.slice(0, 8).map((svc: any) => ({
            id: String(svc?.id ?? ""),
            name: String(svc?.name ?? "Unnamed Service"),
            category: svc?.category ?? null,
            description: svc?.description ?? null,
            price:
              typeof svc?.price === "number"
                ? svc.price
                : Number(svc?.price ?? svc?.base_price) || null,
          })),
        };
      }),
    );

    return {
      service_type: serviceType,
      total: rows.length,
      properties: propertiesWithServices,
    };
  },
};
