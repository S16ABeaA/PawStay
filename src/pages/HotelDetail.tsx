import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Star, Heart, MapPin, Wifi, Car, Coffee, Shield, 
  ArrowLeft, Share2, Calendar as CalendarIcon, Check,
  Phone, Mail, Clock
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

const hotelData = {
  id: 1,
  name: "Pawsome Paradise Resort",
  images: [
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1587559070757-f72a388edbba?w=800&auto=format&fit=crop",
  ],
  location: "123 Pet Paradise Lane, Los Angeles, CA 90001",
  rating: 4.9,
  reviews: 328,
  price: 65,
  originalPrice: 85,
  description: "Welcome to Pawsome Paradise Resort, where your furry friends receive the royal treatment they deserve. Our state-of-the-art facility offers spacious suites, professional care staff, and a range of premium services to ensure your pet's stay is nothing short of exceptional.",
  amenities: [
    { name: "Free WiFi", icon: Wifi },
    { name: "24/7 Care", icon: Coffee },
    { name: "Vet On-site", icon: Shield },
    { name: "Free Parking", icon: Car },
  ],
  features: [
    "Spacious individual suites",
    "Daily exercise and playtime",
    "Webcam access for pet parents",
    "Gourmet meal options",
    "Climate-controlled environment",
    "Professional grooming available",
  ],
  roomTypes: [
    { name: "Standard Suite", price: 65, description: "Cozy space for small to medium pets" },
    { name: "Deluxe Suite", price: 85, description: "Extra spacious with outdoor access" },
    { name: "VIP Suite", price: 120, description: "Premium luxury with personal attendant" },
  ],
};

const HotelDetail = () => {
  const { id } = useParams();
  const [isLiked, setIsLiked] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(hotelData.roomTypes[0]);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();

  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 1;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="container">
          {/* Back Button */}
          <Link to="/hotels" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Hotels
          </Link>

          {/* Image Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              <img
                src={hotelData.images[0]}
                alt={hotelData.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {hotelData.images.slice(1).map((img, i) => (
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
                    <Badge className="bg-gradient-hero text-primary-foreground border-0">Featured</Badge>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-rating/10">
                      <Star className="h-4 w-4 fill-rating text-rating" />
                      <span className="text-sm font-bold">{hotelData.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({hotelData.reviews} reviews)</span>
                  </div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {hotelData.name}
                  </h1>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{hotelData.location}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setIsLiked(!isLiked)}>
                    <Heart className={`h-5 w-5 ${isLiked ? "fill-primary text-primary" : ""}`} />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="font-semibold text-xl mb-3">About This Hotel</h2>
                <p className="text-muted-foreground leading-relaxed">{hotelData.description}</p>
              </div>

              {/* Amenities */}
              <div className="mb-8">
                <h2 className="font-semibold text-xl mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {hotelData.amenities.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                      <amenity.icon className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="mb-8">
                <h2 className="font-semibold text-xl mb-4">What's Included</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {hotelData.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-success" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Room Types */}
              <div>
                <h2 className="font-semibold text-xl mb-4">Choose Your Room</h2>
                <div className="space-y-3">
                  {hotelData.roomTypes.map((room) => (
                    <div
                      key={room.name}
                      onClick={() => setSelectedRoom(room)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedRoom.name === room.name
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{room.name}</h3>
                          <p className="text-sm text-muted-foreground">{room.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-foreground">${room.price}</p>
                          <p className="text-xs text-muted-foreground">per night</p>
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
                <div className="flex items-baseline gap-2 mb-6">
                  {hotelData.originalPrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      ${hotelData.originalPrice}
                    </span>
                  )}
                  <span className="text-3xl font-bold text-foreground">${selectedRoom.price}</span>
                  <span className="text-muted-foreground">/ night</span>
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start gap-2 h-auto py-3">
                        <CalendarIcon className="h-4 w-4" />
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground">Check-in</p>
                          <p className="text-sm font-medium">
                            {checkIn ? format(checkIn, "MMM dd") : "Select"}
                          </p>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start gap-2 h-auto py-3">
                        <CalendarIcon className="h-4 w-4" />
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground">Check-out</p>
                          <p className="text-sm font-medium">
                            {checkOut ? format(checkOut, "MMM dd") : "Select"}
                          </p>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-border pt-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">${selectedRoom.price} x {nights} night(s)</span>
                    <span>${selectedRoom.price * nights}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service fee</span>
                    <span>$10</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-border">
                    <span>Total</span>
                    <span>${selectedRoom.price * nights + 10}</span>
                  </div>
                </div>

                <Link to="/booking">
                  <Button variant="hero" size="lg" className="w-full mb-4">
                    Reserve Now
                  </Button>
                </Link>

                <p className="text-center text-xs text-muted-foreground mb-6">
                  Free cancellation up to 24 hours before check-in
                </p>

                {/* Contact */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>contact@pawsome.com</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Check-in: 2PM / Check-out: 11AM</span>
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

export default HotelDetail;
