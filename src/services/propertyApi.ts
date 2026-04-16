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
  const normalizeListFilter = (value?: string | string[]): string | undefined => {
    if (Array.isArray(value)) {
      const items = value
        .map((entry) => String(entry || "").trim())
        .filter(Boolean);
      return items.length ? items.join(",") : undefined;
    }

    const text = String(value || "").trim();
    return text || undefined;
  };

  const payload = {
    ...filters,
    petType: normalizeListFilter(filters.petType),
    dogSize: normalizeListFilter(filters.dogSize),
    amenities: normalizeListFilter(filters.amenities),
  };

  const res = await fetch("/api/properties/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to fetch properties");

  const data = await res.json();
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
