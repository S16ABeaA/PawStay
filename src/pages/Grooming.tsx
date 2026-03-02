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
import { fetchAmenities } from "@/services/amenitiesApi";

const timeSlots = [
  "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00",
];

const Grooming = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 3000]);
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Dynamic Data States
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<any[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [petType, setPetType] = useState<string>("Dog");
  const [dogSize, setDogSize] = useState<string>("Small");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [dateError, setDateError] = useState<string | null>(null);

  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];
  const maxDateISO = "2100-12-31";

  const isValidISODate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split("-").map(Number);
    if (y < 1900 || y > 2100) return false;
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date.toISOString().split("T")[0] === value;
  };

  const validateDates = (ci: string) => {
    if (ci && !isValidISODate(ci)) { setDateError("Invalid appointment date."); return; }
    if (ci && ci < todayISO) { setDateError("Appointment date cannot be in the past."); return; }
    setDateError(null);
  };

  const handleResetAll = () => {
    setLocation("");
    setPetType("Dog");
    setDogSize("Small");
    setPriceRange([0, 3000]);
    setMinRating(null);
    setSelectedAmenities([]);
    setAppointmentDate("");
    setTimeSlot("");
    setDateError(null);
  };

  const loadGrooming = async () => {
    setLoading(true);
    try {
      const data = await fetchProperties({
        propertyType: "grooming",
        serviceCategory: "Grooming",
        location: location.trim() || undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1],
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        rating: minRating ?? undefined,
        petType: petType?.toLowerCase(),
        dogSize: petType === "Dog" && dogSize ? dogSize : undefined,
        checkIn: appointmentDate || undefined,
        timeSlot: timeSlot || undefined,
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

  // Load amenities dynamically
  useEffect(() => {
    fetchAmenities("grooming")
      .then((data) => setAmenitiesList(data || []))
      .catch((err) => console.error("Failed to load amenities:", err));
  }, []);

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

                {/* Pet Type */}
                <div className="pb-6 border-b border-border/50">
                  <label className="text-sm font-semibold text-foreground mb-3 block">Pet Type</label>
                  <div className="flex gap-2">
                    {["Dog", "Cat", "Others"].map((pet) => (
                      <button
                        key={pet}
                        onClick={() => {
                          setPetType(pet);
                          if (pet !== "Dog") setDogSize("Small");
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 active:scale-95 ${
                          petType === pet
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-foreground border-border hover:border-foreground/40 hover:bg-muted"
                        }`}
                      >
                        {pet}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dog Size */}
                {petType === "Dog" && (
                  <div className="pb-6 border-b border-border/50">
                    <label className="text-sm font-semibold text-foreground mb-3 block">Dog Size</label>
                    <div className="flex flex-wrap gap-2">
                      {["Small", "Medium", "Large", "Giant"].map((size) => (
                        <button
                          key={size}
                          onClick={() => setDogSize(size)}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 active:scale-95 ${
                            dogSize === size
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background text-foreground border-border hover:border-foreground/40 hover:bg-muted"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location */}
                <div className="pb-6 border-b border-border/50">
                  <label className="text-sm font-semibold text-foreground mb-3 block">Location</label>
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

                {/* Dates */}
                <div className="pb-6 border-b border-border/50">
                  <label className="text-sm font-semibold text-foreground mb-3 block">Dates</label>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Appointment Date</label>
                      <Input
                        type="date"
                        value={appointmentDate}
                        min={todayISO}
                        max={maxDateISO}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAppointmentDate(val);
                          validateDates(val);
                        }}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Time Slot</label>
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        disabled={!appointmentDate}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                      >
                        <option value="">
                          {appointmentDate ? "Select time" : "Select date first"}
                        </option>
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                    {dateError && (
                      <div className="text-xs text-destructive">{dateError}</div>
                    )}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="text-sm font-semibold text-foreground mb-4 block">
                    Price Range:{" "}
                    <span className="text-primary">
                      ₱{priceRange[0]} - {priceRange[1] === 3000 ? "₱3000+" : `₱${priceRange[1]}`}
                    </span>
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={3000}
                    step={50}
                    className="w-full"
                  />
                </div>

                {/* Rating */}
                <div className="py-6 border-b border-border/50">
                  <label className="text-sm font-semibold text-foreground mb-3 block">Rating</label>
                  <div className="flex gap-2">
                    {[3, 4, 4.5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setMinRating(minRating === r ? null : r)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          minRating === r
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Star className="h-3.5 w-3.5 fill-rating text-rating" />
                        {r}+
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div className="py-6">
                  <label className="text-sm font-semibold text-foreground mb-3 block">Amenities</label>
                  <div className="space-y-3">
                    {amenitiesList.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No amenities available.</div>
                    ) : (
                      amenitiesList.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <Checkbox
                            id={`amenity-${item.id}`}
                            checked={selectedAmenities.includes(item.amenity)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedAmenities([...selectedAmenities, item.amenity]);
                              else setSelectedAmenities(selectedAmenities.filter((a) => a !== item.amenity));
                            }}
                          />
                          <label
                            htmlFor={`amenity-${item.id}`}
                            className="text-sm text-foreground cursor-pointer hover:text-primary transition-colors"
                          >
                            {item.amenity}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Button
                  variant="hero"
                  className="w-full mt-6"
                  onClick={loadGrooming}
                  disabled={Boolean(dateError)}
                >
                  Apply Filters
                </Button>
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
