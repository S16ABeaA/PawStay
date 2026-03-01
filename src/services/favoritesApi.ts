import { authHelper } from "../helpers/authHelper";

// Prefer `VITE_API_BASE_URL`, fall back to older `VITE_BACKEND_URL`, then localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";


export const favoritesApi = {
  fetchFavorites: async () => {
    const data = await authHelper.get(`${API_BASE_URL}/api/favorites`);
    return data.favorites || [];
  },

  addFavorite: async (property_id: string | number) => {
    const data = await authHelper.post(`${API_BASE_URL}/api/favorites`, { property_id });
    return data;
  },

  removeFavorite: async (property_id: string | number) => {
    const data = await authHelper.delete(`${API_BASE_URL}/api/favorites/${property_id}`);
    return data;
  },

  checkFavorite: async (property_id: string | number): Promise<boolean> => {
    try {
      const data = await authHelper.get(`${API_BASE_URL}/api/favorites/check/${property_id}`);
      return data.isFavorited ?? false;
    } catch {
      return false;
    }
  },

  toggleFavorite: async (property_id: string | number): Promise<{ action: "added" | "removed" }> => {
    const isFavorited = await favoritesApi.checkFavorite(property_id);

    if (isFavorited) {
      await favoritesApi.removeFavorite(property_id);
      return { action: "removed" };
    } else {
      await favoritesApi.addFavorite(property_id);
      return { action: "added" };
    }
  },
};