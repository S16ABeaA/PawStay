import { authHelper } from "@/helpers/authHelper";

const isLikelyAuthenticated = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("pawstay.authenticated") === "true";
};

export async function fetchRandomProperties() {
  const data = await authHelper.post("/api/properties/randomproperty", {});
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
