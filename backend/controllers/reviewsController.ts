import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabaseAdmin";

export const reviewsController = {
  myReviews: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      // Get owner's properties
      const { data: props, error: propsErr } = await supabaseAdmin
        .from("properties")
        .select("id")
        .eq("owner_id", userId)
        .eq("is_deleted", false);

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
};
