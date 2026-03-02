import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, Heart, MapPin, Scissors, Bath, Sparkles,
  ArrowLeft, Share2, Check,
  Phone, Mail, Clock, Award, Users
} from "lucide-react";
import { useState, useEffect } from "react";
import { favoritesApi } from "../services/favoritesApi";

const groomingData: Record<number, {
  id: number;
  propertyId?: string;
  name: string;
  images: string[];
  location: string;
  rating: number;
  reviews: number;
  description: string;
  amenities: { name: string; icon: React.ElementType }[];
  features: string[];
  services: { name: string; price: number; duration: string; description: string }[];
  hours: string;
  phone: string;
  email: string;
}> = {
  1: {
    id: 1,
    propertyId: "a1000000-0000-0000-0000-000000000002",
    name: "Pawsome Grooming Spa",
    images: [
      "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop",
    ],
    location: "456 Grooming Lane, Los Angeles, CA 90001",
    rating: 4.9,
    reviews: 412,
    description: "Welcome to Pawsome Grooming Spa, where we transform your furry friends into their most fabulous selves. Our certified groomers use premium, pet-safe products and the latest grooming techniques to ensure your pet looks and feels amazing.",
    amenities: [
      { name: "Certified Groomers", icon: Award },
      { name: "Pet-Safe Products", icon: Sparkles },
      { name: "Experienced Team", icon: Users },
      { name: "Relaxing Spa", icon: Bath },
    ],
    features: [
      "Hypoallergenic shampoos",
      "Stress-free environment",
      "Individual attention",
      "Before & after photos",
      "Aromatherapy options",
      "Same-day appointments available",
    ],
    services: [
      { name: "Basic Bath & Dry", price: 35, duration: "45 min", description: "Bath, blow dry, and brush out" },
      { name: "Full Grooming", price: 65, duration: "1.5 hrs", description: "Complete grooming with haircut and styling" },
      { name: "Deluxe Spa Package", price: 95, duration: "2 hrs", description: "Full grooming plus spa treatments" },
      { name: "Nail Trim Only", price: 15, duration: "15 min", description: "Quick nail trimming service" },
    ],
    hours: "Mon-Sat: 9AM - 7PM, Sun: 10AM - 5PM",
    phone: "+1 (555) 234-5678",
    email: "hello@pawsomespa.com",
  },
};

const defaultData = {
  id: 0,
  name: "Premium Pet Grooming",
  images: [
    "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop",
  ],
  location: "123 Pet Care Street, Los Angeles, CA",
  rating: 4.8,
  reviews: 256,
  description: "Professional pet grooming services with certified groomers. We use only premium, pet-safe products to ensure your furry friend looks and feels their best.",
  amenities: [
    { name: "Certified Groomers", icon: Award },
    { name: "Pet-Safe Products", icon: Sparkles },
    { name: "Experienced Team", icon: Users },
    { name: "Relaxing Spa", icon: Bath },
  ],
  features: [
    "Hypoallergenic shampoos",
    "Stress-free environment",
    "Individual attention",
    "Before & after photos",
    "Aromatherapy options",
    "Same-day appointments available",
  ],
  services: [
    { name: "Basic Bath & Dry", price: 35, duration: "45 min", description: "Bath, blow dry, and brush out" },
    { name: "Full Grooming", price: 65, duration: "1.5 hrs", description: "Complete grooming with haircut and styling" },
    { name: "Deluxe Spa Package", price: 95, duration: "2 hrs", description: "Full grooming plus spa treatments" },
    { name: "Nail Trim Only", price: 15, duration: "15 min", description: "Quick nail trimming service" },
  ],
  hours: "Mon-Sat: 9AM - 7PM, Sun: 10AM - 5PM",
  phone: "+1 (555) 234-5678",
  email: "contact@petgrooming.com",
};

const GroomingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const data = groomingData[Number(id)] || defaultData;
  const isAuthenticated =
    typeof window !== "undefined" &&
    localStorage.getItem("pawstay.authenticated") === "true";

  const propertyId = (data as any).propertyId ?? id;

  useEffect(() => {
    let mounted = true;
    if (!isAuthenticated || !propertyId) return;
    const load = async () => {
      try {
        const fav = await favoritesApi.checkFavorite(propertyId as any);
        if (mounted) setIsLiked(Boolean(fav));
      } catch (err) {
        console.error("checkFavorite failed", err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [propertyId, isAuthenticated]);
  const [selectedService, setSelectedService] = useState(data.services[1]);

  const serviceFee = Math.round(selectedService.price * 0.10 * 100) / 100;

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
                src={data.images[0]}
                alt={data.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {data.images.slice(1).map((img, i) => (
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
                      <span className="text-sm font-bold">{data.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({data.reviews} reviews)</span>
                  </div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {data.name}
                  </h1>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{data.location}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      if (!isAuthenticated) {
                        navigate(`/signin?redirect=${encodeURIComponent(`/grooming/${id}`)}`);
                        return;
                      }
                      const previous = isLiked;
                      setIsLiked(!previous);
                      try {
                        if (previous) {
                          await favoritesApi.removeFavorite(propertyId as any);
                        } else {
                          await favoritesApi.addFavorite(propertyId as any);
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
                <h2 className="font-semibold text-xl mb-3">About This Salon</h2>
                <p className="text-muted-foreground leading-relaxed">{data.description}</p>
              </div>

              {/* Amenities */}
              <div className="mb-8">
                <h2 className="font-semibold text-xl mb-4">Why Choose Us</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.amenities.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                      <amenity.icon className="h-5 w-5 text-accent" />
                      <span className="text-sm font-medium">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="mb-8">
                <h2 className="font-semibold text-xl mb-4">What's Included</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {data.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-success" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div>
                <h2 className="font-semibold text-xl mb-4">Our Services</h2>
                <div className="space-y-3">
                  {data.services.map((service) => (
                    <div
                      key={service.name}
                      onClick={() => setSelectedService(service)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedService.name === service.name
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
                          <p className="text-xl font-bold text-foreground">₱{service.price}</p>
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
                  <Scissors className="h-5 w-5 text-accent" />
                  <span className="font-medium">{selectedService.name}</span>
                </div>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-bold text-foreground">₱{selectedService.price}</span>
                  <span className="text-muted-foreground">• {selectedService.duration}</span>
                </div>

                {/* Price Summary */}
                <div className="border-t border-border pt-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{selectedService.name}</span>
                    <span>₱{selectedService.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service fee (10%)</span>
                    <span>₱{serviceFee}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-border">
                    <span>Total</span>
                    <span>₱{selectedService.price + serviceFee}</span>
                  </div>
                </div>

                <Link to="/booking" state={{ shop: { type: "grooming", name: data.name, location: data.location, image: data.images[0], price: selectedService.price, serviceName: selectedService.name, propertyId: (data as any).propertyId?.toString(), qrCodeGCash: (data as any).qrCodeGCash, qrCodePayMaya: (data as any).qrCodePayMaya, acceptedPaymentMethods: (data as any).acceptedPaymentMethods } }}>
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
                    <span>{data.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{data.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{data.hours}</span>
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
