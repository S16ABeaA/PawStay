import AdminLayout from "@/components/admin/AdminLayout";
import StatsCard from "@/components/admin/StatsCard";
import { Calendar, DollarSign, Star, Users, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { authHelper } from "@/helpers/authHelper";

const recentBookings = [];

const upcomingCheckIns: any[] = [];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [stats, setStats] = useState({ totalBookings: 0, revenue: 0, avgRating: 0, occupancy: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  const [todayCheckIns, setTodayCheckIns] = useState<any[]>([]);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
    const fetchMyProperties = async () => {
      try {
        setLoadingProps(true);
        const data = await authHelper.get(`${API_BASE_URL}/api/properties/mine`);
        setProperties(data.properties || []);
      } catch (err) {
        console.error("Failed to load properties", err);
      } finally {
        setLoadingProps(false);
      }
    };

    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const data = await authHelper.get(`${API_BASE_URL}/api/properties/mine/stats`);
        setStats({
          totalBookings: data.totalBookings || 0,
          revenue: data.revenue || 0,
          avgRating: data.avgRating || 0,
          occupancy: data.occupancy || 0,
        });
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchMyProperties();
    fetchStats();
    const fetchCheckIns = async () => {
      try {
        setLoadingCheckIns(true);
        const data = await authHelper.get(`${API_BASE_URL}/api/bookings/mine/today`);
        setTodayCheckIns(data.checkIns || []);
      } catch (err) {
        console.error('Failed to load today check-ins', err);
      } finally {
        setLoadingCheckIns(false);
      }
    };

    fetchCheckIns();
    const fetchRecent = async () => {
      try {
        setLoadingRecent(true);
        const data = await authHelper.get(`${API_BASE_URL}/api/bookings/mine/recent`);
        setRecentBookings(data.bookings || []);
      } catch (err) {
        console.error('Failed to load recent bookings', err);
      } finally {
        setLoadingRecent(false);
      }
    };

    fetchRecent();
  }, []);

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back! Here's your business overview.">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div onClick={() => navigate('/admin/bookings')} className="cursor-pointer">
          <StatsCard
            title="Total Bookings"
            value={loadingStats ? '...' : String(stats.totalBookings)}
            change=""
            changeType="positive"
            icon={Calendar}
            iconColor="text-primary"
          />
        </div>
        <div onClick={() => navigate('/admin/settings')} className="cursor-pointer">
          <StatsCard
            title="Revenue"
            value={loadingStats ? '...' : `₱${Number(stats.revenue || 0).toFixed(2)}`}
            change=""
            changeType="positive"
            icon={DollarSign}
            iconColor="text-success"
          />
        </div>
        <div onClick={() => navigate('/admin/reviews')} className="cursor-pointer">
          <StatsCard
            title="Avg. Rating"
            value={loadingStats ? '...' : String(stats.avgRating)}
            change={loadingStats ? '' : `Based on ratings`}
            changeType="neutral"
            icon={Star}
            iconColor="text-rating"
          />
        </div>
        <div onClick={() => navigate('/admin/services')} className="cursor-pointer">
          <StatsCard
            title="Occupancy"
            value={loadingStats ? '...' : `${stats.occupancy}%`}
            change=""
            changeType="positive"
            icon={TrendingUp}
            iconColor="text-accent"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Bookings</CardTitle>
            <Link to="/admin/bookings">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingRecent ? (
                <div className="text-sm text-muted-foreground">Loading recent bookings...</div>
              ) : recentBookings && recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary/70 transition-colors"
                    onClick={() => navigate('/admin/bookings')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">{booking.pet?.[0] ?? 'P'}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{booking.pet}</p>
                        <p className="text-xs text-muted-foreground">{booking.owner}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-foreground">{booking.service}</p>
                      <p className="text-xs text-muted-foreground">{booking.date}</p>
                    </div>
                    <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                      {booking.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No recent bookings.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today's Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingCheckIns ? (
                <div className="text-sm text-muted-foreground">Loading check-ins...</div>
              ) : todayCheckIns && todayCheckIns.length > 0 ? (
                todayCheckIns.map((checkIn) => (
                  <div key={checkIn.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{checkIn.pet}</p>
                      <p className="text-xs text-muted-foreground">{checkIn.owner}</p>
                      <p className="text-xs text-muted-foreground">{checkIn.service}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{checkIn.time}</p>
                      <p className="text-xs text-muted-foreground">{checkIn.room}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No check-ins for today.</div>
              )}
            </div>
            <Link to="/admin/bookings">
              <Button variant="outline" className="w-full mt-4">
                View Full Schedule
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
