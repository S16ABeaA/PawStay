import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HotelCard from "@/components/HotelCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  SlidersHorizontal, ArrowUpDown, Grid3X3, List, 
  MapPin, Star, Search
} from "lucide-react";
import { useState, useEffect } from "react";

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
];

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const location = searchParams.get("location") || "";

  const rawPet = searchParams.get("pet") || "Dog";
  const defaultPet = rawPet.charAt(0).toUpperCase() + rawPet.slice(1).toLowerCase();
  const defaultService = (searchParams.get("service") as "hotel" | "grooming" | "vet") || "hotel";
  const defaultMinPrice = Number(searchParams.get("minPrice")) || 0;
  const defaultMaxPrice = Number(searchParams.get("maxPrice")) || 150;
  const defaultRating = Number(searchParams.get("rating")) || null;
  const defaultAmenities = searchParams.get("amenities")?.split(",") || [];

  // States
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [selectedPet, setSelectedPet] = useState(defaultPet);
  const [selectedService, setSelectedService] = useState<"hotel" | "grooming" | "vet" | null>(defaultService);
  const [priceRange, setPriceRange] = useState([defaultMinPrice, defaultMaxPrice]);
  const [selectedRating, setSelectedRating] = useState<number | null>(defaultRating);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(defaultAmenities);

  // Reset all filters
  const handleResetAll = () => {
    setSelectedPet(defaultPet);
    setSelectedService(defaultService);
    setPriceRange([0, 150]);
    setSelectedRating(null);
    setSelectedAmenities([]);
    navigate(`/search?location=${location}&pet=${defaultPet}`);
  };

  // Apply filters (update URL)
  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (selectedPet) params.set("pet", selectedPet);
    if (selectedService) params.set("service", selectedService);
    if (priceRange) {
      params.set("minPrice", String(priceRange[0]));
      params.set("maxPrice", String(priceRange[1]));
    }
    if (selectedRating) params.set("rating", String(selectedRating));
    if (selectedAmenities.length) params.set("amenities", selectedAmenities.join(","));
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="container">
          {/* Search Bar */}
          <div className="bg-card rounded-2xl p-4 shadow-soft mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input defaultValue={location} placeholder="Where are you going?" className="pl-10" />
              </div>
              <Button variant="hero" className="gap-2">
                <Search className="h-5 w-5" />
                Search
              </Button>
            </div>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              {location ? `Pet Hotels in ${location}` : "Search Results"}
            </h1>
            <p className="text-muted-foreground">{hotels.length} properties found</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:w-72 shrink-0">
              <div className="bg-card rounded-2xl p-6 shadow-soft">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-lg">Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleResetAll}
                  >
                    Reset All
                  </Button>
                </div>

                {/* Service Type */}
                <div className="pb-6 border-b border-border/50">
                  <label className="text-sm font-semibold text-foreground mb-3 block">Service Type</label>
                  <div className="flex gap-2">
                    {[
                      { value: "hotel" as const, label: "Hotel" },
                      { value: "grooming" as const, label: "Grooming" },
                      { value: "vet" as const, label: "Veterinary" },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setSelectedService(selectedService === value ? null : value)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedService === value
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        } ${value === defaultService && selectedService !== value ? 'ring-2 ring-primary/20' : ''}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pet Type */}
                <div className="pb-6 border-b border-border/50">
                  <label className="text-sm font-semibold text-foreground mb-3 block">Pet Type</label>
                  <div className="flex gap-2">
                    {["Dog", "Cat"].map((pet) => (
                      <button
                        key={pet}
                        onClick={() => setSelectedPet(pet)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedPet === pet
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        } ${pet === defaultPet ? 'ring-2 ring-primary/20' : ''}`}
                      >
                        {pet}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="text-sm font-semibold text-foreground mb-4 block">
                    Price Range: <span className="text-primary">${priceRange[0]} - ${priceRange[1]}</span>
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
                <div className="py-6 border-b border-border/50">
                  <label className="text-sm font-semibold text-foreground mb-3 block">Rating</label>
                  <div className="flex gap-2">
                    {[3, 4, 4.5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          selectedRating === rating
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Star className="h-3.5 w-3.5 fill-rating text-rating" />
                        {rating}+
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div className="py-6">
                  <label className="text-sm font-semibold text-foreground mb-3 block">Amenities</label>
                  <div className="space-y-3">
                    {["WiFi", "24/7 Care", "Vet On-site", "Parking", "Grooming"].map((amenity) => (
                      <div key={amenity} className="flex items-center gap-3">
                        <Checkbox
                          id={`search-${amenity}`}
                          checked={selectedAmenities.includes(amenity)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedAmenities([...selectedAmenities, amenity]);
                            else setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
                          }}
                        />
                        <label
                          htmlFor={`search-${amenity}`}
                          className="text-sm text-foreground cursor-pointer hover:text-primary transition-colors"
                        >
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button variant="hero" className="w-full mt-6" onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Controls */}
              <div className="flex items-center justify-between mb-6">
                

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

              {/* Results */}
              <div
                className={`grid gap-6 ${
                  viewMode === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {hotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>

              {/* Load More */}
              <div className="text-center mt-10">
                <Button variant="outline" size="lg">
                  Load More Results
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

export default SearchResults;
