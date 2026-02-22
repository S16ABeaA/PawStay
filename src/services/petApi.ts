import { authHelper } from "../helpers/authHelper";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export interface PetPayload {
  name: string;
  species: string;
  breed: string;
  birthday: string;
  weight: number;
  photo_url?: string | null;
  notes?: string | null;
}

export const petApi = {
  /** Fetch all pets belonging to the current user */
  list: () => authHelper.get(`${API_BASE_URL}/api/pets`),

  /** Fetch a single pet by id */
  getById: (id: string) => authHelper.get(`${API_BASE_URL}/api/pets/${id}`),

  /** Create a new pet */
  create: (pet: PetPayload) => authHelper.post(`${API_BASE_URL}/api/pets`, pet),

  /** Update a pet */
  update: (id: string, pet: Partial<PetPayload>) =>
    authHelper.put(`${API_BASE_URL}/api/pets/${id}`, pet),

  /** Delete (soft-delete) a pet */
  delete: (id: string) => authHelper.delete(`${API_BASE_URL}/api/pets/${id}`),
};
