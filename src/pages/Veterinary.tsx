import { useState, useEffect, useRef, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VeterinaryCard from "@/components/VeterinaryCard";
import { fetchProperties } from "@/services/propertyApi";
import { fetchAmenities } from "@/services/amenitiesApi";
import { Loader2, Star, ArrowRight, SlidersHorizontal, ArrowUpDown, Grid3X3, List } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

const timeSlots = [
  "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00",
];

const Veterinary = () => {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 3000]);
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<any[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [petTypes, setPetTypes] = useState<string[]>(["Dog"]);
  const [dogSizes, setDogSizes] = useState<string[]>(["Small"]);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [dateError, setDateError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const PAGE_SIZE = 9;
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  type SortOption = "default" | "price-asc" | "price-desc" | "rating-desc" | "name-asc" | "distance-asc";
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const sortLabels: Record<SortOption, string> = {
    default: "Default",
    "price-asc": "Price: Low to High",
    "price-desc": "Price: High to Low",
    "rating-desc": "Rating: High to Low",
    "name-asc": "Name: A to Z",
    "distance-asc": "Distance: Near to Far",
  };

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
    setPetTypes(["Dog"]);
    setDogSizes(["Small"]);
    setPriceRange([0, 3000]);
    setMinRating(null);
    setSelectedAmenities([]);
    setAppointmentDate("");
    setTimeSlot("");
    setDateError(null);
  };

  // Reset UI and reload results, then scroll to results
  const handleResetAllAndReload = () => {
    handleResetAll();
    loadClinics();
    setTimeout(() => {
      const el = resultsRef.current;
      if (!el) return;
      const header = document.querySelector('header');
      const offset = (header?.clientHeight ?? 0) + 8;
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }, 120);
  };

  const loadClinics = async () => {
    setLoading(true);
    try {
      // Pass explicit filters to the API
      const data = await fetchProperties({
        propertyType: "veterinary",
        serviceCategory: "Veterinary",
        location: location.trim() || undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1],
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        rating: minRating ?? undefined,
        petType: petTypes.length > 0 ? petTypes.map(p => p.toLowerCase()) : undefined,
        dogSize: petTypes.includes("Dog") && dogSizes.length > 0 ? dogSizes : undefined,
        checkIn: appointmentDate || undefined,
        timeSlot: timeSlot || undefined,
      });
      setClinics(data || []);
      setDisplayCount(PAGE_SIZE);
    } catch (err) {
      console.error("Filter Error:", err);
      setClinics([]);
    } finally {
      setLoading(false);
    }
  };

  // Run on initial mount
  useEffect(() => {
    loadClinics();
  }, []);

  // Load amenities dynamically
  useEffect(() => {
    fetchAmenities("veterinary")
      .then((data) => setAmenitiesList(data || []))
      .catch((err) => console.error("Failed to load amenities:", err));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-success/10 to-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left Content */}
            <div>
              <Badge className="bg-success/10 text-success border-success/20 mb-4">Veterinary Care</Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Find Expert Care for Your{" "}
                <span className="text-gradient bg-gradient-to-r from-green-400 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                  Beloved Pets
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                Connect with trusted veterinary clinics offering compassionate, comprehensive care for all your pet's health needs.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link to="#clinics">
                  <Button variant="hero" size="xl" className="gap-2 bg-green-600 hover:bg-green-700">
                    Browse Clinics
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="xl" className="gap-2 border-green-600 text-green-600 hover:bg-green-50">
                  View Gallery
                </Button>
              </div>

              {/* Stats Section */}
              <div className="flex gap-8">
                <div>
                  <p className="text-3xl font-bold text-foreground">80+</p>
                  <p className="text-sm text-muted-foreground">Clinics Available</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">30k+</p>
                  <p className="text-sm text-muted-foreground">Pets Treated</p>
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
                src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600&auto=format&fit=crop"
                alt="Veterinary care"
                className="rounded-2xl shadow-elevated"
              />
              {/* Floating Info Card */}
              <div className="absolute -bottom-6 -right-6 bg-card rounded-xl p-4 shadow-elevated border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Star className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Featured Clinics</p>
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
            {/* Filters Sidebar */}
            <aside className={`lg:w-72 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-card rounded-2xl p-6 shadow-soft">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-lg">Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleResetAllAndReload}
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
                          setPetTypes(prev =>
                            prev.includes(pet)
                              ? prev.filter(p => p !== pet)
                              : [...prev, pet]
                          );
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 active:scale-95 ${
                          petTypes.includes(pet)
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
                {petTypes.includes("Dog") && (
                  <div className="pb-6 border-b border-border/50">
                    <label className="text-sm font-semibold text-foreground mb-3 block">Dog Size</label>
                    <div className="flex flex-wrap gap-2">
                      {["Small", "Medium", "Large", "Giant"].map((size) => (
                        <button
                          key={size}
                          onClick={() => setDogSizes(prev =>
                            prev.includes(size)
                              ? prev.filter(s => s !== size)
                              : [...prev, size]
                          )}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 active:scale-95 ${
                            dogSizes.includes(size)
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
                    onKeyDown={(e) => e.key === 'Enter' && loadClinics()}
                  />
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
                  onClick={() => {
                    loadClinics();
                    setTimeout(() => {
                      const el = resultsRef.current;
                      if (!el) return;
                      const header = document.querySelector('header');
                      const offset = (header?.clientHeight ?? 0) + 8;
                      const y = el.getBoundingClientRect().top + window.scrollY - offset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }, 120);
                  }}
                  disabled={Boolean(dateError)}
                >
                  Apply Filters
                </Button>
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1" ref={resultsRef}>
              <div className="flex items-center justify-between mb-6">
                <div />
                <div className="flex items-center gap-2 ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={sortBy !== "default" ? "default" : "outline"}
                        size="sm"
                        className="gap-2"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                        {sortBy === "default" ? "Sort" : sortLabels[sortBy]}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {Object.keys(sortLabels).map((option) => (
                        <DropdownMenuItem
                          key={option}
                          onClick={() => setSortBy(option as any)}
                          className={sortBy === option ? "bg-accent font-medium" : ""}
                        >
                          {sortLabels[option as keyof typeof sortLabels]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

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
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <h2 className="text-2xl font-bold">Veterinary Clinics</h2>
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : clinics.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">No clinics found. Try adjusting your filters.</div>
              ) : (
                <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
                  {(() => {
                    const list = [...clinics];
                    const getPrice = (p: any) => Number(p?.cheapest_service_price ?? 0);
                    const getRating = (p: any) => Number(p?.rating ?? 0);
                    const getName = (p: any) => String(p?.name ?? "");
                    switch (sortBy) {
                      case "price-asc":
                        list.sort((a, b) => getPrice(a) - getPrice(b));
                        break;
                      case "price-desc":
                        list.sort((a, b) => getPrice(b) - getPrice(a));
                        break;
                      case "rating-desc":
                        list.sort((a, b) => getRating(b) - getRating(a));
                        break;
                      case "name-asc":
                        list.sort((a, b) => getName(a).localeCompare(getName(b)));
                        break;
                      default:
                        break;
                    }

                    return list.slice(0, displayCount).map((c) => (
                      <VeterinaryCard key={c.id} clinic={{
                        ...c,
                        image: c.cover_image || "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800",
                        location: c.city,
                        price: c.cheapest_service_price,
                        services: ["Consultation", "Vaccination"],
                        rating: c.rating || 0,
                        reviews: c.review_count || 0
                      }} />
                    ));
                  })()}
                </div>
              )}
              {/* Load More */}
              {clinics.length > displayCount && (
                <div className="text-center mt-10">
                  <Button variant="outline" size="lg" onClick={() => setDisplayCount(c => Math.min(c + PAGE_SIZE, clinics.length))}>
                    Load More Clinics
                  </Button>
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
export default Veterinary;
