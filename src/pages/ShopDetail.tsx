import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, Heart, MapPin, Wifi, Car, Coffee, Shield, 
  ArrowLeft, Share2, Calendar as CalendarIcon, Check,
  Phone, Mail, Clock
} from "lucide-react";
import { useState } from "react";
import { veterinaryShops, groomingShops, Shop } from "@/lib/shops";

const shopData: Record<number, Omit<Shop, 'reviews'> & { images: string[]; features: string[]; reviews: { name: string; rating: number; comment: string; date: string }[] }> = {
  1001: {
    ...(veterinaryShops.find(s => s.id === 1001)! as Omit<Shop, 'reviews'>),
    images: [
      "https://images.unsplash.com/photo-1557976609-5f360d9a6c3f?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop",
    ],
    features: [
      "Modern diagnostic equipment",
      "Board-certified veterinarians",
      "Emergency care available",
      "Pet pharmacy on-site",
    ],
    reviews: [
      { name: "Sarah M.", rating: 5, comment: "Excellent care for my dog. Very professional staff.", date: "2024-01-10" },
      { name: "John D.", rating: 4, comment: "Good service, though a bit pricey.", date: "2024-01-08" },
    ],
  },
  1002: {
    ...(veterinaryShops.find(s => s.id === 1002)! as Omit<Shop, 'reviews'>),
    images: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1557976609-5f360d9a6c3f?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop",
    ],
    features: [
      "24/7 emergency services",
      "Advanced surgery facilities",
      "Dental care specialists",
      "Vaccination clinics",
    ],
    reviews: [
      { name: "Emily R.", rating: 5, comment: "Saved my cat's life. Highly recommend!", date: "2024-01-05" },
      { name: "Mike T.", rating: 4, comment: "Friendly staff and clean facility.", date: "2024-01-03" },
    ],
  },
  2001: {
    ...(groomingShops.find(s => s.id === 2001)! as Omit<Shop, 'reviews'>),
    images: [
      "https://images.unsplash.com/photo-1507149833265-60c372daea22?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop",
    ],
    features: [
      "Professional groomers",
      "Pet-safe products",
      "Relaxing spa environment",
      "Breed-specific cuts",
    ],
    reviews: [
      { name: "Lisa K.", rating: 5, comment: "My dog looks amazing! Great service.", date: "2024-01-09" },
      { name: "Tom W.", rating: 4, comment: "Clean and efficient. Will return.", date: "2024-01-07" },
    ],
  },
  2002: {
    ...(groomingShops.find(s => s.id === 2002)! as Omit<Shop, 'reviews'>),
    images: [
      "https://images.unsplash.com/photo-1514385292610-7e9a3d7a0f9f?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507149833265-60c372daea22?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&auto=format&fit=crop",
    ],
    features: [
      "Luxury spa treatments",
      "De-matting specialists",
      "Aromatherapy options",
      "Photo sessions included",
    ],
    reviews: [
      { name: "Anna P.", rating: 5, comment: "Best grooming experience ever!", date: "2024-01-06" },
      { name: "David L.", rating: 4, comment: "High-quality service at fair prices.", date: "2024-01-04" },
    ],
  },
};

const ShopDetail = () => {
  const { id } = useParams();
  const shopId = parseInt(id!);
  const shop = shopData[shopId];
  const [isLiked, setIsLiked] = useState(false);

  // Fallback images for shops that have no sample images (e.g. PawCare Veterinary Clinic, Purr & Pooch Spa)
  const images = (shop.images && shop.images.length > 0)
    ? shop.images
    : [
        "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800&auto=format&fit=crop", // generic pet
        "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&auto=format&fit=crop",
      ];

  if (!shop) {
    return <div>Shop not found</div>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="container">
          {/* Back Button */}
          <Link to={shop.type === "grooming" ? "/grooming" : "/veterinary"} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to {shop.type === "grooming" ? "Grooming Salons" : "Veterinary Clinics"}
          </Link>

          {/* Image Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              <img src={images[0]} alt={shop.name} className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {images.slice(1).map((img, i) => (
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
                    <Badge className="bg-gradient-hero text-primary-foreground border-0">
                      {shop.type === "grooming" ? "Grooming Salon" : "Veterinary Clinic"}
                    </Badge>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-rating/10">
                      <Star className="h-4 w-4 fill-rating text-rating" />
                      <span className="text-sm font-bold text-foreground">{shop.rating}</span>
                      <span className="text-sm text-muted-foreground">({shop.reviews.length} reviews)</span>
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">{shop.name}</h1>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{shop.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">About {shop.name}</h2>
                <p className="text-muted-foreground">
                  {shop.type === "grooming"
                    ? "Professional grooming services for your beloved pets. We use only the highest quality, pet-safe products to ensure your furry friend looks and feels their best."
                    : "Comprehensive veterinary care for dogs and cats. Our experienced team provides compassionate, high-quality medical services for all your pet's health needs."
                  }
                </p>
              </div>

              {/* Features */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">What We Offer</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shop.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Customer Reviews</h2>
                <div className="space-y-4">
                  {shop.reviews.map((review, index) => (
                    <div key={index} className="bg-card rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{review.name}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-rating text-rating" />
                          <span className="text-sm">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-2">{review.comment}</p>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl p-6 shadow-soft sticky top-24">
                <h3 className="font-semibold text-lg mb-4">Book Your Appointment</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Open 7 days a week</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>(555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>info@{shop.name.toLowerCase().replace(/\s+/g, '')}.com</span>
                  </div>
                </div>
                <Link to="/booking" state={{ shop }}>
                  <Button className="w-full" size="lg">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Book Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShopDetail;