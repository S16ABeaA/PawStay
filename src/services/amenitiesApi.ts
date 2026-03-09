const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

export async function fetchAmenities(serviceType: string) {
  const qp = new URLSearchParams({ serviceType });
  const res = await fetch(`${API_BASE_URL}/api/amenities?${qp.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Failed to fetch amenities of service type: " + serviceType);

  const data = await res.json();
  return data.amenities ?? data.properties ?? [];
}
