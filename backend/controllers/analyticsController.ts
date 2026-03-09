import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabaseAdmin";

const PHT_OFFSET = 8 * 60; // Philippines = UTC+8

/** Return a Date shifted so that UTC methods give PHT values */
function toPHT(date: Date): Date {
  return new Date(date.getTime() + (PHT_OFFSET + date.getTimezoneOffset()) * 60_000);
}

/** Current time in PHT */
function nowPHT(): Date {
  return toPHT(new Date());
}

// parse time range query param into a JS Date (UTC — matches Supabase timestamps)
function rangeToDate(range: string): Date | null {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "3m":
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, now.getUTCDate()));
    case "6m":
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, now.getUTCDate()));
    case "12m":
      return new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()));
    default:
      return null;
  }
}

export const analyticsController = {
  getOverview: async (req: Request, res: Response) => {
    try {
      const range = (req.query.range as string) || "12m";
      const since = rangeToDate(range);

      const sinceDate = since ? since.toISOString().slice(0, 10) : null;
      console.log("SINCE:", since?.toISOString());
      console.log("sinceDate:", sinceDate);

      // ── Total bookings (by created_at) ──
      let bookingsQuery = supabaseAdmin
        .from("bookings")
        .select("id, payment_status", { count: "exact" })
        .eq("is_deleted", false);
      if (since) bookingsQuery = bookingsQuery.gte("created_at", since.toISOString());
      const { data: bookings, count: totalBookings } = await bookingsQuery;
      console.log("Total bookings:", totalBookings);
      
      // ── Revenue: paid bookings filtered by checkout/checkin date ──
      const { data: paidBookings } = await supabaseAdmin
        .from("bookings")
        .select("total_price, checkout, checkin")
        .eq("is_deleted", false)
        .eq("payment_status", "paid");

      const revenueInRange = (paidBookings ?? []).filter((b: any) => {
        const d = b.checkout || b.checkin;
        return d && (!sinceDate || d >= sinceDate);
      });

      const totalRevenue = revenueInRange.reduce(
        (sum: number, b: any) => sum + (parseFloat(b.total_price) || 0),
        0
      );
      const paidCount = revenueInRange.length;
      console.log("Total revenue:", totalRevenue, "from", paidCount, "bookings");

      // ── Paid bookings in period (for conversion rate) ──
      const paidInPeriod = (bookings ?? []).filter(
        (b: any) => b.payment_status === "paid"
      ).length;
      console.log("Paid bookings in period (count):", paidInPeriod);

      // ── Total users ──
      let usersQuery = supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact" })
        .eq("is_deleted", false);
      if (since) usersQuery = usersQuery.gte("created_at", since.toISOString());
      const { count: totalUsers } = await usersQuery;
      console.log("Total users:", totalUsers);

      // ── Approved properties count ──
      const { count: totalProperties } = await supabaseAdmin
        .from("properties")
        .select("id", { count: "exact" })
        .eq("status", "approved")
        .eq("is_deleted", false);
      console.log("Total approved properties:", totalProperties);

      // ── Average rating (from reviews) ──
      const { data: ratingData } = await supabaseAdmin
        .from("reviews")
        .select("rating");
      const avgRating =
        ratingData && ratingData.length > 0
          ? ratingData.reduce((s: number, r: any) => s + r.rating, 0) / ratingData.length
          : 0;
      console.log("Average rating:", avgRating);

      // ── Average spend per paid booking ──
      const avgSpend =
        paidCount > 0
          ? Math.round((totalRevenue / paidCount) * 100) / 100
          : 0;
      console.log("Average spend per paid booking:", avgSpend);

      // ── Conversion rate (paid / total bookings in period) ──
      const conversionRate =
        totalBookings && totalBookings > 0
          ? Math.round((paidInPeriod / totalBookings) * 100 * 10) / 10
          : 0;
      console.log("Conversion rate:", conversionRate, "%");

      // ── Previous period comparison (for trends) ──
      let prevBookingsCount = 0;
      let prevRevenue = 0;
      if (since) {
        const periodMs = Date.now() - since.getTime();
        const prevSince = new Date(since.getTime() - periodMs);
        const prevSinceDate = prevSince.toISOString().slice(0, 10);
        const { count: prevCount } = await supabaseAdmin
          .from("bookings")
          .select("id", { count: "exact" })
          .eq("is_deleted", false)
          .gte("created_at", prevSince.toISOString())
          .lt("created_at", since.toISOString());
        prevBookingsCount = prevCount ?? 0;
        // Previous period revenue (paid bookings by checkout/checkin date)
        prevRevenue = (paidBookings ?? []).reduce(
          (sum: number, b: any) => {
            const d = b.checkout || b.checkin;
            return d && d >= prevSinceDate && d < sinceDate!
              ? sum + (parseFloat(b.total_price) || 0)
              : sum;
          },
          0
        );
      }

      const bookingsChange =
        prevBookingsCount > 0
          ? (((totalBookings ?? 0) - prevBookingsCount) / prevBookingsCount) * 100
          : 0;
      const revenueChange =
        prevRevenue > 0
          ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
          : 0;

      res.json({
        totalBookings: totalBookings ?? 0,
        totalRevenue,
        totalUsers: totalUsers ?? 0,
        totalProperties: totalProperties ?? 0,
        avgRating: Math.round(avgRating * 100) / 100,
        avgSpend: Math.round(avgSpend * 100) / 100,
        conversionRate,
        bookingsChange: Math.round(bookingsChange * 10) / 10,
        revenueChange: Math.round(revenueChange * 10) / 10,
      });
    } catch (err: any) {
      console.error("Analytics overview error:", err);
      res.status(500).json({ error: "Failed to fetch analytics overview" });
    }
  },

  getBookingTrends: async (req: Request, res: Response) => {
    try {
      const range = (req.query.range as string) || "12m";
      const since = rangeToDate(range);

      const sinceDate = since ? since.toISOString().slice(0, 10) : null;

      // Booking counts by created_at
      let bookingQuery = supabaseAdmin
        .from("bookings")
        .select("created_at")
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });
      if (since) bookingQuery = bookingQuery.gte("created_at", since.toISOString());
      const { data: allBookings } = await bookingQuery;

      // Revenue by checkout date, paid only
      const { data: paidBookings } = await supabaseAdmin
        .from("bookings")
        .select("total_price, checkout, checkin")
        .eq("is_deleted", false)
        .eq("payment_status", "paid");

      // Group by day for short ranges, month for longer
      const useDaily = range === "7d" || range === "30d";
      const periodMap: Record<string, { bookings: number; revenue: number }> = {};
      for (const b of allBookings ?? []) {
        const d = toPHT(new Date(b.created_at));
        const key = useDaily
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!periodMap[key]) periodMap[key] = { bookings: 0, revenue: 0 };
        periodMap[key].bookings++;
      }
      for (const b of paidBookings ?? []) {
        const dateRef = b.checkout || b.checkin;
        if (!dateRef) continue;
        if (sinceDate && dateRef < sinceDate) continue;
        const key = useDaily
          ? (dateRef as string).slice(0, 10)
          : (dateRef as string).slice(0, 7);
        if (!periodMap[key]) periodMap[key] = { bookings: 0, revenue: 0 };
        periodMap[key].revenue += parseFloat(b.total_price) || 0;
      }

      const trends = Object.entries(periodMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => ({
          period: key,
          bookings: val.bookings,
          revenue: Math.round(val.revenue * 100) / 100,
        }));

      res.json({ trends });
    } catch (err: any) {
      console.error("Booking trends error:", err);
      res.status(500).json({ error: "Failed to fetch booking trends" });
    }
  },

  /**
   * Returns booking count + revenue grouped by service_type
   */
  getServiceBreakdown: async (req: Request, res: Response) => {
    try {
      const range = (req.query.range as string) || "12m";
      const since = rangeToDate(range);

      const sinceDate = since ? since.toISOString().slice(0, 10) : null;

      // Booking counts by created_at
      let countQuery = supabaseAdmin
        .from("bookings")
        .select("properties!inner(property_type)")
        .eq("is_deleted", false);
      if (since) countQuery = countQuery.gte("created_at", since.toISOString());
      const { data: allBookings } = await countQuery;

      // Revenue by checkout date, paid only
      const { data: paidBookings } = await supabaseAdmin
        .from("bookings")
        .select("total_price, checkout, checkin, properties!inner(property_type)")
        .eq("is_deleted", false)
        .eq("payment_status", "paid");

      const typeMap: Record<string, { count: number; revenue: number }> = {};
      for (const b of allBookings ?? []) {
        const types: string[] = (b as any).properties?.property_type ?? [];
        const type = types[0] || "other";
        if (!typeMap[type]) typeMap[type] = { count: 0, revenue: 0 };
        typeMap[type].count++;
      }
      for (const b of paidBookings ?? []) {
        const dateRef = (b as any).checkout || (b as any).checkin;
        if (!dateRef) continue;
        if (sinceDate && dateRef < sinceDate) continue;
        const types: string[] = (b as any).properties?.property_type ?? [];
        const type = types[0] || "other";
        if (!typeMap[type]) typeMap[type] = { count: 0, revenue: 0 };
        typeMap[type].revenue += parseFloat(b.total_price) || 0;
      }

      const total = (allBookings ?? []).length || 1;

      const breakdown = Object.entries(typeMap)
        .map(([type, data]) => ({
          type,
          value: Math.round((data.count / total) * 100),
          count: data.count,
          revenue: Math.round(data.revenue * 100) / 100,
        }))
        .sort((a, b) => b.count - a.count);

      res.json({ breakdown });
    } catch (err: any) {
      console.error("Service breakdown error:", err);
      res.status(500).json({ error: "Failed to fetch service breakdown" });
    }
  },

  /**
   * GET /api/analytics/user-growth
   * Returns monthly user registration data
   */
  getUserGrowth: async (req: Request, res: Response) => {
    try {
      const range = (req.query.range as string) || "12m";
      const since = rangeToDate(range);

      let query = supabaseAdmin
        .from("profiles")
        .select("created_at")
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });
      if (since) query = query.gte("created_at", since.toISOString());

      const { data: users } = await query;

      // Get total user count for running total
      const { count: totalBefore } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact" })
        .eq("is_deleted", false)
        .lt("created_at", (since ?? new Date("2000-01-01")).toISOString());

      const useDaily = range === "7d" || range === "30d";
      const periodMap: Record<string, number> = {};
      for (const u of users ?? []) {
        const d = toPHT(new Date(u.created_at));
        const key = useDaily
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        periodMap[key] = (periodMap[key] || 0) + 1;
      }

      let runningTotal = totalBefore ?? 0;
      const growth = Object.entries(periodMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, newUsers]) => {
          runningTotal += newUsers;
          return {
            period: key,
            total: runningTotal,
            new: newUsers,
          };
        });

      res.json({ growth });
    } catch (err: any) {
      console.error("User growth error:", err);
      res.status(500).json({ error: "Failed to fetch user growth" });
    }
  },

  /**
   * GET /api/analytics/top-locations
   * Returns cities ranked by booking count
   */
  getTopLocations: async (req: Request, res: Response) => {
    try {
      const range = (req.query.range as string) || "12m";
      const since = rangeToDate(range);

      const sinceDate = since ? since.toISOString().slice(0, 10) : null;

      // Booking counts by created_at
      let countQuery = supabaseAdmin
        .from("bookings")
        .select("properties!inner(city)")
        .eq("is_deleted", false);
      if (since) countQuery = countQuery.gte("created_at", since.toISOString());
      const { data: allBookings } = await countQuery;

      // Revenue by checkout date, paid only
      const { data: paidBookings } = await supabaseAdmin
        .from("bookings")
        .select("total_price, checkout, checkin, properties!inner(city)")
        .eq("is_deleted", false)
        .eq("payment_status", "paid");

      // Property counts per city
      const { data: propertyData } = await supabaseAdmin
        .from("properties")
        .select("city")
        .eq("status", "approved")
        .eq("is_deleted", false);

      const propertyCounts: Record<string, number> = {};
      for (const p of propertyData ?? []) {
        const city = p.city || "Unknown";
        propertyCounts[city] = (propertyCounts[city] || 0) + 1;
      }

      const cityMap: Record<string, { bookings: number; revenue: number }> = {};
      for (const b of allBookings ?? []) {
        const city = (b as any).properties?.city || "Unknown";
        if (!cityMap[city]) cityMap[city] = { bookings: 0, revenue: 0 };
        cityMap[city].bookings++;
      }
      for (const b of paidBookings ?? []) {
        const dateRef = (b as any).checkout || (b as any).checkin;
        if (!dateRef) continue;
        if (sinceDate && dateRef < sinceDate) continue;
        const city = (b as any).properties?.city || "Unknown";
        if (!cityMap[city]) cityMap[city] = { bookings: 0, revenue: 0 };
        cityMap[city].revenue += parseFloat(b.total_price) || 0;
      }

      const locations = Object.entries(cityMap)
        .map(([city, data]) => ({
          city,
          bookings: data.bookings,
          revenue: Math.round(data.revenue * 100) / 100,
          properties: propertyCounts[city] || 0,
        }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 10);

      res.json({ locations });
    } catch (err: any) {
      console.error("Top locations error:", err);
      res.status(500).json({ error: "Failed to fetch top locations" });
    }
  },

  /**
   * GET /api/analytics/top-properties
   * Returns properties ranked by booking count with revenue + rating
   */
  getTopProperties: async (req: Request, res: Response) => {
    try {
      const range = (req.query.range as string) || "12m";
      const since = rangeToDate(range);

      const sinceDate = since ? since.toISOString().slice(0, 10) : null;

      // Booking counts by created_at
      let countQuery = supabaseAdmin
        .from("bookings")
        .select("property_id")
        .eq("is_deleted", false);
      if (since) countQuery = countQuery.gte("created_at", since.toISOString());
      const { data: allBookings } = await countQuery;

      // Revenue by checkout date, paid only
      const { data: paidBookings } = await supabaseAdmin
        .from("bookings")
        .select("property_id, total_price, checkout, checkin")
        .eq("is_deleted", false)
        .eq("payment_status", "paid");

      // Aggregate by property
      const propMap: Record<string, { bookings: number; revenue: number }> = {};
      for (const b of allBookings ?? []) {
        const pid = b.property_id;
        if (!propMap[pid]) propMap[pid] = { bookings: 0, revenue: 0 };
        propMap[pid].bookings++;
      }
      for (const b of paidBookings ?? []) {
        const dateRef = b.checkout || b.checkin;
        if (!dateRef) continue;
        if (sinceDate && dateRef < sinceDate) continue;
        const pid = b.property_id;
        if (!propMap[pid]) propMap[pid] = { bookings: 0, revenue: 0 };
        propMap[pid].revenue += parseFloat(b.total_price) || 0;
      }

      // Get top 10 property IDs
      const topIds = Object.entries(propMap)
        .sort(([, a], [, b]) => b.bookings - a.bookings)
        .slice(0, 10)
        .map(([id]) => id);

      if (topIds.length === 0) {
        return res.json({ properties: [] });
      }

      // Fetch property details
      const { data: props } = await supabaseAdmin
        .from("properties")
        .select("id, name, city, rating, review_count")
        .in("id", topIds);

      const properties = topIds.map((id) => {
        const prop = (props ?? []).find((p: any) => p.id === id);
        const stats = propMap[id];
        return {
          id,
          name: prop?.name ?? "Unknown Property",
          location: prop?.city ?? "Unknown",
          bookings: stats.bookings,
          revenue: Math.round(stats.revenue * 100) / 100,
          rating: prop?.rating ?? 0,
        };
      });

      res.json({ properties });
    } catch (err: any) {
      console.error("Top properties error:", err);
      res.status(500).json({ error: "Failed to fetch top properties" });
    }
  },

  /**
   * GET /api/analytics/booking-patterns
   * Returns booking count by day-of-week and hour-of-day
   */
  getBookingPatterns: async (req: Request, res: Response) => {
    try {
      const range = (req.query.range as string) || "12m";
      const since = rangeToDate(range);

      let query = supabaseAdmin
        .from("bookings")
        .select("created_at")
        .eq("is_deleted", false);
      if (since) query = query.gte("created_at", since.toISOString());

      const { data: bookings } = await query;

      // Day of week distribution (0=Sun, 1=Mon, ..., 6=Sat)
      const dayMap: Record<number, number> = {};
      for (let d = 0; d <= 6; d++) dayMap[d] = 0;

      // Hour distribution (6–22)
      const hourMap: Record<number, number> = {};
      for (let h = 6; h <= 22; h++) hourMap[h] = 0;

      for (const b of bookings ?? []) {
        const d = toPHT(new Date(b.created_at));
        dayMap[d.getDay()]++;

        const h = d.getHours();
        if (h >= 6 && h <= 22) hourMap[h]++;
      }

      // Reorder to start with Mon (1,2,3,4,5,6,0)
      const weeklyOrder = [1, 2, 3, 4, 5, 6, 0];
      const weekly = weeklyOrder.map((dayIndex) => ({ dayIndex, bookings: dayMap[dayIndex] }));

      const hourly = Object.entries(hourMap).map(([h, bookings]) => ({
        hour: parseInt(h, 10),
        bookings,
      }));

      res.json({ weekly, hourly });
    } catch (err: any) {
      console.error("Booking patterns error:", err);
      res.status(500).json({ error: "Failed to fetch booking patterns" });
    }
  },
};
