import { authHelper } from "../helpers/authHelper";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

export interface Review {
  id: string;
  author: string;
  pet_name: string | null;
  service_type: string | null;
  rating: number;
  comment: string | null;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export interface CreateReviewPayload {
  booking_id: string;
  rating: number;
  comment?: string;
}

export const reviewsApi = {
  /** Submit a review for a completed booking */
  create: (data: CreateReviewPayload) =>
    authHelper.post(`${API_BASE_URL}/api/reviews`, data),

  /** Get all reviews for a property (public, no auth needed) */
  getPropertyReviews: (propertyId: string): Promise<{ reviews: Review[]; avgRating: number; total: number }> =>
    authHelper.get(`${API_BASE_URL}/api/reviews/property/${propertyId}`),

  /** Check if user has already reviewed a booking */
  checkReview: (bookingId: string): Promise<{ hasReview: boolean; review: Review | null }> =>
    authHelper.get(`${API_BASE_URL}/api/reviews/check/${bookingId}`),
};
