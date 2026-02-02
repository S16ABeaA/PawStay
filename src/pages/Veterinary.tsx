import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VeterinaryCard from "@/components/VeterinaryCard";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, ArrowUpDown, Grid3X3, List, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

const veterinaryClinics = [
  {
    id: 1,
    name: "PawStay Veterinary Clinic",
    image: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&auto=format&fit=crop",
    location: "Los Angeles, CA",
    rating: 4.9,
    reviews: 523,
    price: 75,
    originalPrice: 95,
    services: ["Wellness Exams", "Vaccinations", "Surgery"],
    featured: true,
    availability: "Open Today",
    emergency: true,
  },
  {
    id: 2,
    name: "Happy Pets Animal Hospital",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&auto=format&fit=crop",
    location: "San Francisco, CA",
    rating: 4.8,
    reviews: 387,
    price: 65,
    services: ["Wellness Exams", "Vaccinations"],
    featured: false,
    availability: "Available",
  },
  {
    id: 3,
    name: "City Vet Care Center",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop",
    location: "Seattle, WA",
    rating: 4.7,
    reviews: 245,
    price: 55,
    services: ["Wellness Exams", "Vaccinations", "Emergency"],
    featured: true,
    availability: "3 slots left",
    emergency: true,
  },
  {
    id: 4,
    name: "Premium Pet Medical",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop",
    location: "New York, NY",
    rating: 4.9,
    reviews: 612,
    price: 95,
    originalPrice: 120,
    services: ["Wellness Exams", "Surgery", "Vaccinations"],
    featured: false,
    availability: "1 slot left",
  },
  {
    id: 5,
    name: "Companion Animal Clinic",
    image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&auto=format&fit=crop",
    location: "Chicago, IL",
    rating: 4.6,
    reviews: 178,
    price: 50,
    services: ["Wellness Exams", "Vaccinations"],
    featured: false,
    availability: "Available",
  },
  {
    id: 6,
    name: "Coastal Veterinary Hospital",
    image: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop",
    location: "Miami, FL",
    rating: 4.8,
    reviews: 423,
    price: 80,
    services: ["Wellness Exams", "Surgery", "Emergency"],
    featured: true,
    availability: "Open Today",
    emergency: true,
  },
  {
    id: 7,
    name: "Mountain View Pet Clinic",
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&auto=format&fit=crop",
    location: "Denver, CO",
    rating: 4.5,
    reviews: 134,
    price: 45,
    services: ["Wellness Exams", "Vaccinations"],
    featured: false,
    availability: "Available",
  },
  {
    id: 8,
    name: "Austin Pet Health Center",
    image: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=800&auto=format&fit=crop",
    location: "Austin, TX",
    rating: 4.7,
    reviews: 289,
    price: 60,
    services: ["Wellness Exams", "Vaccinations", "Surgery"],
    featured: true,
    availability: "2 slots left",
  },
];

const Veterinary = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 150]);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="container">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Veterinary Clinics
            </h1>
            <p className="text-muted-foreground">
              Find trusted veterinary care for your pet from {veterinaryClinics.length} available clinics
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className={`lg:w-72 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-card rounded-2xl p-6 shadow-soft sticky top-24">
                <h3 className="font-semibold text-lg mb-6">Filters</h3>

                {/* Location */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-2 block">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Enter city or area" className="pl-10" />
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-4 block">
                    Consultation Fee: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={200}
                    step={10}
                    className="w-full"
                  />
                </div>

                {/* Rating */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-3 block">Minimum Rating</label>
                  <div className="flex gap-2">
                    {[3, 4, 4.5].map((rating) => (
                      <button
                        key={rating}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-sm transition-colors"
                      >
                        <Star className="h-3.5 w-3.5 fill-rating text-rating" />
                        {rating}+
                      </button>
                    ))}
                  </div>
                </div>

                {/* Services */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-3 block">Services</label>
                  <div className="space-y-3">
                    {["Wellness Exams", "Vaccinations", "Surgery", "Emergency Care", "Dental Care"].map((service) => (
                      <div key={service} className="flex items-center gap-2">
                        <Checkbox id={service} />
                        <label htmlFor={service} className="text-sm text-muted-foreground cursor-pointer">
                          {service}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emergency */}
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <Checkbox id="emergency" />
                    <label htmlFor="emergency" className="text-sm text-muted-foreground cursor-pointer">
                      24/7 Emergency Services
                    </label>
                  </div>
                </div>

                <Button variant="hero" className="w-full">Apply Filters</Button>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Controls */}
              <div className="flex items-center justify-between mb-6">
                <Button 
                  variant="outline" 
                  className="lg:hidden gap-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>

                <div className="flex items-center gap-2 ml-auto">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Sort
                  </Button>
                  <div className="hidden md:flex items-center gap-1 p-1 bg-secondary rounded-lg">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === "grid" ? "bg-card shadow-sm" : "hover:bg-card/50"
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === "list" ? "bg-card shadow-sm" : "hover:bg-card/50"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Veterinary Grid */}
              <div className={`grid gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
                  : "grid-cols-1"
              }`}>
                {veterinaryClinics.map((clinic) => (
                  <VeterinaryCard key={clinic.id} clinic={clinic} />
                ))}
              </div>

              {/* Load More */}
              <div className="text-center mt-10">
                <Button variant="outline" size="lg">
                  Load More Clinics
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Veterinary;
