import { TOOL_INPUT_SCHEMA_TEXT } from "../schemas";
import { ToolContext, ToolDefinition } from "../types";
import { supabaseAdmin } from "../../config/supabaseAdmin";

export interface GetProviderRevenueArgs {
  provider_id?: string;
  month?: string;
}

interface RevenueBreakdownItem {
  label: string;
  revenue: number | null;
  count: number | null;
}

interface GetProviderRevenueResult {
  totalRevenue: number | null;
  breakdown: RevenueBreakdownItem[];
}

export const getProviderRevenueTool: ToolDefinition<GetProviderRevenueArgs, GetProviderRevenueResult> = {
  name: "get_provider_revenue",
  description: "Get provider revenue for a given month",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_provider_revenue,
  run: async (args, context?: ToolContext) => {
    const requestedProviderId = String(args?.provider_id || "").trim();
    const actorId = String(context?.userId || "").trim();

    const targetProviderId = requestedProviderId || actorId;
    if (!targetProviderId) {
      throw new Error("Please sign in to view provider revenue.");
    }

    if (requestedProviderId && actorId && requestedProviderId !== actorId) {
      const { data: actorProfile, error: actorErr } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", actorId)
        .maybeSingle();

      if (actorErr) throw actorErr;
      const actorRole = String(actorProfile?.role || "").toLowerCase();
      if (actorRole !== "super_admin") {
        throw new Error("You can only view your own revenue data.");
      }
    }

    const { data: properties, error: propertiesErr } = await supabaseAdmin
      .from("properties")
      .select("id, name, city")
      .eq("owner_id", targetProviderId)
      .eq("status", "approved")
      .eq("is_deleted", false);

    if (propertiesErr) throw propertiesErr;

    const propertyRows = Array.isArray(properties) ? properties : [];
    if (propertyRows.length === 0) {
      return {
        totalRevenue: 0,
        breakdown: [],
      };
    }

    const propertyIds = propertyRows.map((row: any) => row.id).filter(Boolean);

    let query = supabaseAdmin
      .from("bookings")
      .select("property_id, total_price, checkin")
      .in("property_id", propertyIds)
      .eq("payment_status", "paid")
      .eq("is_deleted", false);

    const month = String(args?.month || "").trim();
    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        throw new Error("month must be YYYY-MM when provided");
      }

      const start = `${month}-01`;
      const [year, mon] = month.split("-").map((v) => Number(v));
      const nextMonthDate = mon === 12
        ? new Date(Date.UTC(year + 1, 0, 1))
        : new Date(Date.UTC(year, mon, 1));
      const end = nextMonthDate.toISOString().slice(0, 10);

      query = query.gte("checkin", start).lt("checkin", end);
    }

    const { data: bookings, error: bookingsErr } = await query;
    if (bookingsErr) throw bookingsErr;

    const bookingRows = Array.isArray(bookings) ? bookings : [];
    const propertyById = new Map(propertyRows.map((row: any) => [String(row.id), row]));

    const revenueByProperty = new Map<string, { revenue: number; count: number }>();
    let totalRevenue = 0;

    for (const row of bookingRows) {
      const propertyId = String((row as any)?.property_id || "");
      if (!propertyId) continue;

      const amount = Number((row as any)?.total_price || 0);
      if (!Number.isFinite(amount)) continue;

      totalRevenue += amount;

      const current = revenueByProperty.get(propertyId) || { revenue: 0, count: 0 };
      current.revenue += amount;
      current.count += 1;
      revenueByProperty.set(propertyId, current);
    }

    const breakdown = Array.from(revenueByProperty.entries())
      .map(([propertyId, totals]) => {
        const property = propertyById.get(propertyId);
        const label = String(property?.name || property?.city || propertyId || "Unknown");
        return {
          label,
          revenue: Number(totals.revenue.toFixed(2)),
          count: totals.count,
        };
      })
      .sort((a, b) => (Number(b.revenue || 0) - Number(a.revenue || 0)))
      .slice(0, 10);

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      breakdown,
    };
  },
};
