import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GroomingCard from "@/components/GroomingCard";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, ArrowUpDown, Grid3X3, List, MapPin, Star, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { fetchProperties } from "@/services/propertyApi";

const AMENITIES_LIST = [
  "Air Conditioning", "CCTV Monitoring", "Pick-up & Drop-off", "Waiting Lounge",
  "Parking", "X-Ray", "Laboratory", "Surgery Room", "Pharmacy", "Emergency Room",
  "Veterinary Clinic", "Pet Shop", "Isolation ward", "Vaccinations", "Veterinary technicians",
];

const Grooming = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Dynamic Data States
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);

  const loadGrooming = async () => {
    setLoading(true);
    try {
      const data = await fetchProperties({
        propertyType: "grooming",
        serviceCategory: "Grooming",
        location: location.trim() || undefined,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        rating: minRating || undefined,
      });
      setShops(data || []);
    } catch (err) {
      console.error("Grooming Fetch Error:", err);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadGrooming();
  }, []);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
       {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-orange-100/20 to-background">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Content */}
              <div>
                <Badge className="bg-orange-100 text-orange-600 border-orange-200 mb-4">
                  Professional Pet Grooming
                </Badge>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                  Find Grooming Services for Your{" "}
                  <span className="text-gradient bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                    Furry Friend
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                  Connect with certified grooming salons offering top-quality services to keep your 
                  pet looking and feeling their absolute best.
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  <Link to="#salons">
                    <Button variant="hero" size="xl" className="gap-2 bg-orange-500 hover:bg-orange-600">
                      Browse Salons
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="xl" className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50">
                    View Gallery
                  </Button>
                </div>

                {/* Stats Section */}
                <div className="flex gap-8">
                  <div>
                    <p className="text-3xl font-bold text-foreground">100+</p>
                    <p className="text-sm text-muted-foreground">Salons Available</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">20k+</p>
                    <p className="text-sm text-muted-foreground">Pets Groomed</p>
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
                  src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&auto=format&fit=crop"
                  alt="Pet grooming"
                  className="rounded-2xl shadow-elevated"
                />
                {/* Floating Info Card */}
                <div className="absolute -bottom-6 -right-6 bg-card rounded-xl p-4 shadow-elevated border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <Star className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Featured Salons</p>
                      <p className="text-sm text-muted-foreground">Top-rated and trusted</p>
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
              Pet Grooming Services
            </h1>
            <p className="text-muted-foreground">
              Find the best grooming salons for your furry friend
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className={`lg:w-72 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-card rounded-2xl p-6 shadow-soft sticky top-24 border">
                <h3 className="font-semibold text-lg mb-6">Filters</h3>

                {/* Location */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-2 block">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="e.g. Taguig" 
                      className="pl-10" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadGrooming()}
                    />
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-4 block">
                    Price: ₱{priceRange[0]} - ₱{priceRange[1]}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={5000}
                    step={50}
                    className="w-full"
                  />
                </div>

                {/* Rating */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-3 block">Minimum Rating</label>
                  <div className="flex gap-2">
                    {[3, 4, 4.5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setMinRating(minRating === r ? null : r)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          minRating === r
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary hover:bg-secondary/80"
                        }`}
                      >
                        <Star className="h-3.5 w-3.5 fill-rating text-rating" />
                        {r}+
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-3 block">Amenities</label>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {AMENITIES_LIST.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2">
                        <Checkbox
                          id={`amenity-${amenity}`}
                          checked={selectedAmenities.includes(amenity)}
                          onCheckedChange={() => toggleAmenity(amenity)}
                        />
                        <label htmlFor={`amenity-${amenity}`} className="text-sm text-muted-foreground cursor-pointer">
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button variant="hero" className="w-full" onClick={loadGrooming}>Apply Filters</Button>
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
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : shops.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  No grooming salons found in this area/price range.
                </div>
              ) : (
                <div className={`grid gap-6 ${
                  viewMode === "grid" 
                    ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
                    : "grid-cols-1"
                }`}>
                  {shops.map((shop) => (
                    <GroomingCard 
                      key={shop.id} 
                      grooming={{
                        id: shop.id,
                        name: shop.name,
                        image: shop.cover_image || "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800",
                        location: shop.city || shop.address,
                        rating: shop.rating || 0,
                        reviews: shop.review_count || 0,
                        price: shop.cheapest_service_price || 0,
                        services: ["Full Grooming", "Bath & Dry"],
                        availability: "Available"
                      }} 
                    />
                  ))}
                </div>
              )}

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
