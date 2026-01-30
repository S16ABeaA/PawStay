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
import { Search, Filter, Download, Eye, CheckCircle, XCircle } from "lucide-react";

const bookings = [
  { id: "BK001", pet: "Max", owner: "John Smith", email: "john@email.com", service: "Boarding", checkIn: "2026-01-30", checkOut: "2026-02-02", status: "confirmed", amount: "$180" },
  { id: "BK002", pet: "Bella", owner: "Sarah Johnson", email: "sarah@email.com", service: "Grooming", checkIn: "2026-01-30", checkOut: "-", status: "pending", amount: "$65" },
  { id: "BK003", pet: "Charlie", owner: "Mike Brown", email: "mike@email.com", service: "Boarding", checkIn: "2026-01-31", checkOut: "2026-02-05", status: "confirmed", amount: "$300" },
  { id: "BK004", pet: "Luna", owner: "Emily Davis", email: "emily@email.com", service: "Daycare", checkIn: "2026-01-31", checkOut: "-", status: "pending", amount: "$45" },
  { id: "BK005", pet: "Cooper", owner: "Alex Wilson", email: "alex@email.com", service: "Boarding", checkIn: "2026-02-01", checkOut: "2026-02-03", status: "confirmed", amount: "$120" },
  { id: "BK006", pet: "Bailey", owner: "Lisa Chen", email: "lisa@email.com", service: "Grooming", checkIn: "2026-02-01", checkOut: "-", status: "cancelled", amount: "$85" },
  { id: "BK007", pet: "Rocky", owner: "Tom Harris", email: "tom@email.com", service: "Boarding", checkIn: "2026-02-02", checkOut: "2026-02-07", status: "confirmed", amount: "$375" },
];

const AdminBookings = () => {
  return (
    <AdminLayout title="Bookings" subtitle="Manage all your reservations and appointments">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by pet, owner, or booking ID..." className="pl-10" />
        </div>
        <Select defaultValue="all">
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
        <Select defaultValue="all">
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
        <Button variant="outline" className="gap-2">
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
            {bookings.map((booking) => (
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
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {booking.status === "pending" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-success">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
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
        <p className="text-sm text-muted-foreground">Showing 1-7 of 156 bookings</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;
