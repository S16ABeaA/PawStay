import { authHelper } from "@/helpers/authHelper";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
const BASE = `${API_BASE_URL}/api/analytics`;

export interface OverviewData {
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  totalProperties: number;
  avgRating: number;
  avgSpend: number;
  conversionRate: number;
  bookingsChange: number;
  revenueChange: number;
}

export interface BookingTrendItem {
  period: string;   // "2025-01"
  bookings: number;
  revenue: number;
  // Added by frontend
  label?: string;
}

export interface ServiceBreakdownItem {
  type: string;     // "hotel" | "grooming" | "veterinary"
  value: number;
  count: number;
  revenue: number;
  // Added by frontend
  name?: string;
  color?: string;
}

export interface UserGrowthItem {
  period: string;   // "2025-01"
  total: number;
  new: number;
  // Added by frontend
  label?: string;
}

export interface TopLocationItem {
  city: string;
  bookings: number;
  revenue: number;
  properties: number;
}

export interface TopPropertyItem {
  id: string;
  name: string;
  location: string;
  bookings: number;
  revenue: number;
  rating: number;
}

export interface BookingPatternsData {
  weekly: { dayIndex: number; bookings: number }[];
  hourly: { hour: number; bookings: number }[];
}

export const analyticsApi = {
  getOverview: (range = "12m"): Promise<OverviewData> =>
    authHelper.get(`${BASE}/overview?range=${range}`),

  getBookingTrends: (range = "12m"): Promise<{ trends: BookingTrendItem[] }> =>
    authHelper.get(`${BASE}/booking-trends?range=${range}`),

  getServiceBreakdown: (range = "12m"): Promise<{ breakdown: ServiceBreakdownItem[] }> =>
    authHelper.get(`${BASE}/service-breakdown?range=${range}`),

  getUserGrowth: (range = "12m"): Promise<{ growth: UserGrowthItem[] }> =>
    authHelper.get(`${BASE}/user-growth?range=${range}`),

  getTopLocations: (range = "12m"): Promise<{ locations: TopLocationItem[] }> =>
    authHelper.get(`${BASE}/top-locations?range=${range}`),

  getTopProperties: (range = "12m"): Promise<{ properties: TopPropertyItem[] }> =>
    authHelper.get(`${BASE}/top-properties?range=${range}`),

  getBookingPatterns: (range = "12m"): Promise<BookingPatternsData> =>
    authHelper.get(`${BASE}/booking-patterns?range=${range}`),
};
