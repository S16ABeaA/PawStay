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
  DialogDescription,
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
import RandomFullPagePetLoader from "@/components/ui/RandomFullPagePetLoader";
import { useBlockingPageLoad } from "@/hooks/useBlockingPageLoad";
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
  payment_screenshot_url?: string | null;
  reference_number?: string | null;
  vaccine_record_url?: string | null;
  med_cert_url?: string | null;
  room_name?: string | null;
  special_requirements?: string | null;
  status: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  confirmed: { label: "Confirmed", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
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
    !["cancelled", "completed"].includes(b.status)
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
  if (b.status === "completed") return true;
  return b.status === "confirmed" && isPastDate(b);
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

function parseDocumentUrls(raw?: string | null): string[] {
  if (!raw) return [];
  const value = String(raw).trim();
  if (!value) return [];
  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((u) => typeof u === "string" && u.length > 0);
      }
    } catch {
      // Fall back to treating as a single URL
    }
  }
  return [value];
}

function isImageUrl(url: string): boolean {
  return /^data:image\//i.test(url) || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url);
}

const MyBookings = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState<string | null>(null);
  const [isPageBlocking, notifyLoaderFinished] = useBlockingPageLoad(loading, 800);

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

  if (isPageBlocking) {
    return <RandomFullPagePetLoader dataLoaded={!loading} onComplete={notifyLoaderFinished} />;
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
                      onViewDetail={() => handleOpenDetail(b)}
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

      {/* Booking Detail Dialog */}
      {detailBooking && (
        <BookingDetailDialog
          booking={detailBooking}
          open={!!detailBooking}
          onOpenChange={(open) => { if (!open) setDetailBooking(null); }}
          onPreviewImage={setImagePreview}
          isReviewed={reviewedBookings.has(detailBooking.id)}
          onWriteReview={() => {
            setDetailBooking(null);
            handleOpenReview(detailBooking);
          }}
        />
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>Click outside or press Escape to close</DialogDescription>
          </DialogHeader>
          {imagePreview && (
            <div className="flex items-center justify-center">
              <img src={imagePreview} alt="Preview" className="max-w-full max-h-[75vh] object-contain rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>
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
    <Card
      className="overflow-hidden hover:shadow-elevated transition-shadow cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={onViewDetail}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onViewDetail) {
          e.preventDefault();
          onViewDetail();
        }
      }}
    >
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onCheckPayment();
                  }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetail?.();
                }}
              >
                <Eye className="h-4 w-4" />
                View Details
              </Button>
              {canReview && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWriteReview?.();
                  }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onWriteReview?.();
                }}
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

/* ────────────── Booking Detail Dialog ────────────── */

function BookingDetailDialog({
  booking,
  open,
  onOpenChange,
  onPreviewImage,
  isReviewed,
  onWriteReview,
}: {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreviewImage: (url: string) => void;
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
  const vaccineDocs = parseDocumentUrls(b.vaccine_record_url);
  const medDocs = parseDocumentUrls(b.med_cert_url);
  const hasPetDocs = vaccineDocs.length > 0 || medDocs.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            Service Details
          </DialogTitle>
          <DialogDescription>{b.service_name || b.service_type || "Booking"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Service Name</p>
              <p className="font-medium">{b.service_name || b.service_type || "Booking"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <Badge className="capitalize mt-1">{b.service_type || "other"}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(b.checkin).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Booking Information */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Booking Information
            </h4>

            <div className="grid grid-cols-2 gap-4 mt-3">
              {b.pet_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Pet</p>
                  <p className="font-medium">{b.pet_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Service</p>
                <p className="font-medium">{b.service_name || b.service_type || "Booking"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-in</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(b.checkin).toLocaleDateString()}
                  {b.time_slot && (
                    <span className="text-muted-foreground ml-1 flex items-center gap-0.5">
                      <Clock className="h-3 w-3" /> {b.time_slot}
                    </span>
                  )}
                </p>
              </div>
              {b.checkout && (
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(b.checkout).toLocaleDateString()}
                  </p>
                </div>
              )}
              {b.total_price != null && (
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">₱{Number(b.total_price).toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={statusVariant} className="mt-1 capitalize">
                  {statusLabel}
                </Badge>
              </div>
              {b.room_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Room</p>
                  <p className="font-medium">{b.room_name}</p>
                </div>
              )}
              {b.property_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Property</p>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {b.property_name}
                  </p>
                </div>
              )}
              {b.owner_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Booked By</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {b.owner_name}
                  </p>
                </div>
              )}
              {b.special_requirements && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Special Requirements</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg mt-1">{b.special_requirements}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          {b.payment_method && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium capitalize">{b.payment_method.replace("_", " ")}</p>
                </div>
                {b.reference_number && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reference Number</p>
                    <p className="font-medium font-mono text-sm bg-muted/50 px-2 py-1 rounded inline-block">{b.reference_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge
                    variant={b.payment_status === "paid" ? "default" : "secondary"}
                    className={`mt-1 capitalize ${b.payment_status === "paid" ? "bg-green-600" : ""}`}
                  >
                    {b.payment_status === "paid" ? "Paid" : b.payment_status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              {b.payment_screenshot_url && (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground mb-2">Payment Screenshot</p>
                  <div
                    className="cursor-pointer inline-block border border-border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                    onClick={() => onPreviewImage(b.payment_screenshot_url as string)}
                  >
                    <img
                      src={b.payment_screenshot_url}
                      alt="Payment proof"
                      className="w-40 h-40 object-cover"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Click to enlarge</p>
                </div>
              )}
            </div>
          )}

          {/* Pet Documents */}
          {hasPetDocs && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Pet Documents
              </h4>
              <div className="flex flex-wrap gap-4">
                {vaccineDocs.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Vaccine Record</p>
                    <div className="flex flex-wrap gap-3">
                      {vaccineDocs.map((url, idx) => (
                        <div key={`vaccine-${idx}`}>
                          {isImageUrl(url) ? (
                            <div
                              className="cursor-pointer inline-block border border-border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                              onClick={() => onPreviewImage(url)}
                            >
                              <img
                                src={url}
                                alt={`Vaccine record ${idx + 1}`}
                                className="w-40 h-40 object-cover"
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="w-40 h-40 border border-border rounded-lg bg-muted/30 text-xs px-3 py-2 text-muted-foreground hover:bg-muted/50"
                              onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                            >
                              Open vaccine document {idx + 1}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Click an image to enlarge or open files in a new tab.</p>
                  </div>
                )}
                {medDocs.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Medical Certificate</p>
                    <div className="flex flex-wrap gap-3">
                      {medDocs.map((url, idx) => (
                        <div key={`med-${idx}`}>
                          {isImageUrl(url) ? (
                            <div
                              className="cursor-pointer inline-block border border-border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                              onClick={() => onPreviewImage(url)}
                            >
                              <img
                                src={url}
                                alt={`Medical certificate ${idx + 1}`}
                                className="w-40 h-40 object-cover"
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="w-40 h-40 border border-border rounded-lg bg-muted/30 text-xs px-3 py-2 text-muted-foreground hover:bg-muted/50"
                              onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                            >
                              Open medical document {idx + 1}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Click an image to enlarge or open files in a new tab.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">Booked on {formatDate(b.created_at)}</p>

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

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MyBookings;
