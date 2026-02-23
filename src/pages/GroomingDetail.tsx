import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, Heart, MapPin, Scissors, Bath, Sparkles,
  ArrowLeft, Share2, Check,
  Phone, Mail, Clock, Award, Users, Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { favoritesApi } from "../services/favoritesApi";
import { fetchPropertyById } from "../services/propertyApi";

const GroomingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  const isAuthenticated =
    typeof window !== "undefined" &&
    localStorage.getItem("pawstay.authenticated") === "true";

  // ── Fetch property data ──
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchPropertyById(id || "");
        if (mounted && data) {
          setProperty(data);
          // Filter services by "Grooming" category and pick the first one
          const groomingServices = (data.property_services || [])
            .filter((s: any) => s.is_active && s.category === "Grooming");
          if (groomingServices.length > 0) {
            setSelectedService(groomingServices[0]);
          } else {
            setSelectedService({ name: "Full Grooming", price: data.cheapest_service_price || 0, description: "Complete grooming service" });
          }
        }
      } catch (err) {
        console.error("Failed to fetch property", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  // ── Check favorites ──
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
      navigate(`/signin?redirect=${encodeURIComponent(`/grooming/${id}`)}`);
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

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading salon details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Not found ──
  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-8">
          <div className="container text-center py-20">
            <p className="text-muted-foreground text-lg">Grooming salon not found</p>
            <Link to="/grooming" className="text-primary hover:underline mt-4 inline-block">
              ← Back to Grooming
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Derived data ──
  const coverImage = property.cover_image || "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&auto=format&fit=crop";
  const images = property.images?.length > 0
    ? property.images
    : [coverImage, coverImage, coverImage, coverImage];

  // Filter services by "Grooming" category only
  const groomingServices = (property.property_services || [])
    .filter((s: any) => s.is_active && s.category === "Grooming");

  // Amenities from DB
  const amenities = (property.property_amenities || []).map((a: any) => a.amenities?.amenity).filter(Boolean);

  const selected = selectedService || groomingServices[0] || { name: "Full Grooming", price: 0 };
  const serviceFee = Math.round(selected.price * 0.10 * 100) / 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="container">
          {/* Back Button */}
          <Link to="/grooming" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Grooming
          </Link>

          {/* Image Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              <img
                src={images[0]}
                alt={property.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {images.slice(1, 5).map((img: string, i: number) => (
                <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-accent/10 text-accent border-accent/20">Grooming Spa</Badge>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-rating/10">
                      <Star className="h-4 w-4 fill-rating text-rating" />
                      <span className="text-sm font-bold">{property.rating || 0}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({property.review_count || 0} reviews)</span>
                  </div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {property.name}
                  </h1>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{property.address || property.city || "Location not specified"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={handleLikeClick}>
                    <Heart className={`h-5 w-5 ${isLiked ? "fill-primary text-primary" : ""}`} />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="font-semibold text-xl mb-3">About This Salon</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {property.description || "Professional pet grooming services with certified groomers. We use only premium, pet-safe products to ensure your furry friend looks and feels their best."}
                </p>
              </div>

              {/* Amenities */}
              {amenities.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-semibold text-xl mb-4">Why Choose Us</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {amenities.map((name: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                        <Check className="h-5 w-5 text-accent" />
                        <span className="text-sm font-medium">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features - from property facilities_amenities */}
              {property.facilities_amenities?.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-semibold text-xl mb-4">What's Included</h2>
                  <div className="grid md:grid-cols-2 gap-3">
                    {property.facilities_amenities.map((feature: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-success" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services — filtered by Grooming category */}
              <div>
                <h2 className="font-semibold text-xl mb-4">Our Services</h2>
                {groomingServices.length > 0 ? (
                  <div className="space-y-3">
                    {groomingServices.map((service: any) => (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selected.id === service.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{service.name}</h3>
                            <p className="text-sm text-muted-foreground">{service.description || "Professional grooming service"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-foreground">₱{service.price}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No grooming services available for this salon.</p>
                )}
              </div>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl p-6 shadow-elevated sticky top-24">
                <div className="flex items-center gap-2 mb-2">
                  <Scissors className="h-5 w-5 text-accent" />
                  <span className="font-medium">{selected.name}</span>
                </div>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-bold text-foreground">₱{selected.price}</span>
                </div>

                {/* Price Summary */}
                <div className="border-t border-border pt-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{selected.name}</span>
                    <span>₱{selected.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service fee (10%)</span>
                    <span>₱{serviceFee}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-border">
                    <span>Total</span>
                    <span>₱{selected.price + serviceFee}</span>
                  </div>
                </div>

                <Link
                  to="/booking"
                  state={{
                    shop: {
                      type: "grooming",
                      name: property.name,
                      location: property.city || property.address,
                      image: coverImage,
                      price: selected.price,
                      serviceName: selected.name,
                      serviceId: selected.id,
                      propertyId: property.id,
                    },
                  }}
                >
                  <Button variant="hero" size="lg" className="w-full mb-4">
                    Book Appointment
                  </Button>
                </Link>

                <p className="text-center text-xs text-muted-foreground mb-6">
                  Free rescheduling up to 24 hours before appointment
                </p>

                {/* Contact */}
                <div className="border-t border-border pt-4 space-y-3">
                  {property.phone && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{property.phone}</span>
                    </div>
                  )}
                  {property.website && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{property.website}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Mon-Sat: 9AM - 7PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GroomingDetail;
