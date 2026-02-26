import { authHelper } from "../helpers/authHelper";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export interface SettingsData {
  propertyId: string | null;
  business: {
    name: string;
    phone: string;
    website: string;
    description: string;
    address: string;
    capacity: number;
  };
  notifications: {
    newBookings: boolean;
    bookingReminders: boolean;
    newReviews: boolean;
    marketingUpdates: boolean;
  };
  availability: {
    maxCapacity: number;
    minStay: number;
    checkInTime: string;
    checkOutTime: string;
    sameDayBookings: boolean;
  };
  payment: {
    acceptedMethods: string[];
    gcashQrUrl: string | null;
    paymayaQrUrl: string | null;
  };
}

export const settingsApi = {
  /** Load all settings for the logged-in owner */
  getSettings: async (): Promise<SettingsData> =>
    authHelper.get(`${API_BASE_URL}/api/settings`),

  /** Update business info */
  updateBusiness: async (data: Partial<SettingsData["business"]>) =>
    authHelper.put(`${API_BASE_URL}/api/settings/business`, data),

  /** Update notification preferences */
  updateNotifications: async (data: Partial<SettingsData["notifications"]>) =>
    authHelper.put(`${API_BASE_URL}/api/settings/notifications`, data),

  /** Update availability settings */
  updateAvailability: async (data: Partial<SettingsData["availability"]>) =>
    authHelper.put(`${API_BASE_URL}/api/settings/availability`, data),

  /** Update payment settings */
  updatePayment: async (data: Partial<SettingsData["payment"]>) =>
    authHelper.put(`${API_BASE_URL}/api/settings/payment`, data),
};
