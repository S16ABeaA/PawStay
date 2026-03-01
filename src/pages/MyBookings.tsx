import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  MapPin,
  PawPrint,
  CreditCard,
  ArrowLeft,
  Loader2,
  CalendarX2,
  Star,
  CheckCircle2,
} from "lucide-react";
import { bookingApi } from "@/services/bookingApi";
import { reviewsApi } from "@/services/reviewsApi";
import ReviewDialog from "@/components/ReviewDialog";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  property_id: string;
  property_name: string | null;
  property_image: string | null;
  checkin: string;
  checkout: string | null;
  time_slot: string | null;
  pet_name: string | null;
  pet_type: string | null;
  pet_breed: string | null;
  service_name: string | null;
  service_type: string | null;
  owner_name: string | null;
  subtotal: number | null;
  service_fee: number | null;
  total_price: number | null;
  payment_method: string | null;
  payment_status: string;
  status: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  confirmed: { label: "Confirmed", variant: "default" },
  checked_in: { label: "Checked In", variant: "default" },
  checked_out: { label: "Checked Out", variant: "outline" },
  completed: { label: "Completed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  no_show: { label: "No Show", variant: "destructive" },
};

const serviceTypeLabel: Record<string, string> = {
  boarding: "Hotel / Boarding",
  grooming: "Grooming",
  veterinary: "Veterinary",
  daycare: "Daycare",
  transport: "Transport",
};

function isUpcoming(b: Booking): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = b.checkout ? new Date(b.checkout) : new Date(b.checkin);
  return (
    end >= now &&
    !["cancelled", "completed", "checked_out", "no_show"].includes(b.status)
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null): string {
  if (amount == null) return "—";
  return `₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

const MyBookings = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await bookingApi.list();
      setBookings(res.bookings ?? []);
    } catch (err: any) {
      console.error("Failed to load bookings:", err);
      toast({ title: "Error", description: "Failed to load bookings." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Check which past bookings already have reviews
  useEffect(() => {
    const pastBookings = bookings.filter((b) => !isUpcoming(b) && ["completed", "checked_out"].includes(b.status));
    if (!pastBookings.length) return;

    const checkReviews = async () => {
      const reviewed = new Set<string>();
      await Promise.all(
        pastBookings.map(async (b) => {
          try {
            const res = await reviewsApi.checkReview(b.id);
            if (res.hasReview) reviewed.add(b.id);
          } catch {
            // ignore check errors
          }
        })
      );
      setReviewedBookings(reviewed);
    };
    checkReviews();
  }, [bookings]);

  const handleOpenReview = (booking: Booking) => {
    setSelectedBooking(booking);
    setReviewDialogOpen(true);
  };

  const handleReviewSubmitted = () => {
    if (selectedBooking) {
      setReviewedBookings((prev) => new Set(prev).add(selectedBooking.id));
    }
    setSelectedBooking(null);
  };

  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter((b) => !isUpcoming(b));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8 md:py-12">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/profile">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                My Bookings
              </h1>
              <p className="text-muted-foreground text-sm">
                {bookings.length} total booking{bookings.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {bookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <CalendarX2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold mb-2">No Bookings Yet</h2>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  You haven't made any bookings yet. Browse our services and
                  book a stay, grooming, or vet visit for your pet!
                </p>
                <Link to="/hotels">
                  <Button variant="hero">Browse Pet Hotels</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="upcoming" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upcoming">
                  Current & Upcoming ({upcoming.length})
                </TabsTrigger>
                <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {upcoming.length === 0 ? (
                  <EmptyState message="No upcoming bookings" />
                ) : (
                  upcoming.map((b) => <BookingCard key={b.id} booking={b} />)
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4">
                {past.length === 0 ? (
                  <EmptyState message="No past bookings" />
                ) : (
                  past.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      isReviewed={reviewedBookings.has(b.id)}
                      onWriteReview={() => handleOpenReview(b)}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />

      {/* Review Dialog */}
      {selectedBooking && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          bookingId={selectedBooking.id}
          propertyName={selectedBooking.property_name ?? "this place"}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
};

/* ────────────── Sub-components ────────────── */

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-12 text-center">
        <CalendarX2 className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

function BookingCard({
  booking,
  isReviewed,
  onWriteReview,
}: {
  booking: Booking;
  isReviewed?: boolean;
  onWriteReview?: () => void;
}) {
  const b = booking;
  const { label: statusLabel, variant: statusVariant } =
    statusConfig[b.status] ?? { label: b.status, variant: "secondary" as const };

  const dateRange = b.checkout
    ? `${formatDate(b.checkin)} – ${formatDate(b.checkout)}`
    : formatDate(b.checkin);

  const canReview = ["completed", "checked_out"].includes(b.status) && !isReviewed;

  return (
    <Card className="overflow-hidden hover:shadow-elevated transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <div className="sm:w-40 h-32 sm:h-auto bg-muted flex-shrink-0">
          {b.property_image ? (
            <img
              src={b.property_image}
              alt={b.property_name ?? "Property"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PawPrint className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Details */}
        <CardContent className="flex-1 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {b.property_name ?? "Booking"}
              </h3>
              {b.service_type && (
                <p className="text-xs text-muted-foreground">
                  {serviceTypeLabel[b.service_type] ?? b.service_type}
                </p>
              )}
            </div>
            <Badge variant={statusVariant} className="flex-shrink-0">
              {statusLabel}
            </Badge>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {/* Date */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{dateRange}</span>
            </div>

            {/* Time slot */}
            {b.time_slot && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>{b.time_slot}</span>
              </div>
            )}

            {/* Pet */}
            {b.pet_name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <PawPrint className="h-4 w-4 flex-shrink-0" />
                <span>
                  {b.pet_name}
                  {b.pet_breed ? ` (${b.pet_breed})` : ""}
                </span>
              </div>
            )}

            {/* Service */}
            {b.service_name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{b.service_name}</span>
              </div>
            )}
          </div>

          {/* Footer row: Price + payment */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize text-muted-foreground">
                {b.payment_method?.replace("_", " ") ?? "—"}
              </span>
              <Badge
                variant={b.payment_status === "paid" ? "default" : "secondary"}
                className="text-[10px] px-1.5 py-0"
              >
                {b.payment_status}
              </Badge>
            </div>
            <span className="font-semibold text-foreground">
              {formatCurrency(b.total_price)}
            </span>
          </div>

          {/* Review button for completed bookings */}
          {canReview && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={onWriteReview}
              >
                <Star className="h-4 w-4" />
                Write a Review
              </Button>
            </div>
          )}
          {isReviewed && (
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Reviewed</span>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}

export default MyBookings;
