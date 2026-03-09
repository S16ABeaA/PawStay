import { useState, useEffect, useCallback } from "react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Building2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  DollarSign,
  Activity,
  Clock,
  Star,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCcw,
  Target,
  Zap,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  analyticsApi,
  type OverviewData,
  type BookingTrendItem,
  type ServiceBreakdownItem,
  type UserGrowthItem,
  type TopLocationItem,
  type TopPropertyItem,
} from "@/services/analyticsApi";

// ── Map tab values to API range params ──
const rangeMap: Record<string, string> = {
  "7days": "7d",
  "30days": "30d",
  "3months": "3m",
  "6months": "6m",
  "12months": "12m",
};

// ── Presentation helpers (display labels, colors) ──
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SERVICE_COLORS: Record<string, string> = {
  hotel: "#ffa31a",
  grooming: "#10b981",
  veterinary: "#ef4444",
};
const SERVICE_LABELS: Record<string, string> = {
  hotel: "Hotel",
  grooming: "Grooming",
  veterinary: "Veterinary",
};

/** Convert "2025-01" → "Jan '25" or "2025-01-15" → "Jan 15" */
const periodToLabel = (period: string) => {
  const parts = period.split("-");
  const month = MONTHS[parseInt(parts[1], 10) - 1];
  if (parts.length === 3) {
    return `${month} ${parseInt(parts[2], 10)}`;
  }
  return `${month} '${parts[0].slice(-2)}`;
};

/** Convert hour number (0-23) → "9am", "12pm", "3pm" */
const hourToLabel = (h: number) =>
  h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;

