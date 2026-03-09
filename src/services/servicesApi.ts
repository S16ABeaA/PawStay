import { authHelper } from "@/helpers/authHelper";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

export interface DBService {
  id: string;
  property_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  capacity?: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export const servicesApi = {
  // Fetch all services for a property
  getServices: async (propertyId: string): Promise<DBService[]> => {
    const data = await authHelper.get(
      `${API_BASE_URL}/api/properties/${propertyId}/services`
    );
    return data.services || [];
  },

  // Create a new service
  createService: async (
    propertyId: string,
    service: Omit<DBService, "id" | "created_at" | "updated_at" | "is_deleted">
  ): Promise<DBService> => {
    const data = await authHelper.post(
      `${API_BASE_URL}/api/properties/${propertyId}/services`,
      service
    );
    return data.service;
  },

  // Update an existing service
  updateService: async (
    propertyId: string,
    serviceId: string,
    updates: Partial<DBService>
  ): Promise<DBService> => {
    const data = await authHelper.patch(
      `${API_BASE_URL}/api/properties/${propertyId}/services/${serviceId}`,
      updates
    );
    return data.service;
  },

  // Delete a service (soft delete)
  deleteService: async (
    propertyId: string,
    serviceId: string
  ): Promise<DBService> => {
    const data = await authHelper.delete(
      `${API_BASE_URL}/api/properties/${propertyId}/services/${serviceId}`
    );
    return data.service;
  },

  // Toggle service active status
  toggleService: async (
    propertyId: string,
    serviceId: string,
    isActive: boolean
  ): Promise<DBService> => {
    return servicesApi.updateService(propertyId, serviceId, { is_active: isActive });
  },
};
