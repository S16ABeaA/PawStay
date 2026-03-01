import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  MapPin,
  Star,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  PauseCircle,
  RefreshCw,
  Building2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Users,
  Download,
  ArrowUpDown,
  Scissors,
  Stethoscope,
  FileText,
  Shield,
  DollarSign,
  Image,
  Calendar,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { adminApi, AdminProperty, PropertyStatsResponse } from "@/services/adminApi";

const LIMIT = 10;

type SortOption = "newest" | "oldest" | "name_asc" | "name_desc" | "rating_desc" | "bookings_desc" | "revenue_desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name A → Z" },
  { value: "name_desc", label: "Name Z → A" },
  { value: "rating_desc", label: "Highest rating" },
  { value: "bookings_desc", label: "Most bookings" },
  { value: "revenue_desc", label: "Highest revenue" },
];

const TYPE_LABELS: Record<string, string> = {
  hotel: "Boarding",
  grooming: "Grooming",
  veterinary: "Veterinary",
};

const typeIcon = (t: string) => {
  switch (t) {
    case "hotel": return <Building2 className="h-3.5 w-3.5" />;
    case "grooming": return <Scissors className="h-3.5 w-3.5" />;
    case "veterinary": return <Stethoscope className="h-3.5 w-3.5" />;
    default: return null;
  }
};

const statusBadge = (status: string) => {
  switch (status) {
    case "approved": return "bg-emerald-600/20 text-emerald-400 border-emerald-600/30";
    case "pending":  return "bg-amber-600/20 text-amber-400 border-amber-600/30";
    case "rejected": return "bg-red-600/20 text-red-400 border-red-600/30";
    case "suspended": return "bg-orange-600/20 text-orange-400 border-orange-600/30";
    default: return "bg-white/10 text-white/60";
  }
};

