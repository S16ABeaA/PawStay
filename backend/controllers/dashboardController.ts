import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabaseAdmin";

/**
 * GET /api/admin/dashboard
 * Returns aggregated stats for the super-admin dashboard.
 */
export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();

    // ── 1. Total Users ──
    const { count: totalUsers } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", false);

    const { count: usersThisMonth } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", false)
      .gte("created_at", startOfThisMonth);

    const { count: usersLastMonth } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", false)
      .gte("created_at", startOfLastMonth)
      .lt("created_at", startOfThisMonth);

    // ── 2. Active Properties ──
    const { count: activeProperties } = await supabaseAdmin
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("is_deleted", false);

    const { count: activePropsThisMonth } = await supabaseAdmin
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("is_deleted", false)
      .gte("created_at", startOfThisMonth);

    const { count: activePropsLastMonth } = await supabaseAdmin
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("is_deleted", false)
      .gte("created_at", startOfLastMonth)
      .lt("created_at", startOfThisMonth);

    // ── 3. Revenue This Month vs Last Month (service fee = platform commission) ──
    const { data: revenueThisMonthRows } = await supabaseAdmin
      .from("bookings")
      .select("service_fee")
      .eq("is_deleted", false)
      .in("status", ["completed", "checked_out"])
      .neq("payment_status", "refunded")
      .gte("created_at", startOfThisMonth);

    const revenueThisMonth = (revenueThisMonthRows || []).reduce(
      (sum: number, r: any) => sum + (parseFloat(r.service_fee) || 0),
      0
    );

    const { data: revenueLastMonthRows } = await supabaseAdmin
      .from("bookings")
      .select("service_fee")
      .eq("is_deleted", false)
      .in("status", ["completed", "checked_out"])
      .neq("payment_status", "refunded")
      .gte("created_at", startOfLastMonth)
      .lt("created_at", startOfThisMonth);

    const revenueLastMonth = (revenueLastMonthRows || []).reduce(
      (sum: number, r: any) => sum + (parseFloat(r.service_fee) || 0),
      0
    );

    // ── 4. Bookings Today vs Yesterday ──
    const { count: bookingsToday } = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", false)
      .gte("created_at", todayStart);

    const { count: bookingsYesterday } = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", false)
      .gte("created_at", yesterdayStart)
      .lt("created_at", todayStart);

    // ── 5. Recent Property Applications ──
    const { data: recentApplications } = await supabaseAdmin
      .from("properties")
      .select(
        `id, name, city, status, created_at,
         profiles!properties_owner_id_fkey ( first_name, last_name, email )`
      )
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(6);

    // ── 6. Top Performing Properties (highest revenue) ──
    // Top performers computed for the year-to-date
    const { data: topRevenueRows } = await supabaseAdmin
      .from("bookings")
      .select("property_id, service_fee")
      .eq("is_deleted", false)
      .in("status", ["completed", "checked_out"])
      .neq("payment_status", "refunded")
      .gte("created_at", startOfYear);

    // Aggregate per property
    const revenueMap: Record<string, number> = {};
    const bookingCountMap: Record<string, number> = {};
    (topRevenueRows || []).forEach((b: any) => {
      const pid = b.property_id;
      revenueMap[pid] = (revenueMap[pid] || 0) + (parseFloat(b.service_fee) || 0);
      bookingCountMap[pid] = (bookingCountMap[pid] || 0) + 1;
    });

    // Sort by revenue descending, take top 5
    const topPropertyIds = Object.entries(revenueMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([pid]) => pid);

    let topPerformers: any[] = [];
    if (topPropertyIds.length > 0) {
      const { data: topProps } = await supabaseAdmin
        .from("properties")
        .select("id, name, rating, review_count, city")
        .in("id", topPropertyIds);

      topPerformers = topPropertyIds.map((pid) => {
        const prop = (topProps || []).find((p: any) => p.id === pid);
        return {
          id: pid,
          name: prop?.name || "Unknown",
          city: prop?.city || "",
          rating: prop?.rating || 0,
          bookings: bookingCountMap[pid] || 0,
          revenue: revenueMap[pid] || 0,
        };
      });
    }

    // ── Build response ──
    const userChange = usersLastMonth
      ? (((usersThisMonth || 0) - (usersLastMonth || 0)) / usersLastMonth) * 100
      : 0;

    const propChange = activePropsLastMonth
      ? (((activePropsThisMonth || 0) - (activePropsLastMonth || 0)) / activePropsLastMonth) * 100
      : 0;

    const revenueChange = revenueLastMonth
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : 0;

    const bookingChange = bookingsYesterday
      ? (((bookingsToday || 0) - (bookingsYesterday || 0)) / bookingsYesterday) * 100
      : 0;

    return res.json({
      totalUsers: totalUsers || 0,
      usersThisMonth: usersThisMonth || 0,
      usersLastMonth: usersLastMonth || 0,
      userChange: Math.round(userChange * 10) / 10,

      activeProperties: activeProperties || 0,
      activePropsThisMonth: activePropsThisMonth || 0,
      activePropsLastMonth: activePropsLastMonth || 0,
      propChange: Math.round(propChange * 10) / 10,

      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      revenueLastMonth: Math.round(revenueLastMonth * 100) / 100,
      revenueChange: Math.round(revenueChange * 10) / 10,

      bookingsToday: bookingsToday || 0,
      bookingsYesterday: bookingsYesterday || 0,
      bookingChange: Math.round(bookingChange * 10) / 10,

      recentApplications: (recentApplications || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        city: p.city,
        status: p.status,
        createdAt: p.created_at,
        owner: p.profiles
          ? `${p.profiles.first_name || ""} ${p.profiles.last_name || ""}`.trim()
          : "Unknown",
      })),

      topPerformers,
    });
  } catch (err: any) {
    console.error("Dashboard stats error:", err);
    return res.status(500).json({ error: "Failed to load dashboard stats." });
  }
};
