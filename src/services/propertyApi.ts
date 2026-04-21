import { authHelper } from "../helpers/authHelper";

type PropertyFilters = {
  location?: string;
  petType?: string | string[];
  dogSize?: string | string[];
  propertyType?: string;
  serviceCategory?: string;  // per-service filter: Boarding, Grooming, Veterinary, etc.
  checkIn?: string;
  checkOut?: string;
  timeSlot?: string;          // for same-day services like grooming/vet
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  amenities?: string[];
  keyword?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
};

export async function fetchProperties(filters: PropertyFilters) {
  const data = await authHelper.post("/api/properties/search", filters);
  return data.properties;
}

export async function fetchPropertyById(id: string) {
  const res = await fetch(`/api/properties/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Failed to fetch property details");

  const data = await res.json();
  return data.property;
}

export async function fetchPropertyReviews(propertyId: string) {
  const res = await fetch(`/api/properties/${propertyId}/reviews`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.reviews ?? [];
}
