import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Loader2, Check, Phone, Mail, Clock, Heart } from "lucide-react";
import { favoritesApi } from "../services/favoritesApi";
import { Card } from "@/components/ui/card";
import { fetchPropertyById } from "../services/propertyApi";

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);

  const isAuthenticated =
    typeof window !== "undefined" &&
    localStorage.getItem("pawstay.authenticated") === "true";

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const item = await fetchPropertyById(id || "");
        setProperty(item);
        
        // Set first service or default boarding service
        if (item?.property_services?.length > 0) {
          const activeServices = item.property_services.filter((s: any) => s.is_active);
          setSelectedService(activeServices[0] || { name: "Boarding", price: item.cheapest_service_price || 0 });
        } else {
          setSelectedService({ name: "Boarding", price: item?.cheapest_service_price || 0 });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  // Check if this property is already favorited on mount
  useEffect(() => {
    let mounted = true;
    if (!isAuthenticated || !id) return;
    const load = async () => {
      try {
        const fav = await favoritesApi.checkFavorite(id);
        if (mounted) setIsLiked(Boolean(fav));
      } catch (err) {
        console.error("checkFavorite failed", err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id, isAuthenticated]);

  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      navigate(`/signin?redirect=${encodeURIComponent(`/hotels/${id}`)}`);
      return;
    }
    if (!id) return;
    const previous = isLiked;
    setIsLiked(!previous);
    try {
      if (previous) {
        await favoritesApi.removeFavorite(id);
      } else {
        await favoritesApi.addFavorite(id);
      }
    } catch (err) {
      console.error("favorite toggle failed", err);
      setIsLiked(previous);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-20">Property not found</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="container">
          <Link to="/hotels" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
            ← Back to Hotels
          </Link>

          <h1 className="text-4xl font-bold mb-4">{property.name}</h1>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {property.cover_image && (
                <img 
                  src={property.cover_image} 
                  className="w-full h-96 object-cover rounded-2xl mb-6" 
                  alt={property.name}
                />
              )}
              <p className="text-lg text-muted-foreground mb-6">{property.description || "No description available"}</p>
              
              {property.property_amenities && property.property_amenities.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.property_amenities.map((a: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                        <Check className="h-5 w-5 text-primary" />
                        <span>{a.amenities?.amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services Section */}
              {property.property_services && property.property_services.filter((s: any) => s.is_active).length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">Available Services</h2>
                  <div className="space-y-3">
                    {property.property_services.filter((s: any) => s.is_active).map((service: any) => (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedService?.id === service.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{service.name}</h3>
                            <p className="text-sm text-muted-foreground">{service.description || service.category}</p>
                            {service.duration_minutes && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{service.duration_minutes} min</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-foreground">₱{service.price}</p>
                            <span className="text-sm text-muted-foreground">/ night</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold">₱{selectedService?.price || property.cheapest_service_price || 0}</div>
                    <span className="text-sm text-muted-foreground">/ night</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleLikeClick}>
                    <Heart className={`h-5 w-5 ${isLiked ? "fill-primary text-primary" : ""}`} />
                  </Button>
                </div>

                {selectedService && (
                  <div className="mb-4 p-3 bg-secondary rounded-lg">
                    <span className="text-sm font-medium">{selectedService.name}</span>
                  </div>
                )}
                
                {property.rating && (
                  <div className="flex items-center gap-1 mb-4">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{property.rating}</span>
                    <span className="text-sm text-muted-foreground">({property.review_count || 0} reviews)</span>
                  </div>
                )}

                <Button 
                  variant="hero" 
                  className="w-full mb-4" 
                  onClick={() => navigate("/booking", {
                    state: {
                      shop: {
                        type: "hotel",
                        name: property.name,
                        location: property.city,
                        image: property.cover_image,
                        price: selectedService?.price || property.cheapest_service_price,
                        propertyId: property.id,
                        serviceId: selectedService?.id,
                        serviceName: selectedService?.name || "Standard Boarding"
                      }
                    }
                  })}
                >
                  Book Now
                </Button>

                <p className="text-center text-xs text-muted-foreground mb-4">
                  Free cancellation up to 24 hours
                </p>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{property.city || property.address}</span>
                  </div>
                  {property.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{property.phone}</span>
                    </div>
                  )}
                  {property.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{property.email}</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HotelDetail;
