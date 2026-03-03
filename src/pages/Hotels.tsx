import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HotelCard from "@/components/HotelCard";
import { Button } from "@/components/ui/button";
import { Star, Loader2, ArrowRight, SlidersHorizontal, ArrowUpDown, Grid3X3, List } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { fetchProperties } from "@/services/propertyApi";
import { fetchAmenities } from "@/services/amenitiesApi";

const Hotels = () => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 3000]);
  const [showFilters, setShowFilters] = useState(false);
  const [location, setLocation] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<any[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [petType, setPetType] = useState<string>("Dog");
  const [dogSize, setDogSize] = useState<string>("Small");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
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

  const validateDates = (ci: string, co: string) => {
    if (ci && !isValidISODate(ci)) { setDateError("Invalid check-in date."); return; }
    if (co && !isValidISODate(co)) { setDateError("Invalid check-out date."); return; }
    if (ci && ci < todayISO) { setDateError("Check-in date cannot be in the past."); return; }
    if (co && co < todayISO) { setDateError("Check-out date cannot be in the past."); return; }
    if (ci && co && co <= ci) { setDateError("Check-out must be after check-in."); return; }
    setDateError(null);
  };

  const handleResetAll = () => {
    setLocation("");
    setPetType("Dog");
    setDogSize("Small");
    setPriceRange([0, 3000]);
    setMinRating(null);
    setSelectedAmenities([]);
    setCheckIn("");
    setCheckOut("");
    setDateError(null);
  };

  const loadHotels = async () => {
    setLoading(true);
    try {
      // Pass explicit filters to the API
      const data = await fetchProperties({
        propertyType: "hotel",
        serviceCategory: "Boarding",
        location: location.trim() || undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1],
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        rating: minRating ?? undefined,
        petType: petType?.toLowerCase(),
        dogSize: petType === "Dog" && dogSize ? dogSize : undefined,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
      });
      setHotels(data || []);
    } catch (err) {
      console.error("Filter Error:", err);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  // Run on initial mount
  useEffect(() => {
    loadHotels();
  }, []);

  // Load amenities dynamically
  useEffect(() => {
    fetchAmenities("hotel")
      .then((data) => setAmenitiesList(data || []))
      .catch((err) => console.error("Failed to load amenities:", err));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-accent/10 to-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left Content */}
            <div>
              <Badge className="bg-accent/10 text-accent border-accent/20 mb-4">Pet Hotels</Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Find the Perfect Stay for Your{" "}
                <span className="text-gradient bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                  Furry Friend
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                Discover verified pet-friendly hotels offering comfort, safety, and a home away from home for your beloved pets.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link to="#hotels">
                  <Button variant="hero" size="xl" className="gap-2">
                    Browse Hotels
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="xl" className="gap-2 border-primary text-primary hover:bg-primary/5">
                  View Gallery
                </Button>
              </div>

              {/* Stats Section */}
              <div className="flex gap-8">
                <div>
                  <p className="text-3xl font-bold text-foreground">150+</p>
                  <p className="text-sm text-muted-foreground">Hotels Available</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">50k+</p>
                  <p className="text-sm text-muted-foreground">Pets Hosted</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">4.8★</p>
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
              <div className="absolute -bottom-6 -right-6 bg-card rounded-xl p-4 shadow-elevated border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Featured Hotels</p>
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
          <div className="flex flex-col lg:flex-row gap-8">
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
                  <Input 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                    placeholder="e.g. Makati" 
                    onKeyDown={(e) => e.key === 'Enter' && loadHotels()}
                  />
                </div>

                {/* Dates */}
                <div className="pb-6 border-b border-border/50">
                  <label className="text-sm font-semibold text-foreground mb-3 block">Dates</label>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Check-in</label>
                      <Input
                        type="date"
                        value={checkIn}
                        min={todayISO}
                        max={maxDateISO}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCheckIn(val);
                          validateDates(val, checkOut);
                        }}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Check-out</label>
                      <Input
                        type="date"
                        value={checkOut}
                        min={checkIn || todayISO}
                        max={maxDateISO}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCheckOut(val);
                          validateDates(checkIn, val);
                        }}
                        className="w-full"
                      />
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
                  <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={3000} step={50} className="w-full" />
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
                  onClick={loadHotels}
                  disabled={Boolean(dateError)}
                >
                  Apply Filters
                </Button>
              </div>
            </aside>

            <div className="flex-1">
              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : hotels.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">No hotels found. Try adjusting your filters.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {hotels.map((h) => (
                    <HotelCard key={h.id} hotel={{
                      ...h,
                      image: h.cover_image || "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
                      location: h.city,
                      price: h.cheapest_service_price,
                      amenities: h.property_amenities?.map((a:any) => a.amenities.amenity) || []
                    }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
export default Hotels;
