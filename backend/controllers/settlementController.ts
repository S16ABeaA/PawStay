import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabaseAdmin";

/* ================================================================== */
/*  Settlement Controller                                              */
/*  Manages proprietor → platform fee payments (settlement of          */
/*  service_fee receivables).                                          */
/* ================================================================== */

/**
 * POST /api/settlements
 * Record a new settlement (proprietor paying platform their owed service_fee).
 *
 * Body:
 *   proprietorId  - uuid of the proprietor
 *   propertyId    - uuid of the property
 *   amount        - numeric amount settled
 *   bookingIds    - optional array of booking UUIDs this settlement covers
 *   method        - settlement_method ('cash','gcash','bank_transfer','card','check','offset')
 *   referenceNo   - external reference string
 *   notes         - free text
 *   periodMonth   - ISO date string for period (e.g. '2026-03-01')
 *   settledAt     - ISO timestamp (defaults to now)
 */
export const createSettlement = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;
    const {
      proprietorId,
      propertyId,
      amount,
      bookingIds,
      method,
      referenceNo,
      notes,
      periodMonth,
      settledAt,
    } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!proprietorId || !propertyId || !parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: "proprietorId, propertyId, and a positive amount are required." });
    }

    // ── Validate: settlement shouldn't exceed total outstanding for the property ──
    // Fetch all finalized bookings for this property
    const { data: allBookings, error: bAllErr } = await supabaseAdmin
      .from("bookings")
      .select("id, service_fee")
      .eq("property_id", propertyId)
      .eq("is_deleted", false)
      .in("status", ["completed", "checked_out"])
      .neq("payment_status", "refunded")
      .not("finalized_at", "is", null)
      .limit(100000);
    if (bAllErr) throw bAllErr;

    const allBookingIds = (allBookings ?? []).map((b: any) => b.id);
    const totalFees = (allBookings ?? []).reduce(
      (sum: number, b: any) => sum + (parseFloat(b.service_fee) || 0), 0
    );

    // Fetch already-settled amounts per booking
    const { data: existingLinks } = allBookingIds.length > 0
      ? await supabaseAdmin
          .from("settlement_bookings")
          .select("booking_id, amount, proprietor_settlements!inner(status)")
          .in("booking_id", allBookingIds)
      : { data: [] };

    const settledPerBooking: Record<string, number> = {};
    (existingLinks ?? []).forEach((l: any) => {
      if ((l as any).proprietor_settlements?.status === "completed") {
        settledPerBooking[l.booking_id] = (settledPerBooking[l.booking_id] || 0) + (parseFloat(l.amount) || 0);
      }
    });

    const totalAlreadySettled = Object.values(settledPerBooking).reduce((s, v) => s + v, 0);
    const totalOutstanding = Math.round((totalFees - totalAlreadySettled) * 100) / 100;

    if (parsedAmount > totalOutstanding + 0.01) {
      return res.status(400).json({
        error: `Settlement amount (${parsedAmount}) exceeds outstanding balance (${totalOutstanding}) for this property.`,
        totalFees,
        totalAlreadySettled,
        totalOutstanding,
      });
    }

    // 1) Insert settlement record
    const { data: settlement, error: settleErr } = await supabaseAdmin
      .from("proprietor_settlements")
      .insert({
        proprietor_id: proprietorId,
        property_id: propertyId,
        amount: parsedAmount,
        settlement_method: method || null,
        reference_no: referenceNo || null,
        notes: notes || null,
        period_month: periodMonth || null,
        settled_at: settledAt || new Date().toISOString(),
        created_by: adminId,
        status: "completed",
      })
      .select()
      .single();

    if (settleErr) throw settleErr;

    // 2) Link settlement to bookings
    //    If specific bookingIds provided → allocate across those.
    //    Otherwise → auto-allocate oldest-first across all unsettled bookings.
    const targetBookings = (bookingIds && Array.isArray(bookingIds) && bookingIds.length > 0)
      ? (allBookings ?? []).filter((b: any) => bookingIds.includes(b.id))
      : [...(allBookings ?? [])]; // clone so we can sort

    if (targetBookings.length > 0) {
      // Sort oldest first for FIFO allocation
      targetBookings.sort((a: any, b: any) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));

      let remaining = parsedAmount;
      const links: Array<{ settlement_id: string; booking_id: string; amount: number }> = [];

      for (const b of targetBookings as any[]) {
        if (remaining <= 0) break;
        const fee = parseFloat(b.service_fee) || 0;
        const alreadySettled = settledPerBooking[b.id] || 0;
        const bookingOutstanding = Math.round((fee - alreadySettled) * 100) / 100;
        if (bookingOutstanding <= 0) continue;

        const allocated = Math.min(remaining, bookingOutstanding);
        links.push({
          settlement_id: settlement.id,
          booking_id: b.id,
          amount: Math.round(allocated * 100) / 100,
        });
        remaining = Math.round((remaining - allocated) * 100) / 100;
      }

      if (links.length > 0) {
        const { error: linkErr } = await supabaseAdmin
          .from("settlement_bookings")
          .insert(links);

        if (linkErr) {
          console.warn("Failed to link settlement to bookings:", linkErr);
          // Don't fail the settlement — it's recorded, links are supplementary
        }
      }
    }

    // 3) Refresh materialized view (non-blocking)
    (async () => {
      try {
        await supabaseAdmin.rpc("refresh_monthly_receivables");
      } catch (e) {
        console.warn('refresh_monthly_receivables failed', e);
      }
    })();

    return res.status(201).json({
      settlement,
      allocation: { totalFees, totalAlreadySettled, newSettlement: parsedAmount, remainingOutstanding: Math.max(0, totalOutstanding - parsedAmount) },
    });
  } catch (err: any) {
    console.error("createSettlement error:", err);
    return res.status(500).json({ error: "Failed to create settlement.", details: err?.message || err });
  }
};

