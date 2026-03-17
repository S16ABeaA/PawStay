import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabaseAdmin";
import { notificationModel } from "../models/notificationModel";
import {
  batchSignStorageRefs,
  getSignedStorageUrl,
  parseStorageRef,
} from "../utils/storageMedia";

const PROPERTY_IMAGE_BUCKET = "property-images";
const PROPERTY_LEGAL_BUCKET = "legal-documents";

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value];
  }
  return [];
}

/**
 * Super-admin property management controller.
 * All routes require authMiddleware + requireSuperAdmin.
 */
export const adminPropertyController = {
  /**
   * GET /api/admin/properties
   * Query params: status, search, page (1-based), limit
   */
  listProperties: async (req: Request, res: Response) => {
    try {
      const { status, search, page = "1", limit = "10" } = req.query as Record<string, string>;
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const offset = (pageNum - 1) * limitNum;

      // Build query: properties + owner profile
      let query = supabaseAdmin
        .from("properties")
        .select(
          `
          id,
          name,
          address,
          city,
          zip_code,
          phone,
          description,
          property_type,
          status,
          capacity,
          images,
          cover_image,
          rating,
          review_count,
          rejection_reason,
          created_at,
          updated_at,
          owner_id,
          profiles!properties_owner_id_fkey (
            id,
            first_name,
            last_name,
            email,
            phone
          )
          `,
          { count: "exact" }
        )
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        // Search by name; we'll also filter by owner name on the JS side since
        // Supabase PostgREST doesn't support OR across relations easily without RPC
        query = query.ilike("name", term);
      }

      const { data: properties, error, count } = await query;

      if (error) {
        console.error("listProperties error:", error);
        return res.status(500).json({ error: "Failed to fetch properties." });
      }

      // Fetch booking stats per property in one query
      const propertyIds = (properties ?? []).map((p: any) => p.id);
      let bookingStats: Record<string, { total: number; revenue: number }> = {};

      if (propertyIds.length > 0) {
        const { data: bookings } = await supabaseAdmin
          .from("bookings")
          .select("property_id, total_price, status")
          .in("property_id", propertyIds)
          .eq("is_deleted", false);

        (bookings ?? []).forEach((b: any) => {
          if (!bookingStats[b.property_id]) {
            bookingStats[b.property_id] = { total: 0, revenue: 0 };
          }
          bookingStats[b.property_id].total += 1;
          if (b.status === "completed") {
            bookingStats[b.property_id].revenue += parseFloat(b.total_price ?? 0);
          }
        });
      }

      // Batch-sign cover images (one API call for all properties on this page)
      const coverRefs = (properties ?? [])
        .map((p: any) => parseStorageRef(p.cover_image ?? p.images?.[0], PROPERTY_IMAGE_BUCKET))
        .filter((ref): ref is { bucket: string; path: string } => !!ref);
      const coverSignedMap = await batchSignStorageRefs(coverRefs);

      const formatted = (properties ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        city: p.city,
        zip_code: p.zip_code,
        phone: p.phone,
        description: p.description,
        property_type: p.property_type,
        status: p.status,
        capacity: p.capacity,
        cover_image: getSignedStorageUrl(p.cover_image ?? p.images?.[0], coverSignedMap, PROPERTY_IMAGE_BUCKET),
        rating: p.rating,
        review_count: p.review_count,
        rejection_reason: p.rejection_reason,
        created_at: p.created_at,
        updated_at: p.updated_at,
        owner: p.profiles
          ? {
              id: p.profiles.id,
              name: `${p.profiles.first_name ?? ""} ${p.profiles.last_name ?? ""}`.trim(),
              email: p.profiles.email,
              phone: p.profiles.phone,
            }
          : null,
        booking_count: bookingStats[p.id]?.total ?? 0,
        total_revenue: bookingStats[p.id]?.revenue ?? 0,
      }));

      return res.json({
        properties: formatted,
        total: count ?? 0,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil((count ?? 0) / limitNum),
      });
    } catch (err) {
      console.error("listProperties unexpected error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  /**
   * GET /api/admin/properties/stats
   * Returns counts grouped by status.
   */
  getStats: async (_req: Request, res: Response) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("properties")
        .select("status")
        .eq("is_deleted", false);

      if (error) {
        return res.status(500).json({ error: "Failed to fetch stats." });
      }

      const counts: Record<string, number> = { pending: 0, approved: 0, rejected: 0, suspended: 0, all: 0 };
      (data ?? []).forEach((p: any) => {
        counts[p.status] = (counts[p.status] ?? 0) + 1;
        counts.all += 1;
      });

      return res.json(counts);
    } catch (err) {
      console.error("getStats error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  /**
   * GET /api/admin/properties/:id
   * Full property detail with related tables.
   */
  getPropertyDetail: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Fetch property + owner
      const { data: property, error } = await supabaseAdmin
        .from("properties")
        .select(
          `
          *,
          profiles!properties_owner_id_fkey (
            id, first_name, last_name, email, phone
          )
          `
        )
        .eq("id", id)
        .eq("is_deleted", false)
        .single();

      if (error || !property) {
        return res.status(404).json({ error: "Property not found." });
      }

      // Fetch related tables in parallel
      const [
        { data: services },
        { data: pricing },
        { data: setup },
        { data: legal },
        { data: amenityLinks },
        { data: bookings },
        { data: reviews },
      ] = await Promise.all([
        supabaseAdmin
          .from("property_services")
          .select("*")
          .eq("property_id", id)
          .eq("is_deleted", false),
        supabaseAdmin
          .from("property_pricing")
          .select("*")
          .eq("property_id", id)
          .maybeSingle(),
        supabaseAdmin
          .from("property_setup")
          .select("*")
          .eq("property_id", id)
          .maybeSingle(),
        supabaseAdmin
          .from("property_legal")
          .select("*")
          .eq("property_id", id)
          .maybeSingle(),
        supabaseAdmin
          .from("property_amenities")
          .select("amenity_id, amenities(amenity, category)")
          .eq("property_id", id),
        supabaseAdmin
          .from("bookings")
          .select("id, status, total_price, created_at")
          .eq("property_id", id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(10),
        supabaseAdmin
          .from("reviews")
          .select("id, rating, comment, created_at")
          .eq("property_id", id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      // Booking stats
      const { data: allBookings } = await supabaseAdmin
        .from("bookings")
        .select("status, total_price")
        .eq("property_id", id)
        .eq("is_deleted", false);

      const bookingStats = (allBookings ?? []).reduce(
        (acc: any, b: any) => {
          acc.total += 1;
          acc[b.status] = (acc[b.status] ?? 0) + 1;
          if (b.status === "completed") acc.revenue += parseFloat(b.total_price ?? 0);
          return acc;
        },
        { total: 0, revenue: 0 }
      );

      // Batch-sign all images and legal uploads for the detail view
      const lguPermits = toStringArray((legal as any)?.lgu_permits);
      const baiDocument = (legal as any)?.bai_document ? String((legal as any).bai_document) : null;
      const contractDocument = (legal as any)?.contract_document ? String((legal as any).contract_document) : null;

      const imageRaws = [
        property.cover_image ?? property.images?.[0],
        ...(property.images ?? []),
      ].filter(Boolean) as string[];

      const legalRaws = [
        ...lguPermits,
        baiDocument,
        contractDocument,
      ].filter(Boolean) as string[];

      const allRefs = [
        ...imageRaws
          .map((raw) => parseStorageRef(raw, PROPERTY_IMAGE_BUCKET))
          .filter((ref): ref is { bucket: string; path: string } => !!ref),
        ...legalRaws
          .map((raw) => parseStorageRef(raw, PROPERTY_LEGAL_BUCKET))
          .filter((ref): ref is { bucket: string; path: string } => !!ref),
      ];

      const detailSignedMap = await batchSignStorageRefs(allRefs);

      const resolvedProperty = {
        ...property,
        cover_image: getSignedStorageUrl(property.cover_image ?? property.images?.[0], detailSignedMap, PROPERTY_IMAGE_BUCKET),
        images: (property.images ?? [])
          .map((img: string) => getSignedStorageUrl(img, detailSignedMap, PROPERTY_IMAGE_BUCKET))
          .filter(Boolean),
      };

      const resolvedLegal = legal
        ? {
            ...legal,
            lgu_permits: lguPermits
              .map((p) => getSignedStorageUrl(p, detailSignedMap, PROPERTY_LEGAL_BUCKET))
              .filter(Boolean),
            bai_document: baiDocument
              ? getSignedStorageUrl(baiDocument, detailSignedMap, PROPERTY_LEGAL_BUCKET)
              : null,
            contract_document: contractDocument
              ? getSignedStorageUrl(contractDocument, detailSignedMap, PROPERTY_LEGAL_BUCKET)
              : null,
          }
        : null;

      return res.json({
        property: {
          ...resolvedProperty,
          owner: property.profiles
            ? {
                id: property.profiles.id,
                name: `${property.profiles.first_name ?? ""} ${property.profiles.last_name ?? ""}`.trim(),
                email: property.profiles.email,
                phone: property.profiles.phone,
              }
            : null,
        },
        services: services ?? [],
        pricing: pricing ?? null,
        setup: setup ?? null,
        legal: resolvedLegal,
        amenities: (amenityLinks ?? []).map((a: any) => a.amenities),
        recent_bookings: bookings ?? [],
        recent_reviews: reviews ?? [],
        booking_stats: bookingStats,
      });
    } catch (err) {
      console.error("getPropertyDetail error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  /**
   * PATCH /api/admin/properties/:id/status
   * Body: { status: 'approved'|'rejected'|'suspended'|'pending', rejection_reason?: string }
   */
  updatePropertyStatus: async (req: Request, res: Response) => {
    try {
      const requester = (req as any).user;
      if (!requester || requester.role !== "super_admin") {
        return res.status(403).json({ error: "Forbidden: super_admin only." });
      }

      const { id } = req.params;
      const { status, rejection_reason } = req.body as {
        status: "approved" | "rejected" | "suspended" | "pending";
        rejection_reason?: string;
      };

      const validStatuses = ["approved", "rejected", "suspended", "pending"];
      if (!status || !validStatuses.includes(status)) {
        return res
          .status(400)
          .json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }

      const updatePayload: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "rejected" && rejection_reason) {
        updatePayload.rejection_reason = rejection_reason;
      } else if (status !== "rejected") {
        // Clear rejection reason when un-rejecting
        updatePayload.rejection_reason = null;
      }

      const { data, error } = await supabaseAdmin
        .from("properties")
        .update(updatePayload)
        .eq("id", id)
        .eq("is_deleted", false)
        .select("id, name, status, owner_id")
        .single();

      if (error || !data) {
        console.error("updatePropertyStatus error:", error);
        return res.status(404).json({ error: "Property not found or update failed." });
      }

      // Create notification when property is approved, rejected, or suspended.
      if (status === "approved" || status === "rejected" || status === "suspended") {
        try {
          const isApproved = status === "approved";
          const isRejected = status === "rejected";
          await notificationModel.create({
            user_id: data.owner_id,
            type: isApproved ? "property_approved" : isRejected ? "property_rejected" : "property_suspended",
            title: isApproved
              ? "Property Approved!"
              : isRejected
                ? "Property Application Rejected"
                : "Property Suspended",
            message: isApproved
              ? `Your property "${data.name}" has been approved and is now live on PawStay.`
              : isRejected
                ? `Your property "${data.name}" was rejected.${rejection_reason ? ` Reason: ${rejection_reason}` : " Please review the feedback and resubmit."}`
                : `Your property "${data.name}" has been suspended and is temporarily hidden from customers.`,
            link: "/admin/services",
            reference_id: data.id,
            reference_type: "property",
          });
        } catch (notifErr) {
          console.warn("Failed to create property status notification:", notifErr);
          // Don't fail the request if notification creation fails
        }
      }

      const statusMessages: Record<string, string> = {
        approved: `Property "${data.name}" has been approved.`,
        rejected: `Property "${data.name}" has been rejected.`,
        suspended: `Property "${data.name}" has been suspended.`,
        pending: `Property "${data.name}" has been set back to pending review.`,
      };

      return res.json({ message: statusMessages[status], property: data });
    } catch (err) {
      console.error("updatePropertyStatus unexpected error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  /**
   * DELETE /api/admin/properties/:id
   * Soft-deletes a property (sets is_deleted = true).
   */
  deleteProperty: async (req: Request, res: Response) => {
    try {
      const requester = (req as any).user;
      if (!requester || requester.role !== "super_admin") {
        return res.status(403).json({ error: "Forbidden: super_admin only." });
      }

      const { id } = req.params;

      const { data, error } = await supabaseAdmin
        .from("properties")
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("id, name")
        .single();

      if (error || !data) {
        return res.status(404).json({ error: "Property not found." });
      }

      return res.json({ message: `Property "${data.name}" has been deleted.` });
    } catch (err) {
      console.error("deleteProperty error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },
};
