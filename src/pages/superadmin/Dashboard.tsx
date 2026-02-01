import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
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
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const stats = [
  { label: "Total Users", value: "52,481", change: "+12.5%", trend: "up", icon: Users, link: "/superadmin/users" },
  { label: "Active Properties", value: "2,847", change: "+8.2%", trend: "up", icon: Building2, link: "/superadmin/properties" },
  { label: "Monthly Revenue", value: "$847,250", change: "+23.1%", trend: "up", icon: DollarSign, link: "/superadmin/revenue" },
  { label: "Bookings Today", value: "1,284", change: "-2.4%", trend: "down", icon: Activity, link: "/superadmin/analytics" },
];

const recentProperties = [
  { name: "Luxury Paws Resort", location: "Los Angeles, CA", status: "pending", date: "2 hours ago" },
  { name: "Happy Tails Hotel", location: "San Francisco, CA", status: "approved", date: "5 hours ago" },
  { name: "Pet Paradise Inn", location: "Seattle, WA", status: "pending", date: "8 hours ago" },
  { name: "Cozy Critters Lodge", location: "Portland, OR", status: "approved", date: "1 day ago" },
];

const topPerformers = [
  { name: "Pawsome Pet Hotel", bookings: 342, revenue: "$28,450", rating: 4.9 },
  { name: "The Dog House", bookings: 289, revenue: "$24,120", rating: 4.8 },
  { name: "Feline Friends Spa", bookings: 256, revenue: "$21,890", rating: 4.9 },
  { name: "Bark & Stay", bookings: 234, revenue: "$19,560", rating: 4.7 },
];

const SuperAdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <SuperAdminLayout title="Dashboard" subtitle="Platform overview and key metrics">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card 
            key={stat.label} 
            className="bg-slate-900 border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors"
            onClick={() => navigate(stat.link)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${
                    stat.trend === "up" ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    <span>{stat.change}</span>
                    <span className="text-slate-500">vs last month</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-violet-600/20">
                  <stat.icon className="h-5 w-5 text-violet-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Property Applications */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-white">Recent Applications</CardTitle>
            <Link to="/superadmin/properties">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProperties.map((property, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => navigate('/superadmin/properties')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{property.name}</p>
                      <p className="text-xs text-slate-400">{property.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={property.status === "approved" ? "default" : "secondary"}
                      className={property.status === "approved" 
                        ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30" 
                        : "bg-amber-600/20 text-amber-400 hover:bg-amber-600/30"
                      }
                    >
                      {property.status}
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">{property.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-white">Top Performers</CardTitle>
            <Link to="/superadmin/analytics">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((property, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => navigate('/superadmin/analytics')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white">{property.name}</p>
                      <p className="text-xs text-slate-400">{property.bookings} bookings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{property.revenue}</p>
                    <p className="text-xs text-amber-400">★ {property.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
