import { authHelper } from "../helpers/authHelper";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

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
  propertySetup: {
    unvaccinatedPolicy: boolean;
    unvaccinatedPolicyDetails: string;
    breedRestrictions: boolean;
    breedRestrictionsDetails: string;
    aggressivePolicy: boolean;
    aggressivePolicyDetails: string;
    bookingRules: string[];
    complianceRequirements: string[];
    vaccinationRequirements: string[];
    emergencyProcedures: string;
    vetAvailability: string[];
    isolationSanitationProtocols: string[];
  };
}

export const settingsApi = {
  /** Load all settings for the logged-in owner (optionally for a specific property) */
  getSettings: async (propertyId?: string | null): Promise<SettingsData> => {
    const qs = propertyId ? `?property_id=${propertyId}` : "";
    return authHelper.get(`${API_BASE_URL}/api/settings${qs}`);
  },

  /** Update business info */
  updateBusiness: async (data: Partial<SettingsData["business"]> & { property_id?: string }) =>
    authHelper.put(`${API_BASE_URL}/api/settings/business`, data),

  /** Update notification preferences */
  updateNotifications: async (data: Partial<SettingsData["notifications"]>) =>
    authHelper.put(`${API_BASE_URL}/api/settings/notifications`, data),

  /** Update availability settings */
  updateAvailability: async (data: Partial<SettingsData["availability"]> & { property_id?: string }) =>
    authHelper.put(`${API_BASE_URL}/api/settings/availability`, data),

  /** Update payment settings */
  updatePayment: async (data: Partial<SettingsData["payment"]> & { property_id?: string }) =>
    authHelper.put(`${API_BASE_URL}/api/settings/payment`, data),

  /** Update property setup */
  updatePropertySetup: async (data: Partial<SettingsData["propertySetup"]> & { property_id?: string }) =>
    authHelper.put(`${API_BASE_URL}/api/settings/property-setup`, data),
};

