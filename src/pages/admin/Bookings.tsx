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
import { Search, Download, Eye, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { authHelper } from "@/helpers/authHelper";

const initialBookings: any[] = [];

const AdminBookings = () => {
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<typeof initialBookings[0] | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const { toast } = useToast();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

  const handleConfirm = async (id: string) => {
    try {
      await authHelper.post(`${API_BASE_URL}/api/bookings/${id}/status`, { status: 'confirmed' });
      setBookings((prev) => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));
      toast({ title: 'Booking Confirmed', description: `Booking ${id} has been confirmed.` });
    } catch (err: any) {
      console.error('Confirm failed', err);
      toast({ title: 'Error', description: err?.message || 'Failed to confirm booking', variant: 'destructive' });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await authHelper.post(`${API_BASE_URL}/api/bookings/${id}/status`, { status: 'cancelled' });
      setBookings((prev) => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      toast({ title: 'Booking Cancelled', description: `Booking ${id} has been cancelled.`, variant: 'destructive' });
    } catch (err: any) {
      console.error('Cancel failed', err);
      toast({ title: 'Error', description: err?.message || 'Failed to cancel booking', variant: 'destructive' });
    }
  };

  const handleView = (booking: typeof initialBookings[0]) => {
    setSelectedBooking(booking);
    setViewDialogOpen(true);
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
    return matchesSearch && matchesStatus && matchesService;
  });

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
    const fetchBookings = async () => {
      try {
        const data = await authHelper.get(`${API_BASE_URL}/api/bookings/mine/list`);
        setBookings((data.bookings || []).map((b: any) => ({
          id: b.id,
          pet: b.pet_name,
          owner: b.owner_name,
          email: '',
          service: b.service_type,
          checkIn: b.checkin,
          checkOut: b.checkout || '-',
          status: b.status,
          amount: b.total_price ? `₱${Number(b.total_price).toFixed(2)}` : '-',
        })));
      } catch (err) {
        console.error('Failed to load bookings', err);
      }
    };

    fetchBookings();
  }, []);

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
              <TableHead>Service</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.id}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{booking.pet}</p>
                    <p className="text-xs text-muted-foreground">{booking.owner}</p>
                  </div>
                </TableCell>
                <TableCell>{booking.service}</TableCell>
                <TableCell>{booking.checkIn}</TableCell>
                <TableCell>{booking.checkOut}</TableCell>
                <TableCell className="font-medium">{booking.amount}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      booking.status === "confirmed"
                        ? "default"
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => handleConfirm(booking.id)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleCancel(booking.id)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Booking ID: {selectedBooking?.id}</DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
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
                  <p className="font-medium">{selectedBooking.email}</p>
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
                  <Badge variant={selectedBooking.status === "confirmed" ? "default" : selectedBooking.status === "pending" ? "secondary" : "destructive"}>
                    {selectedBooking.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
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
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBookings;