/**
 * GET /api/settlements
 * List settlements with optional filters.
 * Query params:
 *   - proprietorId
 *   - propertyId
 *   - status
 *   - from (ISO date)
 *   - to   (ISO date)
 *   - limit (default 100)
 */
export const listSettlements = async (req: Request, res: Response) => {
  try {
    let query = supabaseAdmin
      .from("proprietor_settlements")
      .select(`
        *,
        properties:property_id ( name ),
        profiles:proprietor_id ( first_name, last_name, email )
      `)
      .order("settled_at", { ascending: false });

    const { proprietorId, propertyId, status, from, to, limit } = req.query as Record<string, string>;

    if (proprietorId) query = query.eq("proprietor_id", proprietorId);
    if (propertyId) query = query.eq("property_id", propertyId);
    if (status) query = query.eq("status", status);
    if (from) query = query.gte("settled_at", from);
    if (to) query = query.lte("settled_at", to);
    query = query.limit(parseInt(limit || "100", 10));

    const { data, error } = await query;
    if (error) throw error;

    const settlements = (data ?? []).map((s: any) => ({
      ...s,
      propertyName: s.properties?.name || "Unknown",
      proprietorName: [s.profiles?.first_name, s.profiles?.last_name].filter(Boolean).join(" ") || "Unknown",
      proprietorEmail: s.profiles?.email || "",
      properties: undefined,
      profiles: undefined,
    }));

    return res.json({ settlements });
  } catch (err: any) {
    console.error("listSettlements error:", err);
    return res.status(500).json({ error: "Failed to list settlements.", details: err?.message || err });
  }
};

/**
 * GET /api/settlements/:id
 * Get a single settlement with linked bookings.
 */
