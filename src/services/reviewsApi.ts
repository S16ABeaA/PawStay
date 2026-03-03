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

export interface OwnerReview {
  id: string;
  pet: string | null;
  author: string;
  rating: number;
  date: string;
  text: string | null;
  replied: boolean;
  reply: string;
  service: string | null;
  flagged: boolean;
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

  /** Get reviews for the current owner's properties (admin/proprietor) */
  myReviews: (): Promise<{ reviews: OwnerReview[]; avgRating: number; total: number; pendingReplies: number }> =>
    authHelper.get(`${API_BASE_URL}/api/reviews/mine`),

  /** Reply to a review (property owner) */
  replyToReview: (reviewId: string, reply: string): Promise<{ success: boolean; review: any }> =>
    authHelper.post(`${API_BASE_URL}/api/reviews/${reviewId}/reply`, { reply }),
};
