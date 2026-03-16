import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Download, Eye, CheckCircle, XCircle, FileText, CreditCard, Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { authHelper } from "@/helpers/authHelper";
import { useAdminProperty } from "@/hooks/useAdminProperty";
import { bookingApi } from "@/services/bookingApi";

const initialBookings: any[] = [];

const parseDocumentUrls = (raw?: string | null): string[] => {
  if (!raw) return [];
  const value = String(raw).trim();
  if (!value) return [];
  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === "string" && item.length > 0);
      }
    } catch {
      // fall back to single URL
    }
  }
  return [value];
};

const isImageUrl = (url: string): boolean =>
  /^data:image\//i.test(url) || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url);

const AdminBookings = () => {
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<typeof initialBookings[0] | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const { toast } = useToast();
  const { selectedPropertyId, loading: propLoading } = useAdminProperty();
  const [loadingBookings, setLoadingBookings] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

  const handleConfirm = async (id: string) => {
    try {
      await bookingApi.updateBookingStatus(id, 'confirmed');
      setBookings((prev) => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));
      toast({ title: 'Booking Confirmed', description: `Booking ${id} has been confirmed.` });
    } catch (err: any) {
      console.error('Confirm failed', err);
      toast({ title: 'Error', description: err?.message || 'Failed to confirm booking', variant: 'destructive' });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await bookingApi.updateBookingStatus(id, 'cancelled');
      setBookings((prev) => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      toast({ title: 'Booking Cancelled', description: `Booking ${id} has been cancelled.`, variant: 'destructive' });
    } catch (err: any) {
      console.error('Cancel failed', err);
      toast({ title: 'Error', description: err?.message || 'Failed to cancel booking', variant: 'destructive' });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await bookingApi.updateBookingStatus(id, 'completed');
      setBookings((prev) => prev.map(b => b.id === id ? { ...b, status: 'completed' } : b));
      toast({ title: 'Booking Completed', description: `Booking ${id} marked as completed.` });
    } catch (err: any) {
      console.error('Complete failed', err);
      toast({ title: 'Error', description: err?.message || 'Failed to mark booking as completed', variant: 'destructive' });
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await bookingApi.updatePaymentStatus(id, "paid");
      setBookings((prev) => prev.map(b => b.id === id ? { ...b, paymentStatus: "paid" } : b));
      setSelectedBooking((prev: any) => (prev?.id === id ? { ...prev, paymentStatus: "paid" } : prev));
      toast({ title: "Payment Updated", description: `Booking ${id} marked as paid.` });
    } catch (err: any) {
      console.error("Mark paid failed", err);
      toast({ title: "Error", description: err?.message || "Failed to mark payment as paid", variant: "destructive" });
    }
  };

  const handleView = async (booking: typeof initialBookings[0]) => {
    setSelectedBooking(booking);
    setViewDialogOpen(true);

    // Fetch full booking details (with image data) from the dedicated endpoint
    try {
      const data = await authHelper.get(`${API_BASE_URL}/api/bookings/mine/${booking.id}`);
      if (data?.booking) {
        const b = data.booking;
        setSelectedBooking((prev: any) => ({
          ...prev,
          paymentScreenshotUrl: b.payment_screenshot_url || prev?.paymentScreenshotUrl || null,
          vaccineRecordUrl: b.vaccine_record_url || prev?.vaccineRecordUrl || null,
          medCertUrl: b.med_cert_url || prev?.medCertUrl || null,
          referenceNumber: b.reference_number || prev?.referenceNumber || null,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch booking details:', err);
    }
  };

  const handleExport = () => {
    toast({ title: "Export Started", description: "Booking data is being exported to CSV." });
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.pet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    const matchesService = serviceFilter === "all" || b.service.toLowerCase() === serviceFilter;
    const matchesPayment =
      paymentFilter === "all" ||
      (paymentFilter === "paid" ? b.paymentStatus === "paid" : b.paymentStatus !== "paid");
    return matchesSearch && matchesStatus && matchesService && matchesPayment;
  });

  useEffect(() => {
    let cancelled = false;

    // Clear stale bookings immediately when property changes
    setBookings([]);

    if (propLoading || !selectedPropertyId) return;

    const fetchBookings = async () => {
      try {
        setLoadingBookings(true);
        const data = await authHelper.get(`${API_BASE_URL}/api/bookings/mine/list?property_id=${selectedPropertyId}`);
        if (cancelled) return;
        setBookings((data.bookings || []).map((b: any) => ({
          id: b.id,
          pet: b.pet_name,
          owner: b.owner_name,
          email: b.owner_email || '',
          phone: b.owner_phone || '',
          service: b.service_type,
          checkIn: b.checkin,
          checkOut: b.checkout || '-',
          status: b.status,
          amount: b.total_price ? `₱${Number(b.total_price).toFixed(2)}` : '-',
          paymentStatus: b.payment_status || "unpaid",
          paymentMethod: b.payment_method || null,
          referenceNumber: b.reference_number || null,
          paymentScreenshotUrl: b.payment_screenshot_url || null,
          vaccineRecordUrl: b.vaccine_record_url || null,
          medCertUrl: b.med_cert_url || null,
        })));
      } catch (err) {
        console.error('Failed to load bookings', err);
      } finally {
        if (!cancelled) setLoadingBookings(false);
      }
    };

    fetchBookings();

    return () => { cancelled = true; };
  }, [selectedPropertyId, propLoading]);

  return (
    <AdminLayout title="Bookings" subtitle="Manage all your reservations and appointments">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by pet, owner, or booking ID..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="boarding">Boarding</SelectItem>
            <SelectItem value="grooming">Grooming</SelectItem>
            <SelectItem value="daycare">Daycare</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Pet / Owner</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingBookings ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Loading bookings...
                </TableCell>
              </TableRow>
            ) : filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : filteredBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.id}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{booking.pet}</p>
                    <p className="text-xs text-muted-foreground">{booking.owner}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{booking.phone || '—'}</TableCell>
                <TableCell>{booking.service}</TableCell>
                <TableCell>{booking.checkIn}</TableCell>
                <TableCell>{booking.checkOut}</TableCell>
                <TableCell className="font-medium">{booking.amount}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      booking.status === "confirmed"
                        ? "default"
                        : booking.status === "completed"
                        ? "outline"
                        : booking.status === "pending"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(booking)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {booking.status === "pending" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-success" title="Confirm" onClick={() => handleConfirm(booking.id)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Cancel" onClick={() => handleCancel(booking.id)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {(["confirmed", "checked_in"] as string[]).includes(booking.status) && (
                      <>
                        {booking.paymentStatus !== "paid" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" title="Mark Paid" onClick={() => handleMarkPaid(booking.id)}>
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-success" title="Mark Complete" onClick={() => handleComplete(booking.id)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Cancel" onClick={() => handleCancel(booking.id)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">Showing {filteredBookings.length} of {bookings.length} bookings</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Booking ID: {selectedBooking?.id}</DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pet Name</p>
                  <p className="font-medium">{selectedBooking.pet}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Owner</p>
                  <p className="font-medium">{selectedBooking.owner}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedBooking.email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedBooking.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="font-medium">{selectedBooking.service}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-in</p>
                  <p className="font-medium">{selectedBooking.checkIn}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <p className="font-medium">{selectedBooking.checkOut}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">{selectedBooking.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedBooking.status === "confirmed" ? "default" : selectedBooking.status === "completed" ? "outline" : selectedBooking.status === "pending" ? "secondary" : "destructive"}>
                    {selectedBooking.status}
                  </Badge>
                </div>
              </div>

              {/* Payment Details */}
              {selectedBooking.paymentMethod && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Payment Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <p className="font-medium capitalize">{selectedBooking.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Status</p>
                      <Badge variant={selectedBooking.paymentStatus === "paid" ? "default" : "secondary"} className="mt-1 capitalize">
                        {selectedBooking.paymentStatus || "unpaid"}
                      </Badge>
                    </div>
                    {selectedBooking.referenceNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground">Reference Number</p>
                        <p className="font-medium font-mono text-sm bg-muted/50 px-2 py-1 rounded inline-block">{selectedBooking.referenceNumber}</p>
                      </div>
                    )}
                  </div>
                  {selectedBooking.paymentScreenshotUrl && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">Payment Screenshot / Proof</p>
                      <div
                        className="cursor-pointer inline-block border border-border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                        onClick={() => setImagePreview(selectedBooking.paymentScreenshotUrl)}
                      >
                        <img
                          src={selectedBooking.paymentScreenshotUrl}
                          alt="Payment proof"
                          className="w-40 h-40 object-cover"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Click to enlarge</p>
                    </div>
                  )}
                </div>
              )}

              {/* Documents */}
              {(selectedBooking.vaccineRecordUrl || selectedBooking.medCertUrl) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Pet Documents
                  </h4>
                  {(() => {
                    const vaccineDocs = parseDocumentUrls(selectedBooking.vaccineRecordUrl);
                    const medDocs = parseDocumentUrls(selectedBooking.medCertUrl);
                    return (
                  <div className="flex flex-wrap gap-4">
                    {vaccineDocs.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Vaccine Record</p>
                        <div className="flex flex-wrap gap-3">
                          {vaccineDocs.map((url, idx) => (
                            <div key={`admin-vaccine-${idx}`}>
                              {isImageUrl(url) ? (
                                <div
                                  className="cursor-pointer inline-block border border-border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                                  onClick={() => setImagePreview(url)}
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
                            <div key={`admin-med-${idx}`}>
                              {isImageUrl(url) ? (
                                <div
                                  className="cursor-pointer inline-block border border-border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                                  onClick={() => setImagePreview(url)}
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
                    );
                  })()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedBooking.status === "pending" && (
                  <>
                    <Button className="flex-1" onClick={() => { handleConfirm(selectedBooking.id); setViewDialogOpen(false); }}>
                      Confirm Booking
                    </Button>
                    <Button variant="destructive" onClick={() => { handleCancel(selectedBooking.id); setViewDialogOpen(false); }}>
                      Cancel
                    </Button>
                  </>
                )}
                {(["confirmed", "checked_in"] as string[]).includes(selectedBooking.status) && (
                  <>
                    {selectedBooking.paymentStatus !== "paid" && (
                      <Button variant="outline" onClick={() => { handleMarkPaid(selectedBooking.id); }}>
                        Mark Payment as Paid
                      </Button>
                    )}
                    <Button onClick={() => { handleComplete(selectedBooking.id); setViewDialogOpen(false); }}>
                      Mark Complete
                    </Button>
                    <Button variant="destructive" onClick={() => { handleCancel(selectedBooking.id); setViewDialogOpen(false); }}>
                      Cancel Booking
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
    </AdminLayout>
  );
};

export default AdminBookings;