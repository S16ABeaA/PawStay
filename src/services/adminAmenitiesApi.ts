import { authHelper } from "@/helpers/authHelper";

const BASE = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5001") + "/api/amenities";

export interface Amenity {
  id: string;
  amenity: string;
  category?: string | null;
  service_types?: string[];
  is_active?: boolean;
}

export const adminAmenitiesApi = {
  list: (opts?: { is_active?: boolean }) => {
    let url = `${BASE}/admin`;
    if (opts?.is_active !== undefined) url += `?is_active=${opts.is_active}`;
    return authHelper.get(url) as Promise<{ amenities: Amenity[] }>;
  },
  create: (payload: Partial<Amenity>) => authHelper.post(BASE, payload) as Promise<{ amenity: Amenity }>,
  update: (id: string, payload: Partial<Amenity>) => authHelper.put(`${BASE}/${id}`, payload) as Promise<{ amenity: Amenity }>,
  delete: (id: string) => authHelper.delete(`${BASE}/${id}`) as Promise<{ success: boolean }>,
};
