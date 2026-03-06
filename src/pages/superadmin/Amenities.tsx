import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Plus, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { adminAmenitiesApi, Amenity } from "@/services/adminAmenitiesApi";

import { PetLoader } from "@/components/ui/PetLoader";

const SERVICE_TYPE_OPTIONS = ["hotel", "grooming", "veterinary"] as const;

const SuperAdminAmenities = () => {
  const { toast } = useToast();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Amenity | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState<{ amenity: string; category: string; service_types: string[]; is_active: boolean }>({
    amenity: "",
    category: "",
    service_types: [],
    is_active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAmenitiesApi.list();
      setAmenities(res.amenities || []);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load amenities" });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filteredAmenities = useMemo(() => {
    return amenities.filter((item) => {
      const matchesSearch = !search.trim() || [item.amenity, item.category, ...(item.service_types || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search.trim().toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.is_active) ||
        (statusFilter === "inactive" && !item.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [amenities, search, statusFilter]);

  const stats = useMemo(() => ({
    total: amenities.length,
    active: amenities.filter((item) => item.is_active).length,
    inactive: amenities.filter((item) => !item.is_active).length,
  }), [amenities]);

  const clearForm = () => {
    setEditingId(null);
    setForm({ amenity: "", category: "", service_types: [], is_active: true });
    setFormOpen(false);
  };

  const handleCreateClick = () => {
    setEditingId(null);
    setForm({ amenity: "", category: "", service_types: [], is_active: true });
    setFormOpen(true);
  };

  const toggleServiceType = (serviceType: typeof SERVICE_TYPE_OPTIONS[number]) => {
    setForm((current) => ({
      ...current,
      service_types: current.service_types.includes(serviceType)
        ? current.service_types.filter((item) => item !== serviceType)
        : [...current.service_types, serviceType],
    }));
  };

  const handleSave = async () => {
    if (!form.amenity.trim()) return toast({ title: "Validation", description: "Amenity name required" });
    setSaving(true);
    try {
      const payload = {
        amenity: form.amenity.trim(),
        category: form.category.trim() || null,
        service_types: form.service_types,
        is_active: form.is_active,
      };

      if (editingId) {
        await adminAmenitiesApi.update(editingId, payload);
        toast({ title: "Updated", description: "Amenity updated" });
      } else {
        await adminAmenitiesApi.create(payload);
        toast({ title: "Created", description: "Amenity created" });
      }
      clearForm();
      await load();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (a: Amenity) => {
    setEditingId(a.id);
    setForm({ amenity: a.amenity || "", category: a.category || "", service_types: a.service_types || [], is_active: !!a.is_active });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminAmenitiesApi.delete(deleteTarget.id);
      toast({ title: "Deleted" });
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Delete failed" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SuperAdminLayout title="Amenities" subtitle="Manage platform amenity choices">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card className="bg-[#0b1220] border-white/5 text-white">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-[#808080]">Total amenities</p>
            <p className="mt-2 text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0b1220] border-white/5 text-white">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-[#808080]">Active choices</p>
            <p className="mt-2 text-3xl font-bold text-emerald-500">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 md:col-span-1 bg-[#0b1220] border-white/5 text-white">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-[#808080]">Inactive choices</p>
            <p className="mt-2 text-3xl font-bold text-amber-500">{stats.inactive}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4">
        <div>
          <Card className="bg-[#0b1220] border-white/5 text-white">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <CardTitle>All Amenities</CardTitle>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="w-full sm:w-[360px]">
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search amenity, category, service"
                      className="bg-[#292929] border-white/[0.09] text-white placeholder:text-[#9ca3af] placeholder:opacity-80 pl-3 w-full h-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
                    <SelectTrigger className="w-full sm:w-[140px] bg-[#292929] border-white/[0.09] text-white h-10 flex items-center">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active only</SelectItem>
                      <SelectItem value="inactive">Inactive only</SelectItem>
                    </SelectContent>
                  </Select>
                   <Button onClick={handleCreateClick} className="w-full sm:w-auto sm:order-last">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Amenity
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {loading ? (
                  <PetLoader text="Loading amenities..." className="py-12" />
                ) : (
                <table className="w-full min-w-[700px] table-auto text-sm">
                  <thead>
                    <tr className="border-b border-white/20 text-left text-xs uppercase">
                          <th className="p-2 text-gray-400">Amenity</th>
                          <th className="p-2 text-gray-400">Category</th>
                          <th className="p-2 text-gray-400">Service Types</th>
                          <th className="p-2 text-gray-400">Active</th>
                          <th className="p-2 text-gray-400">Actions</th>
                        </tr>
                  </thead>
                  <tbody>
                    {filteredAmenities.map((a) => (
                      <tr key={a.id} className="border-b border-white/20 hover:bg-white/2">
                        <td className="p-2 font-medium">{a.amenity}</td>
                        <td className="p-2">{a.category || "—"}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1.5">
                            {(a.service_types || []).length > 0 ? (a.service_types || []).map((serviceType) => (
                              <Badge key={`${a.id}-${serviceType}`} variant="outline" className="bg-white/6 text-white border-white/10">{serviceType}</Badge>
                            )) : <span className="text-muted-foreground">—</span>}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant={a.is_active ? "default" : "secondary"}>{a.is_active ? "Active" : "Inactive"}</Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleEdit(a)}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(a)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredAmenities.length === 0 && (
                      <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No amenities match the current filters.</td></tr>
                    )}
                  </tbody>
                </table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) clearForm(); else setFormOpen(true); }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Amenity" : "Create Amenity"}</DialogTitle>
            <DialogDescription>
              Configure name, category, availability, and service types for this amenity.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input value={form.amenity} onChange={(e) => setForm(f => ({ ...f, amenity: (e.target as HTMLInputElement).value }))} placeholder="Amenity name (e.g. CCTV Monitoring)" />
            <Input value={form.category} onChange={(e) => setForm(f => ({ ...f, category: (e.target as HTMLInputElement).value }))} placeholder="Category (optional)" />

            <div className="space-y-2">
              <div className="text-sm font-medium">Service types</div>
              <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-3">
                <div className="mb-3 flex items-center gap-2 text-sm text-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Select where this amenity can be used</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {SERVICE_TYPE_OPTIONS.map((item) => {
                    const checked = form.service_types.includes(item);
                    return (
                      <label
                        key={item}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${checked ? "border-primary bg-primary/10 text-foreground" : "border-white/10 bg-transparent text-muted-foreground hover:border-white/20 hover:text-foreground"}`}
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleServiceType(item)} />
                        <span className="capitalize">{item}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2"><Checkbox checked={form.is_active} onCheckedChange={(v:any) => setForm(f => ({ ...f, is_active: !!v }))} /> Active</label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={clearForm}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Create amenity"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete amenity?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently remove "${deleteTarget.amenity}". If it is assigned to properties, deletion may be blocked until those assignments are removed.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleting}>
              {deleting ? "Deleting..." : "Delete amenity"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SuperAdminLayout>
  );
};

export default SuperAdminAmenities;
