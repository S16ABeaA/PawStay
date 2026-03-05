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

export interface AdminCalendarParams {
  property_id?: string;
  service_type?: string;
  status?: string;
}

export interface CreateWalkinPayload {
  property_id: string;
  checkin: string;
  checkout?: string | null;
  time_slot?: string | null;
  pet_name: string;
  pet_type?: string;
  pet_breed?: string;
  pet_age?: string;
  pet_weight?: string;
  special_requirements?: string;
  service_id?: string | null;
  service_name?: string;
  service_type?: string;
  owner_name: string;
  owner_email?: string;
  owner_phone?: string;
  emergency_contact?: string;
  subtotal?: number;
  service_fee?: number;
  total_price?: number;
  payment_method?: string;
  payment_status?: string;
  notes?: string;
  room_name?: string;
  status?: string;
}

export interface AdminCalendarProperty {
  id: string;
  name: string;
  property_type: string[];
}

export interface PropertyService {
  id: string;
  property_id: string;
  name: string;
  category: string;
  price: number;
  capacity: number | null;
}

export interface AdminCalendarBooking {
  id: string;
  property_id: string;
  property_name: string | null;
  user_id: string;
  pet_id: string | null;
  service_id: string | null;
  checkin: string;
  checkout: string | null;
  time_slot: string | null;
  pet_name: string | null;
  pet_type: string | null;
  pet_breed: string | null;
  service_name: string | null;
  service_type: string | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  special_requirements: string | null;
  subtotal: number | null;
  total_price: number | null;
  payment_status: string;
  status: string;
  notes: string | null;
  room_name: string | null;
  source: string;
  created_by: string | null;
  created_at: string;
}

export interface AdminCalendarResponse {
  bookings: AdminCalendarBooking[];
  properties: AdminCalendarProperty[];
  serviceTypes: string[];
  propertyServices: PropertyService[];
}

export const bookingApi = {
  /** Create a new booking */
  create: (data: CreateBookingPayload) =>
    authHelper.post(`${API_BASE_URL}/api/bookings`, data),

  /** List current user's bookings */
  list: () => authHelper.get(`${API_BASE_URL}/api/bookings`),

  /** Get a single booking */
  getById: (id: string) => authHelper.get(`${API_BASE_URL}/api/bookings/${id}`),

  /** Check payment status of a booking */
  checkPaymentStatus: (bookingId: string): Promise<{
    id: string;
    payment_status: string;
    payment_method: string | null;
    total_price: number | null;
    paid_at: string | null;
    booking_status: string;
  }> => authHelper.get(`${API_BASE_URL}/api/bookings/${bookingId}/payment-status`),

  /** Admin update payment status */
  updatePaymentStatus: (bookingId: string, payment_status: string) =>
    authHelper.patch(`${API_BASE_URL}/api/bookings/admin/${bookingId}/payment`, { payment_status }),

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

  /** Admin calendar — get bookings for proprietor's properties with filters */
  getAdminCalendar: (params?: AdminCalendarParams): Promise<AdminCalendarResponse> => {
    const qs = new URLSearchParams();
    if (params?.property_id) qs.set("property_id", params.property_id);
    if (params?.service_type) qs.set("service_type", params.service_type);
    if (params?.status) qs.set("status", params.status);
    const query = qs.toString();
    return authHelper.get(`${API_BASE_URL}/api/bookings/admin/calendar${query ? "?" + query : ""}`);
  },

  /** Admin walk-in — create a walk-in booking directly from calendar */
  createWalkin: (data: CreateWalkinPayload) =>
    authHelper.post(`${API_BASE_URL}/api/bookings/admin/walkin`, data),

  /** Admin update booking status */
  updateBookingStatus: (bookingId: string, status: string) =>
    authHelper.patch(`${API_BASE_URL}/api/bookings/admin/${bookingId}/status`, { status }),

  /** Admin soft-delete a booking */
  deleteBooking: (bookingId: string) =>
    authHelper.delete(`${API_BASE_URL}/api/bookings/admin/${bookingId}`),

  /** Get total revenue from all service fees (super admin only) */
  getTotalRevenue: () =>
    authHelper.get(`${API_BASE_URL}/api/bookings/revenue/total`),

  /** Get revenue breakdown by service type (super admin only) */
  getRevenueByServiceType: () =>
    authHelper.get(`${API_BASE_URL}/api/bookings/revenue/by-service-type`),

  /** Get revenue breakdown by property (super admin only) */
  getRevenueByProperty: () =>
    authHelper.get(`${API_BASE_URL}/api/bookings/revenue/by-property`),

  /** Get revenue breakdown by location (super admin only) */
  getRevenueByLocation: () =>
    authHelper.get(`${API_BASE_URL}/api/bookings/revenue/by-location`),

  /** Get revenue breakdown by time period - daily, weekly, monthly (super admin only) */
  getRevenueByTimePeriod: () =>
    authHelper.get(`${API_BASE_URL}/api/bookings/revenue/by-time-period`),

  /** Get revenue period comparison - current vs previous period (super admin only) */
  getRevenuePeriodComparison: () =>
    authHelper.get(`${API_BASE_URL}/api/bookings/revenue/period-comparison`),
};
