import { authHelper } from "@/helpers/authHelper";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
const BASE = `${API_BASE_URL}/api/admin/dashboard`;

export interface DashboardStats {
  totalUsers: number;
  usersThisMonth: number;
  usersLastMonth: number;
  userChange: number;

  activeProperties: number;
  activePropsThisMonth: number;
  activePropsLastMonth: number;
  propChange: number;

  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueChange: number;

  bookingsToday: number;
  bookingsYesterday: number;
  bookingChange: number;

  recentApplications: {
    id: string;
    name: string;
    city: string;
    status: string;
    createdAt: string;
    owner: string;
  }[];

  topPerformers: {
    id: string;
    name: string;
    city: string;
    rating: number;
    bookings: number;
    revenue: number;
  }[];
}

export const dashboardApi = {
  getStats: (): Promise<DashboardStats> => authHelper.get(BASE),
};
