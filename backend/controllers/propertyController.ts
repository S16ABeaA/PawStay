import { Request, Response } from "express";
import { getProperties, getRandomProperties, HotelFilters } from "../services/property.service";
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
      const properties = await getRandomProperties(limit);
      res.status(200).json({ properties });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to fetch random properties" });
    }
  },

  myProperties: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { data: rows, error } = await supabaseAdmin
        .from("properties")
        .select(`
          *,
          property_amenities(
            amenity_id,
            amenities(amenity)
          )
        `)
        .eq("owner_id", userId)
        .eq("is_deleted", false);

      if (error) throw error;

      const properties = rows || [];

      // Attach cheapest service price per property
      const propertyIds = properties.map((p: any) => p.id);
      const { data: serviceRows, error: serviceError } = await supabaseAdmin
        .from("property_services")
        .select("property_id, price")
        .in("property_id", propertyIds)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .order("price", { ascending: true });

      if (serviceError) throw serviceError;

      const cheapestByProperty = new Map<string, number>();
      for (const row of serviceRows ?? []) {
        const pid = String(row.property_id);
        if (!cheapestByProperty.has(pid)) {
          cheapestByProperty.set(pid, Number(row.price ?? 0));
        }
      }

      const out = (properties as any[]).map((p: any) => ({
        ...p,
        cheapest_service_price: cheapestByProperty.get(String(p.id)) ?? null,
      }));

      res.status(200).json({ properties: out });
    } catch (err: any) {
      console.error("[myProperties]", err);
      res.status(500).json({ message: err.message || "Failed to fetch user properties" });
    }
  },
  seedMyProperty: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      // Minimal property payload for testing
      const now = new Date().toISOString();
      const minimal = {
        owner_id: userId,
        status: 'approved',
        name: `Sample Property ${now}`,
        property_type: ['hotel'],
        address: '123 Test St',
        city: 'Testville',
        country: 'Testland',
        latitude: 0,
        longitude: 0,
        phone: '',
        description: 'Automatically created sample property for testing',
        capacity: 5,
        pet_types_accepted: ['Dog', 'Cat'],
        dog_sizes: ['Small', 'Medium'],
        facilities_amenities: [],
        images: [],
        cover_image: null,
      };

      const { data: property, error: propertyError } = await supabaseAdmin
        .from('properties')
        .insert(minimal)
        .select('id, name')
        .single();

      if (propertyError) throw propertyError;

      // Insert a default service so cheapest_service_price calculation can find one
      await supabaseAdmin.from('property_services').insert({
        property_id: property.id,
        name: 'Sample Boarding',
        price: 100,
        category: 'Boarding',
        is_active: true,
        is_deleted: false,
      });

      res.status(200).json({ success: true, propertyId: property.id, name: property.name });
    } catch (err: any) {
      console.error('[seedMyProperty]', err);
      res.status(500).json({ message: err.message || 'Failed to seed property' });
    }
  },
  dashboardStats: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      // Get user's properties
      const { data: props, error: propsErr } = await supabaseAdmin
        .from('properties')
        .select('id, capacity')
        .eq('owner_id', userId)
        .eq('is_deleted', false);

      if (propsErr) throw propsErr;

      const propertyIds = (props ?? []).map((p: any) => p.id);
      const totalCapacity = (props ?? []).reduce((sum: number, p: any) => sum + (Number(p.capacity) || 0), 0) || 0;

      if (!propertyIds.length) {
        return res.status(200).json({
          totalBookings: 0,
          revenue: 0,
          avgRating: 0,
          occupancy: 0,
        });
      }

      // Total bookings (all statuses except deleted)
      const bookingRes = await supabaseAdmin
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .in('property_id', propertyIds)
        .eq('is_deleted', false);

      if (bookingRes.error) throw bookingRes.error;
      const totalBookings = Number(bookingRes.count ?? 0);

      // Revenue: sum of total_price for paid bookings
      const { data: revenueRows, error: revenueErr } = await supabaseAdmin
        .from('bookings')
        .select('total_price')
        .in('property_id', propertyIds)
        .eq('payment_status', 'paid')
        .eq('is_deleted', false);

      if (revenueErr) throw revenueErr;
      const revenue = (revenueRows ?? []).reduce((s: number, r: any) => s + Number(r.total_price || 0), 0);

      // Average rating from reviews
      const { data: reviewRows, error: reviewErr } = await supabaseAdmin
        .from('reviews')
        .select('rating')
        .in('property_id', propertyIds)
        .eq('is_deleted', false);

      if (reviewErr) throw reviewErr;
      const ratings = (reviewRows ?? []).map((r: any) => Number(r.rating || 0));
      const avgRating = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;

      // Occupancy: current-day occupancy for boarding (bookings spanning today)
      const today = new Date().toISOString().slice(0, 10);
      const { data: occRows, error: occErr } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .in('property_id', propertyIds)
        .eq('is_deleted', false)
        .in('status', ['pending', 'confirmed', 'checked_in'])
        .lte('checkin', today)
        .gt('checkout', today);

      if (occErr) throw occErr;
      const occupiedCount = (occRows ?? []).length;
      const occupancy = totalCapacity > 0 ? Math.round((occupiedCount / totalCapacity) * 100) : 0;

      res.status(200).json({
        totalBookings,
        revenue,
        avgRating: Number(avgRating.toFixed(1)),
        occupancy,
      });
    } catch (err: any) {
      console.error('[dashboardStats]', err);
      res.status(500).json({ message: err.message || 'Failed to compute dashboard stats' });
    }
  },
};
