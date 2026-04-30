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
  const data = await authHelper.get(`/api/properties/${id}`);
  return data.property;
}

export async function fetchPropertyReviews(propertyId: string) {
  const data = await authHelper.get(`/api/properties/${propertyId}/reviews`);
  return data.reviews ?? [];
}
