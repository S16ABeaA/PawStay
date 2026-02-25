import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  notificationsApi,
  type Notification,
} from "@/services/notificationsApi";
import { useToast } from "@/hooks/use-toast";

const NOTIFICATION_ICONS: Record<string, string> = {
  booking_confirmed: "🎉",
  booking_cancelled: "❌",
  booking_reminder: "⏰",
  booking_completed: "✅",
  payment_received: "💳",
  property_approved: "🏠",
  property_rejected: "🚫",
  review_received: "⭐",
  system: "🔔",
  info: "ℹ️",
};

const TYPE_LABELS: Record<string, string> = {
  booking_confirmed: "Booking Confirmed",
  booking_cancelled: "Booking Cancelled",
  booking_reminder: "Reminder",
  booking_completed: "Booking Completed",
  payment_received: "Payment",
  property_approved: "Property Approved",
  property_rejected: "Property Rejected",
  review_received: "Review",
  system: "System",
  info: "Info",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState("all");

  const LIMIT = 20;

  const fetchNotifications = useCallback(
    async (offset = 0, append = false) => {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);

      try {
        const data = await notificationsApi.list(LIMIT, offset);
        setNotifications((prev) =>
          append ? [...prev, ...data.notifications] : data.notifications
        );
        setTotal(data.total);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load notifications.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleLoadMore = () => {
    fetchNotifications(notifications.length, true);
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const updated = await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast({
        title: "Done",
        description: `Marked ${updated} notification${updated !== 1 ? "s" : ""} as read.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark all as read.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.remove(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((t) => t - 1);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete notification.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAll = async () => {
    try {
      const deleted = await notificationsApi.removeAll();
      setNotifications([]);
      setTotal(0);
      toast({
        title: "Done",
        description: `Deleted ${deleted} notification${deleted !== 1 ? "s" : ""}.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete notifications.",
        variant: "destructive",
      });
    }
  };

  const handleClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await handleMarkRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const filtered =
    tab === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-3xl py-8 px-4">
        {/* Back button & title */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "You're all caught up!"}
            </p>
          </div>
        </div>

        {/* Tabs & actions */}
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <TabsList>
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {total}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleMarkAllRead}
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={handleDeleteAll}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear all
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="all" className="mt-0">
            <NotificationList
              notifications={filtered}
              loading={loading}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              onClick={handleClick}
            />
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            <NotificationList
              notifications={filtered}
              loading={loading}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              onClick={handleClick}
            />
          </TabsContent>
        </Tabs>

        {/* Load more */}
        {!loading && notifications.length < total && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                `Load more (${total - notifications.length} remaining)`
              )}
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

/* ------------------------------------------------------------------
   NotificationList sub-component
------------------------------------------------------------------ */
interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (n: Notification) => void;
}

const NotificationList = ({
  notifications,
  loading,
  onMarkRead,
  onDelete,
  onClick,
}: NotificationListProps) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground text-sm">Loading notifications…</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <BellOff className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-lg font-medium">No notifications</p>
        <p className="text-sm mt-1">
          When something happens, you'll see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`group transition-colors cursor-pointer hover:shadow-md ${
            !notification.is_read
              ? "border-primary/30 bg-primary/5"
              : "bg-background"
          }`}
          onClick={() => onClick(notification)}
        >
          <CardContent className="flex gap-4 p-4">
            {/* Icon */}
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-muted text-xl">
              {NOTIFICATION_ICONS[notification.type] || "🔔"}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm ${
                      !notification.is_read ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {notification.title}
                  </p>
                  {!notification.is_read && (
                    <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] flex-shrink-0">
                  {TYPE_LABELS[notification.type] || notification.type}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {notification.message}
              </p>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground/70">
                  {timeAgo(notification.created_at)}
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkRead(notification.id);
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(notification.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Notifications;
