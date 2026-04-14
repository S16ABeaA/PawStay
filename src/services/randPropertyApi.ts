import { authHelper } from "@/helpers/authHelper";

const isLikelyAuthenticated = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("pawstay.authenticated") === "true";
};

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
  if (!isLikelyAuthenticated()) {
    return [];
  }

  try {
    const data = await authHelper.get(`/api/properties/recommended?limit=${limit}`);
    return data.properties;
  } catch (error: any) {
    if (error?.status === 401) {
      return [];
    }
    throw error;
  }
}
