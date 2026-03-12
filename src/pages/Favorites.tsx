import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HotelCard from "@/components/HotelCard";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight, Home, Scissors, Stethoscope } from "lucide-react";
import { PetLoader } from "@/components/ui/PetLoader";
import { favoritesApi } from "../services/favoritesApi";
import { useState, useEffect } from "react";


const mapPropertyToHotel = (property: any, index: number) => {
  const amenityNames = Array.isArray(property?.property_amenities)
    ? property.property_amenities
        .map((pa: any) => pa?.amenities?.amenity)
        .filter(Boolean)
    : [];

  return {
    id: property?.id ?? `property-${index}`,
    name: property?.property_name ?? property?.name ?? "Untitled Property",
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
    distance: null,
    service_categories: Array.isArray(property?.service_categories) ? property.service_categories : [],
  };
};

const Favorites = () => {
  const [favoriteHotels, setFavoriteHotels] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    try { return localStorage.getItem("pawstay.favFilter") || "all"; } catch { return "all"; }
  });

  const counts = favoriteHotels.reduce((acc: Record<string, number>, p) => {
    acc.all = (acc.all || 0) + 1;
    const cats: string[] = (p.service_categories || []).map((s: string) => String(s));
    for (const c of cats) acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  const CATEGORY_META: Record<string, { label: string; metaKey?: string; Icon?: any }> = {
    all: { label: "All" },
    hotels: { label: "Pet Hotels", metaKey: "Boarding", Icon: Home },
    grooming: { label: "Grooming", metaKey: "Grooming", Icon: Scissors },
    veterinary: { label: "Veterinary", metaKey: "Veterinary", Icon: Stethoscope },
  };

  const setCategory = (key: string) => {
    setSelectedCategory(key);
    try { localStorage.setItem("pawstay.favFilter", key); } catch {}
  };

  const getCountForKey = (key: string) => {
    if (key === "all") return counts.all || 0;
    const meta = CATEGORY_META[key]?.metaKey;
    if (!meta) return 0;
    return counts[meta] || 0;
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const favorites = await favoritesApi.fetchFavorites();
        const mapped = Array.isArray(favorites)
          ? favorites.map(mapPropertyToHotel)
          : [];
        setFavoriteHotels(mapped);
      } catch (err: any) {
        setError(err.message || "Failed to fetch favorites");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <PetLoader text="Loading favorites..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              My Favorites
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground">
                {favoriteHotels.length} saved properties
              </p>

              <div className="ml-4 inline-flex rounded-lg bg-card p-1">
                {Object.keys(CATEGORY_META).map((key) => {
                  const meta = CATEGORY_META[key];
                  const active = selectedCategory === key;
                  const Icon = meta.Icon;
                  return (
                    <button key={key} onClick={() => setCategory(key)} className={`flex items-center gap-2 px-3 py-1 text-sm rounded-md ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                      {Icon && <Icon className="h-4 w-4" />}
                      <span>{meta.label}</span>
                      <span className="ml-1 text-xs text-muted-foreground">({getCountForKey(key)})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {favoriteHotels.length > 0 ? (
            (() => {
              const filtered = favoriteHotels.filter((p) => {
                if (selectedCategory === "all") return true;
                const metaKey = CATEGORY_META[selectedCategory]?.metaKey;
                if (!metaKey) return false;
                const cats: string[] = p.service_categories || [];
                return cats.includes(metaKey);
              });

              return filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                    <Heart className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">No favorites in this category</h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">Try switching to another service or add new favorites.</p>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <Heart className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                No favorites yet
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Start exploring pet hotels and save your favorites here for easy access later.
              </p>
              <Link to="/hotels">
                <Button variant="hero" size="lg" className="gap-2">
                  Browse Hotels
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;