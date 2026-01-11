import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Building2, DollarSign, Camera, CheckCircle2, ArrowRight,
  Star, Users, TrendingUp, Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const benefits = [
  {
    icon: Users,
    title: "Reach More Pet Parents",
    description: "Get access to thousands of pet owners looking for quality care",
  },
  {
    icon: DollarSign,
    title: "Earn Extra Income",
    description: "Set your own prices and availability to maximize earnings",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    description: "Our marketing tools help you attract more customers",
  },
  {
    icon: Shield,
    title: "Insurance Coverage",
    description: "Every booking includes liability protection for your peace of mind",
  },
];

const amenities = [
  "WiFi", "24/7 Care", "Vet On-site", "Parking", 
  "Outdoor Space", "Webcam Access", "Grooming", "Training"
];

const ListProperty = () => {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Application Submitted!",
      description: "We'll review your property and get back to you within 48 hours.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                  List Your Property on{" "}
                  <span className="text-gradient">PawStay</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Join our network of trusted pet care providers and start earning. 
                  We'll help you reach thousands of pet parents looking for quality care.
                </p>
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-secondary border-2 border-background" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">2,500+</span> providers already earning
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-5 w-5 fill-rating text-rating" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Trusted by 50,000+ pet parents
                  </span>
                </div>
              </div>
              <div className="hidden lg:block">
                <img
                  src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&auto=format&fit=crop"
                  alt="Pet hotel"
                  className="rounded-2xl shadow-elevated"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 md:py-20 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Why Partner With Us?
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="bg-card rounded-2xl p-6 shadow-soft">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Application Form */}
        <section className="py-16 md:py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                  Get Started Today
                </h2>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get in touch within 48 hours
                </p>
              </div>

              <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 md:p-8 shadow-elevated">
                {/* Property Info */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">Property Information</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="propertyName">Property Name</Label>
                      <Input id="propertyName" placeholder="e.g., Happy Tails Pet Hotel" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="propertyType">Property Type</Label>
                      <Input id="propertyType" placeholder="e.g., Pet Hotel, Daycare" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" placeholder="Full address" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="City" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" type="tel" placeholder="(555) 123-4567" />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="font-semibold text-lg">Contact Information</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Owner Name</Label>
                      <Input id="ownerName" placeholder="Full name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="you@example.com" />
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <h3 className="font-semibold text-lg">Amenities & Services</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2">
                        <Checkbox id={amenity} />
                        <Label htmlFor={amenity} className="text-sm cursor-pointer">
                          {amenity}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-rating/10 flex items-center justify-center">
                      <Camera className="h-5 w-5 text-rating" />
                    </div>
                    <h3 className="font-semibold text-lg">Tell Us About Your Property</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Describe your property, services, and what makes you special..."
                      rows={4}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 mb-6">
                  <Checkbox id="terms" className="mt-1" />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                    I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Partner Agreement</a>
                  </Label>
                </div>

                <Button variant="hero" size="lg" className="w-full gap-2">
                  Submit Application
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ListProperty;
