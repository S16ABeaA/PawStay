import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, X } from "lucide-react";
import { authHelper } from "@/helpers/authHelper";
import { Link } from "react-router-dom";

interface PropertyNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  reference_id: string;
  is_read: boolean;
  created_at: string;
}

export const PropertyStatusNotification = () => {
  const [notifications, setNotifications] = useState<PropertyNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPropertyNotifications = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
        const data = await authHelper.get(`${API_BASE_URL}/api/notifications`);
        
        // Filter for property-related notifications only
        const propertyNotifs = (data.notifications || []).filter((n: PropertyNotification) =>
          ["property_approved", "property_rejected", "property_suspended"].includes(n.type) && !n.is_read
        );
        
        setNotifications(propertyNotifs.slice(0, 3)); // Show latest 3
      } catch (err) {
        console.error("Failed to fetch property notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyNotifications();
  }, []);

  const resolvePropertyLink = (notification: PropertyNotification) => {
    if (notification.link && notification.link.includes("propertyId=")) {
      return notification.link;
    }
    return `/admin/services?propertyId=${notification.reference_id}`;
  };

  const handleDismiss = async (id: string) => {
    // Optimistic remove so the card disappears immediately.
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
      await authHelper.delete(`${API_BASE_URL}/api/notifications/${id}`);
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
      await authHelper.patch(`${API_BASE_URL}/api/notifications/${id}/read`, {});
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  if (loading) {
    return (
      <div className="mb-6 p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-3">
        <Loader2 className="h-5 w-5 text-slate-600 animate-spin" />
        <p className="text-sm text-slate-600">Loading property status...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {notifications.map((notification) => {
        const isApproved = notification.type === "property_approved";
        const isRejected = notification.type === "property_rejected";
        const Icon = isApproved ? CheckCircle2 : XCircle;
        const bgColor = isApproved
          ? "border-emerald-200 bg-emerald-50"
          : isRejected
            ? "border-red-200 bg-red-50"
            : "border-amber-200 bg-amber-50";
        const iconColor = isApproved
          ? "text-emerald-600"
          : isRejected
            ? "text-red-600"
            : "text-amber-600";
        const titleColor = isApproved
          ? "text-emerald-900"
          : isRejected
            ? "text-red-900"
            : "text-amber-900";
        const textColor = isApproved
          ? "text-emerald-800"
          : isRejected
            ? "text-red-800"
            : "text-amber-800";
        const badgeVariant = isApproved ? "default" : isRejected ? "destructive" : "secondary";

        return (
          <Card key={notification.id} className={`border ${bgColor} overflow-hidden`}>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
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
                    <Badge variant={badgeVariant} className="text-xs">
                      {isApproved ? "Approved" : isRejected ? "Rejected" : "Suspended"}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {isApproved ? (
                      <>
                        <Link to={resolvePropertyLink(notification)}>
                          <Button size="sm" variant="outline" className={`${iconColor} border-emerald-300 hover:bg-emerald-100`}>
                            View Property
                          </Button>
                        </Link>
                      </>
                    ) : isRejected ? (
                      <>
                        <Link to={resolvePropertyLink(notification)}>
                          <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                            View Feedback
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link to={resolvePropertyLink(notification)}>
                          <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
                            Review Status
                          </Button>
                        </Link>
                      </>
                    )}
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
