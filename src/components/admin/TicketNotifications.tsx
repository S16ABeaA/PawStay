import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, CheckCircle2, Loader2, X } from "lucide-react";
import { authHelper } from "@/helpers/authHelper";
import { Link } from "react-router-dom";

interface TicketNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  reference_id: string;
  is_read: boolean;
  created_at: string;
}

export const TicketNotifications = () => {
  const [notifications, setNotifications] = useState<TicketNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchTicketNotifications = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
        const data = await authHelper.get(`${API_BASE_URL}/api/notifications`);
        
        // Filter for ticket-related notifications only
        const ticketNotifs = (data.notifications || []).filter(
          (n: TicketNotification) => n.type === "ticket_reply"
        );
        
        setNotifications(ticketNotifs.slice(0, 3)); // Show latest 3
      } catch (err) {
        console.error("Failed to fetch ticket notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketNotifications();
  }, []);

  const handleDismiss = (id: string) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(id);
    setDismissed(newDismissed);
  };

  const markAsRead = async (id: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
      await authHelper.patch(`${API_BASE_URL}/api/notifications/${id}/read`, {});
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

  if (loading) {
    return (
      <div className="mb-6 p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-3">
        <Loader2 className="h-5 w-5 text-slate-600 animate-spin" />
        <p className="text-sm text-slate-600">Loading support updates...</p>
      </div>
    );
  }

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {visibleNotifications.map((notification) => {
        const bgColor = "border-blue-200 bg-blue-50";
        const iconColor = "text-blue-600";
        const titleColor = "text-blue-900";
        const textColor = "text-blue-800";

        return (
          <Card key={notification.id} className={`border ${bgColor} overflow-hidden`}>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <MessageSquare className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className={`font-semibold ${titleColor}`}>{notification.title}</h3>
                      <p className={`text-sm ${textColor} mt-1 line-clamp-2`}>
                        {notification.message}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        handleDismiss(notification.id);
                        markAsRead(notification.id);
                      }}
                      className={`flex-shrink-0 ${iconColor} hover:opacity-70 transition-opacity`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                      Ticket Reply
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-3">
                    <Link to={`/user/support/${notification.reference_id}`}>
                      <Button size="sm" variant="outline" className={`${iconColor} border-blue-300 hover:bg-blue-100`}>
                        <MessageSquare className="h-4 w-4 mr-1" />
                        View Ticket
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
