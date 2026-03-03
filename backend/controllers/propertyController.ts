import { Request, Response } from "express";
import { getProperties, getPropertyById, getRandomProperties, HotelFilters } from "../services/property.service";
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

  /**
   * GET /api/properties/:id/payment
   * Public endpoint — returns QR codes & accepted payment methods for a property.
   * Used by the booking page to display correct QR images.
   */
  getPaymentOptions: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!id || !uuidRegex.test(id)) {
        return res.status(400).json({ message: "Invalid Property ID format" });
      }

      const { data, error } = await supabaseAdmin
        .from("property_pricing")
        .select("payment_options")
        .eq("property_id", id)
        .maybeSingle();

      if (error) throw error;

      const paymentOpts = data?.payment_options || {};
      return res.json({
        gcashQrUrl: paymentOpts.gcash_qr_url || null,
        paymayaQrUrl: paymentOpts.paymaya_qr_url || null,
        acceptedPaymentMethods: paymentOpts.accepted_methods || [],
        gcashNumber: paymentOpts.gcash_number || null,
        paymayaNumber: paymentOpts.paymaya_number || null,
      });
    } catch (err: any) {
      console.error("getPaymentOptions error:", err);
      res.status(500).json({ message: err.message || "Failed to fetch payment options" });
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

      // Optional: filter by a single property_id
      const filterPropertyId = req.query.property_id as string | undefined;

      // Get user's properties
      let propsQuery = supabaseAdmin
        .from('properties')
        .select('id, capacity')
        .eq('owner_id', userId)
        .eq('is_deleted', false);

      if (filterPropertyId) {
        propsQuery = propsQuery.eq('id', filterPropertyId);
      }

      const { data: props, error: propsErr } = await propsQuery;

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

  // --- Property services management ---
  getServices: async (req: Request, res: Response) => {
    try {
      const propertyId = req.params.id;
      if (!propertyId) return res.status(400).json({ message: 'property id required' });

      const userId = (req as any).user?.id;

      let query = supabaseAdmin
        .from('property_services')
        .select('*')
        .eq('property_id', propertyId)
        .eq('is_deleted', false);

      // If requester is not owner, only return active services
      if (!userId) {
        query = query.eq('is_active', true);
      } else {
        // check ownership
        const { data: propRows } = await supabaseAdmin.from('properties').select('owner_id').eq('id', propertyId).single();
        const ownerId = propRows?.owner_id;
        if (!ownerId || String(ownerId) !== String(userId)) {
          query = query.eq('is_active', true);
        }
      }

      const { data, error } = await query.order('category', { ascending: true }).order('price', { ascending: true });
      if (error) throw error;
      res.status(200).json({ services: data || [] });
    } catch (err: any) {
      console.error('[getServices]', err);
      res.status(500).json({ message: err.message || 'Failed to fetch services' });
    }
  },

  createService: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const propertyId = req.params.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      if (!propertyId) return res.status(400).json({ message: 'property id required' });

      // verify owner
      const { data: propRow, error: propErr } = await supabaseAdmin.from('properties').select('owner_id').eq('id', propertyId).single();
      if (propErr) throw propErr;
      if (!propRow || String(propRow.owner_id) !== String(userId)) return res.status(403).json({ message: 'Forbidden' });

      const { name, description, price, category, capacity, is_active } = req.body;

      // Check if a soft-deleted service with the same name and category exists
      const { data: existingService, error: existingErr } = await supabaseAdmin
        .from('property_services')
        .select('id')
        .eq('property_id', propertyId)
        .eq('name', name)
        .eq('category', category)
        .eq('is_deleted', true)
        .single();

      if (existingErr && existingErr.code !== 'PGRST116') {
        // PGRST116 = no rows, which is fine
        throw existingErr;
      }

      // If a soft-deleted service exists, restore it instead of creating a new one
      if (existingService) {
        const { data, error } = await supabaseAdmin
          .from('property_services')
          .update({
            description: description || null,
            price: price ?? null,
            capacity: capacity ?? null,
            is_active: true,
            is_deleted: false,
          })
          .eq('id', existingService.id)
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json({ service: data });
      }

      // Otherwise, create a new service
      const payload: any = {
        property_id: propertyId,
        name: name || null,
        description: description || null,
        price: price ?? null,
        category: category || null,
        capacity: capacity ?? null,
        is_active: is_active ?? true,
        is_deleted: false,
      };

      const { data, error } = await supabaseAdmin.from('property_services').insert(payload).select().single();
      if (error) throw error;
      res.status(201).json({ service: data });
    } catch (err: any) {
      console.error('[createService]', err);
      res.status(500).json({ message: err.message || 'Failed to create service' });
    }
  },

  updateService: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const serviceId = req.params.serviceId;
      if (!serviceId) return res.status(400).json({ message: 'service id required' });

      // fetch service to get property_id
      const { data: svcRow, error: svcErr } = await supabaseAdmin.from('property_services').select('property_id').eq('id', serviceId).single();
      if (svcErr) throw svcErr;
      if (!svcRow) return res.status(404).json({ message: 'service not found' });

      const propertyId = svcRow.property_id;
      const { data: propRow, error: propErr } = await supabaseAdmin.from('properties').select('owner_id').eq('id', propertyId).single();
      if (propErr) throw propErr;
      if (!propRow || String(propRow.owner_id) !== String(userId)) return res.status(403).json({ message: 'Forbidden' });

      const updates = { ...req.body };
      const { data, error } = await supabaseAdmin.from('property_services').update(updates).eq('id', serviceId).select().single();
      if (error) throw error;
      res.status(200).json({ service: data });
    } catch (err: any) {
      console.error('[updateService]', err);
      res.status(500).json({ message: err.message || 'Failed to update service' });
    }
  },

  deleteService: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const serviceId = req.params.serviceId;
      if (!serviceId) return res.status(400).json({ message: 'service id required' });

      // fetch service to get property_id
      const { data: svcRow, error: svcErr } = await supabaseAdmin.from('property_services').select('property_id').eq('id', serviceId).single();
      if (svcErr) throw svcErr;
      if (!svcRow) return res.status(404).json({ message: 'service not found' });

      const propertyId = svcRow.property_id;
      const { data: propRow, error: propErr } = await supabaseAdmin.from('properties').select('owner_id').eq('id', propertyId).single();
      if (propErr) throw propErr;
      if (!propRow || String(propRow.owner_id) !== String(userId)) return res.status(403).json({ message: 'Forbidden' });

      // soft delete
      const { data, error } = await supabaseAdmin.from('property_services').update({ is_deleted: true, is_active: false }).eq('id', serviceId).select().single();
      if (error) throw error;
      res.status(200).json({ service: data });
    } catch (err: any) {
      console.error('[deleteService]', err);
      res.status(500).json({ message: err.message || 'Failed to delete service' });
    }
  },
};
