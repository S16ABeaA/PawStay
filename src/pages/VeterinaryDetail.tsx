import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, Heart, MapPin, Stethoscope, HeartPulse, Syringe,
  ArrowLeft, Share2, Check,
  Phone, Mail, Clock, Shield, Award, Users, Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { favoritesApi } from "../services/favoritesApi";
import { fetchPropertyById, fetchPropertyReviews } from "../services/propertyApi";

const VeterinaryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);

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
          // Filter services by "Veterinary" category and pick the first one
          const vetServices = (data.property_services || [])
            .filter((s: any) => s.is_active && s.category === "Veterinary");
          if (vetServices.length > 0) {
            setSelectedService(vetServices[0]);
          } else {
            setSelectedService({ name: "Consultation", price: data.cheapest_service_price || 0, description: "General checkup" });
          }
          // Load reviews in parallel
          fetchPropertyReviews(data.id).then(setReviews).catch(() => {});
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
      navigate(`/signin?redirect=${encodeURIComponent(`/veterinary/${id}`)}`);
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
          <p className="text-muted-foreground">Loading clinic details...</p>
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
            <p className="text-muted-foreground text-lg">Clinic not found</p>
            <Link to="/veterinary" className="text-primary hover:underline mt-4 inline-block">
              ← Back to Veterinary
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Derived data ──
  const coverImage = property.cover_image || "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&auto=format&fit=crop";
  const images = property.images?.length > 0
    ? property.images
    : [coverImage, coverImage, coverImage, coverImage];

  // Filter services by "Veterinary" category only
  const vetServices = (property.property_services || [])
    .filter((s: any) => s.is_active && s.category === "Veterinary");

  // Amenities from DB
  const amenities = (property.property_amenities || []).map((a: any) => a.amenities?.amenity).filter(Boolean);

  const selected = selectedService || vetServices[0] || { name: "Consultation", price: 0 };
  const serviceFee = Math.round(selected.price * 0.10 * 100) / 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="container">
          {/* Back Button */}
          <Link to="/veterinary" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Veterinary
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
                    <Badge className="bg-success/10 text-success border-success/20">Veterinary Clinic</Badge>
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
                <h2 className="font-semibold text-xl mb-3">About This Clinic</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {property.description || "Comprehensive veterinary care with board-certified veterinarians. We use state-of-the-art equipment and the latest medical advances to ensure the best outcomes for your pets."}
                </p>
              </div>

              {/* Amenities */}
              {amenities.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-semibold text-xl mb-4">Clinic Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {amenities.map((name: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                        <Check className="h-5 w-5 text-success" />
                        <span className="text-sm font-medium">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Services — filtered by Veterinary category */}
              <div className="mb-8">
                <h2 className="font-semibold text-xl mb-4">Available Services</h2>
                {vetServices.length > 0 ? (
                  <div className="space-y-3">
                    {vetServices.map((service: any) => (
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
                            <p className="text-sm text-muted-foreground">{service.description || `Professional ${service.name.toLowerCase()} service`}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-foreground">₱{service.price}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No veterinary services available for this clinic.</p>
                )}
              </div>

              {/* Reviews Section */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="font-semibold text-xl">Guest Reviews</h2>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rating/10">
                      <Star className="h-4 w-4 fill-rating text-rating" />
                      <span className="font-bold text-sm">{property.rating || 0}</span>
                      <span className="text-sm text-muted-foreground">· {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>
                {reviews.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground">
                    No reviews yet. Be the first to share your experience!
                  </div>
                ) : (
                  <div className="space-y-5">
                    {reviews.map((review: any) => {
                      const name = review.profiles
                        ? `${review.profiles.first_name || ""} ${review.profiles.last_name || ""}`.trim() || "Guest"
                        : "Guest";
                      const avatar = review.profiles?.avatar_url;
                      const date = new Date(review.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
                      return (
                        <div key={review.id} className="p-5 rounded-xl border border-border bg-card">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {avatar ? (
                                <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center font-semibold text-success text-sm">
                                  {name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-sm text-foreground">{name}</p>
                                <p className="text-xs text-muted-foreground">{date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-rating text-rating" : "text-muted-foreground/30"}`} />
                              ))}
                            </div>
                          </div>
                          {review.pet_name && (
                            <p className="text-xs text-muted-foreground mb-2">🐾 Pet: {review.pet_name}</p>
                          )}
                          <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                          {review.reply && (
                            <div className="mt-3 pl-4 border-l-2 border-success/30">
                              <p className="text-xs font-semibold text-success mb-1">Owner's Reply</p>
                              <p className="text-xs text-muted-foreground">{review.reply}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl p-6 shadow-elevated sticky top-24">
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="h-5 w-5 text-success" />
                  <span className="font-medium">{selected.name}</span>
                </div>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-bold text-foreground">₱{selected.price}</span>
                  <span className="text-muted-foreground">• {selected.duration}</span>
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
                      type: "veterinary",
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
                    <span>Mon-Fri: 8AM - 8PM</span>
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

export default VeterinaryDetail;
