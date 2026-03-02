import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VeterinaryCard from "@/components/VeterinaryCard";
import { fetchProperties } from "@/services/propertyApi";
import { fetchAmenities } from "@/services/amenitiesApi";
import { Loader2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

const Veterinary = () => {
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<any[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [petType, setPetType] = useState<string | null>(null);
  const [dogSize, setDogSize] = useState<string | null>(null);

  const loadClinics = async () => {
    setLoading(true);
    try {
      // Pass explicit filters to the API
      const data = await fetchProperties({
        propertyType: "veterinary",
        serviceCategory: "Veterinary",
        location: location.trim() || undefined,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        rating: minRating || undefined,
        petType: petType || undefined,
        dogSize: petType === "dog" && dogSize ? dogSize : undefined,
      });
      setClinics(data || []);
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

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 md:py-24 bg-gradient-to-b from-success/10 to-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-success/10 text-success border-success/20 mb-4">Veterinary Care</Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Find Expert Care for Your <span className="text-gradient">Beloved Pets</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">Connect with trusted veterinary clinics offering compassionate, comprehensive care for all your pet's health needs.</p>
            </div>
            <div className="relative hidden lg:block">
              <img src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600" className="rounded-2xl shadow-elevated" alt="Veterinary" />
            </div>
          </div>
        </div>
      </section>

      <main className="py-8">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
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
                    onKeyDown={(e) => e.key === 'Enter' && loadClinics()}
                  />
                </div>

                {/* Pet Type */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-3 block">Pet Type</label>
                  <div className="flex gap-2">
                    {(["dog", "cat", "others"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => { setPetType(petType === type ? null : type); if (type !== "dog") setDogSize(null); }}
                        className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                          petType === type
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary hover:bg-secondary/80"
                        }`}
                      >
                        {type === "others" ? "Others" : type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dog Size — only when Dog is selected */}
                {petType === "dog" && (
                  <div className="mb-6">
                    <label className="text-sm font-medium text-foreground mb-3 block">Dog Size</label>
                    <div className="flex flex-wrap gap-2">
                      {["small", "medium", "large", "giant"].map((size) => (
                        <button
                          key={size}
                          onClick={() => setDogSize(dogSize === size ? null : size)}
                          className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                            dogSize === size
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary hover:bg-secondary/80"
                          }`}
                        >
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
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
                {amenitiesList.length > 0 && (
                  <div className="mb-6">
                    <label className="text-sm font-medium text-foreground mb-3 block">Amenities</label>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {amenitiesList.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`amenity-${item.id}`}
                            checked={selectedAmenities.includes(item.amenity)}
                            onCheckedChange={() => toggleAmenity(item.amenity)}
                          />
                          <label htmlFor={`amenity-${item.id}`} className="text-sm text-muted-foreground cursor-pointer">
                            {item.amenity}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button variant="hero" className="w-full" onClick={loadClinics}>Apply Filters</Button>
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1">
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {clinics.map((c) => (
                    <VeterinaryCard key={c.id} clinic={{
                      ...c,
                      image: c.cover_image || "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800",
                      location: c.city,
                      price: c.cheapest_service_price,
                      services: ["Consultation", "Vaccination"],
                      rating: c.rating || 0,
                      reviews: c.review_count || 0
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
export default Veterinary;
