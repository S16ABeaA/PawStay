import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Loader2, X } from "lucide-react";
import { authHelper } from "@/helpers/authHelper";
import { Link } from "react-router-dom";
import BookingIdText from "@/components/BookingIdText";

interface TicketNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  reference_id: string;
  is_read: boolean;
  created_at: string;
}

export const SuperAdminTicketNotifications = () => {
  const [notifications, setNotifications] = useState<TicketNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchTicketNotifications = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
        const data = await authHelper.get(`${API_BASE_URL}/api/notifications`);
        
        // Filter for ticket-related notifications (new tickets and replies)
        const ticketNotifs = (data.notifications || []).filter(
          (n: TicketNotification) => n.type === "new_ticket" || n.type === "ticket_reply"
        );
        
        setNotifications(ticketNotifs.slice(0, 4)); // Show latest 4
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
      <div className="mb-6 p-4 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center gap-3">
        <Loader2 className="h-5 w-5 text-white/60 animate-spin" />
        <p className="text-sm text-white/60">Loading support tickets...</p>
      </div>
    );
  }

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 space-y-3">
      {visibleNotifications.map((notification) => {
        const isNewTicket = notification.type === "new_ticket";
        const Icon = isNewTicket ? Mail : MessageSquare;
        const bgColor = isNewTicket
          ? "bg-white/[0.05] border-emerald-500/20"
          : "bg-white/[0.05] border-cyan-500/20";
        const iconColor = isNewTicket ? "text-emerald-400" : "text-cyan-400";
        const badgeVariant = isNewTicket ? "default" : "outline";

        return (
          <Card key={notification.id} className={`border ${bgColor} overflow-hidden`}>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className={`font-semibold text-white`}>{notification.title}</h3>
                      <p className={`text-sm text-white/70 mt-1 line-clamp-2`}>
                        <BookingIdText text={notification.message} />
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
                    <Badge
                      className={`text-xs ${
                        isNewTicket
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                          : "bg-cyan-500/15 text-cyan-400 border-cyan-500/20"
                      }`}
                    >
                      {isNewTicket ? "New Ticket" : "New Reply"}
                    </Badge>
                    <span className="text-xs text-white/50">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-3">
                    <Link to={`/superadmin/support?ticket=${notification.reference_id}`}>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-white/[0.1] text-white/80 hover:text-white hover:bg-white/[0.05]"
                      >
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
