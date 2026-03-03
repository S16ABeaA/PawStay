import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Edit, Trash2, Bed, Scissors, Stethoscope, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { servicesApi, DBService } from "@/services/servicesApi";
import { authHelper } from "@/helpers/authHelper";
import { useAdminProperty } from "@/hooks/useAdminProperty";

const iconMap = {
  Bed: Bed,
  Scissors: Scissors,
  Stethoscope: Stethoscope,
};

// Map categories to icons
const categoryIconMap: Record<string, keyof typeof iconMap> = {
  Boarding: "Bed",
  Grooming: "Scissors",
  Veterinary: "Stethoscope",
};

const AdminServices = () => {
  const [services, setServices] = useState<DBService[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedPropertyId: propertyId, loading: propLoading } = useAdminProperty();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<DBService | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    capacity: "",
  });

  // Fetch services when selected property changes
  useEffect(() => {
    if (propLoading || !propertyId) return;
    fetchServices(propertyId);
  }, [propertyId, propLoading]);

  const fetchServices = async (propId: string) => {
    try {
      setLoading(true);
      const data = await servicesApi.getServices(propId);
      setServices(data);
    } catch (err) {
      console.error("Failed to fetch services", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      capacity: "",
    });
  };

  const toggleService = async (serviceId: string, currentStatus: boolean) => {
    if (!propertyId) return;
    try {
      await servicesApi.toggleService(propertyId, serviceId, !currentStatus);
      setServices(
        services.map((s) =>
          s.id === serviceId ? { ...s, is_active: !currentStatus } : s
        )
      );
    } catch (err) {
      console.error("Failed to toggle service", err);
    }
  };

  const handleAddService = async () => {
    if (!propertyId) return;
    try {
      setSubmitting(true);
      const payload: any = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        property_id: propertyId,
        is_active: true,
      };
      if (formData.category === "Boarding" && formData.capacity) {
        payload.capacity = parseInt(formData.capacity);
      }
      const newService = await servicesApi.createService(propertyId, payload);
      setServices([...services, newService]);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error("Failed to add service", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (service: DBService) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      category: service.category,
      capacity: (service as any).capacity ? String((service as any).capacity) : "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditService = async () => {
    if (!selectedService || !propertyId) return;
    try {
      setSubmitting(true);
      const payload: any = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
      };
      if (formData.category === "Boarding" && formData.capacity) {
        payload.capacity = parseInt(formData.capacity);
      }
      const updated = await servicesApi.updateService(propertyId, selectedService.id, payload);
      setServices(services.map((s) => (s.id === selectedService.id ? updated : s)));
      setIsEditDialogOpen(false);
      setSelectedService(null);
      resetForm();
    } catch (err) {
      console.error("Failed to update service", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (service: DBService) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteService = async () => {
    if (!selectedService || !propertyId) return;
    try {
      setSubmitting(true);
      await servicesApi.deleteService(propertyId, selectedService.id);
      setServices(services.filter((s) => s.id !== selectedService.id));
      setIsDeleteDialogOpen(false);
      setSelectedService(null);
    } catch (err) {
      console.error("Failed to delete service", err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout title="Services" subtitle="Manage your service offerings and pricing">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Services" subtitle="Manage your service offerings and pricing">
      <div>
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Search services..."
            className="md:max-w-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            variant="default"
            className="gap-2 ml-auto"
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => {
            const IconComponent = iconMap[categoryIconMap[service.category]] || Bed;
            return (
              <Card
                key={service.id}
                className={service.is_active ? "" : "opacity-60"}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.is_active}
                        onCheckedChange={() =>
                          toggleService(service.id, service.is_active)
                        }
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {service.name}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {service.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-foreground">
                      ₱{service.price}
                      <span className="text-sm font-normal text-muted-foreground">
                        /night
                      </span>
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditClick(service)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteClick(service)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredServices.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No services found</p>
          </div>
        )}

        {/* Add Service Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>
                Create a new service offering for your pet care business.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="add-name">Service Name</Label>
                <Input
                  id="add-name"
                  placeholder="e.g., Premium Boarding"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-description">Description</Label>
                <Textarea
                  id="add-description"
                  placeholder="Describe what this service includes..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="add-price">Price (₱)</Label>
                  <Input
                    id="add-price"
                    type="number"
                    placeholder="45"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger id="add-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Boarding">Boarding</SelectItem>
                      <SelectItem value="Grooming">Grooming</SelectItem>
                      <SelectItem value="Veterinary">Veterinary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.category === "Boarding" && (
                <div className="grid gap-2">
                  <Label htmlFor="add-capacity">Capacity (number of pets)</Label>
                  <Input
                    id="add-capacity"
                    type="number"
                    placeholder="e.g., 20"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddService}
                disabled={
                  !formData.name ||
                  !formData.description ||
                  !formData.price ||
                  !formData.category ||
                  (formData.category === "Boarding" && !formData.capacity) ||
                  submitting
                }
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Service
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Service Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
              <DialogDescription>Update the service details below.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Service Name</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., Premium Boarding"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Describe what this service includes..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Price (₱)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    placeholder="45"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger id="edit-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Boarding">Boarding</SelectItem>
                      <SelectItem value="Grooming">Grooming</SelectItem>
                      <SelectItem value="Veterinary">Veterinary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.category === "Boarding" && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-capacity">Capacity (number of pets)</Label>
                  <Input
                    id="edit-capacity"
                    type="number"
                    placeholder="e.g., 20"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditService}
                disabled={
                  !formData.name ||
                  !formData.description ||
                  !formData.price ||
                  !formData.category ||
                  (formData.category === "Boarding" && !formData.capacity) ||
                  submitting
                }
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the service "{selectedService?.name}".
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteService}
                disabled={submitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminServices;