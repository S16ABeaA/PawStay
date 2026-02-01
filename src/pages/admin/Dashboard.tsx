import AdminLayout from "@/components/admin/AdminLayout";
import StatsCard from "@/components/admin/StatsCard";
import { Calendar, DollarSign, Star, Users, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

const recentBookings = [
  { id: 1, pet: "Max", owner: "John Smith", service: "Boarding", date: "Jan 30", status: "confirmed" },
  { id: 2, pet: "Bella", owner: "Sarah Johnson", service: "Grooming", date: "Jan 30", status: "pending" },
  { id: 3, pet: "Charlie", owner: "Mike Brown", service: "Boarding", date: "Jan 31", status: "confirmed" },
  { id: 4, pet: "Luna", owner: "Emily Davis", service: "Daycare", date: "Jan 31", status: "pending" },
  { id: 5, pet: "Cooper", owner: "Alex Wilson", service: "Boarding", date: "Feb 1", status: "confirmed" },
];

const upcomingCheckIns = [
  { pet: "Max", owner: "John Smith", time: "10:00 AM", room: "Suite A" },
  { pet: "Charlie", owner: "Mike Brown", time: "2:00 PM", room: "Standard 3" },
  { pet: "Cooper", owner: "Alex Wilson", time: "4:30 PM", room: "Suite B" },
];

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back! Here's your business overview.">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div onClick={() => navigate('/admin/bookings')} className="cursor-pointer">
          <StatsCard
            title="Total Bookings"
            value="156"
            change="+12% from last month"
            changeType="positive"
            icon={Calendar}
            iconColor="text-primary"
          />
        </div>
        <div onClick={() => navigate('/admin/settings')} className="cursor-pointer">
          <StatsCard
            title="Revenue"
            value="$12,450"
            change="+8% from last month"
            changeType="positive"
            icon={DollarSign}
            iconColor="text-success"
          />
        </div>
        <div onClick={() => navigate('/admin/reviews')} className="cursor-pointer">
          <StatsCard
            title="Avg. Rating"
            value="4.8"
            change="Based on 89 reviews"
            changeType="neutral"
            icon={Star}
            iconColor="text-rating"
          />
        </div>
        <div onClick={() => navigate('/admin/services')} className="cursor-pointer">
          <StatsCard
            title="Occupancy"
            value="78%"
            change="+5% from last week"
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
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary/70 transition-colors"
                  onClick={() => navigate('/admin/bookings')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {booking.pet[0]}
                      </span>
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
                  <Badge
                    variant={booking.status === "confirmed" ? "default" : "secondary"}
                  >
                    {booking.status}
                  </Badge>
                </div>
              ))}
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
              {upcomingCheckIns.map((checkIn, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{checkIn.pet}</p>
                    <p className="text-xs text-muted-foreground">{checkIn.owner}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{checkIn.time}</p>
                    <p className="text-xs text-muted-foreground">{checkIn.room}</p>
                  </div>
                </div>
              ))}
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
