import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GroomingCard from "@/components/GroomingCard";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, ArrowUpDown, Grid3X3, List, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

const groomingShops = [
  {
    id: 1,
    name: "Pawsome Grooming Spa",
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&auto=format&fit=crop",
    location: "Los Angeles, CA",
    rating: 4.9,
    reviews: 412,
    price: 45,
    originalPrice: 60,
    services: ["Full Grooming", "Bath & Dry", "Nail Trim"],
    featured: true,
    availability: "Open Today",
  },
  {
    id: 2,
    name: "Fluffy Tails Salon",
    image: "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=800&auto=format&fit=crop",
    location: "San Francisco, CA",
    rating: 4.8,
    reviews: 287,
    price: 55,
    services: ["Full Grooming", "De-shedding", "Nail Trim"],
    featured: false,
    availability: "Available",
  },
  {
    id: 3,
    name: "The Pampered Pup",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop",
    location: "Seattle, WA",
    rating: 4.7,
    reviews: 156,
    price: 40,
    services: ["Bath & Dry", "Nail Trim"],
    featured: true,
    availability: "2 slots left",
  },
  {
    id: 4,
    name: "Luxury Pet Grooming",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop",
    location: "New York, NY",
    rating: 4.9,
    reviews: 523,
    price: 85,
    originalPrice: 110,
    services: ["Full Grooming", "Bath & Dry", "De-shedding", "Nail Trim"],
    featured: false,
    availability: "1 slot left",
  },
  {
    id: 5,
    name: "Happy Paws Grooming",
    image: "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=800&auto=format&fit=crop",
    location: "Chicago, IL",
    rating: 4.6,
    reviews: 198,
    price: 38,
    services: ["Bath & Dry", "Nail Trim"],
    featured: false,
    availability: "Available",
  },
  {
    id: 6,
    name: "Elite Pet Spa",
    image: "https://images.unsplash.com/photo-1587559070757-f72a388edbba?w=800&auto=format&fit=crop",
    location: "Miami, FL",
    rating: 4.8,
    reviews: 334,
    price: 75,
    services: ["Full Grooming", "Bath & Dry", "De-shedding"],
    featured: true,
    availability: "Open Today",
  },
  {
    id: 7,
    name: "Whiskers & Wags",
    image: "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&auto=format&fit=crop",
    location: "Denver, CO",
    rating: 4.5,
    reviews: 87,
    price: 35,
    services: ["Bath & Dry", "Nail Trim"],
    featured: false,
    availability: "Available",
  },
  {
    id: 8,
    name: "Premier Pet Styling",
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop",
    location: "Austin, TX",
    rating: 4.7,
    reviews: 245,
    price: 52,
    services: ["Full Grooming", "Bath & Dry", "Nail Trim"],
    featured: true,
    availability: "3 slots left",
  },
];

const Grooming = () => {
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
              Pet Grooming Services
            </h1>
            <p className="text-muted-foreground">
              Find the best grooming salons for your furry friend from {groomingShops.length} available locations
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
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
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
                    {["Full Grooming", "Bath & Dry", "Nail Trim", "De-shedding", "Teeth Cleaning"].map((service) => (
                      <div key={service} className="flex items-center gap-2">
                        <Checkbox id={service} />
                        <label htmlFor={service} className="text-sm text-muted-foreground cursor-pointer">
                          {service}
                        </label>
                      </div>
                    ))}
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

              {/* Grooming Grid */}
              <div className={`grid gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
                  : "grid-cols-1"
              }`}>
                {groomingShops.map((shop) => (
                  <GroomingCard key={shop.id} grooming={shop} />
                ))}
              </div>

              {/* Load More */}
              <div className="text-center mt-10">
                <Button variant="outline" size="lg">
                  Load More Grooming Salons
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

export default Grooming;
