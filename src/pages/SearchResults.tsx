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
  Star, Search, MapPin
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { fetchProperties } from "@/services/propertyApi";
import { LocationInput } from "@/components/LocationInput";
import { fetchAmenities } from "@/services/amenitiesApi";
import { reverseGeocode } from "@/services/reverseGeocode";
import ScrollToTop from "@/components/ScrollToTop";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

type Amenity = {
  id: string;
  amenity: string;
  category?: string;
  service_types?: string[];
};

type SortOption = "default" | "price-asc" | "price-desc" | "rating-desc" | "name-asc" | "distance-asc";

const sortLabels: Record<SortOption, string> = {
  default: "Default",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "rating-desc": "Rating: High to Low",
  "name-asc": "Name: A to Z",
  "distance-asc": "Distance: Near to Far"
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [location, setLocation] = useState(searchParams.get("location") || "");

  const rawPet = searchParams.get("pet") || "Dog";
  const defaultPet = rawPet.charAt(0).toUpperCase() + rawPet.slice(1).toLowerCase();
  const defaultDogSize = searchParams.get("dogSize") || "Small";
  const defaultService = (searchParams.get("service") as "hotel" | "grooming" | "vet") || "hotel";
  const defaultMinPrice = Number(searchParams.get("minPrice")) || 0;
  const defaultMaxPrice = Number(searchParams.get("maxPrice")) || 1000;
  const defaultRating = Number(searchParams.get("rating")) || null;
  const defaultAmenities = searchParams.get("amenities")?.split(",") || [];
  const defaultCheckIn = searchParams.get("checkIn") || "";
  const defaultCheckOut = searchParams.get("checkOut") || "";
  const defaultKeyword = searchParams.get("keyword") || "";

  // States
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [selectedPet, setSelectedPet] = useState(defaultPet);
  const [selectedDogSize, setSelectedDogSize] = useState(defaultDogSize);

  const [selectedService, setSelectedService] = useState<"hotel" | "grooming" | "vet" | null>(defaultService);
  const [priceRange, setPriceRange] = useState([defaultMinPrice, defaultMaxPrice]);
  const [selectedRating, setSelectedRating] = useState<number | null>(defaultRating);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(defaultAmenities);
  const [checkInDate, setCheckInDate] = useState(defaultCheckIn);
  const [checkOutDate, setCheckOutDate] = useState(defaultCheckOut);
  const [searchLocation, setSearchLocation] = useState(location);
  const [keyword, setKeyword] = useState(defaultKeyword);
  const [scrollKey, setScrollKey] = useState(0);

  // Applied filters (only updated on Apply Filters)
  const [appliedFilters, setAppliedFilters] = useState({
    location,
    pet: defaultPet,
    dogSize: defaultDogSize,
    service: defaultService,
    priceRange: [defaultMinPrice, defaultMaxPrice] as [number, number],
    rating: defaultRating as number | null,
    amenities: defaultAmenities as string[],
    checkIn: defaultCheckIn,
    checkOut: defaultCheckOut,
    keyword: defaultKeyword,
  });
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  const validateDates = (checkIn: string, checkOut: string) => {
    if (checkIn && !isValidISODate(checkIn)) {
      setDateError("Invalid check-in date. Use a valid date between 1900–2100.");
      return;
    }
    if (checkOut && !isValidISODate(checkOut)) {
      setDateError("Invalid check-out date. Use a valid date between 1900–2100.");
      return;
    }
    if (checkIn && checkIn < todayISO) {
      setDateError("Check-in date cannot be in the past.");
      return;
    }
    if (checkOut && checkOut < todayISO) {
      setDateError("Check-out date cannot be in the past.");
      return;
    }
    if (checkIn && checkOut && checkOut <= checkIn) {
      setDateError("Check-out must be after check-in.");
      return;
    }
    setDateError(null);
  };

  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [amenitiesLoading, setAmenitiesLoading] = useState(false);

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [sortBy, setSortBy] = useState<SortOption>("default");

  useEffect(() => {
    setSearchLocation(location);
  }, [location]);

  useEffect(() => {
    const runSearch = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const {
          location: appliedLocation,
          pet: appliedPet,
          dogSize: appliedDogSize,
          service: appliedService,
          priceRange: appliedPriceRange,
          rating: appliedRating,
          amenities: appliedAmenities,
          checkIn: appliedCheckIn,
          checkOut: appliedCheckOut,
          keyword: appliedKeyword,
        } = appliedFilters;

        // Map UI service to property_type and service category
        const propertyTypeMap: Record<string, string> = {
          hotel: "hotel",
          grooming: "grooming",
          vet: "veterinary",
          veterinary: "veterinary",
        };
        const serviceCategoryMap: Record<string, string> = {
          hotel: "Boarding",
          grooming: "Grooming",
          vet: "Veterinary",
          veterinary: "Veterinary",
        };
        const mappedPropertyType = appliedService
          ? propertyTypeMap[appliedService.toLowerCase()] || appliedService.toLowerCase()
          : undefined;
        const mappedServiceCategory = appliedService
          ? serviceCategoryMap[appliedService.toLowerCase()] || undefined
          : undefined;

          console.log("[SearchResults] Fetching properties with filters:", { mappedPropertyType, mappedServiceCategory, ...appliedFilters });

        const results = await fetchProperties({
          location: appliedLocation,
          petType: appliedPet?.toLowerCase(),
          dogSize: appliedDogSize,
          propertyType: mappedPropertyType,
          serviceCategory: mappedServiceCategory,
          checkIn: appliedCheckIn || undefined,
          checkOut: appliedCheckOut || undefined,
          rating: appliedRating ?? undefined,
          amenities: appliedAmenities,
          keyword: appliedKeyword || undefined,
          minPrice: appliedFilters.priceRange[0] > 0 ? appliedFilters.priceRange[0] : undefined,
          maxPrice: appliedFilters.priceRange[1],
          // Pass user coords for geo radius search
          lat: coords?.latitude,
          lng: coords?.longitude,
          radiusKm: 10,
        });
        //console.log("Returned rows:", results);
        const raw = Array.isArray(results) ? results : [];

        // Client-side fallback: filter by location text
        // Only apply text filter when NOT using geo coords
        const normalizedLocation = appliedLocation.trim().toLowerCase();
        const filtered = (normalizedLocation && !coords)
          ? raw.filter((property: any) => {
              const text = [
                property?.city,
                property?.address,
                property?.name,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
              return text.includes(normalizedLocation);
            })
          : raw;

        setProperties(filtered);
      } catch (err: any) {
        setLoadError(err?.message || "Failed to fetch properties");
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };
    runSearch();
  }, [appliedFilters]);

  // Reset all filters
  const handleResetAll = () => {
    setSelectedPet("Dog");
    setSelectedDogSize("Small");
    setSelectedService("hotel");
    setPriceRange([0, 1000]);
    setSelectedRating(null);
    setSelectedAmenities([]);
    setCheckInDate("");
    setCheckOutDate("");
    setKeyword("");
    setDateError(null);
    setSortBy("default");
    setAppliedFilters({
      location,
      pet: "Dog",
      dogSize: "Small",
      service: "hotel",
      priceRange: [0, 1000],
      rating: null,
      amenities: [],
      checkIn: "",
      checkOut: "",
      keyword: "",
    });
    navigate(`/search?location=${encodeURIComponent(location)}&pet=Dog&service=hotel`);
  };

  // Apply filters (update URL)
  const handleApplyFilters = () => {
    if (dateError) return;
    const params = buildParams();
    setAppliedFilters(buildAppliedFilters());
    setScrollKey((k) => k + 1);
    navigate(`/search?${params.toString()}`);
  };

  const handleSearchSubmit = () => {
    if (dateError) return;

    // If user manually changed the location, clear geolocation coords
    // so we don't do a geo-radius search for a manually typed location
    if (searchLocation !== location || !coords) {
      setCoords(null);
    }

    const params = buildParams();
    setAppliedFilters(buildAppliedFilters());
    setScrollKey((k) => k + 1);
    setLocation(searchLocation);
    navigate(`/search?${params.toString()}`);
  };

  const buildParams = (locationOverride?: string) => {
    const params = new URLSearchParams();
    const loc = locationOverride ?? searchLocation;
    if (loc) params.set("location", loc);
    if (selectedPet) params.set("pet", selectedPet);
    if (selectedPet === "Dog" && selectedDogSize) {
      params.set("dogSize", selectedDogSize);
    }
    if (selectedService) params.set("service", selectedService);
    if (priceRange) {
      params.set("minPrice", String(priceRange[0]));
      params.set("maxPrice", String(priceRange[1]));
    }
    if (selectedRating) params.set("rating", String(selectedRating));
    if (selectedAmenities.length) params.set("amenities", selectedAmenities.join(","));
    if (checkInDate) params.set("checkIn", checkInDate);
    if (checkOutDate) params.set("checkOut", checkOutDate);
    if (keyword.trim()) params.set("keyword", keyword.trim());
    return params;
  };

  const buildAppliedFilters = (locationOverride?: string) => ({
    location: locationOverride ?? searchLocation,
    pet: selectedPet,
    dogSize: selectedPet === "Dog" ? selectedDogSize : undefined,
    service: selectedService,
    priceRange: [priceRange[0], priceRange[1]] as [number, number],
    rating: selectedRating,
    amenities: selectedAmenities,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    keyword: keyword.trim(),
  });

  // ── Haversine distance (km) ──
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

  useEffect(() => {
    const loadAmenities = async () => {
      if (!selectedService) {
        setAmenities([]);
        return;
      }
      try {
        setAmenitiesLoading(true);
        const data = await fetchAmenities(selectedService);
        setAmenities(Array.isArray(data) ? data : []);
      } catch (err) {
        setAmenities([]);
      } finally {
        setAmenitiesLoading(false);
      }
    };

    loadAmenities();
  }, [selectedService]);

  useEffect(() => {
    if (!amenities.length) return;
    setSelectedAmenities((prev) =>
      prev.filter((a) => amenities.some((x) => x.amenity === a))
    );
  }, [amenities]);

  const mapPropertyToHotel = (property: any, index: number) => {
    const amenityNames = Array.isArray(property?.property_amenities)
      ? property.property_amenities
          .map((pa: any) => pa?.amenities?.amenity)
          .filter(Boolean)
      : [];

       // Calculate distance if user coords available and property has lat/lng
    let distance: number | null = null;
    if (
      coords &&
      property?.latitude != null &&
      property?.longitude != null
    ) {
      distance = haversineDistance(
        coords.latitude,
        coords.longitude,
        Number(property.latitude),
        Number(property.longitude)
      );
    }

    return {
      id: property?.id ?? `property-${index}`,
      name: property?.name ?? "Untitled Property",
      image:
        property?.cover_image ||
        (Array.isArray(property?.images) && property.images.length > 0 ? property.images[0] : undefined) ||
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop",
      location: property?.city ?? property?.address ?? "",
      rating: Number(property?.rating ?? 0),
      reviews: Number(property?.review_count ?? 0),
      price: Number(property?.cheapest_service_price ?? 0),
      amenities: amenityNames,
      featured: Boolean(property?.featured),
      availability: "Available",
      propertyType: Array.isArray(property?.property_type) ? property.property_type : [],
      petTypes: Array.isArray(property?.pet_types_accepted) ? property.pet_types_accepted : [],
      description: property?.description ?? "",
      phone: property?.phone ?? "",
      capacity: property?.capacity ?? null,
      distance: distance
    };
  };

    // Auto-set sort to "distance-asc" when user location is detected
  useEffect(() => {
    if (coords) {
      setSortBy("distance-asc");
    }
  }, [coords]);

  const sortedProperties = useMemo(() => {
    const list = [...properties];

    const getPrice = (p: any) => Number(p?.cheapest_service_price ?? 0);
    const getRating = (p: any) => Number(p?.rating ?? 0);
    const getName = (p: any) => String(p?.name ?? "");
    const getDistance = (p: any) => {
      if (!coords || p?.latitude == null || p?.longitude == null) return Infinity;
      return haversineDistance(
        coords.latitude,
        coords.longitude,
        Number(p.latitude),
        Number(p.longitude)
      );
    };

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
      case "distance-asc":
        list.sort((a, b) => getDistance(a) - getDistance(b));
        break;
      default:
        break;
    }

    return list;
  }, [properties, sortBy, coords]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });

        reverseGeocode(latitude, longitude).then((place) => {
          setSearchLocation(place);
          setLocation(place);
          setLoading(false);

          // Auto-submit with the resolved place
          const params = buildParams(place);
          setAppliedFilters(buildAppliedFilters(place));
          setScrollKey((k) => k + 1);
          navigate(`/search?${params.toString()}`);
        }).catch((err) => {
          console.error("Failed to get place name:", err);
          alert("Unable to retrieve your location");
          setLoading(false);
        });
      }
    );
  };

     // Filter sort options: only show "Distance: Nearest" when coords are available
  const availableSortOptions = useMemo(() => {
    return (Object.keys(sortLabels) as SortOption[]).filter(
      (opt) => opt !== "distance-asc" || coords !== null
    );
  }, [coords]);


  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop key={scrollKey} />
      <Header />
      <main className="py-8">
        <div className="container">
          {/* Search Bar */}
          <div className="bg-card rounded-2xl p-3 md:p-4 shadow-soft mb-8 border border-border/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchSubmit();
              }}
              className="flex flex-col md:flex-row md:items-center gap-3"
            >

               {/* Keyword search input — takes remaining space */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background border border-border/50 flex-1 min-w-0">
                <Search className="h-5 w-5 text-primary shrink-0" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                />
              </div>

              {/* Search button */}
              <Button
                type="submit"
                variant="hero"
                className="gap-2 md:w-auto w-full shrink-0"
                disabled={Boolean(dateError)}
              >
                <Search className="h-5 w-5" />
                Search
              </Button>


              {/* Location */}
              <div className="md:w-52 w-full shrink-0">
                <LocationInput
                  value={searchLocation}
                  onChange={setSearchLocation}
                  onSelect={(loc) => {
                    setSearchLocation(loc.name);
                    setLocation(loc.name);
                    setCoords(null); // Clear geo coords so heading shows "Pet Hotels in ..."

                    // Auto-submit with the selected location
                    const params = buildParams(loc.name);
                    setAppliedFilters(buildAppliedFilters(loc.name));
                    setScrollKey((k) => k + 1);
                    navigate(`/search?${params.toString()}`);
                  }}
                />
              </div>

              {/* Use My Location */}
              <Button
                type="button"
                variant="outline"
                className="gap-2 md:w-auto w-full shrink-0"
                onClick={handleUseMyLocation}
                disabled={loading}
              >
                <MapPin className="h-4 w-4" />
                {loading ? "Getting location..." : "Use My Location"}
              </Button>

            </form>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              {coords
                ? `Pet Hotels Nearby${location ? ` (${location})` : ""}`
                : location
                  ? `Pet Hotels in ${location}`
                  : "Search Results"}
            </h1>
            <p className="text-muted-foreground">{properties.length} properties found</p>
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
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 active:scale-95 ${
                          selectedService === value
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-foreground border-border hover:border-foreground/40 hover:bg-muted"
                        } `}
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
                    {["Dog", "Cat", "Others"].map((pet) => (
                      <button
                        key={pet}
                        onClick={() => {setSelectedPet(pet);
                           if (pet !== "Dog") {
                            // Reset dog size to default but don't include in URL
                            setSelectedDogSize("Small");
                            
                            // Update URL to remove dogSize parameter
                            const params = new URLSearchParams(searchParams.toString());
                            params.set("pet", pet);
                            params.delete("dogSize"); // Remove dogSize from URL
                            navigate(`/search?${params.toString()}`, { replace: true });
                          } else {
                            // Keep dogSize in URL when Dog is selected
                            const params = new URLSearchParams(searchParams.toString());
                            params.set("pet", pet);
                            params.set("dogSize", selectedDogSize);
                            navigate(`/search?${params.toString()}`, { replace: true });
                          }
                        }
                        }
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 active:scale-95 ${
                          selectedPet === pet
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
                 {selectedPet === "Dog" && (
                <div className="pb-6 border-b border-border/50">
                  <label className="text-sm font-semibold text-foreground mb-3 block">
                    Dog Size
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {["Small", "Medium", "Large", "Giant"].map((dogSize) => (
                      <button
                        key={dogSize}
                        onClick={() => setSelectedDogSize(dogSize)}
                        className={`
                          flex-1 px-4 py-2 rounded-lg text-sm font-medium
                          border transition-all duration-200
                          active:scale-95
                          
                          ${
                            selectedDogSize === dogSize
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background text-foreground border-border hover:border-foreground/40 hover:bg-muted"
                          }`}
                      >
                        {dogSize}
                      </button>
                    ))}
                  </div>
                </div>
                )}


                {/* Check-in & Check-out Dates */}
                <div className="pb-6 border-b border-border/50">
                  <label className="text-sm font-semibold text-foreground mb-3 block">Dates</label>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Check-in</label>
                      <Input
                        type="date"
                        value={checkInDate}
                        min={todayISO}
                        max={maxDateISO}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCheckInDate(val);
                          validateDates(val, checkOutDate);
                        }}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Check-out</label>
                      <Input
                        type="date"
                        value={checkOutDate}
                        min={checkInDate || todayISO}
                        max={maxDateISO}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCheckOutDate(val);
                          validateDates(checkInDate, val);
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
                      &#8369;{priceRange[0]} -{" "}
                      {priceRange[1] === 3000 ? "₱3000+" : `₱${priceRange[1]}`}
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
                    {amenitiesLoading ? (
                      <div className="text-sm text-muted-foreground">Loading amenities...</div>
                    ) : amenities.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No amenities available.</div>
                    ) : (
                      amenities.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <Checkbox
                            id={`search-${item.amenity}`}
                            checked={selectedAmenities.includes(item.amenity)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedAmenities([...selectedAmenities, item.amenity]);
                              else setSelectedAmenities(selectedAmenities.filter((a) => a !== item.amenity));
                            }}
                          />
                          <label
                            htmlFor={`search-${item.amenity}`}
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
                  onClick={handleApplyFilters}
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
                      {availableSortOptions.map((option) => (
                        <DropdownMenuItem
                          key={option}
                          onClick={() => setSortBy(option)}
                          className={sortBy === option ? "bg-accent font-medium" : ""}
                        >
                          {sortLabels[option]}
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

              {/* Results */}
              <div
                className={`grid gap-6 ${
                  viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                }`}
              >
                {isLoading ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground text-sm">Searching for properties...</p>
                  </div>
                ) : loadError ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                      <Search className="h-7 w-7 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground mb-1">Something went wrong</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">{loadError}</p>
                    </div>
                  </div>
                ) : sortedProperties.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 gap-5 text-center">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                        <MapPin className="h-9 w-9 text-muted-foreground/60" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Search className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl text-foreground mb-2">No properties found</h3>
                      <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                        We couldn't find any properties matching your search.
                        Try adjusting your filters, changing the location, or broadening your criteria.
                      </p>
                    </div>
                    <div className="flex gap-3 mt-2">
                      <Button variant="outline" size="sm" onClick={handleResetAll}>
                        Reset Filters
                      </Button>
                      <Button variant="hero" size="sm" onClick={() => navigate("/")}>
                        Back to Home
                      </Button>
                    </div>
                  </div>
                ) : (
                  sortedProperties.map((property, index) => {
                    const mapped = mapPropertyToHotel(property, index);
                    return <HotelCard key={mapped.id} hotel={mapped} />;
                  })
                )}
              </div>

              {/* Load More */}
                  {properties.length > 9 && (
                    <div className="text-center mt-10">
                      <Button variant="outline" size="lg">
                        Load More Results
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

export default SearchResults;
