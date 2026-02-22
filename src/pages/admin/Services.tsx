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
import { Plus, Edit, Trash2, Bed, Scissors, Stethoscope} from "lucide-react";
import { useState } from "react";

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

type Service = {
  id: number;
  name: string;
  description: string;
  price: number;
  icon: keyof typeof iconMap;
  category: string;
  active: boolean;
};

const initialServices: Service[] = [
  { id: 1, name: "Standard Boarding", description: "Comfortable private room with daily walks", price: 45, icon: "Bed", category: "Boarding", active: true },
  { id: 2, name: "Luxury Suite", description: "Premium suite with webcam access and extra playtime", price: 75, icon: "Bed", category: "Boarding", active: true },
  { id: 3, name: "Daycare", description: "Full day of supervised play and socialization", price: 35, icon: "Bed", category: "Boarding", active: true },
  { id: 4, name: "Basic Grooming", description: "Bath, brush, and nail trim", price: 45, icon: "Scissors", category: "Grooming", active: true },
  { id: 5, name: "Full Grooming", description: "Complete grooming with haircut and styling", price: 85, icon: "Scissors", category: "Grooming", active: true },
  { id: 6, name: "Spa Package", description: "Premium treatment with massage and aromatherapy", price: 120, icon: "Scissors", category: "Grooming", active: false },
  { id: 7, name: "Health Check", description: "Basic health examination", price: 50, icon: "Stethoscope", category: "Veterinary", active: true },
];

const AdminServices = () => {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
    });
  };

  const toggleService = (id: number) => {
    setServices(services.map(s => 
      s.id === id ? { ...s, active: !s.active } : s
    ));
  };

  const handleAddService = () => {
    const newService: Service = {
      id: Math.max(...services.map(s => s.id)) + 1,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      icon: categoryIconMap[formData.category],
      category: formData.category,
      active: true,
    };
    setServices([...services, newService]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      category: service.category,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditService = () => {
    if (!selectedService) return;
    setServices(services.map(s => 
      s.id === selectedService.id 
        ? {
            ...s,
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            category: formData.category,
            icon: categoryIconMap[formData.category],
          }
        : s
    ));
    setIsEditDialogOpen(false);
    setSelectedService(null);
    resetForm();
  };

  const handleDeleteClick = (service: Service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteService = () => {
    if (!selectedService) return;
    setServices(services.filter(s => s.id !== selectedService.id));
    setIsDeleteDialogOpen(false);
    setSelectedService(null);
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          const IconComponent = iconMap[service.icon];
          return (
            <Card key={service.id} className={service.active ? "" : "opacity-60"}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={service.active}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{service.name}</h3>
                    <Badge variant="outline" className="text-xs">{service.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-foreground">
                    ${service.price}
                    <span className="text-sm font-normal text-muted-foreground">/night</span>
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-description">Description</Label>
              <Textarea
                id="add-description"
                placeholder="Describe what this service includes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="add-price">Price ($)</Label>
                <Input
                  id="add-price"
                  type="number"
                  placeholder="45"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddService}
              disabled={!formData.name || !formData.description || !formData.price || !formData.category}
            >
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
            <DialogDescription>
              Update the service details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Service Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Premium Boarding"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe what this service includes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Price ($)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  placeholder="45"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditService}
              disabled={!formData.name || !formData.description || !formData.price || !formData.category}
            >
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteService} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
