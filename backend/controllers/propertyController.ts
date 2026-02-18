import { Request, Response } from "express";
import { getProperties, getRandomProperties, HotelFilters } from "../services/property.service";

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
      const properties = await getRandomProperties(limit);
      res.status(200).json({ properties });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to fetch random properties" });
    }
  },
};