// ─────────────────────────────────────────────────────────
// Custom Recharts Tooltip
// ─────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#1b1b1b] px-4 py-3 shadow-xl">
      <p className="text-xs font-medium text-[#808080] mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-white/70 capitalize">{entry.name}:</span>
          <span className="text-white font-semibold tabular-nums">
            {typeof entry.value === "number"
              ? entry.name.toLowerCase().includes("revenue")
                ? `₱${entry.value.toLocaleString()}`
                : entry.value.toLocaleString()
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

const SuperAdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState("12months");
  const [trendMetric, setTrendMetric] = useState<"bookings" | "revenue">("bookings");
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [loading, setLoading] = useState(true);

  // ── API state ──
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [bookingTrends, setBookingTrends] = useState<BookingTrendItem[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdownItem[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; bookings: number }[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: string; bookings: number }[]>([]);
  const [topLocations, setTopLocations] = useState<TopLocationItem[]>([]);
  const [topProperties, setTopProperties] = useState<TopPropertyItem[]>([]);

  const apiRange = rangeMap[timeRange] || "12m";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, trends, services, growth, locations, properties, patterns] =
        await Promise.all([
          analyticsApi.getOverview(apiRange),
          analyticsApi.getBookingTrends(apiRange),
          analyticsApi.getServiceBreakdown(apiRange),
          analyticsApi.getUserGrowth(apiRange),
          analyticsApi.getTopLocations(apiRange),
          analyticsApi.getTopProperties(apiRange),
          analyticsApi.getBookingPatterns(apiRange),
        ]);
      setOverview(ov);

      // Map raw periods → display labels
      setBookingTrends(trends.trends.map((t) => ({ ...t, label: periodToLabel(t.period) })));
      setServiceBreakdown(
        services.breakdown.map((s) => ({
          ...s,
          name: SERVICE_LABELS[s.type] || s.type.charAt(0).toUpperCase() + s.type.slice(1),
          color: SERVICE_COLORS[s.type] || "#808080",
        }))
      );
      setUserGrowthData(growth.growth.map((g) => ({ ...g, label: periodToLabel(g.period) })));
      setTopLocations(locations.locations);
      setTopProperties(properties.properties);
      setWeeklyData(patterns.weekly.map((w) => ({ day: DAYS[w.dayIndex], bookings: w.bookings })));
      setHourlyData(patterns.hourly.map((h) => ({ hour: hourToLabel(h.hour), bookings: h.bookings })));
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [apiRange]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Export all analytics data as CSV ──
  const handleExport = () => {
    const lines: string[] = [];
    const ts = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila", hour12: false });
    const rangeLbl = timeRange.replace("months", "M").replace("days", "D");

    // KPIs
    lines.push("PawStay Analytics Export");
    lines.push(`Range,${rangeLbl}`);
    lines.push(`Exported,${ts}`);
    lines.push("");
    lines.push("== KPI Overview ==");
    lines.push("Metric,Value");
    lines.push(`Total Bookings,${totalBookings}`);
    lines.push(`Total Revenue,${totalRevenue}`);
    lines.push(`Conversion Rate,${conversionRate}%`);
    lines.push(`Avg Spend,${avgSpend}`);
    lines.push(`Properties,${totalProperties}`);
    lines.push(`Avg Rating,${avgRating}`);
    lines.push(`Bookings Change,${overview?.bookingsChange ?? 0}%`);
    lines.push(`Revenue Change,${overview?.revenueChange ?? 0}%`);

    // Booking trends
    if (bookingTrends.length) {
      lines.push("");
      lines.push("== Booking Trends ==");
      lines.push("Period,Bookings,Revenue");
      bookingTrends.forEach((t) =>
        lines.push(`${t.label ?? t.period},${t.bookings},${t.revenue}`)
      );
    }

    // Service breakdown
    if (serviceBreakdown.length) {
      lines.push("");
      lines.push("== Service Breakdown ==");
      lines.push("Service,Share %,Count,Revenue");
      serviceBreakdown.forEach((s) =>
        lines.push(`${s.name ?? s.type},${s.value},${s.count},${s.revenue}`)
      );
    }

    // User growth
    if (userGrowthData.length) {
      lines.push("");
      lines.push("== User Growth ==");
      lines.push("Period,Total,New");
      userGrowthData.forEach((g) =>
        lines.push(`${g.label ?? g.period},${g.total},${g.new}`)
      );
    }

    // Weekly patterns
    if (weeklyData.length) {
      lines.push("");
      lines.push("== Weekly Booking Patterns ==");
      lines.push("Day,Bookings");
      weeklyData.forEach((w) => lines.push(`${w.day},${w.bookings}`));
    }

    // Hourly patterns
    if (hourlyData.length) {
      lines.push("");
      lines.push("== Hourly Booking Patterns ==");
      lines.push("Hour,Bookings");
      hourlyData.forEach((h) => lines.push(`${h.hour},${h.bookings}`));
    }

    // Top locations
    if (topLocations.length) {
      lines.push("");
      lines.push("== Top Locations ==");
      lines.push("City,Bookings,Revenue,Properties");
      topLocations.forEach((l) =>
        lines.push(`${l.city},${l.bookings},${l.revenue},${l.properties}`)
      );
    }

    // Top properties
    if (topProperties.length) {
      lines.push("");
      lines.push("== Top Properties ==");
      lines.push("Name,Location,Bookings,Revenue,Rating");
      topProperties.forEach((p) =>
        lines.push(`"${p.name}","${p.location}",${p.bookings},${p.revenue},${p.rating ?? ""}`)
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const datePH = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    a.download = `pawstay-analytics-${rangeLbl}-${datePH}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Derived KPI data from API response ──
  const totalBookings = overview?.totalBookings ?? 0;
  const totalRevenue = overview?.totalRevenue ?? 0;
  const conversionRate = overview?.conversionRate ?? 0;
  const avgSpend = overview?.avgSpend ?? 0;
  const avgRating = overview?.avgRating ?? 0;
  const totalProperties = overview?.totalProperties ?? 0;

  const fmtChange = (val: number) => {
    const sign = val >= 0 ? "+" : "";
    return `${sign}${val.toFixed(1)}%`;
  };

  // KPI cards data
  const kpis = [
    {
      label: "Total Bookings",
      value: totalBookings.toLocaleString(),
      change: fmtChange(overview?.bookingsChange ?? 0),
      trend: (overview?.bookingsChange ?? 0) >= 0 ? ("up" as const) : ("down" as const),
      icon: Calendar,
      sub: `Last ${timeRange.replace("months", "M").replace("days", "D")}`,

    },
    {
      label: "Total Revenue",
      value: totalRevenue >= 1000 ? `₱${(totalRevenue / 1000).toFixed(0)}K` : `₱${totalRevenue.toLocaleString()}`,
      change: fmtChange(overview?.revenueChange ?? 0),
      trend: (overview?.revenueChange ?? 0) >= 0 ? ("up" as const) : ("down" as const),
      icon: DollarSign,
      sub: "All properties",
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      change: "",
      trend: "up" as const,
      icon: Target,
      sub: "Completed / Total",
    },
    {
      label: "Avg. Spend",
      value: `₱${avgSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      change: "",
      trend: "up" as const,
      icon: Zap,
      sub: "Per booking",
    },
    {
      label: "Properties",
      value: totalProperties.toLocaleString(),
      change: "",
      trend: "up" as const,
      icon: Building2,
      sub: "Approved",
    },
    {
      label: "Avg. Rating",
      value: avgRating > 0 ? avgRating.toFixed(1) : "—",
      change: "",
      trend: "up" as const,
      icon: Star,
      sub: "Platform-wide",
    },
  ];

  return (
    <SuperAdminLayout title="Analytics" subtitle="Platform performance, insights, and growth metrics">
      {/* ── Loading Overlay ── */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-12 sa-slide-in">
          <Loader2 className="h-6 w-6 text-[#ffa31a] animate-spin" />
          <span className="text-[#808080] text-sm">Loading analytics...</span>
        </div>
      )}

      {/* ── Time Range & Actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sa-slide-in">
        <Tabs defaultValue="12months" onValueChange={setTimeRange} className="w-auto">
          <TabsList className="bg-[#292929] border border-white/[0.07]">
            <TabsTrigger value="7days" className="text-xs data-[state=active]:bg-[#ffa31a] data-[state=active]:text-black">7D</TabsTrigger>
            <TabsTrigger value="30days" className="text-xs data-[state=active]:bg-[#ffa31a] data-[state=active]:text-black">30D</TabsTrigger>
            <TabsTrigger value="3months" className="text-xs data-[state=active]:bg-[#ffa31a] data-[state=active]:text-black">3M</TabsTrigger>
            <TabsTrigger value="6months" className="text-xs data-[state=active]:bg-[#ffa31a] data-[state=active]:text-black">6M</TabsTrigger>
            <TabsTrigger value="12months" className="text-xs data-[state=active]:bg-[#ffa31a] data-[state=active]:text-black">12M</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-white/[0.1] text-white/70 hover:bg-white/[0.06] hover:text-white" onClick={() => fetchAll()} disabled={loading}>
            <RefreshCcw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="border-white/[0.1] text-white/70 hover:bg-white/[0.06] hover:text-white" onClick={handleExport} disabled={loading}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 sa-stagger">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-[#292929] border-white/[0.07] sa-card sa-slide-in group hover:border-[#ffa31a]/30 hover:bg-[#ffa31a]/[0.03] transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-[#ffa31a]/10 border border-[#ffa31a]/20 group-hover:border-[#ffa31a]/40 transition-colors">
                  <kpi.icon className="h-4 w-4 text-[#ffa31a]" />
                </div>
                {kpi.change && (
                  <div className={cn(
                    "flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                    kpi.trend === "up" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  )}>
                    {kpi.trend === "up" ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                    {kpi.change}
                  </div>
                )}
              </div>
              <p className="text-xl font-bold text-white tabular-nums tracking-tight">{kpi.value}</p>
              <p className="text-[11px] text-[#808080] mt-0.5">{kpi.label}</p>
              <p className="text-[10px] text-[#808080]/60 mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Row 1: Main Trend Chart + Service Pie ── */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Trend Chart */}
        <Card className="lg:col-span-2 bg-[#292929] border-white/[0.07] sa-card sa-slide-in" style={{ animationDelay: "80ms" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base text-white">Booking & Revenue Trends</CardTitle>
              <p className="text-xs text-[#808080] mt-0.5">Monthly overview for the last 12 months</p>
            </div>
            <div className="flex gap-2">
              {/* Metric selector */}
              <Select value={trendMetric} onValueChange={(v) => setTrendMetric(v as any)}>
                <SelectTrigger className="w-[110px] h-8 text-xs bg-transparent border-white/[0.09] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1b1b1b] border-white/[0.08] text-white">
                  <SelectItem value="bookings" className="text-white text-xs focus:bg-white/[0.06] focus:text-white">Bookings</SelectItem>
                  <SelectItem value="revenue" className="text-white text-xs focus:bg-white/[0.06] focus:text-white">Revenue</SelectItem>
                </SelectContent>
              </Select>
              {/* Chart type toggle */}
              <div className="flex rounded-lg border border-white/[0.09] overflow-hidden">
                <button
                  onClick={() => setChartType("area")}
                  className={cn(
                    "px-2.5 py-1.5 text-xs transition-colors",
                    chartType === "area" ? "bg-[#ffa31a] text-black" : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                  )}
                >
                  <Activity className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setChartType("bar")}
                  className={cn(
                    "px-2.5 py-1.5 text-xs transition-colors",
                    chartType === "bar" ? "bg-[#ffa31a] text-black" : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                  )}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === "area" ? (
                <AreaChart data={bookingTrends}>
                  <defs>
                    <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffa31a" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ffa31a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: "#808080", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#808080", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => trendMetric === "revenue" ? `₱${(v / 1000).toFixed(0)}K` : v.toLocaleString()} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey={trendMetric}
                    stroke="#ffa31a"
                    strokeWidth={2.5}
                    fill="url(#gradPrimary)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#ffa31a", stroke: "#1b1b1b", strokeWidth: 2 }}
                  />
                </AreaChart>
              ) : (
                <BarChart data={bookingTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: "#808080", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#808080", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => trendMetric === "revenue" ? `₱${(v / 1000).toFixed(0)}K` : v.toLocaleString()} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={trendMetric} fill="#ffa31a" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Breakdown Pie */}
        <Card className="bg-[#292929] border-white/[0.07] sa-card sa-slide-in" style={{ animationDelay: "120ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-[#ffa31a]" />
              Service Breakdown
            </CardTitle>
            <p className="text-xs text-[#808080]">Booking share by category</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={serviceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {serviceBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 mt-2">
              {serviceBreakdown.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-sm text-white/80">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#808080] tabular-nums">{s.count.toLocaleString()}</span>
                    <span className="text-sm font-semibold text-white tabular-nums w-10 text-right">{s.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: User Growth + Booking Heatmap (Weekly/Hourly) ── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* User Growth */}
        <Card className="bg-[#292929] border-white/[0.07] sa-card sa-slide-in" style={{ animationDelay: "160ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-[#ffa31a]" />
              User Growth
            </CardTitle>
            <p className="text-xs text-[#808080]">Total vs new users over time</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={userGrowthData}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fill: "#808080", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#808080", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Total Users" stroke="#818cf8" strokeWidth={2} fill="url(#gradTotal)" dot={false} />
                <Bar dataKey="new" name="New Users" fill="#22d3ee" radius={[2, 2, 0, 0]} maxBarSize={14} opacity={0.7} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-5 mt-3 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-xs text-[#808080]"><span className="w-2.5 h-2.5 rounded-full bg-[#818cf8]" /> Total</div>
              <div className="flex items-center gap-1.5 text-xs text-[#808080]"><span className="w-2.5 h-2.5 rounded-full bg-[#22d3ee]" /> New</div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly + Hourly Patterns */}
        <Card className="bg-[#292929] border-white/[0.07] sa-card sa-slide-in" style={{ animationDelay: "200ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#ffa31a]" />
              Booking Patterns
            </CardTitle>
            <p className="text-xs text-[#808080]">Weekly volume & peak hours</p>
          </CardHeader>
          <CardContent>
            {/* Weekly bar */}
            <p className="text-[11px] text-[#808080] mb-1 uppercase tracking-wider">By Day of Week</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" tick={{ fill: "#808080", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="bookings" name="Bookings" fill="#ffa31a" radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>

            {/* Hourly line */}
            <p className="text-[11px] text-[#808080] mb-1 mt-4 uppercase tracking-wider">By Hour of Day</p>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="gradHourly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" tick={{ fill: "#808080", fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#22d3ee" strokeWidth={2} fill="url(#gradHourly)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Booking Completion + Top Locations ── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Booking Status Breakdown */}
        <Card className="bg-[#292929] border-white/[0.07] sa-card sa-slide-in" style={{ animationDelay: "240ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-[#ffa31a]" />
              Booking Completion
            </CardTitle>
            <p className="text-xs text-[#808080]">Completed vs total bookings</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const completedPct = conversionRate;
              const pendingPct = Math.max(0, 100 - completedPct);
              const stages = [
                { stage: "Total Bookings", value: totalBookings, pct: 100 },
                { stage: "Completed", value: Math.round(totalBookings * completedPct / 100), pct: completedPct },
              ];
              return stages.map((step, i) => {
                const isLast = i === stages.length - 1;
                return (
                  <div key={step.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white/80">{step.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#808080] tabular-nums">{step.value.toLocaleString()}</span>
                        <span className={cn(
                          "text-xs font-semibold tabular-nums",
                          isLast ? "text-[#ffa31a]" : "text-white/60"
                        )}>
                          {step.pct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${step.pct}%`,
                          backgroundColor: isLast ? "#ffa31a" : `rgba(255,163,26,${0.25 + (step.pct / 100) * 0.5})`,
                        }}
                      />
                    </div>
                  </div>
                );
              });
            })()}
            <div className="pt-3 border-t border-white/[0.06]">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#808080]">Completion Rate</span>
                <span className="text-lg font-bold text-[#ffa31a] tabular-nums">{conversionRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card className="bg-[#292929] border-white/[0.07] sa-card sa-slide-in" style={{ animationDelay: "400ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#ffa31a]" />
              Top Locations
            </CardTitle>
            <p className="text-xs text-[#808080]">Best performing regions</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {topLocations.length === 0 && !loading && (
              <p className="text-sm text-[#808080] text-center py-8">No location data available</p>
            )}
            {topLocations.map((loc, i) => (
              <div
                key={loc.city}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-[#ffa31a]/5 border border-transparent hover:border-[#ffa31a]/20 transition-all"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                  i === 0 ? "bg-gradient-to-br from-[#ffa31a] to-[#ffa31a]/70 text-black" :
                  i === 1 ? "bg-white/10 text-white" :
                  "bg-white/[0.05] text-[#808080]"
                )}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{loc.city}</p>
                  <p className="text-[11px] text-[#808080]">{loc.properties} properties</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-white tabular-nums">{loc.bookings.toLocaleString()}</p>
                  <p className="text-[10px] text-[#808080]">₱{loc.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Top Properties Table ── */}
      <Card className="bg-[#292929] border-white/[0.07] sa-card sa-slide-in" style={{ animationDelay: "360ms" }}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Star className="h-4 w-4 text-[#ffa31a]" />
              Top Performing Properties
            </CardTitle>
            <p className="text-xs text-[#808080] mt-0.5">Ranked by booking volume</p>
          </div>
          <Button variant="ghost" size="sm" className="text-[#808080] hover:text-[#ffa31a] text-xs h-7 px-2">
            View All <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[#808080] font-medium py-3 pr-4">#</th>
                  <th className="text-left text-[#808080] font-medium py-3 pr-4">Property</th>
                  <th className="text-right text-[#808080] font-medium py-3 px-4">Bookings</th>
                  <th className="text-right text-[#808080] font-medium py-3 px-4">Revenue</th>
                  <th className="text-right text-[#808080] font-medium py-3 pl-4">Rating</th>
                </tr>
              </thead>
              <tbody>
                {topProperties.length === 0 && !loading && (
                  <tr><td colSpan={5} className="text-center py-8 text-[#808080]">No property data available</td></tr>
                )}
                {topProperties.map((prop, i) => (
                  <tr key={prop.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 pr-4">
                      <div className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                        i === 0 ? "bg-[#ffa31a] text-black" : "bg-white/[0.06] text-[#808080]"
                      )}>
                        {i + 1}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div>
                        <p className="font-medium text-white">{prop.name}</p>
                        <p className="text-[11px] text-[#808080]">{prop.location}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-white font-medium tabular-nums">{prop.bookings}</td>
                    <td className="py-3 px-4 text-right text-white font-medium tabular-nums">₱{prop.revenue.toLocaleString()}</td>
                    <td className="py-3 pl-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="h-3 w-3 text-[#ffa31a] fill-[#ffa31a]" />
                        <span className="text-white font-medium tabular-nums">{prop.rating || "—"}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </SuperAdminLayout>
  );
};

export default SuperAdminAnalytics;
