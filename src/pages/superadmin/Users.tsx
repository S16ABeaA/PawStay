import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
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
import { Search, Download, MoreHorizontal, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const users = [
  { id: 1, name: "John Smith", email: "john@email.com", role: "customer", status: "active", joined: "2025-12-15", bookings: 8 },
  { id: 2, name: "Sarah Johnson", email: "sarah@hotel.com", role: "admin", status: "active", joined: "2025-11-20", bookings: 0 },
  { id: 3, name: "Happy Paws Hotel", email: "contact@happypaws.com", role: "admin", status: "active", joined: "2025-10-05", bookings: 0 },
  { id: 4, name: "Mike Brown", email: "mike@email.com", role: "customer", status: "inactive", joined: "2025-09-18", bookings: 3 },
  { id: 5, name: "Pet Paradise", email: "info@petparadise.com", role: "admin", status: "pending", joined: "2026-01-28", bookings: 0 },
  { id: 6, name: "Emily Davis", email: "emily@email.com", role: "customer", status: "active", joined: "2025-08-22", bookings: 12 },
  { id: 7, name: "Alex Wilson", email: "alex@email.com", role: "customer", status: "active", joined: "2025-07-10", bookings: 5 },
];

const SuperAdminUsers = () => {
  return (
    <SuperAdminLayout title="Users" subtitle="Manage platform users and property owners">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search users..." 
            className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full md:w-40 bg-slate-900 border-slate-700 text-white">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="customer">Customers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-full md:w-40 bg-slate-900 border-slate-700 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-slate-800/50">
              <TableHead className="text-slate-400">User</TableHead>
              <TableHead className="text-slate-400">Role</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Joined</TableHead>
              <TableHead className="text-slate-400">Bookings</TableHead>
              <TableHead className="text-slate-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center">
                      <span className="font-semibold text-violet-400">{user.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      user.role === "admin"
                        ? "border-violet-500 text-violet-400"
                        : "border-slate-600 text-slate-400"
                    }
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      user.status === "active"
                        ? "bg-emerald-600/20 text-emerald-400"
                        : user.status === "pending"
                        ? "bg-amber-600/20 text-amber-400"
                        : "bg-slate-600/20 text-slate-400"
                    }
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-300">{user.joined}</TableCell>
                <TableCell className="text-slate-300">{user.bookings}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                      <DropdownMenuItem className="text-slate-300 focus:bg-slate-800">View Details</DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-300 focus:bg-slate-800">Edit User</DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-300 focus:bg-slate-800">
                        {user.status === "active" ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 focus:bg-slate-800">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-slate-400">Showing 1-7 of 52,481 users</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled className="border-slate-700 text-slate-500">
            Previous
          </Button>
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Next
          </Button>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminUsers;
