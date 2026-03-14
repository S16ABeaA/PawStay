import AdminLayout from "@/components/admin/AdminLayout";
import StatsCard from "@/components/admin/StatsCard";
import { PropertyStatusNotification } from "@/components/admin/PropertyStatusNotification";
import { TicketNotifications } from "@/components/admin/TicketNotifications";
import { Calendar, DollarSign, Star, Users, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { authHelper } from "@/helpers/authHelper";
import { useAdminProperty } from "@/hooks/useAdminProperty";

const recentBookings = [];

const upcomingCheckIns: any[] = [];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { selectedPropertyId, loading: propLoading } = useAdminProperty();
  const [stats, setStats] = useState({ totalBookings: 0, revenue: 0, avgRating: 0, occupancy: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  const [todayCheckIns, setTodayCheckIns] = useState<any[]>([]);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [settlementStatus, setSettlementStatus] = useState<any>(null);
  const [loadingSettlement, setLoadingSettlement] = useState(false);
  const [isPaymentDueDay, setIsPaymentDueDay] = useState(false);

  useEffect(() => {
    // Track whether this effect has been superseded by a newer one
    let cancelled = false;

    // Clear stale data immediately when property changes
    setStats({ totalBookings: 0, revenue: 0, avgRating: 0, occupancy: 0 });
    setTodayCheckIns([]);
    setRecentBookings([]);
    setSettlementStatus(null);

    if (propLoading || !selectedPropertyId) return;

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
    const qs = `?property_id=${selectedPropertyId}`;

    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const data = await authHelper.get(`${API_BASE_URL}/api/properties/mine/stats${qs}`);
        if (cancelled) return;
        setStats({
          totalBookings: data.totalBookings || 0,
          revenue: data.revenue || 0,
          avgRating: data.avgRating || 0,
          occupancy: data.occupancy || 0,
        });
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    };

    const fetchCheckIns = async () => {
      try {
        setLoadingCheckIns(true);
        const data = await authHelper.get(`${API_BASE_URL}/api/bookings/mine/today${qs}`);
        if (cancelled) return;
        setTodayCheckIns(data.checkIns || []);
      } catch (err) {
        console.error('Failed to load today check-ins', err);
      } finally {
        if (!cancelled) setLoadingCheckIns(false);
      }
    };

    const fetchRecent = async () => {
      try {
        setLoadingRecent(true);
        const data = await authHelper.get(`${API_BASE_URL}/api/bookings/mine/recent${qs}`);
        if (cancelled) return;
        setRecentBookings(data.bookings || []);
      } catch (err) {
        console.error('Failed to load recent bookings', err);
      } finally {
        if (!cancelled) setLoadingRecent(false);
      }
    };

    const fetchSettlementStatus = async () => {
      try {
        setLoadingSettlement(true);
        const data = await authHelper.get(`${API_BASE_URL}/api/settlements/proprietor/monthly-status${qs}`);
        if (cancelled) return;
        setSettlementStatus(data);
      } catch (err) {
        console.error('Failed to load settlement status', err);
      } finally {
        if (!cancelled) setLoadingSettlement(false);
      }
    };

    fetchStats();
    fetchCheckIns();
    fetchRecent();
    fetchSettlementStatus();

    return () => { cancelled = true; };
  }, [selectedPropertyId, propLoading]);

  // Check if today is the first or last day of the month
  useEffect(() => {
    const today = new Date();
    const firstDay = today.getDate() === 1;
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() === today.getDate();
    setIsPaymentDueDay(firstDay || lastDay);
  }, []);

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back! Here's your business overview.">
      {/* Settlement Payment Notification */}
      {isPaymentDueDay && settlementStatus && settlementStatus.thisMonthOutstanding > 0 && (
        <div className="mb-6 p-4 rounded-lg border border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">Payment Due: Monthly Settlement</h3>
              <p className="text-sm text-amber-800 mt-1">
                Outstanding balance for this month: <span className="font-bold">₱{settlementStatus.thisMonthOutstanding.toFixed(2)}</span>
              </p>
              <p className="text-xs text-amber-700 mt-2">
                {new Date().getDate() === 1 
                  ? "Settlement reminders are sent on the 1st of the month."
                  : "Please settle any outstanding payments by the end of the month."}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 border-amber-300 text-amber-900 hover:bg-amber-100"
                onClick={() => navigate('/admin/settlements')}
              >
                View Settlements
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Property Status Notifications */}
      <PropertyStatusNotification />

      {/* Ticket Notifications */}
      <TicketNotifications />

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
        <div onClick={() => navigate('/admin/bookings')} className="cursor-pointer">
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
            change=""
            changeType="neutral"
            icon={Star}
            iconColor="text-rating"
          />
        </div>
        <div onClick={() => navigate('/admin/calendar')} className="cursor-pointer">
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
            <Link to="/admin/calendar?view=day">
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