export const getSettlement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: settlement, error } = await supabaseAdmin
      .from("proprietor_settlements")
      .select(`
        *,
        properties:property_id ( name ),
        profiles:proprietor_id ( first_name, last_name, email )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!settlement) return res.status(404).json({ error: "Settlement not found." });

    // Get linked bookings
    const { data: links, error: linkErr } = await supabaseAdmin
      .from("settlement_bookings")
      .select(`
        amount,
        bookings:booking_id ( id, checkin, checkout, service_fee, service_type, status, pet_name )
      `)
      .eq("settlement_id", id);

    if (linkErr) throw linkErr;

    return res.json({
      settlement: {
        ...settlement,
        propertyName: settlement.properties?.name || "Unknown",
        proprietorName: [settlement.profiles?.first_name, settlement.profiles?.last_name].filter(Boolean).join(" ") || "Unknown",
        proprietorEmail: settlement.profiles?.email || "",
        properties: undefined,
        profiles: undefined,
        linkedBookings: (links ?? []).map((l: any) => ({
          settledAmount: l.amount,
          ...l.bookings,
        })),
      },
    });
  } catch (err: any) {
    console.error("getSettlement error:", err);
    return res.status(500).json({ error: "Failed to get settlement.", details: err?.message || err });
  }
};

/**
 * PATCH /api/settlements/:id/status
 * Update settlement status (e.g. mark as reversed/failed).
 * Body: { status: 'reversed' | 'failed' | 'completed' }
 */
export const updateSettlementStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["pending", "completed", "failed", "reversed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    const { data, error } = await supabaseAdmin
      .from("proprietor_settlements")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Refresh materialized view (non-blocking)
    (async () => {
      try {
        await supabaseAdmin.rpc("refresh_monthly_receivables");
      } catch (e) {
        console.warn('refresh_monthly_receivables failed', e);
      }
    })();

    return res.json({ settlement: data });
  } catch (err: any) {
    console.error("updateSettlementStatus error:", err);
    return res.status(500).json({ error: "Failed to update settlement.", details: err?.message || err });
  }
};


/**
 * GET /api/settlements/monthly-receivables
 * Returns monthly receivable breakdown:
 *   - Each month: { month, generated, settled, outstanding }
 *   - Optionally filtered by proprietorId, propertyId
 * Query params:
 *   - months (default 12)
 *   - proprietorId (optional)
 *   - propertyId (optional)
 */
export const getMonthlyReceivables = async (req: Request, res: Response) => {
  try {
    const monthsParam = parseInt((req.query.months as string) || "12", 10);
    const months = isNaN(monthsParam) ? 12 : Math.max(1, monthsParam);
    const { proprietorId, propertyId } = req.query as Record<string, string>;

    const now = new Date();

    // Generate month keys
    const monthKeys: string[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    // -- GENERATED: service_fee from finalized bookings per month --
    let genQuery = supabaseAdmin
      .from("bookings")
      .select("service_fee, finalized_at, property_id")
      .eq("is_deleted", false)
      .in("status", ["completed", "checked_out"])
      .neq("payment_status", "refunded")
      .not("finalized_at", "is", null)
      .order("finalized_at", { ascending: true })
      .limit(100000);

    if (propertyId) genQuery = genQuery.eq("property_id", propertyId);

    // If filtering by proprietor, we need to get their property IDs first
    let propIds: string[] | undefined;
    if (proprietorId) {
      const { data: props } = await supabaseAdmin
        .from("properties")
        .select("id")
        .eq("owner_id", proprietorId)
        .eq("is_deleted", false);
      propIds = (props ?? []).map((p: any) => p.id);
      if (propIds.length === 0) {
        // No properties → return empty
        return res.json({
          series: monthKeys.map((k) => ({
            month: k,
            label: k,
            generated: 0,
            settled: 0,
            outstanding: 0,
          })),
          totals: { generated: 0, settled: 0, outstanding: 0 },
          currency: "PHP",
        });
      }
      genQuery = genQuery.in("property_id", propIds);
    }

    const { data: genData, error: genErr } = await genQuery;
    if (genErr) throw genErr;

    // Aggregate generated by month
    const genMap: Record<string, number> = {};
    monthKeys.forEach((k) => (genMap[k] = 0));

    (genData ?? []).forEach((b: any) => {
      const fee = parseFloat(b.service_fee) || 0;
      const d = new Date(b.finalized_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in genMap) genMap[key] += fee;
    });

    // -- SETTLED: amounts from completed settlements per month --
    let settQuery = supabaseAdmin
      .from("proprietor_settlements")
      .select("amount, settled_at, property_id")
      .eq("status", "completed")
      .order("settled_at", { ascending: true })
      .limit(100000);

    if (propertyId) settQuery = settQuery.eq("property_id", propertyId);
    if (propIds) settQuery = settQuery.in("property_id", propIds);

    const { data: settData, error: settErr } = await settQuery;
    if (settErr) throw settErr;

    const settMap: Record<string, number> = {};
    monthKeys.forEach((k) => (settMap[k] = 0));

    (settData ?? []).forEach((s: any) => {
      const amt = parseFloat(s.amount) || 0;
      const d = new Date(s.settled_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in settMap) settMap[key] += amt;
    });

    // Build series
    const series = monthKeys.map((k) => ({
      month: k,
      label: k,
      generated: Math.round(genMap[k] * 100) / 100,
      settled: Math.round(settMap[k] * 100) / 100,
      outstanding: Math.round((genMap[k] - settMap[k]) * 100) / 100,
    }));

    // Totals
    const totalGenerated = series.reduce((s, m) => s + m.generated, 0);
    const totalSettled = series.reduce((s, m) => s + m.settled, 0);

    return res.json({
      series,
      totals: {
        generated: Math.round(totalGenerated * 100) / 100,
        settled: Math.round(totalSettled * 100) / 100,
        outstanding: Math.round((totalGenerated - totalSettled) * 100) / 100,
      },
      currency: "PHP",
    });
  } catch (err: any) {
    console.error("getMonthlyReceivables error:", err);
    return res.status(500).json({ error: "Failed to get monthly receivables.", details: err?.message || err });
  }
};

/**
 * GET /api/settlements/summary
 * Quick summary for the dashboard:
 *   - totalGenerated (all-time)
 *   - totalSettled (all-time)
 *   - totalOutstanding
 *   - thisMonthGenerated
 *   - thisMonthSettled
 *   - thisMonthOutstanding
 */
export const getReceivableSummary = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // All-time generated
    const { data: allGen, error: e1 } = await supabaseAdmin
      .from("bookings")
      .select("service_fee")
      .eq("is_deleted", false)
      .in("status", ["completed", "checked_out"])
      .neq("payment_status", "refunded")
      .not("finalized_at", "is", null)
      .limit(100000);
    if (e1) throw e1;

    const totalGenerated = (allGen ?? []).reduce(
      (sum: number, b: any) => sum + (parseFloat(b.service_fee) || 0),
      0
    );

    // This month generated
    const { data: monthGen, error: e2 } = await supabaseAdmin
      .from("bookings")
      .select("service_fee")
      .eq("is_deleted", false)
      .in("status", ["completed", "checked_out"])
      .neq("payment_status", "refunded")
      .gte("finalized_at", monthStart)
      .limit(100000);
    if (e2) throw e2;

    const thisMonthGenerated = (monthGen ?? []).reduce(
      (sum: number, b: any) => sum + (parseFloat(b.service_fee) || 0),
      0
    );

    // All-time settled
    const { data: allSett, error: e3 } = await supabaseAdmin
      .from("proprietor_settlements")
      .select("amount")
      .eq("status", "completed")
      .limit(100000);
    if (e3) throw e3;

    const totalSettled = (allSett ?? []).reduce(
      (sum: number, s: any) => sum + (parseFloat(s.amount) || 0),
      0
    );

    // This month settled
    const { data: monthSett, error: e4 } = await supabaseAdmin
      .from("proprietor_settlements")
      .select("amount")
      .eq("status", "completed")
      .gte("settled_at", monthStart)
      .limit(100000);
    if (e4) throw e4;

    const thisMonthSettled = (monthSett ?? []).reduce(
      (sum: number, s: any) => sum + (parseFloat(s.amount) || 0),
      0
    );

    return res.json({
      totalGenerated: Math.round(totalGenerated * 100) / 100,
      totalSettled: Math.round(totalSettled * 100) / 100,
      totalOutstanding: Math.round((totalGenerated - totalSettled) * 100) / 100,
      thisMonthGenerated: Math.round(thisMonthGenerated * 100) / 100,
      thisMonthSettled: Math.round(thisMonthSettled * 100) / 100,
      thisMonthOutstanding: Math.round((thisMonthGenerated - thisMonthSettled) * 100) / 100,
      currency: "PHP",
    });
  } catch (err: any) {
    console.error("getReceivableSummary error:", err);
    return res.status(500).json({ error: "Failed to get receivable summary.", details: err?.message || err });
  }
};


/**
 * GET /api/settlements/property/:propertyId
 * Settlement history for a specific property (used in the detail modal).
 */
export const getPropertySettlements = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("proprietor_settlements")
      .select(`
        id, amount, settlement_method, reference_no, notes, status, period_month,
        settled_at, created_at,
        profiles:created_by ( first_name, last_name )
      `)
      .eq("property_id", propertyId)
      .order("settled_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const settlements = (data ?? []).map((s: any) => ({
      ...s,
      createdByName: [s.profiles?.first_name, s.profiles?.last_name].filter(Boolean).join(" ") || "System",
      profiles: undefined,
    }));

    return res.json({ settlements });
  } catch (err: any) {
    console.error("getPropertySettlements error:", err);
    return res.status(500).json({ error: "Failed to get property settlements.", details: err?.message || err });
  }
};


/**
 * DELETE /api/settlements/:id
 * Hard-delete a settlement (only if status = 'pending' or 'failed').
 * Completed/reversed settlements should use status update instead.
 */
export const deleteSettlement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch to check status
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("proprietor_settlements")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchErr) throw fetchErr;
    if (!existing) return res.status(404).json({ error: "Settlement not found." });

    if (existing.status === "completed") {
      return res.status(400).json({
        error: "Cannot delete a completed settlement. Reverse it first via PATCH status.",
      });
    }

    // settlement_bookings has ON DELETE CASCADE so links are auto-removed
    const { error: delErr } = await supabaseAdmin
      .from("proprietor_settlements")
      .delete()
      .eq("id", id);

    if (delErr) throw delErr;

    // Refresh view
    (async () => {
      try { await supabaseAdmin.rpc("refresh_monthly_receivables"); } catch (_) {}
    })();

    return res.json({ success: true });
  } catch (err: any) {
    console.error("deleteSettlement error:", err);
    return res.status(500).json({ error: "Failed to delete settlement.", details: err?.message || err });
  }
};
