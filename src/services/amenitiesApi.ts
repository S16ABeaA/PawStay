export async function fetchAmenities(serviceType: string) {
  const res = await fetch("/api/amenities/servicetype", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serviceType }),
  });

  if (!res.ok) throw new Error("Failed to fetch amenities of service type: " + serviceType);

  const data = await res.json();
  return data.properties;
}
