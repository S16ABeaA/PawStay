import { authHelper } from "../helpers/authHelper";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

export interface CreateBookingPayload {
  property_id: string;
  pet_id?: string | null;
  service_id?: string | null;
  checkin: string;
  checkout?: string | null;
  time_slot?: string | null;
  pet_name?: string;
  pet_type?: string;
  pet_breed?: string;
  pet_age?: string;
  pet_weight?: string;
  special_requirements?: string;
  med_cert_url?: string | null;
  vaccine_record_url?: string | null;
  service_name?: string;
  service_type?: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  emergency_contact?: string;
  subtotal?: number;
  service_fee?: number;
  total_price?: number;
  payment_method?: string;
  reference_number?: string;
  amount_paid?: string;
  payment_screenshot_url?: string;
  // New pet fields
  new_pet_species?: string;
  new_pet_birthday?: string;
  new_pet_photo_url?: string | null;
  new_pet_notes?: string | null;
  dog_size?: string;
}

export interface SlotAvailability {
  date: string;
  capacity: number;
  totalBooked: number;
  unavailableSlots: string[];
  availableSlots: string[];
}

export interface HotelAvailability {
  unavailableDates: string[];
}

export const bookingApi = {
  /** Create a new booking */
  create: (data: CreateBookingPayload) =>
    authHelper.post(`${API_BASE_URL}/api/bookings`, data),

  /** List current user's bookings */
  list: () => authHelper.get(`${API_BASE_URL}/api/bookings`),

  /** Get a single booking */
  getById: (id: string) => authHelper.get(`${API_BASE_URL}/api/bookings/${id}`),

  /** Check time-slot availability for grooming/vet on a specific date */
  getSlotAvailability: async (
    propertyId: string,
    date: string
  ): Promise<SlotAvailability> => {
    const params = new URLSearchParams({ date, type: "appointment" });
    const res = await fetch(
      `${API_BASE_URL}/api/bookings/availability/${propertyId}?${params}`
    );
    if (!res.ok) throw await res.json();
    return res.json();
  },

  /** Check hotel date availability — returns dates that are fully booked */
  getHotelAvailability: async (
    propertyId: string,
    rangeStart: string,
    rangeEnd: string
  ): Promise<HotelAvailability> => {
    const params = new URLSearchParams({ rangeStart, rangeEnd, type: "hotel" });
    const res = await fetch(
      `${API_BASE_URL}/api/bookings/availability/${propertyId}?${params}`
    );
    if (!res.ok) throw await res.json();
    return res.json();
  },
};
