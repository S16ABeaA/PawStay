import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MapPin,
  Star,
  CheckCircle,
  XCircle,
  Eye,
  Building2,
} from "lucide-react";

const properties = [
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
  },
];

const SuperAdminProperties = () => {
  const pendingCount = properties.filter((p) => p.status === "pending").length;

  return (
    <SuperAdminLayout title="Properties" subtitle="Review and manage listed properties">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search properties..."
            className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
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

        <TabsContent value="pending" className="space-y-4">
          {properties
            .filter((p) => p.status === "pending")
            .map((property) => (
              <Card key={property.id} className="bg-slate-900 border-slate-800">
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
                        <Badge className="bg-amber-600/20 text-amber-400">
                          {property.status}
                        </Badge>
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
                        <Button size="sm" variant="outline" className="gap-2 border-slate-700 text-slate-300">
                          <Eye className="h-4 w-4" />
                          Review
                        </Button>
                        <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-2">
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {properties
            .filter((p) => p.status === "approved")
            .map((property) => (
              <Card key={property.id} className="bg-slate-900 border-slate-800">
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
                          <Badge className="bg-emerald-600/20 text-emerald-400">
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="rejected">
          <p className="text-slate-400">Rejected properties...</p>
        </TabsContent>

        <TabsContent value="all">
          <p className="text-slate-400">All properties...</p>
        </TabsContent>
      </Tabs>
    </SuperAdminLayout>
  );
};

export default SuperAdminProperties;
