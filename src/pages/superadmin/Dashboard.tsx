import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Building2, DollarSign, TrendingUp,
  ArrowUpRight, ArrowDownRight, Activity,
  AlertTriangle, Clock, Star, ChevronRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Total Users",       value: "52,481",   change: "+12.5%", trend: "up",   icon: Users,     link: "/superadmin/users" },
  { label: "Active Properties", value: "2,847",    change: "+8.2%",  trend: "up",   icon: Building2, link: "/superadmin/properties" },
  { label: "Monthly Revenue",   value: "₱847,250", change: "+23.1%", trend: "up",   icon: DollarSign,link: "/superadmin/revenue" },
  { label: "Bookings Today",    value: "1,284",    change: "-2.4%",  trend: "down", icon: Activity,  link: "/superadmin/analytics" },
];

const alerts = [
  { icon: AlertTriangle, accent: "text-[#ffa31a]",  bg: "bg-[#ffa31a]/10",    message: "5 property listings pending approval",  link: "/superadmin/properties" },
  { icon: Clock,         accent: "text-red-400",     bg: "bg-red-400/10",      message: "3 urgent support tickets unresolved",   link: "/superadmin/support"    },
  { icon: TrendingUp,    accent: "text-emerald-400", bg: "bg-emerald-400/10",  message: "Revenue up 23% compared to last month", link: "/superadmin/revenue"    },
];

const rankColors = ["bg-[#ffa31a]", "bg-[#808080]", "bg-[#808080]/60", "bg-[#808080]/40"];

const recentProperties = [
  { name: "Luxury Paws Resort",  location: "Makati, PH",    status: "pending",  date: "2 hrs ago" },
  { name: "Happy Tails Hotel",   location: "BGC, PH",       status: "approved", date: "5 hrs ago" },
  { name: "Pet Paradise Inn",    location: "Quezon City, PH", status: "pending", date: "8 hrs ago" },
  { name: "Cozy Critters Lodge", location: "Pasig, PH",     status: "approved", date: "1 day ago" },
];

const topPerformers = [
  { name: "Pawsome Pet Hotel",  bookings: 342, revenue: "₱28,450", rating: 4.9 },
  { name: "The Dog House",      bookings: 289, revenue: "₱24,120", rating: 4.8 },
  { name: "Feline Friends Spa", bookings: 256, revenue: "₱21,890", rating: 4.9 },
  { name: "Bark & Stay",        bookings: 234, revenue: "₱19,560", rating: 4.7 },
];

const SuperAdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <SuperAdminLayout title="Dashboard" subtitle="Platform overview and key metrics">

      {/* ── Alerts Bar ── */}
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {alerts.map((alert, i) => (
          <button
            key={i}
            onClick={() => navigate(alert.link)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#292929] border border-white/[0.07] hover:border-[#ffa31a]/30 hover:bg-[#ffa31a]/5 transition-all text-left group"
          >
            <div className={cn("p-2 rounded-lg shrink-0", alert.bg)}>
              <alert.icon className={cn("h-4 w-4", alert.accent)} />
            </div>
            <p className="text-sm text-white/80 flex-1 leading-snug">{alert.message}</p>
            <ChevronRight className="h-4 w-4 text-[#808080] group-hover:text-[#ffa31a] shrink-0 transition-colors" />
          </button>
        ))}
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => navigate(stat.link)}
            className="group text-left p-5 rounded-2xl border border-white/[0.07] bg-[#292929] hover:border-[#ffa31a]/30 hover:bg-[#ffa31a]/5 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-[#ffa31a]/10 border border-[#ffa31a]/20">
                <stat.icon className="h-5 w-5 text-[#ffa31a]" />
              </div>
              <div className={cn(
                "flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full",
                stat.trend === "up"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              )}>
                {stat.trend === "up"
                  ? <ArrowUpRight className="h-3 w-3" />
                  : <ArrowDownRight className="h-3 w-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
            <p className="text-sm text-[#808080] mt-1">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* ── Bottom Grid ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Recent Applications */}
        <Card className="bg-[#292929] border-white/[0.07]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-white">Recent Applications</CardTitle>
            <Link to="/superadmin/properties">
              <Button variant="ghost" size="sm" className="text-[#808080] hover:text-[#ffa31a] text-xs h-7 px-2">
                View All <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {recentProperties.map((property, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-[#ffa31a]/5 border border-transparent hover:border-[#ffa31a]/20 transition-all cursor-pointer group"
                onClick={() => navigate("/superadmin/properties")}
              >
                <div className="w-9 h-9 rounded-lg bg-[#ffa31a]/10 border border-[#ffa31a]/20 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-[#ffa31a]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{property.name}</p>
                  <p className="text-xs text-[#808080] truncate">{property.location}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge
                    className={cn(
                      "text-[11px] font-medium border-0",
                      property.status === "approved"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-[#ffa31a]/15 text-[#ffa31a]"
                    )}
                  >
                    {property.status}
                  </Badge>
                  <p className="text-[10px] text-[#808080] mt-1">{property.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="bg-[#292929] border-white/[0.07]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-white">Top Performers</CardTitle>
            <Link to="/superadmin/analytics">
              <Button variant="ghost" size="sm" className="text-[#808080] hover:text-[#ffa31a] text-xs h-7 px-2">
                View All <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {topPerformers.map((property, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-[#ffa31a]/5 border border-transparent hover:border-[#ffa31a]/20 transition-all cursor-pointer"
                onClick={() => navigate("/superadmin/analytics")}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                  rankColors[i],
                  i === 0 ? "text-[#1b1b1b]" : "text-white"
                )}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{property.name}</p>
                  <p className="text-xs text-[#808080]">{property.bookings} bookings</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-white">{property.revenue}</p>
                  <p className="text-xs text-[#ffa31a] flex items-center justify-end gap-0.5">
                    <Star className="h-3 w-3 fill-current" />
                    {property.rating}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
