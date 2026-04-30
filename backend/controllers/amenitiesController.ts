import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabaseAdmin";
import { logger } from "../utils/logger";

export const amenitiesController = {
  getamenitiesByServiceType: async (req: Request, res: Response) => {
    try {
      const { serviceType } = req.body as { serviceType?: string };

      if (!serviceType || typeof serviceType !== "string") {
        return res.status(400).json({ message: "serviceType is required" });
      }

      const normalized = serviceType.toLowerCase();
      const mapped =
        normalized === "vet" ? "veterinary" : normalized;

      const { data, error } = await supabaseAdmin
        .from("amenities")
        .select("id, amenity, category, service_types, is_active")
        .eq("is_active", true)
        .contains("service_types", [mapped]);

      if (error) throw error;

      //console.log("[getamenitiesByServiceType] Retrieved amenities:", data);
      return res.status(200).json({ properties: data ?? [] });
    } catch (err: any) {
      logger.error("[getamenitiesByServiceType]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },
  // Admin: list all amenities (optional ?is_active=true|false)
  listAmenities: async (req: Request, res: Response) => {
    try {
      const { is_active } = req.query;

      let q = supabaseAdmin
        .from("amenities")
        .select("id, amenity, category, service_types, is_active")
        .order("amenity", { ascending: true });

      if (is_active === "true")  q = q.eq("is_active", true)  as typeof q;
      if (is_active === "false") q = q.eq("is_active", false) as typeof q;

      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json({ amenities: data ?? [] });
    } catch (err: any) {
      logger.error("[listAmenities]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },
  createAmenity: async (req: Request, res: Response) => {
    try {
      const { amenity, category, service_types, is_active } = req.body;
      if (!amenity || typeof amenity !== "string") {
        return res.status(400).json({ message: "amenity is required" });
      }

      const payload = {
        amenity: amenity.trim(),
        category: category || null,
        service_types: Array.isArray(service_types) ? service_types : [],
        is_active: typeof is_active === "boolean" ? is_active : true,
      };

      const { data, error } = await supabaseAdmin.from("amenities").insert([payload]).select("id, amenity, category, service_types, is_active");
      if (error) throw error;
      return res.status(201).json({ amenity: data?.[0] ?? null });
    } catch (err: any) {
      logger.error("[createAmenity]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },
  updateAmenity: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ message: "id required" });

      // Whitelist only known columns to prevent Postgrest errors from extra client keys
      const { amenity, category, service_types, is_active } = req.body;
      const fields: Record<string, any> = {};
      if (amenity    !== undefined) fields.amenity       = amenity;
      if (category   !== undefined) fields.category      = category;
      if (service_types !== undefined) fields.service_types = service_types;
      if (is_active  !== undefined) fields.is_active     = is_active;

      if (Object.keys(fields).length === 0) {
        return res.status(400).json({ message: "No valid fields provided" });
      }

      const { data, error } = await supabaseAdmin.from("amenities").update(fields).eq("id", id).select("id, amenity, category, service_types, is_active");
      if (error) throw error;
      return res.status(200).json({ amenity: data?.[0] ?? null });
    } catch (err: any) {
      logger.error("[updateAmenity]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },
  deleteAmenity: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ message: "id required" });

      // Check if any property is still using this amenity (FK on delete restrict)
      const { count: usageCount, error: usageErr } = await supabaseAdmin
        .from("property_amenities")
        .select("*", { count: "exact", head: true })
        .eq("amenity_id", id);
      if (usageErr) throw usageErr;
      if (usageCount && usageCount > 0) {
        return res.status(409).json({ message: "Cannot delete: this amenity is assigned to one or more properties. Remove it from those properties first." });
      }

      const { error } = await supabaseAdmin.from("amenities").delete().eq("id", id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (err: any) {
      logger.error("[deleteAmenity]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },
};

