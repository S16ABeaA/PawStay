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
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { adminApi, AdminProperty, PropertyStatsResponse } from "@/services/adminApi";

const LIMIT = 10;

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

  useEffect(() => { setPage(1); }, [activeTab, debouncedSearch]);

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
    <Card className="bg-[#292929] border-white/[0.07]">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pending Review", key: "pending", icon: Clock, color: "text-amber-400" },
          { label: "Approved",       key: "approved",  icon: CheckCircle, color: "text-emerald-400" },
          { label: "Rejected",       key: "rejected",  icon: XCircle,     color: "text-red-400" },
          { label: "Suspended",      key: "suspended", icon: PauseCircle, color: "text-orange-400" },
        ].map(({ label, key, icon: Icon, color }) => (
          <Card key={key} className="bg-[#292929] border-white/[0.07]">
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={"h-8 w-8 " + color} />
              <div>
                <p className="text-2xl font-bold text-white">{stats[key as keyof PropertyStatsResponse] ?? 0}</p>
                <p className="text-xs text-[#808080]">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#808080]" />
        <Input
          placeholder="Search by property name..."
          className="pl-10 bg-[#292929] border-white/[0.09] text-white placeholder:text-[#808080]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                    <CardContent className="p-5 h-36" />
                  </Card>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <p className="text-[#808080] text-center py-12">No properties found.</p>
            ) : (
              properties.map((p) => <PropertyCard key={p.id} property={p} />)
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
        <DialogContent className="bg-[#1b1b1b] border-white/[0.08] max-w-2xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
          <DialogHeader>
            <DialogTitle className="text-white">Property Details</DialogTitle>
            <DialogDescription className="text-[#808080]">Full review of the property application</DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <div className="space-y-5">
              {selectedProperty.cover_image ? (
                <img
                  src={selectedProperty.cover_image}
                  alt={selectedProperty.name}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    console.error("[Properties] Detail image failed:", selectedProperty.cover_image);
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
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl font-semibold text-white">{selectedProperty.name}</h3>
                  <p className="text-[#808080] flex items-center gap-1 mt-1 text-sm">
                    <MapPin className="h-4 w-4" />{selectedProperty.address}, {selectedProperty.city} {selectedProperty.zip_code}
                  </p>
                </div>
                <Badge className={"border " + statusBadge(selectedProperty.status)}>{selectedProperty.status}</Badge>
              </div>
              <p className="text-white/80 text-sm">{selectedProperty.description}</p>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div><p className="text-xs text-[#808080]">Owner</p><p className="text-white">{selectedProperty.owner?.name ?? "—"}</p></div>
                <div><p className="text-xs text-[#808080]">Email</p><p className="text-white flex items-center gap-1"><Mail className="h-3 w-3 text-[#808080]" />{selectedProperty.owner?.email ?? "—"}</p></div>
                <div><p className="text-xs text-[#808080]">Phone</p><p className="text-white flex items-center gap-1"><Phone className="h-3 w-3 text-[#808080]" />{selectedProperty.phone ?? selectedProperty.owner?.phone ?? "—"}</p></div>
                <div><p className="text-xs text-[#808080]">Type</p><p className="text-white capitalize">{selectedProperty.property_type?.join(", ") ?? "—"}</p></div>
                <div><p className="text-xs text-[#808080]">Capacity</p><p className="text-white flex items-center gap-1"><Users className="h-3 w-3 text-[#808080]" />{selectedProperty.capacity ?? "—"} pets</p></div>
                <div><p className="text-xs text-[#808080]">Submitted</p><p className="text-white">{new Date(selectedProperty.created_at).toLocaleDateString()}</p></div>
              </div>
              {detailLoading && <div className="py-4 text-center text-[#808080] text-sm animate-pulse">Loading full details…</div>}
              {detail && !detailLoading && (
                <>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm font-semibold text-white mb-3">Booking Stats</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#292929] rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-white">{detail.booking_stats.total}</p>
                        <p className="text-xs text-[#808080]">Total</p>
                      </div>
                      <div className="bg-[#292929] rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-emerald-400">{detail.booking_stats.completed ?? 0}</p>
                        <p className="text-xs text-[#808080]">Completed</p>
                      </div>
                      <div className="bg-[#292929] rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-[#ffa31a]">₱{Number(detail.booking_stats.revenue ?? 0).toLocaleString()}</p>
                        <p className="text-xs text-[#808080]">Revenue</p>
                      </div>
                    </div>
                  </div>
                  {detail.services.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm font-semibold text-white mb-2">Services</p>
                      <div className="flex flex-wrap gap-2">
                        {detail.services.map((s: any) => (
                          <Badge key={s.id} variant="outline" className="border-[#ffa31a]/50 text-[#ffa31a] text-xs">
                            {s.name}{s.price ? ` — ₱${s.price}` : ""}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {detail.amenities.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm font-semibold text-white mb-2">Amenities ({detail.amenities.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {detail.amenities.slice(0, 12).map((a: any, i: number) => (
                          <Badge key={i} variant="outline" className="border-white/20 text-white/70 text-xs">{a?.amenity ?? a}</Badge>
                        ))}
                        {detail.amenities.length > 12 && (
                          <Badge variant="outline" className="border-white/20 text-white/50 text-xs">+{detail.amenities.length - 12} more</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {detail.recent_reviews.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm font-semibold text-white mb-2">Recent Reviews</p>
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
                </>
              )}
              {selectedProperty.status === "rejected" && selectedProperty.rejection_reason && (
                <div className="p-3 rounded-lg bg-red-600/10 border border-red-600/30">
                  <p className="text-sm text-red-400">Rejection Reason: {selectedProperty.rejection_reason}</p>
                </div>
              )}
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
