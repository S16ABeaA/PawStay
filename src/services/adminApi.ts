import { authHelper } from "@/helpers/authHelper";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
const BASE = `${API_BASE_URL}/api/admin/properties`;

export interface AdminProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  zip_code: string;
  phone: string;
  description: string;
  property_type: string[];
  status: "pending" | "approved" | "rejected" | "suspended";
  capacity: number;
  cover_image: string | null;
  rating: number | null;
  review_count: number;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  booking_count: number;
  total_revenue: number;
}

export interface PropertyListResponse {
  properties: AdminProperty[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PropertyStatsResponse {
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  all: number;
}

export interface PropertyDetailResponse {
  property: AdminProperty & { [key: string]: any };
  services: any[];
  pricing: any | null;
  setup: any | null;
  legal: any | null;
  amenities: any[];
  recent_bookings: any[];
  recent_reviews: any[];
  booking_stats: { total: number; revenue: number; [key: string]: any };
}

export const adminApi = {
  /**
   * List all properties, with optional filtering and pagination.
   */
  getProperties: (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PropertyListResponse> => {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== "all") qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return authHelper.get(`${BASE}${query ? "?" + query : ""}`);
  },

  /**
   * Get status counts for the stats bar.
   */
  getPropertyStats: (): Promise<PropertyStatsResponse> =>
    authHelper.get(`${BASE}/stats`),

  /**
   * Get full detail for a single property.
   */
  getProperty: (id: string): Promise<PropertyDetailResponse> =>
    authHelper.get(`${BASE}/${id}`),

  /**
   * Approve, reject, suspend, or reset a property.
   */
  updatePropertyStatus: (
    id: string,
    data: { status: "approved" | "rejected" | "suspended" | "pending"; rejection_reason?: string }
  ): Promise<{ message: string; property: { id: string; name: string; status: string } }> =>
    authHelper.patch(`${BASE}/${id}/status`, data),

  /**
   * Soft-delete a property.
   */
  deleteProperty: (id: string): Promise<{ message: string }> =>
    authHelper.delete(`${BASE}/${id}`),
};
