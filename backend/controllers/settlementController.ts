import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabaseAdmin";
import { notificationModel } from "../models/notificationModel";
import { getSuperAdminRecipients } from "../services/notificationRecipients";
import { logger } from "../utils/logger";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfUtcDay = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const toPhp = (amount: number): string =>
  `PHP ${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getReminderCopyByOffset = (
  dayOffsetFromSettlement: number
): { title: string; messagePrefix: string } | null => {
  if (dayOffsetFromSettlement === -1) {
    return {
      title: "Settlement Due Tomorrow",
      messagePrefix: "Reminder: your settlement day is tomorrow",
    };
  }
  if (dayOffsetFromSettlement === 0) {
    return {
      title: "Settlement Due Today",
      messagePrefix: "Your settlement is due today",
    };
  }
  if (dayOffsetFromSettlement === 7) {
    return {
      title: "Final Settlement Due Today",
      messagePrefix: "Final reminder: settlement is now overdue by 7 days and your business risks being removed if unpaid",
    };
  }
  return null;
};

const getCurrentSettlementCycleDay = (todayStart: Date): Date => {
  const currentMonthSettlementDay = new Date(
    Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth(), 1)
  );
  const currentCycleDueDay = new Date(currentMonthSettlementDay.getTime() + 7 * MS_PER_DAY);

  if (todayStart.getTime() <= currentCycleDueDay.getTime()) {
    return currentMonthSettlementDay;
  }

  return new Date(Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth() + 1, 1));
};

const createReminderIfMissingToday = async (params: {
  userId: string;
  propertyId: string;
  title: string;
  message: string;
  now: Date;
}) => {
  const dayStart = startOfUtcDay(params.now).toISOString();
  const dayEnd = new Date(startOfUtcDay(params.now).getTime() + MS_PER_DAY).toISOString();

  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("notifications")
    .select("id")
    .eq("user_id", params.userId)
    .eq("reference_id", params.propertyId)
    .eq("reference_type", "property")
    .eq("title", params.title)
    .gte("created_at", dayStart)
    .lt("created_at", dayEnd)
    .limit(1);

  if (existingErr) throw existingErr;
  if ((existing ?? []).length > 0) return false;

  await notificationModel.create({
    user_id: params.userId,
    type: "system",
    title: params.title,
    message: params.message,
    link: "/admin",
    reference_id: params.propertyId,
    reference_type: "property",
  });

  return true;
};

export const dispatchSettlementRemindersJob = async (opts?: { now?: Date; dryRun?: boolean }) => {
  const now = opts?.now ?? new Date();
  const dryRun = !!opts?.dryRun;
  const todayStart = startOfUtcDay(now);
  const settlementDay = getCurrentSettlementCycleDay(todayStart);
  const dayOffsetFromSettlement = Math.round(
    (todayStart.getTime() - settlementDay.getTime()) / MS_PER_DAY
  );
  const reminderCopy = getReminderCopyByOffset(dayOffsetFromSettlement);

  if (!reminderCopy) {
    return {
      created: 0,
      checkedProperties: 0,
      skipped: "not-a-reminder-day" as const,
      settlementDay: settlementDay.toISOString(),
      dueDay: new Date(settlementDay.getTime() + 7 * MS_PER_DAY).toISOString(),
      dayOffsetFromSettlement,
      dryRun,
    };
  }

  const { data: properties, error: propsErr } = await supabaseAdmin
    .from("properties")
    .select("id, name, owner_id")
    .eq("is_deleted", false)
    .eq("status", "approved");

  if (propsErr) throw propsErr;

  let created = 0;
  let checkedProperties = 0;

  for (const property of properties ?? []) {
    checkedProperties += 1;

    const { data: bookings, error: bookingErr } = await supabaseAdmin
      .from("bookings")
      .select("id, service_fee")
      .eq("property_id", property.id)
      .eq("is_deleted", false)
      .in("status", ["completed", "checked_out"])
      .neq("payment_status", "refunded")
      .not("finalized_at", "is", null)
      .limit(100000);

    if (bookingErr) {
      console.warn("[settlement-reminders] failed to fetch bookings", property.id, bookingErr);
      continue;
    }

    const bookingIds = (bookings ?? []).map((b: any) => b.id);
    const totalFees = (bookings ?? []).reduce(
      (sum: number, b: any) => sum + (parseFloat(b.service_fee) || 0),
      0
    );

    let settledTotal = 0;
    if (bookingIds.length > 0) {
      const { data: links, error: linksErr } = await supabaseAdmin
        .from("settlement_bookings")
        .select("amount, proprietor_settlements!inner(status)")
        .in("booking_id", bookingIds);

      if (linksErr) {
        console.warn("[settlement-reminders] failed to fetch settlement links", property.id, linksErr);
        continue;
      }

      settledTotal = (links ?? []).reduce((sum: number, link: any) => {
        if (link?.proprietor_settlements?.status === "completed") {
          return sum + (parseFloat(link.amount) || 0);
        }
        return sum;
      }, 0);
    }

    const outstanding = Math.round((totalFees - settledTotal) * 100) / 100;
    if (outstanding <= 0) continue;

    try {
      if (dryRun) {
        created += 1;
      } else {
        const wasCreated = await createReminderIfMissingToday({
          userId: property.owner_id,
          propertyId: property.id,
          title: reminderCopy.title,
          message: `${reminderCopy.messagePrefix} for ${property.name}. Outstanding balance: ${toPhp(outstanding)}.`,
          now,
        });
        if (wasCreated) created += 1;
      }
    } catch (notifErr) {
      console.warn("[settlement-reminders] failed to create notification", property.id, notifErr);
    }
  }

  return {
    created,
    checkedProperties,
    settlementDay: settlementDay.toISOString(),
    dueDay: new Date(settlementDay.getTime() + 7 * MS_PER_DAY).toISOString(),
    dayOffsetFromSettlement,
    dryRun,
  };
};

export const dispatchSettlementReminders = async (req: Request, res: Response) => {
  try {
    const dateStr = (req.query.date as string) || "";
    const dryRun = String(req.query.dryRun || "").toLowerCase() === "true";
    let now: Date | undefined;

    if (dateStr) {
      now = new Date(dateStr);
      if (isNaN(now.getTime())) {
        return res.status(400).json({ error: "Invalid date query. Use ISO date/time format." });
      }
    }

    const result = await dispatchSettlementRemindersJob({ now, dryRun });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    logger.error("dispatchSettlementReminders error", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const DEFAULT_SETTLEMENT_CHANNELS = {
  gcash: { imageUrl: null, description: "" },
  paymaya: { imageUrl: null, description: "" },
  bankTransfer: { imageUrl: null, number: "", provider: "" },
  card: { number: "", provider: "" },
  cashCheque: { description: "To be settled personally between owner and proprietor." },
};

const toCleanString = (value: any): string => (value === undefined || value === null ? "" : String(value).trim());

const getSettlementPaymentChannelsFromPrefs = (prefs: any) => {
  const raw = prefs?.settlement_payment_channels || {};

  // Backward compatibility for previous flat keys.
  const legacyGcash = raw?.gcashQrUrl || null;
  const legacyPaymaya = raw?.paymayaQrUrl || null;

  return {
    gcash: {
      imageUrl: raw?.gcash?.imageUrl || legacyGcash || null,
      description: raw?.gcash?.description || "",
    },
    paymaya: {
      imageUrl: raw?.paymaya?.imageUrl || legacyPaymaya || null,
      description: raw?.paymaya?.description || "",
    },
    bankTransfer: {
      imageUrl: raw?.bankTransfer?.imageUrl || null,
      number: raw?.bankTransfer?.number || "",
      provider: raw?.bankTransfer?.provider || raw?.bankTransfer?.description || "",
    },
    card: {
      number: raw?.card?.number || "",
      provider: raw?.card?.provider || raw?.card?.description || "",
    },
    cashCheque: {
      description:
        raw?.cashCheque?.description ||
        DEFAULT_SETTLEMENT_CHANNELS.cashCheque.description,
    },
  };
};

/**
 * GET /api/settlements/payment-channels
 * Returns platform-level payment account images set by superadmin.
 */
export const getSettlementPaymentChannels = async (_req: Request, res: Response) => {
  try {
    const { data: superAdmins, error } = await supabaseAdmin
      .from("profiles")
      .select("id, notification_prefs, updated_at")
      .eq("role", "super_admin")
      .eq("is_deleted", false)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    const selected = (superAdmins ?? []).find((row: any) => {
      const channels = getSettlementPaymentChannelsFromPrefs(row.notification_prefs);
      return !!channels.gcash?.imageUrl || !!channels.paymaya?.imageUrl || !!channels.bankTransfer?.imageUrl;
    }) || superAdmins?.[0];

    const channels = getSettlementPaymentChannelsFromPrefs(selected?.notification_prefs || {});
    return res.json({ paymentChannels: channels });
  } catch (err: any) {
    logger.error("getSettlementPaymentChannels error", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * PUT /api/settlements/payment-channels
 * Superadmin updates platform-level payment account images.
 */
export const updateSettlementPaymentChannels = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { paymentChannels, gcashQrUrl, paymayaQrUrl } = req.body || {};

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("notification_prefs")
      .eq("id", user.id)
      .single();

    if (profileErr) throw profileErr;

    const currentChannels = getSettlementPaymentChannelsFromPrefs(profile?.notification_prefs || {});
    const incoming = paymentChannels || {};

    const normalizedChannels = {
      gcash: {
        imageUrl:
          incoming?.gcash?.imageUrl !== undefined
            ? (incoming?.gcash?.imageUrl || null)
            : (gcashQrUrl !== undefined ? (gcashQrUrl || null) : currentChannels.gcash.imageUrl),
        description:
          incoming?.gcash?.description !== undefined
            ? toCleanString(incoming?.gcash?.description)
            : currentChannels.gcash.description,
      },
      paymaya: {
        imageUrl:
          incoming?.paymaya?.imageUrl !== undefined
            ? (incoming?.paymaya?.imageUrl || null)
            : (paymayaQrUrl !== undefined ? (paymayaQrUrl || null) : currentChannels.paymaya.imageUrl),
        description:
          incoming?.paymaya?.description !== undefined
            ? toCleanString(incoming?.paymaya?.description)
            : currentChannels.paymaya.description,
      },
      bankTransfer: {
        imageUrl:
          incoming?.bankTransfer?.imageUrl !== undefined
            ? (incoming?.bankTransfer?.imageUrl || null)
            : currentChannels.bankTransfer.imageUrl,
        number:
          incoming?.bankTransfer?.number !== undefined
            ? toCleanString(incoming?.bankTransfer?.number)
            : currentChannels.bankTransfer.number,
        provider:
          incoming?.bankTransfer?.provider !== undefined
            ? toCleanString(incoming?.bankTransfer?.provider)
            : (incoming?.bankTransfer?.description !== undefined
                ? toCleanString(incoming?.bankTransfer?.description)
                : currentChannels.bankTransfer.provider),
      },
      card: {
        number:
          incoming?.card?.number !== undefined
            ? toCleanString(incoming?.card?.number)
            : currentChannels.card.number,
        provider:
          incoming?.card?.provider !== undefined
            ? toCleanString(incoming?.card?.provider)
            : (incoming?.card?.description !== undefined
                ? toCleanString(incoming?.card?.description)
                : currentChannels.card.provider),
      },
      cashCheque: {
        description:
          incoming?.cashCheque?.description !== undefined
            ? toCleanString(incoming?.cashCheque?.description) || DEFAULT_SETTLEMENT_CHANNELS.cashCheque.description
            : currentChannels.cashCheque.description || DEFAULT_SETTLEMENT_CHANNELS.cashCheque.description,
      },
    };

    const mergedPrefs = {
      ...(profile?.notification_prefs || {}),
      settlement_payment_channels: normalizedChannels,
    };

    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({ notification_prefs: mergedPrefs, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateErr) throw updateErr;

    return res.json({ paymentChannels: getSettlementPaymentChannelsFromPrefs(mergedPrefs) });
  } catch (err: any) {
    logger.error("updateSettlementPaymentChannels error", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

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

    // Notify proprietor that this settlement has been received/recorded.
    try {
      await notificationModel.create({
        user_id: proprietorId,
        type: "payment_received",
        title: "Settlement Received",
        message: `Your settlement payment of ${toPhp(parsedAmount)} for this property has been recorded successfully.`,
        link: "/admin",
        reference_id: propertyId,
        reference_type: "property",
      });
    } catch (notifErr) {
      console.warn("Failed to create settlement received notification:", notifErr);
    }

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
    logger.error("createSettlement error", err);
    return res.status(500).json({ error: "Internal server error." });
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
    const { data: activeProperties, error: activePropsErr } = await supabaseAdmin
      .from("properties")
      .select("id")
      .eq("is_deleted", false)
      .eq("status", "approved");
    if (activePropsErr) throw activePropsErr;

    const activePropertyIds = (activeProperties ?? []).map((row: any) => row.id);
    if (activePropertyIds.length === 0) {
      return res.json({ settlements: [] });
    }

    let query = supabaseAdmin
      .from("proprietor_settlements")
      .select(`
        *,
        properties:property_id ( name ),
        profiles:proprietor_id ( first_name, last_name, email )
      `)
      .in("property_id", activePropertyIds)
      .order("settled_at", { ascending: false });

    const { proprietorId, propertyId, status, from, to, limit } = req.query as Record<string, string>;

    if (proprietorId) query = query.eq("proprietor_id", proprietorId);
    if (propertyId) {
      if (!activePropertyIds.includes(propertyId)) {
        return res.json({ settlements: [] });
      }
      query = query.eq("property_id", propertyId);
    }
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
    logger.error("listSettlements error", err);
    return res.status(500).json({ error: "Internal server error." });
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
    logger.error("getSettlement error", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * PATCH /api/settlements/:id/status
 * Update settlement status (e.g. mark as reversed/failed).
 * Body: { status: 'reversed' | 'failed' | 'completed' }
 */
export const updateSettlementStatus = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["pending", "completed", "failed", "reversed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("proprietor_settlements")
      .select("id, status, proprietor_id, property_id, amount")
      .eq("id", id)
      .single();

    if (existingErr) throw existingErr;

    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status !== "pending" && adminId) {
      // Keep created_by aligned with the reviewer so proprietor history shows the superadmin who processed it.
      updates.created_by = adminId;
    }

    const { data, error } = await supabaseAdmin
      .from("proprietor_settlements")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (status === "completed" && existing?.status !== "completed") {
      try {
        await notificationModel.create({
          user_id: existing.proprietor_id,
          type: "payment_received",
          title: "Settlement Confirmed",
          message: `Your settlement payment of ${toPhp(parseFloat(existing.amount) || 0)} has been confirmed.`,
          link: "/admin",
          reference_id: existing.property_id,
          reference_type: "property",
        });
      } catch (notifErr) {
        console.warn("Failed to create settlement confirmation notification:", notifErr);
      }
    }

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
    logger.error("updateSettlementStatus error", err);
    return res.status(500).json({ error: "Internal server error." });
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
        .eq("is_deleted", false)
        .eq("status", "approved");
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
    logger.error("getMonthlyReceivables error", err);
    return res.status(500).json({ error: "Internal server error." });
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
    logger.error("getReceivableSummary error", err);
    return res.status(500).json({ error: "Internal server error." });
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
    logger.error("getPropertySettlements error", err);
    return res.status(500).json({ error: "Internal server error." });
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
    logger.error("deleteSettlement error", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * GET /api/settlements/proprietor/monthly-status
 * Get current month's settlement status for the authenticated proprietor.
 * Proprietors can check their own outstanding balances.
 *
 * Query params:
 *   - propertyId (optional): specific property to check
 *
 * Returns:
 *   - thisMonthGenerated
 *   - thisMonthSettled
 *   - thisMonthOutstanding
 *   - properties: array of property details with their outstanding amounts
 */
export const getProprietorMonthlyStatus = async (req: Request, res: Response) => {
  try {
    const proprietorId = (req as any).user?.id;
    const { propertyId } = req.query as Record<string, string>;

    if (!proprietorId) {
      return res.status(401).json({ error: "Unauthorized: proprietor ID required." });
    }

    // Get proprietor's properties
    let propsQuery = supabaseAdmin
      .from("properties")
      .select("id, name")
      .eq("owner_id", proprietorId)
      .eq("is_deleted", false)
      .eq("status", "approved");

    if (propertyId) {
      propsQuery = propsQuery.eq("id", propertyId);
    }

    const { data: properties, error: propsErr } = await propsQuery;
    if (propsErr) throw propsErr;

    if (!properties || properties.length === 0) {
      return res.json({
        thisMonthGenerated: 0,
        thisMonthSettled: 0,
        thisMonthOutstanding: 0,
        properties: [],
        currency: "PHP",
      });
    }

    const propIds = properties.map((p: any) => p.id);

    // Current month boundaries
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // This month generated for proprietor's properties
    const { data: monthGen, error: e1 } = await supabaseAdmin
      .from("bookings")
      .select("service_fee, property_id")
      .eq("is_deleted", false)
      .in("status", ["completed", "checked_out"])
      .neq("payment_status", "refunded")
      .gte("finalized_at", monthStart)
      .in("property_id", propIds)
      .limit(100000);
    if (e1) throw e1;

    const thisMonthGenerated = (monthGen ?? []).reduce(
      (sum: number, b: any) => sum + (parseFloat(b.service_fee) || 0),
      0
    );

    // This month settled for proprietor's properties
    const { data: monthSett, error: e2 } = await supabaseAdmin
      .from("proprietor_settlements")
      .select("amount, property_id")
      .eq("status", "completed")
      .gte("settled_at", monthStart)
      .in("property_id", propIds)
      .limit(100000);
    if (e2) throw e2;

    const thisMonthSettled = (monthSett ?? []).reduce(
      (sum: number, s: any) => sum + (parseFloat(s.amount) || 0),
      0
    );

    // Build detailed property info with their outstanding amounts
    const propertyDetails = properties.map((prop: any) => {
      const propGen = (monthGen ?? [])
        .filter((b: any) => b.property_id === prop.id)
        .reduce((sum: number, b: any) => sum + (parseFloat(b.service_fee) || 0), 0);

      const propSett = (monthSett ?? [])
        .filter((s: any) => s.property_id === prop.id)
        .reduce((sum: number, s: any) => sum + (parseFloat(s.amount) || 0), 0);

      return {
        propertyId: prop.id,
        propertyName: prop.name,
        generated: Math.round(propGen * 100) / 100,
        settled: Math.round(propSett * 100) / 100,
        outstanding: Math.round((propGen - propSett) * 100) / 100,
      };
    });

    return res.json({
      thisMonthGenerated: Math.round(thisMonthGenerated * 100) / 100,
      thisMonthSettled: Math.round(thisMonthSettled * 100) / 100,
      thisMonthOutstanding: Math.round((thisMonthGenerated - thisMonthSettled) * 100) / 100,
      properties: propertyDetails,
      currency: "PHP",
    });
  } catch (err: any) {
    logger.error("getProprietorMonthlyStatus error", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * GET /api/settlements/proprietor/receivables
 * Proprietor-only receivables view (current + historical summary per property).
 */
export const getProprietorReceivables = async (req: Request, res: Response) => {
  try {
    const proprietorId = (req as any).user?.id;
    const proprietorName = [
      (req as any).user?.first_name,
      (req as any).user?.last_name,
    ]
      .filter(Boolean)
      .join(" ") || "Proprietor";
    const proprietorEmail = (req as any).user?.email || "";
    const { propertyId } = req.query as Record<string, string>;

    if (!proprietorId) {
      return res.status(401).json({ error: "Unauthorized: proprietor ID required." });
    }

    let propsQuery = supabaseAdmin
      .from("properties")
      .select("id, name, created_at")
      .eq("owner_id", proprietorId)
      .eq("is_deleted", false)
      .eq("status", "approved");

    if (propertyId) propsQuery = propsQuery.eq("id", propertyId);

    const { data: properties, error: propsErr } = await propsQuery;
    if (propsErr) throw propsErr;

    if (!properties || properties.length === 0) {
      return res.json({
        summary: {
          totalPayables: 0,
          totalSettled: 0,
          outstandingPayables: 0,
          propertiesWithBalance: 0,
        },
        properties: [],
      });
    }

    const propertyIds = properties.map((p: any) => p.id);

    const { data: allBookings, error: bookingsErr } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, property_id, service_fee, status, payment_status, payment_method, service_type, pet_name, checkin, checkout, created_at, finalized_at"
      )
      .in("property_id", propertyIds)
      .eq("is_deleted", false)
      .in("status", ["completed", "checked_out"])
      .neq("payment_status", "refunded")
      .not("finalized_at", "is", null)
      .order("finalized_at", { ascending: true })
      .limit(100000);

    if (bookingsErr) throw bookingsErr;

    const bookingIds = (allBookings ?? []).map((b: any) => b.id);

    const { data: links, error: linksErr } = bookingIds.length
      ? await supabaseAdmin
          .from("settlement_bookings")
          .select("booking_id, amount, proprietor_settlements!inner(status)")
          .in("booking_id", bookingIds)
      : { data: [], error: null as any };

    if (linksErr) throw linksErr;

    const settledPerBooking: Record<string, number> = {};
    (links ?? []).forEach((l: any) => {
      if ((l as any).proprietor_settlements?.status === "completed") {
        settledPerBooking[l.booking_id] =
          (settledPerBooking[l.booking_id] || 0) + (parseFloat(l.amount) || 0);
      }
    });

    const { data: allSettlements, error: settErr } = await supabaseAdmin
      .from("proprietor_settlements")
      .select("property_id, amount, status")
      .eq("proprietor_id", proprietorId)
      .in("property_id", propertyIds)
      .limit(100000);

    if (settErr) throw settErr;

    const completedSettledPerProperty: Record<string, number> = {};
    (allSettlements ?? []).forEach((s: any) => {
      if (s.status === "completed") {
        completedSettledPerProperty[s.property_id] =
          (completedSettledPerProperty[s.property_id] || 0) + (parseFloat(s.amount) || 0);
      }
    });

    const rows = (properties ?? []).map((p: any) => {
      const propBookings = (allBookings ?? []).filter((b: any) => b.property_id === p.id);
      const totalPayable = propBookings.reduce(
        (sum: number, b: any) => sum + (parseFloat(b.service_fee) || 0),
        0
      );
      const totalSettled = completedSettledPerProperty[p.id] || 0;
      const outstanding = Math.max(0, Math.round((totalPayable - totalSettled) * 100) / 100);

      const bookings = propBookings.map((b: any) => {
        const fee = parseFloat(b.service_fee) || 0;
        const settledAmount = Math.round((settledPerBooking[b.id] || 0) * 100) / 100;
        const outstandingAmount = Math.max(0, Math.round((fee - settledAmount) * 100) / 100);

        return {
          id: b.id,
          checkin: b.checkin,
          checkout: b.checkout,
          serviceType: b.service_type,
          paymentMethod: b.payment_method,
          paymentStatus: b.payment_status,
          petName: b.pet_name,
          status: b.status,
          serviceFee: fee,
          settledAmount,
          outstandingAmount,
          createdAt: b.created_at,
        };
      });

      return {
        propertyId: p.id,
        propertyName: p.name,
        ownerId: proprietorId,
        ownerName: proprietorName,
        ownerEmail: proprietorEmail,
        bookingCount: bookings.length,
        oldestFinalized: propBookings[0]?.finalized_at || null,
        totalPayable: Math.round(totalPayable * 100) / 100,
        totalSettled: Math.round(totalSettled * 100) / 100,
        outstandingPayable: outstanding,
        bookings,
      };
    });

    const totalPayables = rows.reduce((sum: number, r: any) => sum + (r.totalPayable || 0), 0);
    const totalSettled = rows.reduce((sum: number, r: any) => sum + (r.totalSettled || 0), 0);
    const outstandingPayables = rows.reduce(
      (sum: number, r: any) => sum + (r.outstandingPayable || 0),
      0
    );

    return res.json({
      summary: {
        totalPayables: Math.round(totalPayables * 100) / 100,
        totalSettled: Math.round(totalSettled * 100) / 100,
        outstandingPayables: Math.round(outstandingPayables * 100) / 100,
        propertiesWithBalance: rows.filter((r: any) => r.outstandingPayable > 0).length,
      },
      properties: rows,
    });
  } catch (err: any) {
    logger.error("getProprietorReceivables error", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * GET /api/settlements/proprietor/settlements
 * Proprietor-only settlement history.
 */
export const getProprietorSettlements = async (req: Request, res: Response) => {
  try {
    const proprietorId = (req as any).user?.id;
    const { propertyId, status, from, to, limit } = req.query as Record<string, string>;

    if (!proprietorId) {
      return res.status(401).json({ error: "Unauthorized: proprietor ID required." });
    }

    let query = supabaseAdmin
      .from("proprietor_settlements")
      .select(
        "id, proprietor_id, property_id, amount, settlement_method, reference_no, notes, status, period_month, settled_at, created_at, updated_at, properties:property_id(name), profiles:created_by(first_name,last_name,email)"
      )
      .eq("proprietor_id", proprietorId)
      .order("settled_at", { ascending: false });

    if (propertyId) query = query.eq("property_id", propertyId);
    if (status) query = query.eq("status", status);
    if (from) query = query.gte("settled_at", from);
    if (to) query = query.lte("settled_at", to);
    query = query.limit(parseInt(limit || "200", 10));

    const { data, error } = await query;
    if (error) throw error;

    const settlements = (data ?? []).map((s: any) => ({
      ...s,
      propertyName: s.properties?.name || "Unknown",
      reviewedByName:
        [s.profiles?.first_name, s.profiles?.last_name].filter(Boolean).join(" ") ||
        "Pending Review",
      reviewedByEmail: s.profiles?.email || "",
      properties: undefined,
      profiles: undefined,
    }));

    return res.json({ settlements });
  } catch (err: any) {
    logger.error("getProprietorSettlements error", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * POST /api/settlements/proprietor/settlements
 * Proprietor submits a settlement payment proof for superadmin review.
 */
export const submitProprietorSettlement = async (req: Request, res: Response) => {
  try {
    const proprietorId = (req as any).user?.id;
    const {
      propertyId,
      amount,
      method,
      referenceNo,
      notes,
      proofUrl,
      periodMonth,
    } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!proprietorId) {
      return res.status(401).json({ error: "Unauthorized: proprietor ID required." });
    }
    if (!propertyId || !parsedAmount || parsedAmount <= 0) {
      return res
        .status(400)
        .json({ error: "propertyId and a positive amount are required." });
    }

    const { data: property, error: propErr } = await supabaseAdmin
      .from("properties")
      .select("id, name, owner_id")
      .eq("id", propertyId)
      .eq("is_deleted", false)
      .eq("status", "approved")
      .single();
    if (propErr) throw propErr;

    if (!property || property.owner_id !== proprietorId) {
      return res.status(403).json({ error: "You can only submit settlements for your own properties." });
    }

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
      (sum: number, b: any) => sum + (parseFloat(b.service_fee) || 0),
      0
    );

    const { data: existingLinks } = allBookingIds.length
      ? await supabaseAdmin
          .from("settlement_bookings")
          .select("booking_id, amount, proprietor_settlements!inner(status)")
          .in("booking_id", allBookingIds)
      : { data: [] };

    const settledPerBooking: Record<string, number> = {};
    (existingLinks ?? []).forEach((l: any) => {
      if ((l as any).proprietor_settlements?.status === "completed") {
        settledPerBooking[l.booking_id] =
          (settledPerBooking[l.booking_id] || 0) + (parseFloat(l.amount) || 0);
      }
    });
    const totalAlreadySettled = Object.values(settledPerBooking).reduce((s, v) => s + v, 0);
    const totalOutstanding = Math.round((totalFees - totalAlreadySettled) * 100) / 100;

    if (parsedAmount > totalOutstanding + 0.01) {
      return res.status(400).json({
        error: `Submitted amount (${parsedAmount}) exceeds outstanding balance (${totalOutstanding}) for this property.`,
        totalOutstanding,
      });
    }

    const composedNotes = [
      notes?.trim() || null,
      proofUrl && String(proofUrl).trim() ? `Proof: ${String(proofUrl).trim()}` : null,
    ].filter(Boolean).join("\n");

    const { data: settlement, error: settleErr } = await supabaseAdmin
      .from("proprietor_settlements")
      .insert({
        proprietor_id: proprietorId,
        property_id: propertyId,
        amount: parsedAmount,
        settlement_method: method || null,
        reference_no: referenceNo || null,
        notes: composedNotes || null,
        period_month: periodMonth || null,
        settled_at: new Date().toISOString(),
        created_by: proprietorId,
        status: "pending",
      })
      .select()
      .single();

    if (settleErr) throw settleErr;

    try {
      const admins = await getSuperAdminRecipients();
      await Promise.all(
        admins.map((admin) =>
          notificationModel.create({
            user_id: admin.id,
            type: "system",
            title: "New Settlement Submission",
            message: `A proprietor submitted ${toPhp(parsedAmount)} for ${property.name}. Review and confirm this settlement request.`,
            link: `/superadmin/revenue?propertyId=${propertyId}`,
            reference_id: settlement.id,
            reference_type: "settlement",
          })
        )
      );
    } catch (notifErr) {
      console.warn("Failed to notify superadmins for settlement submission:", notifErr);
    }

    return res.status(201).json({
      settlement,
      message: "Settlement request submitted successfully and is pending superadmin review.",
    });
  } catch (err: any) {
    logger.error("submitProprietorSettlement error", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};
