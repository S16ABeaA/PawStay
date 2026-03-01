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
  { name: "Boarding", percentage: 45, color: "bg-violet-500" },
  { name: "Grooming", percentage: 28, color: "bg-emerald-500" },
  { name: "Daycare", percentage: 18, color: "bg-amber-500" },
  { name: "Veterinary", percentage: 9, color: "bg-rose-500" },
];

const SuperAdminAnalytics = () => {
  const maxBookings = Math.max(...chartData.map((d) => d.bookings));

  return (
    <SuperAdminLayout title="Analytics" subtitle="Platform performance and insights">
      {/* Time Range Selector */}
      <div className="flex justify-end mb-6">
        <Select defaultValue="6months">
          <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="6months">Last 6 months</SelectItem>
            <SelectItem value="1year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-violet-600/20">
                <Calendar className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Bookings</p>
                <p className="text-xl font-bold text-white">48,291</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-600/20">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Conversion Rate</p>
                <p className="text-xl font-bold text-white">24.8%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
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
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-rose-600/20">
                <Building2 className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Avg. Occupancy</p>
                <p className="text-xl font-bold text-white">72%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bookings Chart */}
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">Booking Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {chartData.map((data) => (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-lg transition-all hover:from-violet-500 hover:to-violet-300"
                    style={{ height: `${(data.bookings / maxBookings) * 100}%` }}
                  />
                  <span className="text-xs text-slate-400">{data.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-500" />
                <span className="text-sm text-slate-400">Bookings</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Breakdown */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">Service Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceBreakdown.map((service) => (
                <div key={service.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{service.name}</span>
                    <span className="text-white font-medium">{service.percentage}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
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
      <Card className="mt-6 bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-violet-400" />
            Top Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            {topLocations.map((location, i) => (
              <div key={location.city} className="p-4 rounded-lg bg-slate-800/50 text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {i + 1}
                </div>
                <p className="font-medium text-white">{location.city}</p>
                <p className="text-sm text-slate-400">{location.bookings.toLocaleString()} bookings</p>
                <p className="text-xs text-violet-400 mt-1">{location.percentage}% of total</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </SuperAdminLayout>
  );
};

export default SuperAdminAnalytics;
