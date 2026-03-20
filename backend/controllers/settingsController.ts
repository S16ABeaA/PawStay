import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabaseAdmin";

// ─── Helper: get a specific property (or first) owned by the authenticated user ───
async function getOwnerProperty(ownerId: string, propertyId?: string | null) {
  // If a specific property_id is given, verify it belongs to this owner
  if (propertyId) {
    const { data, error } = await supabaseAdmin
      .from("properties")
      .select("id")
      .eq("id", propertyId)
      .eq("owner_id", ownerId)
      .eq("status", "approved")
      .eq("is_deleted", false)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;
    // Fall through to default if the given id is invalid
  }

  // Fallback: first property
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("status", "approved")
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data; // null when no property exists yet
}

export const settingsController = {
  // ════════════════════════════════════════════════
  // GET /api/settings — load all settings for the logged-in owner
  // ════════════════════════════════════════════════
  getSettings: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      // 1. Profile (notification prefs)
      const { data: profile, error: profileErr } = await supabaseAdmin
        .from("profiles")
        .select("notification_prefs")
        .eq("id", user.id)
        .single();

      if (profileErr) throw profileErr;

      // 2. Property (business info) — respect optional property_id query param
      const qsPropertyId = req.query.property_id as string | undefined;
      const property = await getOwnerProperty(user.id, qsPropertyId);

      let business: any = null;
      let availability: any = null;
      let payment: any = null;
      let propertySetup: any = null;
      let propertyId: string | null = null;

      if (property) {
        propertyId = property.id;

        // Business info from properties table
        const { data: propData, error: propErr } = await supabaseAdmin
          .from("properties")
          .select("name, phone, website, description, address, capacity")
          .eq("id", propertyId)
          .single();

        if (propErr) throw propErr;
        business = propData;

        // Availability from property_setup
        const { data: setup } = await supabaseAdmin
          .from("property_setup")
          .select("operating_hours, policies, booking_rules, compliance, health_safety, vet_availability, sanitation_protocols, emergency_contact")
          .eq("property_id", propertyId)
          .maybeSingle();

        availability = setup?.operating_hours || {};
        propertySetup = setup || {};

        // Payment from property_pricing
        const { data: pricing } = await supabaseAdmin
          .from("property_pricing")
          .select("payment_options")
          .eq("property_id", propertyId)
          .maybeSingle();

        payment = pricing?.payment_options || {};
      }

      return res.json({
        propertyId,
        business: business || {
          name: "",
          phone: "",
          website: "",
          description: "",
          address: "",
          capacity: 0,
        },
        notifications: profile?.notification_prefs || {
          newBookings: true,
          bookingReminders: true,
          newReviews: true,
          marketingUpdates: false,
        },
        availability: {
          maxCapacity: business?.capacity || 0,
          minStay: availability?.minStay ?? 1,
          checkInTime: availability?.checkInTime || availability?.dailyOpenTime || "09:00",
          checkOutTime: availability?.checkOutTime || availability?.dailyCloseTime || "17:00",
          sameDayBookings: availability?.sameDayBookings ?? true,
        },
        payment: {
          acceptedMethods: payment?.accepted_methods || payment?.methods || [],
          gcashQrUrl: payment?.gcash_qr_url || null,
          paymayaQrUrl: payment?.paymaya_qr_url || null,
        },
        propertySetup: {
          unvaccinatedPolicy: propertySetup?.policies?.unvaccinatedPolicy || false,
          unvaccinatedPolicyDetails: propertySetup?.policies?.unvaccinatedPolicyDetails || "",
          breedRestrictions: propertySetup?.policies?.breedRestrictions || false,
          breedRestrictionsDetails: propertySetup?.policies?.breedRestrictionsDetails || "",
          aggressivePolicy: propertySetup?.policies?.aggressivePolicy || false,
          aggressivePolicyDetails: propertySetup?.policies?.aggressivePolicyDetails || "",
          bookingRules: Array.isArray(propertySetup?.booking_rules) ? propertySetup.booking_rules : [],
          complianceRequirements: Array.isArray(propertySetup?.compliance) ? propertySetup.compliance : [],
          vaccinationRequirements: Array.isArray(propertySetup?.health_safety) ? propertySetup.health_safety : [],
          emergencyProcedures: propertySetup?.emergency_contact || "",
          vetAvailability: Array.isArray(propertySetup?.vet_availability) ? propertySetup.vet_availability : [],
          isolationSanitationProtocols: Array.isArray(propertySetup?.sanitation_protocols) ? propertySetup.sanitation_protocols : [],
        },
      });
    } catch (err: any) {
      console.error("[Settings] getSettings error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  },

  // ════════════════════════════════════════════════
  // PUT /api/settings/business — update business info
  // ════════════════════════════════════════════════
  updateBusiness: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const bodyPropertyId = req.body.property_id as string | undefined;
      const property = await getOwnerProperty(user.id, bodyPropertyId);
      if (!property) return res.status(404).json({ error: "No property found for this account." });

      const { name, phone, website, description, address } = req.body;

      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone = phone;
      if (website !== undefined) updates.website = website;
      if (description !== undefined) updates.description = description;
      if (address !== undefined) updates.address = address;

      const { error } = await supabaseAdmin
        .from("properties")
        .update(updates)
        .eq("id", property.id);

      if (error) throw error;

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[Settings] updateBusiness error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  },

  // ════════════════════════════════════════════════
  // PUT /api/settings/notifications — update notification prefs
  // ════════════════════════════════════════════════
  updateNotifications: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { newBookings, bookingReminders, newReviews, marketingUpdates } = req.body;

      const prefs: Record<string, boolean> = {};
      if (newBookings !== undefined) prefs.newBookings = newBookings;
      if (bookingReminders !== undefined) prefs.bookingReminders = bookingReminders;
      if (newReviews !== undefined) prefs.newReviews = newReviews;
      if (marketingUpdates !== undefined) prefs.marketingUpdates = marketingUpdates;

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          notification_prefs: prefs,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[Settings] updateNotifications error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  },

  // ════════════════════════════════════════════════
  // PUT /api/settings/availability — update availability settings
  // ════════════════════════════════════════════════
  updateAvailability: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const bodyPropertyId = req.body.property_id as string | undefined;
      const property = await getOwnerProperty(user.id, bodyPropertyId);
      if (!property) return res.status(404).json({ error: "No property found for this account." });

      const { maxCapacity, minStay, checkInTime, checkOutTime, sameDayBookings } = req.body;

      // Update capacity in properties table
      if (maxCapacity !== undefined) {
        const { error: capErr } = await supabaseAdmin
          .from("properties")
          .update({ capacity: maxCapacity, updated_at: new Date().toISOString() })
          .eq("id", property.id);
        if (capErr) throw capErr;
      }

      // Update operating_hours in property_setup — merge with existing
      const { data: existing } = await supabaseAdmin
        .from("property_setup")
        .select("operating_hours")
        .eq("property_id", property.id)
        .maybeSingle();

      const mergedHours = {
        ...(existing?.operating_hours || {}),
        checkInTime: checkInTime ?? existing?.operating_hours?.checkInTime ?? "09:00",
        checkOutTime: checkOutTime ?? existing?.operating_hours?.checkOutTime ?? "17:00",
        minStay: minStay ?? existing?.operating_hours?.minStay ?? 1,
        sameDayBookings: sameDayBookings ?? existing?.operating_hours?.sameDayBookings ?? true,
      };

      const { error } = await supabaseAdmin
        .from("property_setup")
        .upsert(
          {
            property_id: property.id,
            operating_hours: mergedHours,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "property_id" }
        );

      if (error) throw error;

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[Settings] updateAvailability error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  },

  // ════════════════════════════════════════════════
  // PUT /api/settings/payment — update payment settings
  // ════════════════════════════════════════════════
  updatePayment: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const bodyPropertyId = req.body.property_id as string | undefined;
      const property = await getOwnerProperty(user.id, bodyPropertyId);
      if (!property) return res.status(404).json({ error: "No property found for this account." });

      const { acceptedMethods, gcashQrUrl, paymayaQrUrl } = req.body;

      // Merge with existing payment_options
      const { data: existing } = await supabaseAdmin
        .from("property_pricing")
        .select("payment_options")
        .eq("property_id", property.id)
        .maybeSingle();

      const merged = {
        ...(existing?.payment_options || {}),
        accepted_methods: acceptedMethods ?? existing?.payment_options?.accepted_methods ?? [],
        gcash_qr_url: gcashQrUrl !== undefined ? gcashQrUrl : (existing?.payment_options?.gcash_qr_url ?? null),
        paymaya_qr_url: paymayaQrUrl !== undefined ? paymayaQrUrl : (existing?.payment_options?.paymaya_qr_url ?? null),
      };

      const { error } = await supabaseAdmin
        .from("property_pricing")
        .upsert(
          {
            property_id: property.id,
            payment_options: merged,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "property_id" }
        );

      if (error) throw error;

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[Settings] updatePayment error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  },

  // ════════════════════════════════════════════════
  // PUT /api/settings/property-setup — update property setup
  // ════════════════════════════════════════════════
  updatePropertySetup: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const bodyPropertyId = req.body.property_id as string | undefined;
      const property = await getOwnerProperty(user.id, bodyPropertyId);
      if (!property) return res.status(404).json({ error: "No property found for this account." });

      const {
        unvaccinatedPolicy,
        unvaccinatedPolicyDetails,
        breedRestrictions,
        breedRestrictionsDetails,
        aggressivePolicy,
        aggressivePolicyDetails,
        bookingRules,
        complianceRequirements,
        vaccinationRequirements,
        emergencyProcedures,
        vetAvailability,
        isolationSanitationProtocols,
      } = req.body;

      // Merge with existing columns in property_setup
      const { data: existing } = await supabaseAdmin
        .from("property_setup")
        .select("policies, booking_rules, compliance, health_safety, vet_availability, sanitation_protocols, emergency_contact")
        .eq("property_id", property.id)
        .maybeSingle();

      const mergedPolicies = {
        ...(existing?.policies || {}),
        unvaccinatedPolicy: unvaccinatedPolicy ?? existing?.policies?.unvaccinatedPolicy ?? false,
        unvaccinatedPolicyDetails: unvaccinatedPolicyDetails ?? existing?.policies?.unvaccinatedPolicyDetails ?? "",
        breedRestrictions: breedRestrictions ?? existing?.policies?.breedRestrictions ?? false,
        breedRestrictionsDetails: breedRestrictionsDetails ?? existing?.policies?.breedRestrictionsDetails ?? "",
        aggressivePolicy: aggressivePolicy ?? existing?.policies?.aggressivePolicy ?? false,
        aggressivePolicyDetails: aggressivePolicyDetails ?? existing?.policies?.aggressivePolicyDetails ?? "",
      };

      const { error } = await supabaseAdmin
        .from("property_setup")
        .upsert(
          {
            property_id: property.id,
            policies: mergedPolicies,
            booking_rules: bookingRules ?? existing?.booking_rules ?? [],
            compliance: complianceRequirements ?? existing?.compliance ?? [],
            health_safety: vaccinationRequirements ?? existing?.health_safety ?? [],
            vet_availability: vetAvailability ?? existing?.vet_availability ?? [],
            sanitation_protocols: isolationSanitationProtocols ?? existing?.sanitation_protocols ?? [],
            emergency_contact: emergencyProcedures ?? existing?.emergency_contact ?? "",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "property_id" }
        );

      if (error) throw error;

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[Settings] updatePropertySetup error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  },
};
