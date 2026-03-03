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
import {
  Search, Download, MoreHorizontal, ShieldCheck, Loader2, RefreshCw,
  Users, UserCheck, Building2, Shield, Ban, Trash2, Copy, CheckCheck,
  ChevronLeft, ChevronRight, AlertTriangle, ArrowUpDown, Calendar, Mail,
  PawPrint, Home, CreditCard, AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/services/authApi";

type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  created_at: string;
  banned_until: string | null;
  email_confirmed_at: string | null;
};

const ROLES = ["customer", "proprietor", "admin", "super_admin"] as const;
const PAGE_SIZE = 10;

type SortField = "name" | "email" | "role" | "joined";
type SortDir = "asc" | "desc";

const isBanned = (u: User) =>
  !!u.banned_until && u.banned_until !== "none" && new Date(u.banned_until) > new Date();

const roleBadgeClass = (role: string) => {
  switch (role) {
    case "super_admin": return "border-[#ffa31a] text-[#ffa31a]";
    case "admin":       return "border-[#ffa31a]/50 text-[#ffa31a]/80";
    case "proprietor":  return "border-[#808080] text-[#808080]";
    default:            return "border-[#808080]/40 text-[#808080]";
  }
};

const roleLabel = (role: string) =>
  role === "super_admin" ? "Super Admin" : role.charAt(0).toUpperCase() + role.slice(1);

const SuperAdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("joined");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Promote dialog
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [promoting, setPromoting] = useState(false);

  // View dialog
  const [viewUserDialogOpen, setViewUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Suspend dialog
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);
  const [suspending, setSuspending] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await authApi.getUsers();
      setUsers(result?.users ?? []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load users.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // --- Stats ---
  const suspendedCount = users.filter(u => isBanned(u)).length;
  const unverifiedCount = users.filter(u => !u.email_confirmed_at && !isBanned(u)).length;

  const stats = [
    { label: "Total Users",  value: users.length,                                                          icon: Users,     accent: "text-[#ffa31a]",   bg: "bg-[#ffa31a]/10",   border: "border-[#ffa31a]/20" },
    { label: "Customers",    value: users.filter(u => u.role === "customer").length,                       icon: UserCheck, accent: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
    { label: "Proprietors",  value: users.filter(u => u.role === "proprietor").length,                     icon: Building2, accent: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/20" },
    { label: "Staff",        value: users.filter(u => u.role === "admin" || u.role === "super_admin").length, icon: Shield, accent: "text-[#ffa31a]",   bg: "bg-[#ffa31a]/10",   border: "border-[#ffa31a]/20" },
    { label: "Suspended",    value: suspendedCount,                                                        icon: Ban,       accent: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/20" },
    { label: "Unverified",   value: unverifiedCount,                                                       icon: AlertCircle, accent: "text-amber-400", bg: "bg-amber-400/10",  border: "border-amber-400/20" },
  ];

  // --- Filtering + sorting + pagination ---
  const filteredUsers = users.filter(u => {
    const name = `${u.first_name} ${u.last_name}`.toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    let matchesStatus = true;
    if (statusFilter === "active") matchesStatus = !!u.email_confirmed_at && !isBanned(u);
    else if (statusFilter === "suspended") matchesStatus = isBanned(u);
    else if (statusFilter === "unverified") matchesStatus = !u.email_confirmed_at && !isBanned(u);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Sort
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "name":
        cmp = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        break;
      case "email":
        cmp = a.email.localeCompare(b.email);
        break;
      case "role":
        cmp = a.role.localeCompare(b.role);
        break;
      case "joined":
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE));
  const pagedUsers = sortedUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearchQuery(v); setPage(1); };
  const handleRoleFilter = (v: string) => { setRoleFilter(v); setPage(1); };
  const handleStatusFilter = (v: string) => { setStatusFilter(v); setPage(1); };
  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  // --- Copy email ---
  const copyEmail = (user: User) => {
    navigator.clipboard.writeText(user.email);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied", description: user.email });
  };

  // --- Promote ---
  const openPromoteDialog = (user: User) => {
    setPromoteTarget(user);
    setSelectedRole(user.role);
    setPromoteDialogOpen(true);
  };

  const handlePromote = async () => {
    if (!promoteTarget || !selectedRole) return;
    if (selectedRole === promoteTarget.role) {
      toast({ title: "No change", description: "That is already the user's current role." });
      return;
    }
    setPromoting(true);
    try {
      await authApi.promoteUser({ email: promoteTarget.email, role: selectedRole });
      toast({
        title: "Role Updated",
        description: `${promoteTarget.first_name} ${promoteTarget.last_name} is now a ${roleLabel(selectedRole)}.`,
      });
      setPromoteDialogOpen(false);
      setPromoteTarget(null);
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update role.", variant: "destructive" });
    } finally {
      setPromoting(false);
    }
  };

  // --- Suspend / Reinstate ---
  const openSuspendDialog = (user: User) => {
    setSuspendTarget(user);
    setSuspendDialogOpen(true);
  };

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    const willBan = !isBanned(suspendTarget);
    setSuspending(true);
    try {
      await authApi.banUser(suspendTarget.id, willBan);
      toast({
        title: willBan ? "User Suspended" : "User Reinstated",
        description: `${suspendTarget.first_name} ${suspendTarget.last_name} has been ${willBan ? "suspended" : "reinstated"}.`,
      });
      setSuspendDialogOpen(false);
      setSuspendTarget(null);
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Action failed.", variant: "destructive" });
    } finally {
      setSuspending(false);
    }
  };

  // --- Delete ---
  const openDeleteDialog = (user: User) => {
    setDeleteTarget(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await authApi.deleteUser(deleteTarget.id);
      toast({ title: "User Deleted", description: `${deleteTarget.first_name} ${deleteTarget.last_name} has been permanently deleted.` });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete user.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  // --- Real CSV Export ---
  const handleExport = () => {
    const rows = [
      ["Name", "Email", "Role", "Status", "Email Verified", "Joined"],
      ...sortedUsers.map(u => [
        `${u.first_name} ${u.last_name}`,
        u.email,
        roleLabel(u.role),
        isBanned(u) ? "Suspended" : u.email_confirmed_at ? "Active" : "Unverified",
        u.email_confirmed_at ? new Date(u.email_confirmed_at).toLocaleDateString() : "No",
        u.created_at ? new Date(u.created_at).toLocaleDateString() : "",
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pawstay-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export Complete", description: `${sortedUsers.length} users exported to CSV.` });
  };

  return (
    <SuperAdminLayout title="Users" subtitle="Manage platform users and property owners">

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="sa-card sa-slide-in flex items-center gap-4 p-4 rounded-xl bg-[#292929] border border-white/[0.07]">
            <div className={`p-2.5 rounded-lg ${s.bg} border ${s.border} shrink-0`}>
              <s.icon className={`h-5 w-5 ${s.accent}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white leading-none">{loading ? "—" : s.value}</p>
              <p className="text-xs text-[#808080] mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-5 sa-slide-in" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#808080]" />
          <Input
            placeholder="Search by name or email…"
            className="pl-10 bg-[#292929] border-white/10 text-white placeholder:text-[#808080] focus-visible:ring-[#ffa31a]/50"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={handleRoleFilter}>
          <SelectTrigger className="w-full md:w-44 bg-[#292929] border-white/10 text-white">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent className="bg-[#292929] border-white/10 text-white">
            <SelectItem value="all" className="text-white focus:bg-white/[0.06] focus:text-white">All Roles</SelectItem>
            <SelectItem value="customer" className="text-white focus:bg-white/[0.06] focus:text-white">Customers</SelectItem>
            <SelectItem value="proprietor" className="text-white focus:bg-white/[0.06] focus:text-white">Proprietors</SelectItem>
            <SelectItem value="admin" className="text-white focus:bg-white/[0.06] focus:text-white">Admins</SelectItem>
            <SelectItem value="super_admin" className="text-white focus:bg-white/[0.06] focus:text-white">Super Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full md:w-40 bg-[#292929] border-white/10 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#292929] border-white/10 text-white">
            <SelectItem value="all" className="text-white focus:bg-white/[0.06] focus:text-white">All Statuses</SelectItem>
            <SelectItem value="active" className="text-white focus:bg-white/[0.06] focus:text-white">Active</SelectItem>
            <SelectItem value="suspended" className="text-white focus:bg-white/[0.06] focus:text-white">Suspended</SelectItem>
            <SelectItem value="unverified" className="text-white focus:bg-white/[0.06] focus:text-white">Unverified</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2 border-white/10 text-[#808080] hover:bg-white/5 hover:text-white" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button variant="outline" className="gap-2 border-white/10 text-[#808080] hover:bg-white/5 hover:text-white" onClick={handleExport} disabled={loading || sortedUsers.length === 0}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="bg-[#292929] rounded-xl border border-white/10 overflow-hidden sa-slide-in" style={{ animationDelay: '150ms' }}>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-[#808080] font-semibold uppercase text-xs tracking-wider cursor-pointer select-none" onClick={() => toggleSort("name")}>
                <span className="flex items-center gap-1">User <ArrowUpDown className={`h-3 w-3 ${sortField === "name" ? "text-[#ffa31a]" : "text-[#808080]/50"}`} /></span>
              </TableHead>
              <TableHead className="text-[#808080] font-semibold uppercase text-xs tracking-wider cursor-pointer select-none" onClick={() => toggleSort("role")}>
                <span className="flex items-center gap-1">Role <ArrowUpDown className={`h-3 w-3 ${sortField === "role" ? "text-[#ffa31a]" : "text-[#808080]/50"}`} /></span>
              </TableHead>
              <TableHead className="text-[#808080] font-semibold uppercase text-xs tracking-wider hidden md:table-cell">Status</TableHead>
              <TableHead className="text-[#808080] font-semibold uppercase text-xs tracking-wider hidden lg:table-cell cursor-pointer select-none" onClick={() => toggleSort("joined")}>
                <span className="flex items-center gap-1">Joined <ArrowUpDown className={`h-3 w-3 ${sortField === "joined" ? "text-[#ffa31a]" : "text-[#808080]/50"}`} /></span>
              </TableHead>
              <TableHead className="text-[#808080] font-semibold uppercase text-xs tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-0">
                  <div className="py-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-2 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-white/[0.06]" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-32 bg-white/[0.06] rounded" />
                          <div className="h-2 w-48 bg-white/[0.04] rounded" />
                        </div>
                        <div className="h-5 w-16 bg-white/[0.06] rounded-full" />
                      </div>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ) : pagedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-[#808080]">
                  <Users className="h-8 w-8 mx-auto mb-2 text-[#808080]/40" />
                  <p className="text-sm">No users found matching your filters.</p>
                  <p className="text-xs text-[#808080]/60 mt-1">Try adjusting your search or filter criteria.</p>
                </TableCell>
              </TableRow>
            ) : (
              pagedUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className={`border-white/[0.06] hover:bg-white/[0.04] transition-colors ${isBanned(user) ? "opacity-60" : ""}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${isBanned(user) ? "bg-red-500/10 border border-red-500/20" : "bg-[#ffa31a]/10 border border-[#ffa31a]/20"}`}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className={`font-bold text-sm ${isBanned(user) ? "text-red-400" : "text-[#ffa31a]"}`}>
                            {(user.first_name?.[0] ?? user.email[0]).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-[#808080]">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleBadgeClass(user.role)}>
                      {roleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {isBanned(user) ? (
                      <Badge variant="outline" className="text-red-400 border-red-400/30 text-[11px]">Suspended</Badge>
                    ) : user.email_confirmed_at ? (
                      <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[11px]">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[#808080] border-[#808080]/30 text-[11px]">Unverified</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-[#808080] hidden lg:table-cell text-sm">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#808080] hover:text-white hover:bg-white/5">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1b1b1b] border-white/10 min-w-[160px] text-white">
                        <DropdownMenuItem
                          className="text-white/80 focus:bg-white/[0.06] focus:text-white cursor-pointer"
                          onClick={() => { setSelectedUser(user); setViewUserDialogOpen(true); }}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-white/80 focus:bg-white/[0.06] focus:text-white cursor-pointer gap-2"
                          onClick={() => copyEmail(user)}
                        >
                          {copiedId === user.id
                            ? <CheckCheck className="h-4 w-4 text-emerald-400" />
                            : <Copy className="h-4 w-4" />}
                          Copy Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/[0.06]" />
                        <DropdownMenuItem
                          className="text-[#ffa31a] focus:bg-[#ffa31a]/10 focus:text-[#ffa31a] gap-2 cursor-pointer"
                          onClick={() => openPromoteDialog(user)}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={`gap-2 cursor-pointer ${isBanned(user)
                            ? "text-emerald-400 focus:bg-emerald-400/10 focus:text-emerald-400"
                            : "text-amber-400 focus:bg-amber-400/10 focus:text-amber-400"}`}
                          onClick={() => openSuspendDialog(user)}
                        >
                          <Ban className="h-4 w-4" />
                          {isBanned(user) ? "Reinstate" : "Suspend"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/[0.06]" />
                        <DropdownMenuItem
                          className="text-red-400 focus:bg-red-400/10 focus:text-red-400 gap-2 cursor-pointer"
                          onClick={() => openDeleteDialog(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && sortedUsers.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[#808080]">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, sortedUsers.length)}–{Math.min(page * PAGE_SIZE, sortedUsers.length)} of {sortedUsers.length} users
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 text-[#808080] hover:text-white hover:bg-white/5 disabled:opacity-30"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === "number" && (n as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(n);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "…" ? (
                  <span key={`dots-${idx}`} className="w-8 text-center text-[#808080] text-sm">…</span>
                ) : (
                  <Button
                    key={item}
                    variant="ghost" size="icon"
                    className={`h-8 w-8 text-sm ${page === item ? "bg-[#ffa31a]/10 text-[#ffa31a] border border-[#ffa31a]/20" : "text-[#808080] hover:text-white hover:bg-white/5"}`}
                    onClick={() => setPage(item as number)}
                  >
                    {item}
                  </Button>
                )
              )}
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 text-[#808080] hover:text-white hover:bg-white/5 disabled:opacity-30"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Change Role Dialog ── */}
      <Dialog open={promoteDialogOpen} onOpenChange={(open) => { if (!promoting) setPromoteDialogOpen(open); }}>
        <DialogContent className="bg-[#1b1b1b] border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#ffa31a]" />
              Change Role
            </DialogTitle>
            <DialogDescription className="text-[#808080]">
              Update the role for{" "}
              <span className="text-white font-medium">{promoteTarget?.first_name} {promoteTarget?.last_name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-white/80 text-sm">New Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="bg-[#292929] border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#292929] border-white/10 text-white">
                  {ROLES.map(r => <SelectItem key={r} value={r} className="text-white focus:bg-white/[0.06] focus:text-white">{roleLabel(r)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedRole === "super_admin" && (
              <p className="text-xs text-[#ffa31a] bg-[#ffa31a]/10 border border-[#ffa31a]/25 rounded-lg px-3 py-2">
                ⚠ Granting Super Admin gives full platform access. Make sure this is intentional.
              </p>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setPromoteDialogOpen(false)} className="border-white/10 text-[#808080] hover:text-white hover:bg-white/5" disabled={promoting}>
                Cancel
              </Button>
              <Button onClick={handlePromote} className="bg-[#ffa31a] hover:bg-[#ffa31a]/90 text-[#1b1b1b] font-semibold gap-2" disabled={promoting || selectedRole === promoteTarget?.role}>
                {promoting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Suspend / Reinstate Dialog ── */}
      <Dialog open={suspendDialogOpen} onOpenChange={(open) => { if (!suspending) setSuspendDialogOpen(open); }}>
        <DialogContent className="bg-[#1b1b1b] border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Ban className={`h-5 w-5 ${suspendTarget && isBanned(suspendTarget) ? "text-emerald-400" : "text-amber-400"}`} />
              {suspendTarget && isBanned(suspendTarget) ? "Reinstate User" : "Suspend User"}
            </DialogTitle>
            <DialogDescription className="text-[#808080]">
              {suspendTarget && isBanned(suspendTarget)
                ? `Reinstating ${suspendTarget.first_name} ${suspendTarget.last_name} will restore their access to the platform.`
                : `Suspending ${suspendTarget?.first_name} ${suspendTarget?.last_name} will block their access until reinstated.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)} className="border-white/10 text-[#808080] hover:text-white hover:bg-white/5" disabled={suspending}>
              Cancel
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={suspending}
              className={`gap-2 font-semibold ${suspendTarget && isBanned(suspendTarget)
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-amber-500 hover:bg-amber-600 text-[#1b1b1b]"}`}
            >
              {suspending && <Loader2 className="h-4 w-4 animate-spin" />}
              {suspendTarget && isBanned(suspendTarget) ? "Yes, Reinstate" : "Yes, Suspend"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { if (!deleting) setDeleteDialogOpen(open); }}>
        <DialogContent className="bg-[#1b1b1b] border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Delete User
            </DialogTitle>
            <DialogDescription className="text-[#808080]">
              This will permanently delete{" "}
              <span className="text-white font-medium">{deleteTarget?.first_name} {deleteTarget?.last_name}</span>{" "}
              and all their data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-white/10 text-[#808080] hover:text-white hover:bg-white/5" disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="gap-2" disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── View User Dialog ── */}
      <Dialog open={viewUserDialogOpen} onOpenChange={setViewUserDialogOpen}>
        <DialogContent className="bg-[#1b1b1b] border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">User Details</DialogTitle>
            <DialogDescription className="text-[#808080]">Full profile overview and quick actions</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-5">
              {/* Avatar & name */}
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden ${isBanned(selectedUser) ? "bg-red-500/10 border border-red-500/20" : "bg-[#ffa31a]/10 border border-[#ffa31a]/20"}`}>
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className={`text-2xl font-bold ${isBanned(selectedUser) ? "text-red-400" : "text-[#ffa31a]"}`}>
                      {(selectedUser.first_name?.[0] ?? selectedUser.email[0]).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-white">{selectedUser.first_name} {selectedUser.last_name}</p>
                  <p className="text-sm text-[#808080] flex items-center gap-1 truncate"><Mail className="h-3 w-3 shrink-0" />{selectedUser.email}</p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.07]">
                <div>
                  <p className="text-xs text-[#808080] uppercase tracking-wider mb-1">Role</p>
                  <Badge variant="outline" className={roleBadgeClass(selectedUser.role)}>{roleLabel(selectedUser.role)}</Badge>
                </div>
                <div>
                  <p className="text-xs text-[#808080] uppercase tracking-wider mb-1">Status</p>
                  {isBanned(selectedUser)
                    ? <Badge variant="outline" className="text-red-400 border-red-400/30">Suspended</Badge>
                    : selectedUser.email_confirmed_at
                      ? <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">Active</Badge>
                      : <Badge variant="outline" className="text-[#808080] border-[#808080]/30">Unverified</Badge>
                  }
                </div>
                <div>
                  <p className="text-xs text-[#808080] uppercase tracking-wider mb-1">Email Verified</p>
                  <p className="text-white text-sm">
                    {selectedUser.email_confirmed_at
                      ? new Date(selectedUser.email_confirmed_at).toLocaleDateString()
                      : "Not verified"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#808080] uppercase tracking-wider mb-1">Joined</p>
                  <p className="text-white text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#808080]" />
                    {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#808080] uppercase tracking-wider mb-1">User ID</p>
                  <p className="text-white text-xs font-mono truncate">{selectedUser.id}</p>
                </div>
                <div>
                  <p className="text-xs text-[#808080] uppercase tracking-wider mb-1">Phone</p>
                  <p className="text-white text-sm">{selectedUser.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-[#808080] uppercase tracking-wider mb-1">Account Age</p>
                  <p className="text-white text-sm">
                    {selectedUser.created_at
                      ? (() => {
                          const days = Math.floor((Date.now() - new Date(selectedUser.created_at).getTime()) / 86400000);
                          if (days < 1) return "Today";
                          if (days < 30) return `${days} day${days > 1 ? "s" : ""}`;
                          const months = Math.floor(days / 30);
                          return `${months} month${months > 1 ? "s" : ""}`;
                        })()
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Address (full width) */}
              {selectedUser.address && (
                <div className="pt-4 border-t border-white/[0.07]">
                  <p className="text-xs text-[#808080] uppercase tracking-wider mb-1">Address</p>
                  <p className="text-white text-sm flex items-center gap-1">
                    <Home className="h-3 w-3 text-[#808080] shrink-0" />{selectedUser.address}
                  </p>
                </div>
              )}

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.07]">
                <Button variant="outline" onClick={() => copyEmail(selectedUser)} className="border-white/10 text-[#808080] hover:text-white hover:bg-white/5 gap-2">
                  <Copy className="h-4 w-4" />
                  Copy Email
                </Button>
                <Button
                  className="bg-[#ffa31a] hover:bg-[#ffa31a]/90 text-[#1b1b1b] font-semibold gap-2"
                  onClick={() => { setViewUserDialogOpen(false); openPromoteDialog(selectedUser); }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Change Role
                </Button>
                <Button
                  variant="outline"
                  className={`gap-2 border-white/10 ${isBanned(selectedUser) ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10" : "text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"}`}
                  onClick={() => { setViewUserDialogOpen(false); openSuspendDialog(selectedUser); }}
                >
                  <Ban className="h-4 w-4" />
                  {isBanned(selectedUser) ? "Reinstate" : "Suspend"}
                </Button>
                <Button variant="outline" onClick={() => setViewUserDialogOpen(false)} className="border-white/10 text-[#808080] hover:text-white hover:bg-white/5 ml-auto">
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
