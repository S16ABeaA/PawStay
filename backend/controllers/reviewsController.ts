import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabaseAdmin";

export const reviewsController = {
  myReviews: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const filterPropertyId = req.query.property_id as string | undefined;

      // Get owner's properties
      let propsQuery = supabaseAdmin
        .from("properties")
        .select("id")
        .eq("owner_id", userId)
        .eq("is_deleted", false);

      if (filterPropertyId) propsQuery = propsQuery.eq("id", filterPropertyId);

      const { data: props, error: propsErr } = await propsQuery;

      if (propsErr) throw propsErr;

      const propertyIds = (props ?? []).map((p: any) => p.id);
      if (!propertyIds.length) return res.status(200).json({ reviews: [], avgRating: 0, total: 0, pendingReplies: 0 });

      const { data: reviews, error: reviewsErr } = await supabaseAdmin
        .from("reviews")
        .select("id, property_id, user_id, pet_name, service_type, rating, comment, reply, replied_at, flagged, created_at")
        .in("property_id", propertyIds)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (reviewsErr) throw reviewsErr;

      // Fetch authors' names
      const userIds = Array.from(new Set((reviews ?? []).map((r: any) => r.user_id)));
      const usersMap = new Map<string, string>();
      if (userIds.length) {
        const { data: users } = await supabaseAdmin
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", userIds);
        for (const u of users ?? []) {
          const full = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
          usersMap.set(String(u.id), full || "");
        }
      }

      const out = (reviews ?? []).map((r: any) => ({
        id: r.id,
        pet: r.pet_name,
        author: usersMap.get(String(r.user_id)) || "",
        rating: Number(r.rating || 0),
        date: r.created_at ? String(r.created_at).slice(0, 10) : "",
        text: r.comment,
        replied: !!r.replied_at,
        reply: r.reply || "",
        service: r.service_type,
        flagged: !!r.flagged,
      }));

      const ratings = out.map((o) => Number(o.rating || 0));
      const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      const pendingReplies = out.filter((o) => !o.replied).length;

      res.status(200).json({ reviews: out, avgRating: Number(avgRating.toFixed(1)), total: out.length, pendingReplies });
    } catch (err: any) {
      console.error("[myReviews]", err);
      res.status(500).json({ message: err.message || "Failed to fetch reviews" });
    }
  },

  replyToReview: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const reviewId = req.params.id;
      const { reply } = req.body;
      if (!reply || !String(reply).trim()) return res.status(400).json({ message: "Reply is required" });

      // Ensure review exists
      const { data: reviewRow, error: reviewErr } = await supabaseAdmin.from("reviews").select("id, property_id").eq("id", reviewId).single();
      if (reviewErr) throw reviewErr;

      // Ensure current user owns the property the review belongs to
      const { data: propRow, error: propErr } = await supabaseAdmin.from("properties").select("owner_id").eq("id", reviewRow.property_id).single();
      if (propErr) throw propErr;
      if (String(propRow.owner_id) !== String(userId)) return res.status(403).json({ message: "Forbidden" });

      const { data, error: updateErr } = await supabaseAdmin
        .from("reviews")
        .update({ reply: reply, replied_at: new Date().toISOString() })
        .eq("id", reviewId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      res.status(200).json({ success: true, review: data });
    } catch (err: any) {
      console.error("[replyToReview]", err);
      res.status(500).json({ message: err.message || "Failed to submit reply" });
    }
  },

  /** Customer submits a review for a completed booking */
  createReview: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { booking_id, rating, comment } = req.body;
      if (!booking_id) return res.status(400).json({ message: "booking_id is required" });
      if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be between 1 and 5" });

      // Fetch booking & verify ownership + status
      const { data: booking, error: bookingErr } = await supabaseAdmin
        .from("bookings")
        .select("id, user_id, property_id, pet_id, status, service_type, checkin, checkout")
        .eq("id", booking_id)
        .single();

      if (bookingErr || !booking) return res.status(404).json({ message: "Booking not found" });
      if (String(booking.user_id) !== String(userId)) return res.status(403).json({ message: "This booking does not belong to you" });

      // Allow review if status is completed/checked_out, OR if the booking dates have passed
      const completedStatuses = ["completed", "checked_out"];
      const reviewableByDate = ["confirmed", "checked_in", "completed", "checked_out"];
      const endDate = booking.checkout || booking.checkin;
      const isPast = endDate ? new Date(endDate) < new Date(new Date().toISOString().slice(0, 10)) : false;
      const canReview = completedStatuses.includes(booking.status) || (isPast && reviewableByDate.includes(booking.status));

      if (!canReview) {
        return res.status(400).json({ message: "You can only review completed or past bookings" });
      }

      // If the booking dates have passed but status wasn't updated, auto-complete it
      if (isPast && !completedStatuses.includes(booking.status) && reviewableByDate.includes(booking.status)) {
        await supabaseAdmin.from("bookings").update({ status: "completed" }).eq("id", booking_id);
      }

      // Check if a review already exists for this booking
      const { data: existing } = await supabaseAdmin
        .from("reviews")
        .select("id")
        .eq("booking_id", booking_id)
        .maybeSingle();

      if (existing) return res.status(409).json({ message: "You have already reviewed this booking" });

      // Fetch pet name snapshot
      let petName: string | null = null;
      if (booking.pet_id) {
        const { data: pet } = await supabaseAdmin.from("pets").select("name").eq("id", booking.pet_id).single();
        petName = pet?.name ?? null;
      }

      const { data: review, error: insertErr } = await supabaseAdmin
        .from("reviews")
        .insert({
          property_id: booking.property_id,
          user_id: userId,
          booking_id: booking_id,
          pet_name: petName,
          service_type: booking.service_type || null,
          rating: Number(rating),
          comment: comment || null,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      res.status(201).json({ success: true, review });
    } catch (err: any) {
      console.error("[createReview]", err);
      res.status(500).json({ message: err.message || "Failed to create review" });
    }
  },

  /** Get all reviews for a property (public) */
  getPropertyReviews: async (req: Request, res: Response) => {
    try {
      const propertyId = req.params.propertyId;
      if (!propertyId) return res.status(400).json({ message: "propertyId is required" });

      const { data: reviews, error } = await supabaseAdmin
        .from("reviews")
        .select("id, user_id, pet_name, service_type, rating, comment, reply, replied_at, created_at")
        .eq("property_id", propertyId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch author names
      const userIds = Array.from(new Set((reviews ?? []).map((r: any) => r.user_id)));
      const usersMap = new Map<string, string>();
      if (userIds.length) {
        const { data: users } = await supabaseAdmin
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", userIds);
        for (const u of users ?? []) {
          const full = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
          usersMap.set(String(u.id), full || "Anonymous");
        }
      }

      const out = (reviews ?? []).map((r: any) => ({
        id: r.id,
        author: usersMap.get(String(r.user_id)) || "Anonymous",
        pet_name: r.pet_name,
        service_type: r.service_type,
        rating: Number(r.rating),
        comment: r.comment,
        reply: r.reply || null,
        replied_at: r.replied_at || null,
        created_at: r.created_at,
      }));

      const ratings = out.map((o) => o.rating);
      const avgRating = ratings.length ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 0;

      res.status(200).json({ reviews: out, avgRating, total: out.length });
    } catch (err: any) {
      console.error("[getPropertyReviews]", err);
      res.status(500).json({ message: err.message || "Failed to fetch reviews" });
    }
  },

  /** Check if current user has already reviewed a booking */
  checkReview: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const bookingId = req.params.bookingId;
      const { data } = await supabaseAdmin
        .from("reviews")
        .select("id, rating, comment, created_at")
        .eq("booking_id", bookingId)
        .eq("user_id", userId)
        .maybeSingle();

      res.status(200).json({ hasReview: !!data, review: data || null });
    } catch (err: any) {
      console.error("[checkReview]", err);
      res.status(500).json({ message: err.message || "Failed to check review" });
    }
  },
};