const SuperAdminProperties = () => {
  const { toast } = useToast();

  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [stats, setStats] = useState<PropertyStatsResponse>({ pending: 0, approved: 0, rejected: 0, suspended: 0, all: 0 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<AdminProperty | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<AdminProperty | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminProperty | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => { setPage(1); }, [activeTab, debouncedSearch, typeFilter]);

  // --- Client-side type filter + sort ---
  const displayProperties = (() => {
    let list = [...properties];
    // Type filter
    if (typeFilter !== "all") {
      list = list.filter(p => p.property_type?.includes(typeFilter));
    }
    // Sort
    list.sort((a, b) => {
      switch (sortOption) {
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name_asc": return a.name.localeCompare(b.name);
        case "name_desc": return b.name.localeCompare(a.name);
        case "rating_desc": return (b.rating ?? 0) - (a.rating ?? 0);
        case "bookings_desc": return (b.booking_count ?? 0) - (a.booking_count ?? 0);
        case "revenue_desc": return (b.total_revenue ?? 0) - (a.total_revenue ?? 0);
        case "newest":
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return list;
  })();

  // --- CSV Export ---
  const handleExportCSV = () => {
    const rows = [
      ["Name", "Status", "Type", "City", "Owner", "Owner Email", "Capacity", "Rating", "Bookings", "Revenue", "Submitted"],
      ...displayProperties.map(p => [
        p.name,
        p.status,
        p.property_type?.join(", ") ?? "",
        p.city ?? "",
        p.owner?.name ?? "",
        p.owner?.email ?? "",
        String(p.capacity ?? ""),
        p.rating != null ? Number(p.rating).toFixed(1) : "",
        String(p.booking_count ?? 0),
        String(p.total_revenue ?? 0),
        new Date(p.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pawstay-properties-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export Complete", description: `${displayProperties.length} properties exported.` });
  };

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getProperties({
        status: activeTab === "all" ? undefined : activeTab,
        search: debouncedSearch || undefined,
        page,
        limit: LIMIT,
      });
      setProperties(res.properties);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      toast({ title: "Error", description: err?.error ?? "Failed to load properties.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, page, toast]);

  const fetchStats = useCallback(async () => {
    try { setStats(await adminApi.getPropertyStats()); } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleApprove = async (property: AdminProperty) => {
    try {
      const res = await adminApi.updatePropertyStatus(property.id, { status: "approved" });
      toast({ title: "Property Approved", description: res.message });
      fetchProperties(); fetchStats();
      if (viewDialogOpen && selectedProperty?.id === property.id) setViewDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.error ?? "Failed to approve.", variant: "destructive" });
    }
  };

  const openRejectDialog = (property: AdminProperty) => {
    setRejectTarget(property); setRejectReason(""); setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      const res = await adminApi.updatePropertyStatus(rejectTarget.id, {
        status: "rejected",
        rejection_reason: rejectReason || "Does not meet requirements.",
      });
      toast({ title: "Property Rejected", description: res.message, variant: "destructive" });
      setRejectDialogOpen(false);
      fetchProperties(); fetchStats();
      if (viewDialogOpen && selectedProperty?.id === rejectTarget.id) setViewDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.error ?? "Failed to reject.", variant: "destructive" });
    }
  };

  const handleSuspend = async (property: AdminProperty) => {
    try {
      const res = await adminApi.updatePropertyStatus(property.id, { status: "suspended" });
      toast({ title: "Property Suspended", description: res.message });
      fetchProperties(); fetchStats();
    } catch (err: any) {
      toast({ title: "Error", description: err?.error ?? "Failed to suspend.", variant: "destructive" });
    }
  };

  const handleReinstate = async (property: AdminProperty) => {
    try {
      const res = await adminApi.updatePropertyStatus(property.id, { status: "approved" });
      toast({ title: "Property Reinstated", description: res.message });
      fetchProperties(); fetchStats();
    } catch (err: any) {
      toast({ title: "Error", description: err?.error ?? "Failed to reinstate.", variant: "destructive" });
    }
  };

  const openDeleteDialog = (property: AdminProperty) => { setDeleteTarget(property); setDeleteDialogOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await adminApi.deleteProperty(deleteTarget.id);
      toast({ title: "Property Deleted", description: res.message });
      setDeleteDialogOpen(false);
      fetchProperties(); fetchStats();
    } catch (err: any) {
      toast({ title: "Error", description: err?.error ?? "Failed to delete.", variant: "destructive" });
    }
  };

  const handleView = async (property: AdminProperty) => {
    setSelectedProperty(property); setViewDialogOpen(true);
    setDetailLoading(true); setDetail(null);
    try { setDetail(await adminApi.getProperty(property.id)); } catch { /* show basic info */ }
    finally { setDetailLoading(false); }
  };

  const PropertyCard = ({ property }: { property: AdminProperty }) => (
    <Card className="bg-[#292929] border-white/[0.07] sa-card">
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row gap-4">
          {property.cover_image ? (
            <img
              src={property.cover_image}
              alt={property.name}
              className="w-full md:w-40 h-32 object-cover rounded-lg flex-shrink-0"
              onError={(e) => {
                console.error("[Properties] Image failed to load:", property.cover_image);
                (e.currentTarget as HTMLImageElement).style.display = "none";
                (e.currentTarget.nextSibling as HTMLElement)?.style.setProperty("display", "flex");
              }}
            />
          ) : null}
          <div
            className="w-full md:w-40 h-32 rounded-lg bg-[#1b1b1b] flex items-center justify-center flex-shrink-0"
            style={{ display: property.cover_image ? "none" : "flex" }}
          >
            <Building2 className="h-10 w-10 text-[#808080]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg text-white">{property.name}</h3>
                <p className="text-sm text-[#808080] flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4 flex-shrink-0" />{property.city ?? property.address}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {property.rating != null && property.rating > 0 && (
                  <span className="flex items-center gap-1 text-amber-400 text-sm">
                    <Star className="h-4 w-4 fill-current" />{Number(property.rating).toFixed(1)}
                  </span>
                )}
                <Badge className={"border " + statusBadge(property.status)}>{property.status}</Badge>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><p className="text-[#808080]">Owner</p><p className="text-white truncate">{property.owner?.name ?? "—"}</p></div>
              <div><p className="text-[#808080]">Email</p><p className="text-white truncate">{property.owner?.email ?? "—"}</p></div>
              <div><p className="text-[#808080]">Type</p><p className="text-white capitalize">{property.property_type?.join(", ") ?? "—"}</p></div>
              <div><p className="text-[#808080]">Submitted</p><p className="text-white">{new Date(property.created_at).toLocaleDateString()}</p></div>
            </div>
            {property.rejection_reason && (
              <div className="mt-2 text-xs text-red-400 bg-red-600/10 border border-red-600/20 rounded px-2 py-1">
                Reason: {property.rejection_reason}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button size="sm" variant="outline" className="gap-1 border-white/[0.09] text-white/80 hover:bg-white/[0.05]" onClick={() => handleView(property)}>
                <Eye className="h-4 w-4" />Review
              </Button>
              {property.status === "pending" && (
                <>
                  <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(property)}>
                    <CheckCircle className="h-4 w-4" />Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-1" onClick={() => openRejectDialog(property)}>
                    <XCircle className="h-4 w-4" />Reject
                  </Button>
                </>
              )}
              {property.status === "approved" && (
                <Button size="sm" className="gap-1 bg-orange-600 hover:bg-orange-700 text-white" onClick={() => handleSuspend(property)}>
                  <PauseCircle className="h-4 w-4" />Suspend
                </Button>
              )}
              {property.status === "suspended" && (
                <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleReinstate(property)}>
                  <RefreshCw className="h-4 w-4" />Reinstate
                </Button>
              )}
              {property.status === "rejected" && (
                <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(property)}>
                  <CheckCircle className="h-4 w-4" />Approve Anyway
                </Button>
              )}
              <Button size="sm" variant="ghost" className="gap-1 text-red-400 hover:text-red-300 hover:bg-red-600/10 ml-auto" onClick={() => openDeleteDialog(property)}>
                <Trash2 className="h-4 w-4" />Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const tabCount = (tab: string) => tab === "all" ? stats.all : (stats[tab as keyof PropertyStatsResponse] ?? 0);

  return (
    <SuperAdminLayout title="Properties" subtitle="Review and manage listed properties">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 sa-stagger">
        {[
          { label: "Pending Review", key: "pending", icon: Clock, color: "text-amber-400" },
          { label: "Approved",       key: "approved",  icon: CheckCircle, color: "text-emerald-400" },
          { label: "Rejected",       key: "rejected",  icon: XCircle,     color: "text-red-400" },
          { label: "Suspended",      key: "suspended", icon: PauseCircle, color: "text-orange-400" },
        ].map(({ label, key, icon: Icon, color }) => (
          <Card key={key} className="bg-[#292929] border-white/[0.07] sa-card sa-slide-in">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={"p-2.5 rounded-lg bg-[#1b1b1b]"}>
                <Icon className={"h-6 w-6 " + color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tabular-nums">{stats[key as keyof PropertyStatsResponse] ?? 0}</p>
                <p className="text-xs text-[#808080]">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search / Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 sa-slide-in" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#808080]" />
          <Input
            placeholder="Search by property name..."
            className="pl-10 bg-[#292929] border-white/[0.09] text-white placeholder:text-[#808080]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full md:w-40 bg-[#292929] border-white/10 text-white">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-[#292929] border-white/10 text-white">
            <SelectItem value="all" className="text-white focus:bg-white/[0.06] focus:text-white">All Types</SelectItem>
            <SelectItem value="hotel" className="text-white focus:bg-white/[0.06] focus:text-white">Boarding</SelectItem>
            <SelectItem value="grooming" className="text-white focus:bg-white/[0.06] focus:text-white">Grooming</SelectItem>
            <SelectItem value="veterinary" className="text-white focus:bg-white/[0.06] focus:text-white">Veterinary</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
          <SelectTrigger className="w-full md:w-48 bg-[#292929] border-white/10 text-white">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#808080]" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-[#292929] border-white/10 text-white">
            {SORT_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value} className="text-white focus:bg-white/[0.06] focus:text-white">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2 border-white/10 text-[#808080] hover:bg-white/5 hover:text-white" onClick={() => { fetchProperties(); fetchStats(); }} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button variant="outline" className="gap-2 border-white/10 text-[#808080] hover:bg-white/5 hover:text-white" onClick={handleExportCSV} disabled={loading || displayProperties.length === 0}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sa-slide-in" style={{ animationDelay: '150ms' }}>
        <TabsList className="bg-[#292929] border border-white/[0.07]">
          {["pending", "approved", "rejected", "suspended", "all"].map((tab) => (
            <TabsTrigger key={tab} value={tab}
              className="text-[#808080] data-[state=active]:bg-[#ffa31a] data-[state=active]:text-[#1b1b1b] data-[state=active]:font-semibold capitalize">
              {tab === "all" ? "All" : tab} ({tabCount(tab)})
            </TabsTrigger>
          ))}
        </TabsList>

        {["pending", "approved", "rejected", "suspended", "all"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="bg-[#292929] border-white/[0.07] animate-pulse">
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        <div className="w-40 h-32 bg-[#1b1b1b] rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                          <div className="h-5 bg-[#1b1b1b] rounded w-2/5" />
                          <div className="h-4 bg-[#1b1b1b] rounded w-1/3" />
                          <div className="grid grid-cols-4 gap-3 mt-3">
                            {Array.from({ length: 4 }).map((_, j) => (
                              <div key={j} className="space-y-1">
                                <div className="h-3 bg-[#1b1b1b] rounded w-2/3" />
                                <div className="h-4 bg-[#1b1b1b] rounded w-4/5" />
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <div className="h-8 bg-[#1b1b1b] rounded w-20" />
                            <div className="h-8 bg-[#1b1b1b] rounded w-20" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : displayProperties.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="h-12 w-12 text-[#808080]/50 mx-auto mb-3" />
                <p className="text-[#808080] text-sm font-medium">No properties found</p>
                <p className="text-[#808080]/60 text-xs mt-1">Try adjusting your search, filters, or tab selection</p>
              </div>
            ) : (
              displayProperties.map((p) => <PropertyCard key={p.id} property={p} />)
            )}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-[#808080]">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-white/[0.09] text-white/80 hover:bg-white/[0.05]"
                    disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="flex items-center px-3 text-sm text-white/60">{page} / {totalPages}</span>
                  <Button size="sm" variant="outline" className="border-white/[0.09] text-white/80 hover:bg-white/[0.05]"
                    disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-[#1b1b1b] border-white/[0.08] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Property Details</DialogTitle>
            <DialogDescription className="text-[#808080]">Full review of the property application</DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <div className="space-y-5">
              {/* Cover image */}
              {selectedProperty.cover_image ? (
                <img
                  src={selectedProperty.cover_image}
                  alt={selectedProperty.name}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    (e.currentTarget.nextSibling as HTMLElement)?.style.setProperty("display", "flex");
                  }}
                />
              ) : null}
              <div
                className="w-full h-48 rounded-lg bg-[#292929] flex items-center justify-center"
                style={{ display: selectedProperty.cover_image ? "none" : "flex" }}
              >
                <Building2 className="h-16 w-16 text-[#808080]" />
              </div>

              {/* Image gallery */}
              {detail?.property?.images && detail.property.images.length > 1 && (
                <div>
                  <p className="text-xs text-[#808080] mb-2 flex items-center gap-1"><Image className="h-3 w-3" />All Photos ({detail.property.images.length})</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {detail.property.images.map((img: string, i: number) => (
                      <img key={i} src={img} alt={`Photo ${i + 1}`} className="h-20 w-28 rounded-lg object-cover flex-shrink-0 border border-white/10" />
                    ))}
                  </div>
                </div>
              )}

              {/* Name, address, status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl font-semibold text-white">{selectedProperty.name}</h3>
                  <p className="text-[#808080] flex items-center gap-1 mt-1 text-sm">
                    <MapPin className="h-4 w-4" />{selectedProperty.address}{selectedProperty.city ? `, ${selectedProperty.city}` : ""} {selectedProperty.zip_code ?? ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedProperty.rating != null && selectedProperty.rating > 0 && (
                    <span className="flex items-center gap-1 text-amber-400 text-sm">
                      <Star className="h-4 w-4 fill-current" />{Number(selectedProperty.rating).toFixed(1)}
                    </span>
                  )}
                  <Badge className={"border " + statusBadge(selectedProperty.status)}>{selectedProperty.status}</Badge>
                </div>
              </div>

              {/* Property type badges */}
              <div className="flex flex-wrap gap-2">
                {selectedProperty.property_type?.map((t: string) => (
                  <Badge key={t} variant="outline" className="border-white/20 text-white/70 text-xs gap-1 capitalize">
                    {typeIcon(t)} {TYPE_LABELS[t] ?? t}
                  </Badge>
                ))}
              </div>

              <p className="text-white/80 text-sm">{selectedProperty.description}</p>

              {/* Info grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div><p className="text-xs text-[#808080]">Owner</p><p className="text-white">{selectedProperty.owner?.name ?? "—"}</p></div>
                <div><p className="text-xs text-[#808080]">Email</p><p className="text-white flex items-center gap-1 truncate"><Mail className="h-3 w-3 text-[#808080] shrink-0" />{selectedProperty.owner?.email ?? "—"}</p></div>
                <div><p className="text-xs text-[#808080]">Phone</p><p className="text-white flex items-center gap-1"><Phone className="h-3 w-3 text-[#808080]" />{selectedProperty.phone ?? selectedProperty.owner?.phone ?? "—"}</p></div>
                <div><p className="text-xs text-[#808080]">Capacity</p><p className="text-white flex items-center gap-1"><Users className="h-3 w-3 text-[#808080]" />{selectedProperty.capacity ?? "—"} pets</p></div>
                <div><p className="text-xs text-[#808080]">Total Bookings</p><p className="text-white">{selectedProperty.booking_count ?? 0}</p></div>
                <div><p className="text-xs text-[#808080]">Submitted</p><p className="text-white flex items-center gap-1"><Calendar className="h-3 w-3 text-[#808080]" />{new Date(selectedProperty.created_at).toLocaleDateString()}</p></div>
              </div>

              {/* Loading state */}
              {detailLoading && (
                <div className="py-6 text-center text-[#808080] text-sm flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#ffa31a]" />Loading full details…
                </div>
              )}

              {detail && !detailLoading && (
                <>
                  {/* Booking Stats */}
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4 text-[#ffa31a]" />Booking Stats</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-[#292929] rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-white">{detail.booking_stats.total}</p>
                        <p className="text-xs text-[#808080]">Total</p>
                      </div>
                      <div className="bg-[#292929] rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-emerald-400">{detail.booking_stats.completed ?? 0}</p>
                        <p className="text-xs text-[#808080]">Completed</p>
                      </div>
                      <div className="bg-[#292929] rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-amber-400">{detail.booking_stats.pending ?? 0}</p>
                        <p className="text-xs text-[#808080]">Pending</p>
                      </div>
                      <div className="bg-[#292929] rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-[#ffa31a]">₱{Number(detail.booking_stats.revenue ?? 0).toLocaleString()}</p>
                        <p className="text-xs text-[#808080]">Revenue</p>
                      </div>
                    </div>
                  </div>

                  {/* Services with capacity */}
                  {detail.services.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Shield className="h-4 w-4 text-[#ffa31a]" />Services ({detail.services.length})</p>
                      <div className="space-y-2">
                        {detail.services.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between bg-[#292929] rounded-lg p-3 text-sm">
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium">{s.name}</p>
                              <p className="text-xs text-[#808080]">{s.category}{s.description ? ` · ${s.description}` : ""}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {s.capacity != null && (
                                <Badge variant="outline" className="border-blue-400/30 text-blue-400 text-xs">
                                  <Users className="h-3 w-3 mr-1" />{s.capacity}
                                </Badge>
                              )}
                              {s.price ? (
                                <span className="text-[#ffa31a] font-semibold">₱{Number(s.price).toLocaleString()}</span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  {detail.amenities.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm font-semibold text-white mb-2">Amenities ({detail.amenities.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {detail.amenities.map((a: any, i: number) => (
                          <Badge key={i} variant="outline" className="border-white/20 text-white/70 text-xs">{a?.amenity ?? a}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Operating Hours (from setup) */}
                  {detail.setup?.operating_hours && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Clock className="h-4 w-4 text-[#ffa31a]" />Operating Hours</p>
                      <div className="bg-[#292929] rounded-lg p-4 text-sm space-y-2">
                        {detail.setup.operating_hours.sameHoursEveryDay ? (
                          <p className="text-white">
                            Every day: <span className="text-[#ffa31a] font-medium">{detail.setup.operating_hours.dailyOpenTime ?? "—"}</span> – <span className="text-[#ffa31a] font-medium">{detail.setup.operating_hours.dailyCloseTime ?? "—"}</span>
                          </p>
                        ) : detail.setup.operating_hours.weeklyHours && Object.keys(detail.setup.operating_hours.weeklyHours).length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(detail.setup.operating_hours.weeklyHours as Record<string, { open: string; close: string }>).map(([day, hours]) => (
                              <div key={day} className="flex justify-between">
                                <span className="text-[#808080] capitalize">{day}</span>
                                <span className="text-white">{hours.open} – {hours.close}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[#808080]">No hours specified</p>
                        )}
                        <div className="flex flex-wrap gap-3 pt-2 border-t border-white/[0.06]">
                          {detail.setup.operating_hours.weekendAvailability && <Badge variant="outline" className="border-emerald-400/30 text-emerald-400 text-xs">Weekend available</Badge>}
                          {detail.setup.operating_hours.holidayAvailability && <Badge variant="outline" className="border-emerald-400/30 text-emerald-400 text-xs">Holiday available</Badge>}
                          {detail.setup.operating_hours.emergencyServices && <Badge variant="outline" className="border-red-400/30 text-red-400 text-xs">Emergency services</Badge>}
                          {detail.setup.operating_hours.appointmentOnly && <Badge variant="outline" className="border-amber-400/30 text-amber-400 text-xs">Appointment only</Badge>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Policies (from setup) */}
                  {detail.setup?.policies && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-[#ffa31a]" />Policies</p>
                      <div className="bg-[#292929] rounded-lg p-4 space-y-2 text-sm">
                        {detail.setup.policies.breedRestrictions && (
                          <div><span className="text-[#808080]">Breed Restrictions:</span> <span className="text-white">{detail.setup.policies.breedRestrictionDetails || "Yes"}</span></div>
                        )}
                        {detail.setup.policies.aggressivePolicy && (
                          <div><span className="text-[#808080]">Aggressive Pet Policy:</span> <span className="text-white">{detail.setup.policies.aggressivePolicyDetails || "Yes"}</span></div>
                        )}
                        {detail.setup.policies.unvaccinatedPolicy && (
                          <div><span className="text-[#808080]">Vaccination Required:</span> <span className="text-white">{detail.setup.policies.unvaccinatedPolicyDetails || "Yes"}</span></div>
                        )}
                        {!detail.setup.policies.breedRestrictions && !detail.setup.policies.aggressivePolicy && !detail.setup.policies.unvaccinatedPolicy && (
                          <p className="text-[#808080]">No special policies</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pricing summary */}
                  {detail.pricing && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><DollarSign className="h-4 w-4 text-[#ffa31a]" />Pricing Details</p>
                      <div className="bg-[#292929] rounded-lg p-4 space-y-3 text-sm">
                        {/* Base services from pricing table */}
                        {detail.pricing.base_services && (detail.pricing.base_services as any[]).length > 0 && (
                          <div>
                            <p className="text-[#808080] text-xs mb-1">Base Services</p>
                            <div className="space-y-1">
                              {(detail.pricing.base_services as any[]).map((bs: any, i: number) => (
                                <div key={i} className="flex justify-between text-white">
                                  <span>{bs.name || "Unnamed"} <span className="text-[#808080]">({bs.priceType ?? "Fixed"})</span></span>
                                  <span className="text-[#ffa31a]">{bs.price ? `₱${bs.price}` : bs.minPrice ? `₱${bs.minPrice}–${bs.maxPrice}` : "—"}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Fees & charges */}
                        {detail.pricing.fees_charges && Object.values(detail.pricing.fees_charges).some(Boolean) && (
                          <div>
                            <p className="text-[#808080] text-xs mb-1">Fees & Charges</p>
                            <div className="grid grid-cols-2 gap-1">
                              {Object.entries(detail.pricing.fees_charges as Record<string, string>).filter(([, v]) => v).map(([k, v]) => (
                                <div key={k} className="flex justify-between">
                                  <span className="text-[#808080] capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                                  <span className="text-white">{v}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Payment options */}
                        {detail.pricing.payment_options?.methods && (detail.pricing.payment_options.methods as string[]).length > 0 && (
                          <div>
                            <p className="text-[#808080] text-xs mb-1">Payment Methods</p>
                            <div className="flex flex-wrap gap-2">
                              {(detail.pricing.payment_options.methods as string[]).map((m: string, i: number) => (
                                <Badge key={i} variant="outline" className="border-white/20 text-white/70 text-xs capitalize">{m}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {detail.pricing.pricing_notes && (
                          <div>
                            <p className="text-[#808080] text-xs mb-1">Notes</p>
                            <p className="text-white/70">{detail.pricing.pricing_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Legal info */}
                  {detail.legal && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-[#ffa31a]" />Legal Information</p>
                      <div className="bg-[#292929] rounded-lg p-4 space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-[#808080]">Entity Type</p>
                            <p className="text-white capitalize">{detail.legal.legal_entity_type || "—"}</p>
                          </div>
                          {detail.legal.contracting_party && (
                            <div>
                              <p className="text-xs text-[#808080]">Contracting Party</p>
                              <p className="text-white">
                                {[detail.legal.contracting_party.firstName, detail.legal.contracting_party.middleName, detail.legal.contracting_party.lastName].filter(Boolean).join(" ") || "—"}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {detail.legal.lgu_permits && (detail.legal.lgu_permits as string[]).length > 0 && (
                            <Badge variant="outline" className="border-emerald-400/30 text-emerald-400 text-xs">
                              {(detail.legal.lgu_permits as string[]).length} LGU Permit{(detail.legal.lgu_permits as string[]).length > 1 ? "s" : ""}
                            </Badge>
                          )}
                          {detail.legal.bai_document && <Badge variant="outline" className="border-emerald-400/30 text-emerald-400 text-xs">BAI Document</Badge>}
                          {detail.legal.contract_document && <Badge variant="outline" className="border-emerald-400/30 text-emerald-400 text-xs">Contract</Badge>}
                          {detail.legal.legal_agreements?.termsAccepted && <Badge variant="outline" className="border-blue-400/30 text-blue-400 text-xs">Terms accepted</Badge>}
                          {detail.legal.legal_agreements?.dataProcessing && <Badge variant="outline" className="border-blue-400/30 text-blue-400 text-xs">DPA accepted</Badge>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Health & Safety */}
                  {detail.setup?.health_safety && detail.setup.health_safety.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm font-semibold text-white mb-2">Health & Safety</p>
                      <div className="flex flex-wrap gap-2">
                        {detail.setup.health_safety.map((h: string, i: number) => (
                          <Badge key={i} variant="outline" className="border-emerald-400/30 text-emerald-400 text-xs">{h}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Reviews */}
                  {detail.recent_reviews.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm font-semibold text-white mb-2">Recent Reviews ({detail.recent_reviews.length})</p>
                      <div className="space-y-2">
                        {detail.recent_reviews.map((r: any) => (
                          <div key={r.id} className="bg-[#292929] rounded-lg p-3 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-amber-400 font-semibold">{r.rating}</span>
                              <span className="text-[#808080] text-xs ml-auto">{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-white/70">{r.comment ?? "No comment."}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Bookings */}
                  {detail.recent_bookings && detail.recent_bookings.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm font-semibold text-white mb-2">Recent Bookings</p>
                      <div className="space-y-1">
                        {detail.recent_bookings.slice(0, 5).map((b: any) => (
                          <div key={b.id} className="flex items-center justify-between bg-[#292929] rounded-lg p-3 text-sm">
                            <div>
                              <Badge variant="outline" className={`text-xs ${b.status === "completed" ? "border-emerald-400/30 text-emerald-400" : b.status === "pending" ? "border-amber-400/30 text-amber-400" : b.status === "cancelled" ? "border-red-400/30 text-red-400" : "border-white/20 text-white/60"}`}>
                                {b.status}
                              </Badge>
                              <span className="text-[#808080] text-xs ml-2">{new Date(b.created_at).toLocaleDateString()}</span>
                            </div>
                            {b.total_price && <span className="text-[#ffa31a] font-semibold">₱{Number(b.total_price).toLocaleString()}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Rejection reason */}
              {selectedProperty.status === "rejected" && selectedProperty.rejection_reason && (
                <div className="p-3 rounded-lg bg-red-600/10 border border-red-600/30">
                  <p className="text-sm text-red-400">Rejection Reason: {selectedProperty.rejection_reason}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                {selectedProperty.status === "pending" && (
                  <>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(selectedProperty)}>
                      <CheckCircle className="h-4 w-4 mr-1" />Approve
                    </Button>
                    <Button variant="destructive" onClick={() => { setViewDialogOpen(false); openRejectDialog(selectedProperty); }}>
                      <XCircle className="h-4 w-4 mr-1" />Reject
                    </Button>
                  </>
                )}
                {selectedProperty.status === "approved" && (
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => handleSuspend(selectedProperty)}>
                    <PauseCircle className="h-4 w-4 mr-1" />Suspend
                  </Button>
                )}
                {selectedProperty.status === "suspended" && (
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleReinstate(selectedProperty)}>
                    <RefreshCw className="h-4 w-4 mr-1" />Reinstate
                  </Button>
                )}
                {selectedProperty.status === "rejected" && (
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(selectedProperty)}>
                    <CheckCircle className="h-4 w-4 mr-1" />Approve Anyway
                  </Button>
                )}
                <Button variant="ghost" className="gap-1 text-red-400 hover:text-red-300 hover:bg-red-600/10" onClick={() => { setViewDialogOpen(false); openDeleteDialog(selectedProperty); }}>
                  <Trash2 className="h-4 w-4" />Delete
                </Button>
                <Button variant="outline" onClick={() => setViewDialogOpen(false)} className="border-white/10 text-white/80 ml-auto">Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-[#1b1b1b] border-white/[0.08]">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Property</DialogTitle>
            <DialogDescription className="text-[#808080]">
              Provide a reason for rejecting <span className="text-white">{rejectTarget?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection…"
            className="bg-[#292929] border-white/[0.09] text-white placeholder:text-[#808080] min-h-[100px]"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" className="border-white/10 text-white/80" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}><XCircle className="h-4 w-4 mr-1" />Confirm Rejection</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1b1b1b] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Property</AlertDialogTitle>
            <AlertDialogDescription className="text-[#808080]">
              Permanently delete <span className="text-white font-medium">{deleteTarget?.name}</span>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white/80 hover:bg-white/[0.05]">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" />Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SuperAdminLayout>
  );
};

export default SuperAdminProperties;
