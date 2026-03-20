import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { SuperAdminTicketNotifications } from "@/components/superadmin/SuperAdminTicketNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  AlertTriangle,
  Star,
  ChevronRight,
  CalendarClock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { dashboardApi, type DashboardStats } from "@/services/dashboardApi";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const fmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
    : n.toLocaleString();

const peso = (n: number) => `₱${fmt(n)}`;

const pct = (n: number) => `${n > 0 ? "+" : ""}${n}%`;

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const rankColors = [
  "bg-[#ffa31a]",
  "bg-[#808080]",
  "bg-[#808080]/60",
  "bg-[#808080]/40",
  "bg-[#808080]/30",
];

/* ------------------------------------------------------------------ */
/*  Skeleton shimmer                                                  */
/* ------------------------------------------------------------------ */

const Skeleton = ({ className }: { className?: string }) => (
  <div
    className={cn("animate-pulse rounded-lg bg-white/[0.06]", className)}
  />
);

const StatCardSkeleton = () => (
  <div className="p-5 rounded-2xl border border-white/[0.07] bg-[#292929]">
    <div className="flex items-start justify-between mb-4">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
    <Skeleton className="h-8 w-28 mb-2" />
    <Skeleton className="h-4 w-20" />
  </div>
);

const ListSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
        <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    dashboardApi
      .getStats()
      .then((d) => { if (mounted) setData(d); })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        if (mounted) setError("Failed to load dashboard data");
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  /* Build stat cards from live data */
  const stats = data
    ? [
        {
          label: "Total Users",
          value: fmt(data.totalUsers),
          change: pct(data.userChange),
          trend: data.userChange >= 0 ? "up" : "down",
          sub: `${data.usersThisMonth} this month · ${data.usersLastMonth} last month`,
          icon: Users,
          link: "/superadmin/users",
        },
        {
          label: "Active Properties",
          value: fmt(data.activeProperties),
          change: pct(data.propChange),
          trend: data.propChange >= 0 ? "up" : "down",
          sub: `${data.activePropsThisMonth} new this month`,
          icon: Building2,
          link: "/superadmin/properties",
        },
        {
          label: "Revenue This Month",
          value: peso(data.revenueThisMonth),
          change: pct(data.revenueChange),
          trend: data.revenueChange >= 0 ? "up" : "down",
          sub: `${peso(data.revenueLastMonth)} last month`,
          icon: DollarSign,
          link: "/superadmin/revenue",
        },
        {
          label: "Bookings Today",
          value: fmt(data.bookingsToday),
          change: pct(data.bookingChange),
          trend: data.bookingChange >= 0 ? "up" : "down",
          sub: `${data.bookingsYesterday} yesterday`,
          icon: Activity,
          link: "/superadmin/analytics",
        },
      ]
    : [];

  /* Pending count for alerts */
  const pendingCount =
    data?.recentApplications?.filter((a) => a.status === "pending").length ?? 0;

  return (
    <SuperAdminLayout title="Dashboard" subtitle="Platform overview and key metrics">

      {/* ── Error state ── */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Alerts Bar ── */}
      {!loading && data && (
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {pendingCount > 0 && (
            <button
              onClick={() => navigate("/superadmin/properties")}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#292929] border border-white/[0.07] hover:border-[#ffa31a]/30 hover:bg-[#ffa31a]/5 transition-all text-left group"
            >
              <div className="p-2 rounded-lg shrink-0 bg-[#ffa31a]/10">
                <AlertTriangle className="h-4 w-4 text-[#ffa31a]" />
              </div>
              <p className="text-sm text-white/80 flex-1 leading-snug">
                {pendingCount} property listing{pendingCount !== 1 ? "s" : ""} pending approval
              </p>
              <ChevronRight className="h-4 w-4 text-[#808080] group-hover:text-[#ffa31a] shrink-0 transition-colors" />
            </button>
          )}
          {data.revenueChange > 0 && (
            <button
              onClick={() => navigate("/superadmin/revenue")}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#292929] border border-white/[0.07] hover:border-emerald-400/30 hover:bg-emerald-400/5 transition-all text-left group"
            >
              <div className="p-2 rounded-lg shrink-0 bg-emerald-400/10">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-sm text-white/80 flex-1 leading-snug">
                Revenue up {data.revenueChange}% compared to last month
              </p>
              <ChevronRight className="h-4 w-4 text-[#808080] group-hover:text-emerald-400 shrink-0 transition-colors" />
            </button>
          )}
          {data.usersThisMonth > 0 && (
            <button
              onClick={() => navigate("/superadmin/users")}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#292929] border border-white/[0.07] hover:border-blue-400/30 hover:bg-blue-400/5 transition-all text-left group"
            >
              <div className="p-2 rounded-lg shrink-0 bg-blue-400/10">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-sm text-white/80 flex-1 leading-snug">
                {data.usersThisMonth} new user{data.usersThisMonth !== 1 ? "s" : ""} this month
              </p>
              <ChevronRight className="h-4 w-4 text-[#808080] group-hover:text-blue-400 shrink-0 transition-colors" />
            </button>
          )}
        </div>
      )}

      {/* ── Ticket Notifications ── */}
      <SuperAdminTicketNotifications />

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((stat) => (
              <button
                key={stat.label}
                onClick={() => navigate(stat.link)}
                className="group text-left p-5 rounded-2xl border border-white/[0.07] bg-[#292929] hover:border-[#ffa31a]/30 hover:bg-[#ffa31a]/5 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-[#ffa31a]/10 border border-[#ffa31a]/20">
                    <stat.icon className="h-5 w-5 text-[#ffa31a]" />
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full",
                      stat.trend === "up"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    )}
                  >
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                <p className="text-sm text-[#808080] mt-1">{stat.label}</p>
                <p className="text-xs text-[#808080]/60 mt-0.5">{stat.sub}</p>
              </button>
            ))}
      </div>

      {/* ── Bottom Grid ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* ── Recent Property Applications ── */}
        <Card className="bg-[#292929] border-white/[0.07]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-white">Recent Property Applications</CardTitle>
            <Link to="/superadmin/properties">
              <Button variant="ghost" size="sm" className="text-[#808080] hover:text-[#ffa31a] text-xs h-7 px-2">
                View All <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {loading ? (
              <ListSkeleton rows={5} />
            ) : (data?.recentApplications?.length ?? 0) === 0 ? (
              <p className="text-sm text-[#808080] text-center py-6">No applications yet</p>
            ) : (
              data!.recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-[#ffa31a]/5 border border-transparent hover:border-[#ffa31a]/20 transition-all cursor-pointer group"
                  onClick={() => navigate("/superadmin/properties")}
                >
                  <div className="w-9 h-9 rounded-lg bg-[#ffa31a]/10 border border-[#ffa31a]/20 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-[#ffa31a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{app.name}</p>
                    <p className="text-xs text-[#808080] truncate">{app.city || "No location"} · {app.owner}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge
                      className={cn(
                        "text-[11px] font-medium border-0",
                        app.status === "approved"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : app.status === "rejected"
                          ? "bg-red-500/15 text-red-400"
                          : app.status === "suspended"
                          ? "bg-orange-500/15 text-orange-400"
                          : "bg-[#ffa31a]/15 text-[#ffa31a]"
                      )}
                    >
                      {app.status}
                    </Badge>
                    <p className="text-[10px] text-[#808080] mt-1 flex items-center justify-end gap-1">
                      <CalendarClock className="h-3 w-3" />
                      {timeAgo(app.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* ── Top Performing Properties ── */}
        <Card className="bg-[#292929] border-white/[0.07]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-white">Top Performing Properties</CardTitle>
            <Link to="/superadmin/analytics">
              <Button variant="ghost" size="sm" className="text-[#808080] hover:text-[#ffa31a] text-xs h-7 px-2">
                View All <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {loading ? (
              <ListSkeleton rows={5} />
            ) : (data?.topPerformers?.length ?? 0) === 0 ? (
              <p className="text-sm text-[#808080] text-center py-6">No revenue data this year</p>
            ) : (
              data!.topPerformers.map((property, i) => (
                <div
                  key={property.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-[#ffa31a]/5 border border-transparent hover:border-[#ffa31a]/20 transition-all cursor-pointer"
                  onClick={() => navigate("/superadmin/analytics")}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                      rankColors[i] ?? "bg-[#808080]/20",
                      i === 0 ? "text-[#1b1b1b]" : "text-white"
                    )}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{property.name}</p>
                    <p className="text-xs text-[#808080]">
                      {property.bookings} booking{property.bookings !== 1 ? "s" : ""} this year
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-white">{peso(property.revenue)}</p>
                    <p className="text-xs text-[#ffa31a] flex items-center justify-end gap-0.5">
                      <Star className="h-3 w-3 fill-current" />
                      {property.rating}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
