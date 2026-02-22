import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabaseAdmin";

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
      console.error("[getamenitiesByServiceType]", err);
      return res
        .status(500)
        .json({ message: err.message || "Failed to fetch amenities" });
    }
  },
};

