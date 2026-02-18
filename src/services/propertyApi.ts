type PropertyFilters = {
  location?: string;
  petType?: string;
  dogSize?: string;
  propertyType?: string;
  serviceCategory?: string;  // per-service filter: Boarding, Grooming, Veterinary, etc.
  checkIn?: string;
  checkOut?: string;
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
  const res = await fetch("/api/properties/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filters),
  });

  if (!res.ok) throw new Error("Failed to fetch properties");

  const data = await res.json();
  return data.properties;
}
