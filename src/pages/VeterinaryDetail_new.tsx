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
import { fetchPropertyById } from "../services/propertyApi";

const VeterinaryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  const isAuthenticated =
    typeof window !== "undefined" &&
    localStorage.getItem("pawstay.authenticated") === "true";

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchPropertyById(id || "");
        if (mounted && data) {
          setProperty(data);
          // Set first service as selected
          if (data.services && data.services.length > 0) {
            setSelectedService(data.services[0]);
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

  useEffect(() => {
    let mounted = true;
    if (!isAuthenticated || !property?.id) return;
    const load = async () => {
      try {
        const fav = await favoritesApi.checkFavorite(property.id);
        if (mounted) setIsLiked(Boolean(fav));
      } catch (err) {
        console.error("checkFavorite failed", err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [property?.id, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Header />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading clinic details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-8">
          <div className="container">
            <p className="text-muted-foreground">Clinic not found</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const services = property.property_amenities?.map((a: any) => ({
    name: a.amenities.amenity,
    price: property.cheapest_service_price || 75,
    duration: "30 min",
    description: `Professional ${a.amenities.amenity.toLowerCase()} service`
  })) || [
    { name: "Consultation", price: 75, duration: "30 min", description: "Comprehensive health checkup" },
    { name: "Vaccination", price: 120, duration: "20 min", description: "Core vaccines for pets" }
  ];

  const selected = selectedService || services[0];
  const serviceFee = Math.round(selected.price * 0.10 * 100) / 100;
  const coverImage = property.cover_image || "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&auto=format&fit=crop";

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
                src={coverImage}
                alt={property.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden">
                  <img src={coverImage} alt="" className="w-full h-full object-cover" />
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
                      <span className="text-sm font-bold">{property.rating || 4.8}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">(0 reviews)</span>
                  </div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {property.name}
                  </h1>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{property.city || "Los Angeles, CA"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      if (!isAuthenticated) {
                        navigate(`/veterinary/${id}?redirect=${encodeURIComponent(`/veterinary/${id}`)}`);
                        return;
                      }
                      const previous = isLiked;
                      setIsLiked(!previous);
                      try {
                        if (previous) {
                          await favoritesApi.removeFavorite(property.id);
                        } else {
                          await favoritesApi.addFavorite(property.id);
                        }
                      } catch (err) {
                        console.error("favorite toggle failed", err);
                        setIsLiked(previous);
                      }
                    }}
                  >
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
              <div className="mb-8">
                <h2 className="font-semibold text-xl mb-4">Services Offered</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {services.map((service: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                      <Stethoscope className="h-5 w-5 text-success" />
                      <span className="text-sm font-medium">{service.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div className="mb-8">
                <h2 className="font-semibold text-xl mb-4">Available Services</h2>
                <div className="space-y-3">
                  {services.map((service: any) => (
                    <div
                      key={service.name}
                      onClick={() => setSelectedService(service)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selected.name === service.name
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{service.duration}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-foreground">${service.price}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <span className="text-3xl font-bold text-foreground">${selected.price}</span>
                  <span className="text-muted-foreground">• {selected.duration}</span>
                </div>

                {/* Price Summary */}
                <div className="border-t border-border pt-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{selected.name}</span>
                    <span>${selected.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service fee (10%)</span>
                    <span>${serviceFee}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-border">
                    <span>Total</span>
                    <span>${selected.price + serviceFee}</span>
                  </div>
                </div>

                <Link to="/booking" state={{ shop: { type: "veterinary", name: property.name, location: property.city, image: coverImage, price: selected.price, serviceName: selected.name, propertyId: property.id, qrCodeGCash: property.qrCodeGCash, qrCodePayMaya: property.qrCodePayMaya, acceptedPaymentMethods: property.acceptedPaymentMethods } }}>
                  <Button variant="hero" size="lg" className="w-full mb-4">
                    Book Appointment
                  </Button>
                </Link>

                <p className="text-center text-xs text-muted-foreground mb-6">
                  Free rescheduling up to 24 hours before appointment
                </p>

                {/* Contact */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{property.phone || "+1 (555) 911-PETS"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{property.email || "care@clinic.com"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{property.hours || "Mon-Fri: 8AM - 8PM"}</span>
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
