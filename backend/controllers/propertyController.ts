import { Request, Response } from "express";
import { getProperties, getPropertyById, HotelFilters } from "../services/property.service";
import { supabaseAdmin } from "../config/supabaseAdmin";

export const propertyController = {
  searchProperties: async (req: Request, res: Response) => {
    try {
      const source = req.method === "GET" ? req.query : req.body;

      const asString = (val: unknown): string | undefined => {
        if (val === undefined || val === null) return undefined;
        const str = String(val).trim();
        return str ? str : undefined;
      };

      const asNumber = (val: unknown): number | undefined => {
        if (val === undefined || val === null || val === "") return undefined;
        const num = Number(val);
        return Number.isFinite(num) ? num : undefined;
      };

      const normalizeAmenities = (val: unknown): string[] | undefined => {
        if (!val) return undefined;
        if (Array.isArray(val)) {
          const items = val.map((v) => String(v).trim()).filter(Boolean);
          return items.length ? items : undefined;
        }
        const str = String(val).trim();
        if (!str) return undefined;
        const items = str.split(",").map((v) => v.trim()).filter(Boolean);
        return items.length ? items : undefined;
      };

      const filters: HotelFilters = {
        location: asString(source.location),
        checkin: asString(source.checkin || source.checkIn),
        checkout: asString(source.checkout || source.checkOut),
        timeSlot: asString(source.timeSlot || source.time_slot),
        petType: asString(source.petType || source.pet)?.toLowerCase(),
        dogSize: asString(source.dogSize || source.dogsize)?.toLowerCase(),
        propertyType: asString(source.propertyType || source.type)?.toLowerCase(),
        serviceCategory: asString(source.serviceCategory),
        minPrice: asNumber(source.minPrice),
        maxPrice: asNumber(source.maxPrice),
        rating: asNumber(source.rating),
        amenities: normalizeAmenities(source.amenities),
        keyword: asString(source.keyword),
        lat: asNumber(source.lat),
        lng: asNumber(source.lng),
        radiusKm: asNumber(source.radiusKm),
      };

      // Call service
      const properties = await getProperties(filters);
      //console.log("[searchProperties] Retrieved properties:", properties);
      // Return JSON response
      res.status(200).json({ properties });
    } catch (err: any) {
      //console.error("[searchProperties]", err);
      res.status(500).json({ message: err.message || "Failed to fetch properties" });
    }
  },

  randomProperties: async (req: Request, res: Response) => {
    try {
      const limit = Number(req.body?.limit) || 6;
      // Use getProperties with no filters to get all, then shuffle and slice
      const allProperties = await getProperties({});
      const shuffled = allProperties.sort(() => Math.random() - 0.5);
      const properties = shuffled.slice(0, limit);
      res.status(200).json({ properties });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to fetch random properties" });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      
      // Basic UUID validation regex
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!id || !uuidRegex.test(id)) {
        return res.status(400).json({ message: "Invalid Property ID format" });
      }
      
      const property = await getPropertyById(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.status(200).json({ property });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to fetch property" });
    }
  },

  getReviews: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!id || !uuidRegex.test(id)) {
        return res.status(400).json({ message: "Invalid Property ID format" });
      }

      const { data, error } = await supabaseAdmin
        .from("reviews")
        .select(`
          id,
          rating,
          comment,
          service_type,
          pet_name,
          created_at,
          reply,
          replied_at,
          profiles(first_name, last_name, avatar_url)
        `)
        .eq("property_id", id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      res.status(200).json({ reviews: data ?? [] });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to fetch reviews" });
    }
  },
};
