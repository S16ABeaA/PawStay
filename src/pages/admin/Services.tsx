import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Bed, Scissors, Stethoscope, Car } from "lucide-react";
import { useState } from "react";

const initialServices = [
  { id: 1, name: "Standard Boarding", description: "Comfortable private room with daily walks", price: 45, icon: Bed, category: "Boarding", active: true },
  { id: 2, name: "Luxury Suite", description: "Premium suite with webcam access and extra playtime", price: 75, icon: Bed, category: "Boarding", active: true },
  { id: 3, name: "Daycare", description: "Full day of supervised play and socialization", price: 35, icon: Bed, category: "Boarding", active: true },
  { id: 4, name: "Basic Grooming", description: "Bath, brush, and nail trim", price: 45, icon: Scissors, category: "Grooming", active: true },
  { id: 5, name: "Full Grooming", description: "Complete grooming with haircut and styling", price: 85, icon: Scissors, category: "Grooming", active: true },
  { id: 6, name: "Spa Package", description: "Premium treatment with massage and aromatherapy", price: 120, icon: Scissors, category: "Grooming", active: false },
  { id: 7, name: "Health Check", description: "Basic health examination", price: 50, icon: Stethoscope, category: "Veterinary", active: true },
  { id: 8, name: "Pet Taxi", description: "Pick-up and drop-off service", price: 25, icon: Car, category: "Transport", active: true },
];

const AdminServices = () => {
  const [services, setServices] = useState(initialServices);

  const toggleService = (id: number) => {
    setServices(services.map(s => 
      s.id === id ? { ...s, active: !s.active } : s
    ));
  };

  return (
    <AdminLayout title="Services" subtitle="Manage your service offerings and pricing">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input placeholder="Search services..." className="md:max-w-xs" />
        <Button variant="hero" className="gap-2 ml-auto">
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card key={service.id} className={service.active ? "" : "opacity-60"}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <service.icon className="h-5 w-5 text-primary" />
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
                  ₱{service.price}
                  <span className="text-sm font-normal text-muted-foreground">/night</span>
                </p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminServices;
