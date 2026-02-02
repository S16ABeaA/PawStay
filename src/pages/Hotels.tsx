import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HotelCard from "@/components/HotelCard";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, ArrowUpDown, Grid3X3, List, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

const hotels = [
  {
    id: 1,
    name: "Pawsome Paradise Resort",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop",
    location: "Los Angeles, CA",
    rating: 4.9,
    reviews: 328,
    price: 65,
    originalPrice: 85,
    amenities: ["WiFi", "24/7 Care", "Vet On-site", "Parking"],
    featured: true,
    availability: "3 rooms left",
  },
  {
    id: 2,
    name: "Happy Tails Pet Hotel",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop",
    location: "San Francisco, CA",
    rating: 4.8,
    reviews: 256,
    price: 55,
    amenities: ["WiFi", "Parking", "24/7 Care"],
    featured: false,
    availability: "Available",
  },
  {
    id: 3,
    name: "The Paw Retreat",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop",
    location: "Seattle, WA",
    rating: 4.7,
    reviews: 189,
    price: 48,
    amenities: ["24/7 Care", "Vet On-site"],
    featured: true,
    availability: "5 rooms left",
  },
  {
    id: 4,
    name: "Luxury Pet Suites",
    image: "https://images.unsplash.com/photo-1587559070757-f72a388edbba?w=800&auto=format&fit=crop",
    location: "New York, NY",
    rating: 4.9,
    reviews: 412,
    price: 89,
    originalPrice: 110,
    amenities: ["WiFi", "24/7 Care", "Parking", "Vet On-site"],
    featured: false,
    availability: "1 room left",
  },
  {
    id: 5,
    name: "Cozy Paws Inn",
    image: "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=800&auto=format&fit=crop",
    location: "Chicago, IL",
    rating: 4.6,
    reviews: 145,
    price: 42,
    amenities: ["WiFi", "Parking"],
    featured: false,
    availability: "Available",
  },
  {
    id: 6,
    name: "Pet Palace Resort",
    image: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800&auto=format&fit=crop",
    location: "Miami, FL",
    rating: 4.8,
    reviews: 278,
    price: 72,
    amenities: ["WiFi", "24/7 Care", "Vet On-site"],
    featured: true,
    availability: "Available",
  },
  {
    id: 7,
    name: "Furry Friends Lodge",
    image: "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&auto=format&fit=crop",
    location: "Denver, CO",
    rating: 4.5,
    reviews: 98,
    price: 38,
    amenities: ["WiFi", "Parking"],
    featured: false,
    availability: "Available",
  },
  {
    id: 8,
    name: "Premium Pet Resort",
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop",
    location: "Austin, TX",
    rating: 4.7,
    reviews: 203,
    price: 58,
    amenities: ["WiFi", "24/7 Care", "Vet On-site", "Parking"],
    featured: true,
    availability: "2 rooms left",
  },
];

const Hotels = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 150]);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-accent/10 to-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div>
              <Badge className="bg-accent/10 text-accent border-accent/20 mb-4">
                Pet Hotels
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Find the Perfect Stay for Your{" "}
                <span className="text-gradient">Furry Friend</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Discover pet-friendly hotels and resorts offering comfort, safety, and top-notch amenities 
                so your pet enjoys a happy and stress-free stay.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Button variant="hero" size="xl" className="gap-2">
                  Browse Hotels
                </Button>
                <Button variant="outline" size="xl" className="gap-2">
                  Contact: (555) PET-CARE
                </Button>
              </div>

              <div className="flex gap-8">
                <div>
                  <p className="text-3xl font-bold text-foreground">8+</p>
                  <p className="text-sm text-muted-foreground">Cities Covered</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">50+</p>
                  <p className="text-sm text-muted-foreground">Hotels Available</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">4.9★</p>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&auto=format&fit=crop"
                alt="Pet hotel"
                className="rounded-2xl shadow-elevated"
              />
              {/* Floating Info Card */}
              <div className="absolute -bottom-6 -right-6 bg-card rounded-xl p-4 shadow-elevated">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Star className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">Available Rooms</p>
                    <p className="text-sm text-muted-foreground">2–5 per hotel</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <main className="py-8">
        <div className="container">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Pet Hotels
            </h1>
            <p className="text-muted-foreground">
              Find the perfect stay for your furry friend from {hotels.length} available hotels
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

                {/* Amenities */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-3 block">Amenities</label>
                  <div className="space-y-3">
                    {["WiFi", "24/7 Care", "Vet On-site", "Parking", "Grooming"].map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2">
                        <Checkbox id={amenity} />
                        <label htmlFor={amenity} className="text-sm text-muted-foreground cursor-pointer">
                          {amenity}
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

              {/* Hotels Grid */}
              <div className={`grid gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
                  : "grid-cols-1"
              }`}>
                {hotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>

              {/* Load More */}
              <div className="text-center mt-10">
                <Button variant="outline" size="lg">
                  Load More Hotels
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

export default Hotels;
