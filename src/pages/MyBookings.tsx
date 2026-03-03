import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  User,
  Phone,
  FileText,
  Eye,
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
  cancelled: { label: "Cancelled", variant: "destructive" },
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
    !["cancelled"].includes(b.status)
  );
}

/** True when the booking's end date is strictly in the past */
function isPastDate(b: Booking): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = b.checkout ? new Date(b.checkout) : new Date(b.checkin);
  return end < now;
}

/** Whether a past booking qualifies for writing a review */
function canWriteReview(b: Booking): boolean {
  const validStatuses = ["confirmed"];
  return (
    validStatuses.includes(b.status) && isPastDate(b)
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
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [checkingPayment, setCheckingPayment] = useState<string | null>(null);

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

  /** Check payment status for a single booking and update UI */
  const handleCheckPayment = async (bookingId: string) => {
    setCheckingPayment(bookingId);
    try {
      const res = await bookingApi.checkPaymentStatus(bookingId);
      // Update the booking in-place with the latest payment status
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, payment_status: res.payment_status, status: res.booking_status }
            : b
        )
      );
      const statusLabel = res.payment_status === "paid" ? "Paid" : res.payment_status === "refunded" ? "Refunded" : res.payment_status === "partially_refunded" ? "Partially Refunded" : "Unpaid";
      toast({
        title: `Payment Status: ${statusLabel}`,
        description: res.payment_status === "paid"
          ? `Payment of ₱${Number(res.total_price ?? 0).toFixed(2)} has been confirmed${res.paid_at ? ` on ${new Date(res.paid_at).toLocaleDateString()}` : ""}.`
          : res.payment_status === "refunded"
            ? "Your payment has been refunded."
            : `Payment is currently ${statusLabel.toLowerCase()}. Please contact the property if you believe this is incorrect.`,
      });
    } catch (err: any) {
      console.error("Failed to check payment:", err);
      toast({ title: "Error", description: "Failed to check payment status.", variant: "destructive" });
    } finally {
      setCheckingPayment(null);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Check which past bookings already have reviews
  useEffect(() => {
    const pastBookings = bookings.filter((b) => !isUpcoming(b) && canWriteReview(b));
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

  const handleOpenDetail = (booking: Booking) => {
    setDetailBooking(booking);
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
                  upcoming.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      onCheckPayment={() => handleCheckPayment(b.id)}
                      isCheckingPayment={checkingPayment === b.id}
                    />
                  ))
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
                      isPast
                      isReviewed={reviewedBookings.has(b.id)}
                      onWriteReview={() => handleOpenReview(b)}
                      onViewDetail={() => handleOpenDetail(b)}
                      onCheckPayment={() => handleCheckPayment(b.id)}
                      isCheckingPayment={checkingPayment === b.id}
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

      {/* Past Booking Detail Dialog */}
      {detailBooking && (
        <PastBookingDetailDialog
          booking={detailBooking}
          open={!!detailBooking}
          onOpenChange={(open) => { if (!open) setDetailBooking(null); }}
          isReviewed={reviewedBookings.has(detailBooking.id)}
          onWriteReview={() => {
            setDetailBooking(null);
            handleOpenReview(detailBooking);
          }}
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
  isPast,
  isReviewed,
  onWriteReview,
  onViewDetail,
  onCheckPayment,
  isCheckingPayment,
}: {
  booking: Booking;
  isPast?: boolean;
  isReviewed?: boolean;
  onWriteReview?: () => void;
  onViewDetail?: () => void;
  onCheckPayment?: () => void;
  isCheckingPayment?: boolean;
}) {
  const b = booking;
  const { label: statusLabel, variant: statusVariant } =
    statusConfig[b.status] ?? { label: b.status, variant: "secondary" as const };

  const dateRange = b.checkout
    ? `${formatDate(b.checkin)} – ${formatDate(b.checkout)}`
    : formatDate(b.checkin);

  const canReview = canWriteReview(b) && !isReviewed;

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
                variant={b.payment_status === "paid" ? "default" : b.payment_status === "refunded" ? "destructive" : "secondary"}
                className={`text-[10px] px-1.5 py-0 ${b.payment_status === "paid" ? "bg-green-600" : ""}`}
              >
                {b.payment_status === "paid" ? "✓ Paid" : b.payment_status === "refunded" ? "Refunded" : b.payment_status === "partially_refunded" ? "Partial Refund" : "Unpaid"}
              </Badge>
              {b.payment_status !== "paid" && onCheckPayment && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-primary hover:text-primary/80 gap-1"
                  onClick={onCheckPayment}
                  disabled={isCheckingPayment}
                >
                  {isCheckingPayment ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CreditCard className="h-3 w-3" />
                  )}
                  Check Payment
                </Button>
              )}
            </div>
            <span className="font-semibold text-foreground">
              {formatCurrency(b.total_price)}
            </span>
          </div>

          {/* Past booking actions */}
          {isPast && (
            <div className="mt-3 pt-3 border-t border-border/50 flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={onViewDetail}
              >
                <Eye className="h-4 w-4" />
                View Details
              </Button>
              {canReview && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={onWriteReview}
                >
                  <Star className="h-4 w-4" />
                  Write a Review
                </Button>
              )}
              {isReviewed && (
                <div className="flex-1 flex items-center justify-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Reviewed</span>
                </div>
              )}
            </div>
          )}

          {/* Review button for non-past completed bookings (fallback) */}
          {!isPast && canReview && (
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
          {!isPast && isReviewed && (
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

/* ────────────── Past Booking Detail Dialog ────────────── */

function PastBookingDetailDialog({
  booking,
  open,
  onOpenChange,
  isReviewed,
  onWriteReview,
}: {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isReviewed: boolean;
  onWriteReview: () => void;
}) {
  const b = booking;
  const { label: statusLabel, variant: statusVariant } =
    statusConfig[b.status] ?? { label: b.status, variant: "secondary" as const };

  const dateRange = b.checkout
    ? `${formatDate(b.checkin)} – ${formatDate(b.checkout)}`
    : formatDate(b.checkin);

  const canReview = canWriteReview(b) && !isReviewed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Booking Details</DialogTitle>
        </DialogHeader>

        {/* Property image + name */}
        <div className="space-y-4">
          {b.property_image && (
            <div className="rounded-lg overflow-hidden h-48 bg-muted">
              <img
                src={b.property_image}
                alt={b.property_name ?? "Property"}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{b.property_name ?? "Booking"}</h3>
              {b.service_type && (
                <p className="text-sm text-muted-foreground">
                  {serviceTypeLabel[b.service_type] ?? b.service_type}
                </p>
              )}
            </div>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>

          {/* Full info grid */}
          <div className="space-y-3 text-sm">
            <DetailRow icon={<Calendar className="h-4 w-4" />} label="Date" value={dateRange} />
            {b.time_slot && (
              <DetailRow icon={<Clock className="h-4 w-4" />} label="Time Slot" value={b.time_slot} />
            )}
            {b.pet_name && (
              <DetailRow
                icon={<PawPrint className="h-4 w-4" />}
                label="Pet"
                value={`${b.pet_name}${b.pet_breed ? ` (${b.pet_breed})` : ""}${b.pet_type ? ` · ${b.pet_type}` : ""}`}
              />
            )}
            {b.service_name && (
              <DetailRow icon={<FileText className="h-4 w-4" />} label="Service" value={b.service_name} />
            )}
            {b.owner_name && (
              <DetailRow icon={<User className="h-4 w-4" />} label="Booked By" value={b.owner_name} />
            )}
          </div>

          {/* Payment section */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <h4 className="font-medium text-sm">Payment Summary</h4>
            {b.subtotal != null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(b.subtotal)}</span>
              </div>
            )}
            {b.service_fee != null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Fee</span>
                <span>{formatCurrency(b.service_fee)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(b.total_price)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm pt-1">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize text-muted-foreground">
                {b.payment_method?.replace("_", " ") ?? "—"}
              </span>
              <Badge
                variant={b.payment_status === "paid" ? "default" : b.payment_status === "refunded" ? "destructive" : "secondary"}
                className={`text-[10px] px-1.5 py-0 ${b.payment_status === "paid" ? "bg-green-600" : ""}`}
              >
                {b.payment_status === "paid" ? "✓ Paid" : b.payment_status === "refunded" ? "Refunded" : b.payment_status === "partially_refunded" ? "Partial Refund" : "Unpaid"}
              </Badge>
            </div>
          </div>

          {/* Booked on */}
          <p className="text-xs text-muted-foreground">
            Booked on {formatDate(b.created_at)}
          </p>

          {/* Review section */}
          {canReview && (
            <Button className="w-full gap-2" onClick={onWriteReview}>
              <Star className="h-4 w-4" />
              Write a Review
            </Button>
          )}
          {isReviewed && (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 py-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>You have already reviewed this booking</span>
            </div>
          )}
          {!canReview && !isReviewed && (
            <p className="text-xs text-center text-muted-foreground">
              Reviews are not available for this booking status.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

export default MyBookings;
