import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Search, Download, MoreHorizontal, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const initialUsers = [
  { id: 1, name: "John Smith", email: "john@email.com", role: "customer", status: "active", joined: "2025-12-15", bookings: 8 },
  { id: 2, name: "Sarah Johnson", email: "sarah@hotel.com", role: "admin", status: "active", joined: "2025-11-20", bookings: 0 },
  { id: 3, name: "Happy Paws Hotel", email: "contact@happypaws.com", role: "admin", status: "active", joined: "2025-10-05", bookings: 0 },
  { id: 4, name: "Mike Brown", email: "mike@email.com", role: "customer", status: "inactive", joined: "2025-09-18", bookings: 3 },
  { id: 5, name: "Pet Paradise", email: "info@petparadise.com", role: "admin", status: "pending", joined: "2026-01-28", bookings: 0 },
  { id: 6, name: "Emily Davis", email: "emily@email.com", role: "customer", status: "active", joined: "2025-08-22", bookings: 12 },
  { id: 7, name: "Alex Wilson", email: "alex@email.com", role: "customer", status: "active", joined: "2025-07-10", bookings: 5 },
];

const SuperAdminUsers = () => {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [viewUserDialogOpen, setViewUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof initialUsers[0] | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "customer" });
  const { toast } = useToast();

  const toggleUserStatus = (id: number) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const newStatus = u.status === "active" ? "inactive" : "active";
        toast({ title: `User ${newStatus === "active" ? "Activated" : "Deactivated"}`, description: `${u.name} has been ${newStatus === "active" ? "activated" : "deactivated"}.` });
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  const deleteUser = (id: number) => {
    const user = users.find(u => u.id === id);
    setUsers(users.filter(u => u.id !== id));
    toast({ title: "User Deleted", description: `${user?.name} has been removed.`, variant: "destructive" });
  };

  const handleAddUser = () => {
    if (newUser.name && newUser.email) {
      const user = {
        id: users.length + 1,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: "active",
        joined: new Date().toISOString().split('T')[0],
        bookings: 0,
      };
      setUsers([...users, user]);
      toast({ title: "User Added", description: `${user.name} has been added successfully.` });
      setAddUserDialogOpen(false);
      setNewUser({ name: "", email: "", role: "customer" });
    }
  };

  const handleExport = () => {
    toast({ title: "Export Started", description: "User data is being exported to CSV." });
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <SuperAdminLayout title="Users" subtitle="Manage platform users and property owners">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search users..." 
            className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-40 bg-slate-900 border-slate-700 text-white">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="customer">Customers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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
        <Button variant="outline" className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button className="gap-2 bg-violet-600 hover:bg-violet-700" onClick={() => setAddUserDialogOpen(true)}>
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
            {filteredUsers.map((user) => (
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
                      <DropdownMenuItem className="text-slate-300 focus:bg-slate-800" onClick={() => { setSelectedUser(user); setViewUserDialogOpen(true); }}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-300 focus:bg-slate-800" onClick={() => toggleUserStatus(user.id)}>
                        {user.status === "active" ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 focus:bg-slate-800" onClick={() => deleteUser(user.id)}>
                        Delete
                      </DropdownMenuItem>
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
        <p className="text-sm text-slate-400">Showing {filteredUsers.length} of {users.length} users</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled className="border-slate-700 text-slate-500">
            Previous
          </Button>
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Next
          </Button>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add New User</DialogTitle>
            <DialogDescription className="text-slate-400">Create a new user account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Name</Label>
              <Input 
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input 
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="Enter email"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Role</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setAddUserDialogOpen(false)} className="border-slate-600 text-slate-300">
                Cancel
              </Button>
              <Button onClick={handleAddUser} className="bg-violet-600 hover:bg-violet-700">
                Add User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={viewUserDialogOpen} onOpenChange={setViewUserDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-violet-600/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-violet-400">{selectedUser.name[0]}</span>
                </div>
                <div>
                  <p className="text-lg font-medium text-white">{selectedUser.name}</p>
                  <p className="text-slate-400">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <p className="text-sm text-slate-500">Role</p>
                  <p className="text-white capitalize">{selectedUser.role}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <p className="text-white capitalize">{selectedUser.status}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Joined</p>
                  <p className="text-white">{selectedUser.joined}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Bookings</p>
                  <p className="text-white">{selectedUser.bookings}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewUserDialogOpen(false)} className="border-slate-600 text-slate-300">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
};

export default SuperAdminUsers;
