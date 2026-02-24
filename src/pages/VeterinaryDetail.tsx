import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, Heart, MapPin, Stethoscope, HeartPulse, Syringe,
  ArrowLeft, Share2, Check,
  Phone, Mail, Clock, Shield, Award, Users
} from "lucide-react";
import { useState } from "react";

const veterinaryData: Record<number, {
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
  team: { name: string; role: string; specialty: string; image: string }[];
  hours: string;
  phone: string;
  email: string;
  emergency: boolean;
}> = {
  1: {
    id: 1,
    propertyId: "a1000000-0000-0000-0000-000000000003",
    name: "PawStay Veterinary Clinic",
    images: [
      "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop",
    ],
    location: "789 Veterinary Blvd, Los Angeles, CA 90001",
    rating: 4.9,
    reviews: 523,
    description: "PawStay Veterinary Clinic provides comprehensive, compassionate care for your beloved pets. Our team of board-certified veterinarians uses state-of-the-art equipment and the latest medical advances to ensure the best outcomes for your furry family members.",
    amenities: [
      { name: "Board Certified", icon: Award },
      { name: "24/7 Emergency", icon: HeartPulse },
      { name: "Modern Equipment", icon: Shield },
      { name: "Caring Team", icon: Users },
    ],
    features: [
      "On-site laboratory",
      "Digital X-ray & ultrasound",
      "Surgical suite",
      "Dental care center",
      "Pharmacy on premises",
      "Pet boarding available",
    ],
    services: [
      { name: "Wellness Exam", price: 75, duration: "30 min", description: "Comprehensive health checkup" },
      { name: "Vaccination Package", price: 120, duration: "20 min", description: "Core vaccines for dogs or cats" },
      { name: "Dental Cleaning", price: 250, duration: "1-2 hrs", description: "Professional teeth cleaning under anesthesia" },
      { name: "Surgery Consultation", price: 95, duration: "45 min", description: "Pre-surgical evaluation and planning" },
    ],
    team: [
      { name: "Dr. Sarah Mitchell", role: "Chief Veterinarian", specialty: "Internal Medicine", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop" },
      { name: "Dr. James Chen", role: "Senior Veterinarian", specialty: "Surgery", image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop" },
    ],
    hours: "Mon-Fri: 8AM - 8PM, Sat-Sun: 9AM - 6PM",
    phone: "+1 (555) 911-PETS",
    email: "care@pawstayvet.com",
    emergency: true,
  },
};

const defaultData = {
  id: 0,
  name: "Premium Veterinary Clinic",
  images: [
    "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop",
  ],
  location: "123 Pet Health Street, Los Angeles, CA",
  rating: 4.8,
  reviews: 312,
  description: "Comprehensive veterinary care with board-certified veterinarians. We use state-of-the-art equipment and the latest medical advances to ensure the best outcomes for your pets.",
  amenities: [
    { name: "Board Certified", icon: Award },
    { name: "24/7 Emergency", icon: HeartPulse },
    { name: "Modern Equipment", icon: Shield },
    { name: "Caring Team", icon: Users },
  ],
  features: [
    "On-site laboratory",
    "Digital X-ray & ultrasound",
    "Surgical suite",
    "Dental care center",
    "Pharmacy on premises",
    "Pet boarding available",
  ],
  services: [
    { name: "Wellness Exam", price: 75, duration: "30 min", description: "Comprehensive health checkup" },
    { name: "Vaccination Package", price: 120, duration: "20 min", description: "Core vaccines for dogs or cats" },
    { name: "Dental Cleaning", price: 250, duration: "1-2 hrs", description: "Professional teeth cleaning under anesthesia" },
    { name: "Surgery Consultation", price: 95, duration: "45 min", description: "Pre-surgical evaluation and planning" },
  ],
  team: [
    { name: "Dr. Sarah Mitchell", role: "Chief Veterinarian", specialty: "Internal Medicine", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop" },
    { name: "Dr. James Chen", role: "Senior Veterinarian", specialty: "Surgery", image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop" },
  ],
  hours: "Mon-Fri: 8AM - 8PM, Sat-Sun: 9AM - 6PM",
  phone: "+1 (555) 345-6789",
  email: "contact@vetclinic.com",
  emergency: false,
};

const VeterinaryDetail = () => {
  const { id } = useParams();
  const [isLiked, setIsLiked] = useState(false);
  const data = veterinaryData[Number(id)] || defaultData;
  const [selectedService, setSelectedService] = useState(data.services[0]);

  const serviceFee = Math.round(selectedService.price * 0.10 * 100) / 100;

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
                    <Badge className="bg-success/10 text-success border-success/20">Veterinary Clinic</Badge>
                    {data.emergency && (
                      <Badge className="bg-destructive text-destructive-foreground border-0">24/7 Emergency</Badge>
                    )}
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
                <h2 className="font-semibold text-xl mb-3">About This Clinic</h2>
                <p className="text-muted-foreground leading-relaxed">{data.description}</p>
              </div>

              {/* Amenities */}
              <div className="mb-8">
                <h2 className="font-semibold text-xl mb-4">Why Choose Us</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.amenities.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                      <amenity.icon className="h-5 w-5 text-success" />
                      <span className="text-sm font-medium">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="mb-8">
                <h2 className="font-semibold text-xl mb-4">Our Facilities</h2>
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
              <div className="mb-8">
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

              {/* Team */}
              <div>
                <h2 className="font-semibold text-xl mb-4">Meet Our Team</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {data.team.map((member) => (
                    <div key={member.name} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-foreground">{member.name}</h3>
                        <p className="text-sm text-primary">{member.role}</p>
                        <p className="text-xs text-muted-foreground">{member.specialty}</p>
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

                <Link to="/booking" state={{ shop: { type: "veterinary", name: data.name, location: data.location, image: data.images[0], price: selectedService.price, serviceName: selectedService.name, propertyId: (data as any).propertyId?.toString(), qrCodeGCash: (data as any).qrCodeGCash, qrCodePayMaya: (data as any).qrCodePayMaya, acceptedPaymentMethods: (data as any).acceptedPaymentMethods } }}>
                  <Button variant="hero" size="lg" className="w-full mb-4">
                    Book Appointment
                  </Button>
                </Link>

                {data.emergency && (
                  <Button variant="destructive" size="lg" className="w-full mb-4 gap-2">
                    <Phone className="h-4 w-4" />
                    Emergency Line
                  </Button>
                )}

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

export default VeterinaryDetail;
