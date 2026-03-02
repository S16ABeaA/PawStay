import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  TrendingUp,
  ArrowUpRight,
  MapPin,
} from "lucide-react";

const chartData = [
  { month: "Aug", bookings: 1200, revenue: 45000 },
  { month: "Sep", bookings: 1450, revenue: 52000 },
  { month: "Oct", bookings: 1680, revenue: 61000 },
  { month: "Nov", bookings: 1890, revenue: 68000 },
  { month: "Dec", bookings: 2340, revenue: 89000 },
  { month: "Jan", bookings: 2100, revenue: 78000 },
];

const topLocations = [
  { city: "San Francisco", bookings: 4521, percentage: 18 },
  { city: "Los Angeles", bookings: 3892, percentage: 15 },
  { city: "New York", bookings: 3654, percentage: 14 },
  { city: "Seattle", bookings: 2987, percentage: 12 },
  { city: "Austin", bookings: 2456, percentage: 10 },
];

const serviceBreakdown = [
  { name: "Boarding", percentage: 45, color: "bg-[#ffa31a]" },
  { name: "Grooming", percentage: 28, color: "bg-emerald-500" },
  { name: "Daycare", percentage: 18, color: "bg-amber-500" },
  { name: "Veterinary", percentage: 9, color: "bg-rose-500" },
];

const SuperAdminAnalytics = () => {
  const maxBookings = Math.max(...chartData.map((d) => d.bookings));

  return (
    <SuperAdminLayout title="Analytics" subtitle="Platform performance and insights">
      {/* Time Range Selector */}
      <div className="flex justify-end mb-6 sa-slide-in">
        <Select defaultValue="6months">
          <SelectTrigger className="w-40 bg-[#292929] border-white/[0.09] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1b1b1b] border-white/[0.08] text-white">
            <SelectItem value="7days" className="text-white focus:bg-white/[0.06] focus:text-white">Last 7 days</SelectItem>
            <SelectItem value="30days" className="text-white focus:bg-white/[0.06] focus:text-white">Last 30 days</SelectItem>
            <SelectItem value="6months" className="text-white focus:bg-white/[0.06] focus:text-white">Last 6 months</SelectItem>
            <SelectItem value="1year" className="text-white focus:bg-white/[0.06] focus:text-white">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 sa-stagger">
        <Card className="bg-[#292929] border-white/[0.07] col-span-1 sa-card sa-slide-in">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#ffa31a]/20">
                <Calendar className="h-5 w-5 text-[#ffa31a]" />
              </div>
              <div>
                <p className="text-sm text-[#808080]">Total Bookings</p>
                <p className="text-xl font-bold text-white tabular-nums">48,291</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#292929] border-white/[0.07] sa-card sa-slide-in">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-600/20">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-[#808080]">Conversion Rate</p>
                <p className="text-xl font-bold text-white tabular-nums">24.8%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#292929] border-white/[0.07] sa-card sa-slide-in">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-600/20">
                <Users className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Avg. User Spend</p>
                <p className="text-xl font-bold text-white">₱127</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#292929] border-white/[0.07] sa-card sa-slide-in">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-rose-600/20">
                <Building2 className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-[#808080]">Avg. Occupancy</p>
                <p className="text-xl font-bold text-white tabular-nums">72%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sa-slide-in" style={{ animationDelay: '120ms' }}>
        {/* Bookings Chart */}
        <Card className="lg:col-span-2 bg-[#292929] border-white/[0.07] sa-card">
          <CardHeader>
            <CardTitle className="text-lg text-white">Booking Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {chartData.map((data) => (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-[#ffa31a] to-[#ffa31a]/60 rounded-t-lg transition-all hover:from-[#ffa31a]/90 hover:to-[#ffa31a]/50"
                    style={{ height: `${(data.bookings / maxBookings) * 100}%` }}
                  />
                  <span className="text-xs text-[#808080]">{data.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ffa31a]" />
                <span className="text-sm text-[#808080]">Bookings</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Breakdown */}
        <Card className="bg-[#292929] border-white/[0.07] sa-card">
          <CardHeader>
            <CardTitle className="text-lg text-white">Service Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceBreakdown.map((service) => (
                <div key={service.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/80">{service.name}</span>
                    <span className="text-white font-medium">{service.percentage}%</span>
                  </div>
                  <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${service.color} rounded-full`}
                      style={{ width: `${service.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Locations */}
      <Card className="mt-6 bg-[#292929] border-white/[0.07] sa-slide-in sa-card" style={{ animationDelay: '200ms' }}>
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#ffa31a]" />
            Top Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            {topLocations.map((location, i) => (
              <div key={location.city} className="p-4 rounded-lg bg-white/[0.04] text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#ffa31a]/90 to-[#ffa31a]/60 flex items-center justify-center text-white font-bold">
                  {i + 1}
                </div>
                <p className="font-medium text-white">{location.city}</p>
                <p className="text-sm text-[#808080]">{location.bookings.toLocaleString()} bookings</p>
                <p className="text-xs text-[#ffa31a] mt-1">{location.percentage}% of total</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </SuperAdminLayout>
  );
};

export default SuperAdminAnalytics;
