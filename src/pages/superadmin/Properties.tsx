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
  Search,
  MapPin,
  Star,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const initialProperties = [
  {
    id: 1,
    name: "Luxury Paws Resort",
    location: "Los Angeles, CA",
    owner: "Jennifer Lee",
    email: "jen@luxurypaws.com",
    status: "pending",
    type: "Pet Hotel",
    rating: null,
    submitted: "2 hours ago",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300",
    description: "A luxury resort offering premium pet boarding with spa services.",
    capacity: 50,
    services: ["Boarding", "Grooming", "Daycare"],
  },
  {
    id: 2,
    name: "Happy Tails Hotel",
    location: "San Francisco, CA",
    owner: "Mark Johnson",
    email: "mark@happytails.com",
    status: "approved",
    type: "Pet Hotel",
    rating: 4.8,
    submitted: "5 hours ago",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=300",
    description: "Family-owned pet hotel with a focus on personalized care.",
    capacity: 30,
    services: ["Boarding", "Training"],
  },
  {
    id: 3,
    name: "Pet Paradise Inn",
    location: "Seattle, WA",
    owner: "Amy Chen",
    email: "amy@petparadise.com",
    status: "pending",
    type: "Boarding",
    rating: null,
    submitted: "8 hours ago",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300",
    description: "Cozy boarding facility with outdoor play areas.",
    capacity: 20,
    services: ["Boarding"],
  },
  {
    id: 4,
    name: "Cozy Critters Lodge",
    location: "Portland, OR",
    owner: "David Brown",
    email: "david@cozycritters.com",
    status: "approved",
    type: "Pet Hotel",
    rating: 4.6,
    submitted: "1 day ago",
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300",
    description: "Lodge-style pet accommodation in a natural setting.",
    capacity: 40,
    services: ["Boarding", "Grooming", "Veterinary"],
  },
  {
    id: 5,
    name: "Purrfect Stay",
    location: "Austin, TX",
    owner: "Lisa Wang",
    email: "lisa@purrfectstay.com",
    status: "rejected",
    type: "Cat Boarding",
    rating: null,
    submitted: "2 days ago",
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300",
    description: "Specialized cat boarding with quiet, cat-friendly spaces.",
    capacity: 15,
    services: ["Boarding", "Grooming"],
    rejectionReason: "Incomplete documentation",
  },
];

const SuperAdminProperties = () => {
  const [properties, setProperties] = useState(initialProperties);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<typeof initialProperties[0] | null>(null);
  const { toast } = useToast();

  const pendingCount = properties.filter((p) => p.status === "pending").length;

  const handleApprove = (id: number) => {
    setProperties(properties.map(p => 
      p.id === id ? { ...p, status: "approved", rating: 0 } : p
    ));
    const property = properties.find(p => p.id === id);
    toast({ title: "Property Approved", description: `${property?.name} has been approved and is now live.` });
  };

  const handleReject = (id: number) => {
    setProperties(properties.map(p => 
      p.id === id ? { ...p, status: "rejected", rejectionReason: "Does not meet requirements" } : p
    ));
    const property = properties.find(p => p.id === id);
    toast({ title: "Property Rejected", description: `${property?.name} has been rejected.`, variant: "destructive" });
  };

  const handleView = (property: typeof initialProperties[0]) => {
    setSelectedProperty(property);
    setViewDialogOpen(true);
  };

  const filterByStatus = (status: string) => {
    return properties.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.owner.toLowerCase().includes(searchQuery.toLowerCase());
      if (status === "all") return matchesSearch;
      return matchesSearch && p.status === status;
    });
  };

  const PropertyCard = ({ property }: { property: typeof initialProperties[0] }) => (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row gap-4">
          <img
            src={property.image}
            alt={property.name}
            className="w-full md:w-40 h-32 object-cover rounded-lg"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg text-white">{property.name}</h3>
                <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {property.location}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {property.rating && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="h-4 w-4 fill-current" />
                    {property.rating}
                  </span>
                )}
                <Badge 
                  className={
                    property.status === "approved" ? "bg-emerald-600/20 text-emerald-400" :
                    property.status === "pending" ? "bg-amber-600/20 text-amber-400" :
                    "bg-red-600/20 text-red-400"
                  }
                >
                  {property.status}
                </Badge>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Owner</p>
                <p className="text-white">{property.owner}</p>
              </div>
              <div>
                <p className="text-slate-500">Email</p>
                <p className="text-white">{property.email}</p>
              </div>
              <div>
                <p className="text-slate-500">Type</p>
                <p className="text-white">{property.type}</p>
              </div>
              <div>
                <p className="text-slate-500">Submitted</p>
                <p className="text-white">{property.submitted}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="gap-2 border-slate-700 text-slate-300" onClick={() => handleView(property)}>
                <Eye className="h-4 w-4" />
                Review
              </Button>
              {property.status === "pending" && (
                <>
                  <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(property.id)}>
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-2" onClick={() => handleReject(property.id)}>
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <SuperAdminLayout title="Properties" subtitle="Review and manage listed properties">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search properties..."
            className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="pending" className="data-[state=active]:bg-violet-600">
            Pending Review ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-violet-600">
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-violet-600">
            Rejected
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-violet-600">
            All
          </TabsTrigger>
        </TabsList>

        {["pending", "approved", "rejected", "all"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filterByStatus(status).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
            {filterByStatus(status).length === 0 && (
              <p className="text-slate-400 text-center py-8">No properties found.</p>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Property Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              Review property application
            </DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <div className="space-y-4">
              <img
                src={selectedProperty.image}
                alt={selectedProperty.name}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedProperty.name}</h3>
                <p className="text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {selectedProperty.location}
                </p>
              </div>
              <p className="text-slate-300">{selectedProperty.description}</p>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <p className="text-sm text-slate-500">Owner</p>
                  <p className="text-white">{selectedProperty.owner}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="text-white">{selectedProperty.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Property Type</p>
                  <p className="text-white">{selectedProperty.type}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Capacity</p>
                  <p className="text-white">{selectedProperty.capacity} pets</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Services Offered</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedProperty.services.map((service) => (
                    <Badge key={service} variant="outline" className="border-violet-500 text-violet-400">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
              {selectedProperty.status === "rejected" && selectedProperty.rejectionReason && (
                <div className="p-3 rounded-lg bg-red-600/10 border border-red-600/30">
                  <p className="text-sm text-red-400">Rejection Reason: {selectedProperty.rejectionReason}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                {selectedProperty.status === "pending" && (
                  <>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { handleApprove(selectedProperty.id); setViewDialogOpen(false); }}>
                      Approve
                    </Button>
                    <Button variant="destructive" onClick={() => { handleReject(selectedProperty.id); setViewDialogOpen(false); }}>
                      Reject
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setViewDialogOpen(false)} className="border-slate-600 text-slate-300">
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

export default SuperAdminProperties;
