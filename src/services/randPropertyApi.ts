import { authHelper } from "@/helpers/authHelper";

export async function fetchRandomProperties() {
  const res = await fetch("/api/properties/randomproperty", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!res.ok) throw new Error("Failed to fetch properties");

  const data = await res.json();
  return data.properties;
}

export async function fetchRecommendedProperties(limit = 6) {
  const data = await authHelper.get(`/api/properties/recommended?limit=${limit}`);
  return data.properties;
}
