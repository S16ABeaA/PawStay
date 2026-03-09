const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

export async function fetchRandomProperties() {
  const res = await fetch(`${API_BASE_URL}/api/properties/randomproperty`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!res.ok) throw new Error("Failed to fetch properties");

  const data = await res.json();
  return data.properties;
}
