import { useSearchParams } from "react-router-dom";
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
import { useState } from "react";

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
  const location = searchParams.get("location") || "";
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 150]);
  const [showFilters, setShowFilters] = useState(false);

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
                <Input 
                  defaultValue={location}
                  placeholder="Where are you going?" 
                  className="pl-10"
                />
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
            <p className="text-muted-foreground">
              {hotels.length} properties found
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className={`lg:w-72 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-card rounded-2xl p-6 shadow-soft sticky top-24">
                <h3 className="font-semibold text-lg mb-6">Filters</h3>

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
                  <label className="text-sm font-medium text-foreground mb-3 block">Rating</label>
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
                        <Checkbox id={`search-${amenity}`} />
                        <label htmlFor={`search-${amenity}`} className="text-sm text-muted-foreground cursor-pointer">
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

              {/* Results */}
              <div className={`grid gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 md:grid-cols-2" 
                  : "grid-cols-1"
              }`}>
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
