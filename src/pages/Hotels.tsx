import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HotelCard from "@/components/HotelCard";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, MapPin, Star, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { fetchProperties } from "@/services/propertyApi";

const AMENITIES_LIST = [
  "Air Conditioning", "CCTV Monitoring", "Pick-up & Drop-off", "Waiting Lounge",
  "Parking", "X-Ray", "Laboratory", "Surgery Room", "Pharmacy", "Emergency Room",
  "Veterinary Clinic", "Pet Shop", "Isolation ward", "Vaccinations", "Veterinary technicians",
];

const Hotels = () => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [showFilters, setShowFilters] = useState(false);
  const [location, setLocation] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);

  const loadHotels = async () => {
    setLoading(true);
    try {
      // Pass explicit filters to the API
      const data = await fetchProperties({
        propertyType: "hotel",
        serviceCategory: "Boarding", // Only look at hotel/boarding prices
        location: location.trim() || undefined,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        rating: minRating || undefined,
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

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="py-16 md:py-24 bg-gradient-to-b from-accent/10 to-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-accent/10 text-accent border-accent/20 mb-4">Pet Hotels</Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Find the Perfect Stay for Your <span className="text-gradient">Furry Friend</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">Discover verified pet-friendly hotels offering comfort and safety.</p>
            </div>
            <div className="relative hidden lg:block">
              <img src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600" className="rounded-2xl shadow-elevated" alt="Hotel" />
            </div>
          </div>
        </div>
      </section>

      <main className="py-8">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className={`lg:w-72 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-card rounded-2xl p-6 shadow-soft sticky top-24 border">
                <h3 className="font-semibold text-lg mb-6">Filters</h3>
                
                {/* Location Input */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-2 block">Location</label>
                  <Input 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                    placeholder="e.g. Makati" 
                    onKeyDown={(e) => e.key === 'Enter' && loadHotels()}
                  />
                </div>
                
                {/* Price Slider */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-4 block">
                    Price: ₱{priceRange[0]} - ₱{priceRange[1]}
                  </label>
                  <Slider value={priceRange} onValueChange={setPriceRange} max={10000} step={100} />
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
                
                <Button variant="hero" className="w-full" onClick={loadHotels}>Apply Filters</Button>
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
