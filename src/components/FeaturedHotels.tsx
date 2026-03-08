import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import HotelCard from "./HotelCard";
import { Button } from "@/components/ui/button";
import {
  SlidersHorizontal,
  ArrowUpDown,
  Grid3X3,
  List,
  Star,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { fetchRandomProperties } from "@/services/randPropertyApi";
import { PetLoaderGate } from "./ui/PetLoader";

const BATCH_SIZE = 6;
const MAX_DISPLAY = 18;

type SortOption = "default" | "price-asc" | "price-desc" | "rating-desc" | "name-asc";

const sortLabels: Record<SortOption, string> = {
  default: "Default",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "rating-desc": "Rating: High to Low",
  "name-asc": "Name: A to Z",
};

const mapPropertyToHotel = (property: any, index: number) => {
  const amenityNames = Array.isArray(property?.property_amenities)
    ? property.property_amenities
        .map((pa: any) => pa?.amenities?.amenity)
        .filter(Boolean)
    : [];

  return {
    id: property?.id ?? `property-${index}`,
    name: property?.name ?? "Untitled Property",
    image:
      property?.cover_image ||
      (Array.isArray(property?.images) && property.images.length > 0
        ? property.images[0]
        : undefined) ||
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop",
    location: property?.city ?? property?.address ?? "",
    rating: Number(property?.rating ?? 0),
    reviews: Number(property?.review_count ?? 0),
    price: Number(property?.cheapest_service_price ?? 0),
    amenities: amenityNames,
    featured: Boolean(property?.featured),
    availability: "Available",
  };
};

const FeaturedHotels = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [hotels, setHotels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Filter state
  const [minRating, setMinRating] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [filterOpen, setFilterOpen] = useState(false);

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>("default");

  const loadBatch = async (existingIds: Set<string> = new Set()) => {
    const properties = await fetchRandomProperties();
    const mapped = Array.isArray(properties)
      ? properties.map(mapPropertyToHotel)
      : [];
    return mapped.filter((h) => !existingIds.has(String(h.id)));
  };

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const batch = await loadBatch();
        const initial = batch.slice(0, BATCH_SIZE);
        setHotels(initial);
        if (batch.length === 0 || initial.length < BATCH_SIZE) {
          setHasMore(false);
        }
      } catch (err: any) {
        console.error("Error fetching featured hotels:", err);
        setError(err?.message || "Failed to load hotels");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitial();
  }, []);

  const handleLoadMore = async () => {
    try {
      setIsLoadingMore(true);
      const existingIds = new Set(hotels.map((h) => String(h.id)));
      const newBatch = await loadBatch(existingIds);
      if (newBatch.length === 0) {
        setHasMore(false);
        return;
      }
      const remaining = MAX_DISPLAY - hotels.length;
      const toAdd = newBatch.slice(0, remaining);
      setHotels((prev) => [...prev, ...toAdd]);
      if (toAdd.length < BATCH_SIZE || hotels.length + toAdd.length >= MAX_DISPLAY) {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("Error loading more hotels:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Filtered + sorted hotels
  const displayedHotels = useMemo(() => {
    let result = [...hotels];

    // Apply filters
    if (minRating !== null) {
      result = result.filter((h) => h.rating >= minRating);
    }
    result = result.filter(
      (h) => h.price >= priceRange[0] && (h.price <= priceRange[1] || h.price === 0)
    );

    // Apply sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating-desc":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [hotels, minRating, priceRange, sortBy]);

  const hasActiveFilters = minRating !== null || priceRange[0] > 0 || priceRange[1] < 10000;

  const clearFilters = () => {
    setMinRating(null);
    setPriceRange([0, 10000]);
  };

  const reachedMax = hotels.length >= MAX_DISPLAY;

  return (
    <section className="py-16 md:py-20 bg-secondary/30">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Featured Pet Service Providers
            </h2>
            <p className="text-muted-foreground">
              Discover top-rated pet care services near you
            </p>
          </div>

          {/* Filters & Sort Controls */}
          <div className="flex items-center gap-2">
            {/* Filter Popover */}
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={hasActiveFilters ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 h-5 w-5 rounded-full bg-primary-foreground text-primary text-xs flex items-center justify-center font-bold">
                      !
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4" align="end">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Filters</h4>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-destructive hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Minimum Rating
                    </label>
                    <div className="flex gap-2">
                      {[3, 3.5, 4, 4.5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() =>
                            setMinRating(minRating === rating ? null : rating)
                          }
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            minRating === rating
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          <Star className="h-3 w-3 fill-rating text-rating" />
                          {rating}+
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Price Range:{" "}
                      <span className="text-primary">
                        ₱{priceRange[0]} – ₱{priceRange[1]}
                      </span>
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={(val) =>
                        setPriceRange([val[0], val[1]])
                      }
                      min={0}
                      max={10000}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>₱0</span>
                      <span>₱10,000</span>
                    </div>
                  </div>

                  <Button
                    variant="hero"
                    size="sm"
                    className="w-full"
                    onClick={() => setFilterOpen(false)}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Sort Dropdown */}
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
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
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

            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center gap-1 ml-2 p-1 bg-secondary rounded-lg">
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

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {minRating !== null && (
              <button
                onClick={() => setMinRating(null)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <Star className="h-3 w-3 fill-rating text-rating" />
                {minRating}+ rating
                <X className="h-3 w-3 ml-0.5" />
              </button>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 10000) && (
              <button
                onClick={() => setPriceRange([0, 10000])}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                ₱{priceRange[0]} – ₱{priceRange[1]}
                <X className="h-3 w-3 ml-0.5" />
              </button>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-destructive hover:underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results count */}
        {!isLoading && !error && hasActiveFilters && (
          <p className="text-sm text-muted-foreground mb-4">
            Showing {displayedHotels.length} of {hotels.length} properties
          </p>
        )}

        {/* Hotel Grid */}
        <div
          className={`grid gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          <PetLoaderGate dataLoaded={!isLoading} loaderText="Loading properties..." loaderClassName="min-h-[300px] col-span-full w-full">
            {error ? (
              <div className="text-destructive col-span-full text-center py-10">
                {error}
              </div>
            ) : displayedHotels.length === 0 ? (
              <div className="text-muted-foreground col-span-full text-center py-10">
                {hasActiveFilters
                  ? "No properties match your filters. Try adjusting them."
                  : "No properties found."}
              </div>
            ) : (
              displayedHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))
            )}

             {/* Load More / View More */}
        {hotels.length > 0 && hasMore && (
          <div className="col-span-full flex justify-center mt-10">
            {reachedMax ? (
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/hotels")}
              >
                View More
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Load More"}
              </Button>
            )}
          </div>
        )}
          </PetLoaderGate>
        </div>
      </div>
    </section>
  );
};

export default FeaturedHotels;
