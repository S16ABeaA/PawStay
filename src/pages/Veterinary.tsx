import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Stethoscope, Syringe, HeartPulse, Pill, Clock, Phone,
  Calendar, Check, ArrowRight, Shield, Award, Users
} from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  {
    icon: HeartPulse,
    name: "Wellness Exams",
    description: "Comprehensive health checkups to keep your pet in top condition",
    price: "From $75",
  },
  {
    icon: Syringe,
    name: "Vaccinations",
    description: "Core and lifestyle vaccines to protect against diseases",
    price: "From $35",
  },
  {
    icon: Stethoscope,
    name: "Sick Pet Visits",
    description: "Diagnosis and treatment when your pet isn't feeling well",
    price: "From $95",
  },
  {
    icon: Pill,
    name: "Prescription Refills",
    description: "Easy refills for ongoing medications",
    price: "From $15",
  },
];

const team = [
  {
    name: "Dr. Sarah Mitchell",
    role: "Chief Veterinarian",
    specialty: "Internal Medicine",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop",
  },
  {
    name: "Dr. James Chen",
    role: "Senior Veterinarian",
    specialty: "Surgery",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop",
  },
  {
    name: "Dr. Emily Rodriguez",
    role: "Veterinarian",
    specialty: "Dermatology",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&auto=format&fit=crop",
  },
];

const Veterinary = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-success/10 to-background">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="bg-success/10 text-success border-success/20 mb-4">
                  Veterinary Care
                </Badge>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                  Expert Care for Your{" "}
                  <span className="text-gradient">Beloved Pets</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Our experienced veterinary team provides compassionate, comprehensive care 
                  for all your pet's health needs. Available 7 days a week.
                </p>
                <div className="flex flex-wrap gap-4 mb-8">
                  <Link to="/booking">
                    <Button variant="hero" size="xl" className="gap-2">
                      Book Appointment
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="xl" className="gap-2">
                    <Phone className="h-5 w-5" />
                    Emergency: (555) 911-PETS
                  </Button>
                </div>
                <div className="flex gap-8">
                  <div>
                    <p className="text-3xl font-bold text-foreground">15+</p>
                    <p className="text-sm text-muted-foreground">Years Experience</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">50k+</p>
                    <p className="text-sm text-muted-foreground">Pets Treated</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">4.9★</p>
                    <p className="text-sm text-muted-foreground">Rating</p>
                  </div>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <img
                  src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600&auto=format&fit=crop"
                  alt="Veterinary care"
                  className="rounded-2xl shadow-elevated"
                />
                <div className="absolute -bottom-6 -right-6 bg-card rounded-xl p-4 shadow-elevated">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="font-semibold">Open 7 Days</p>
                      <p className="text-sm text-muted-foreground">8AM - 8PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 md:py-20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Our Services
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Comprehensive veterinary care for dogs, cats, and exotic pets
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all hover:-translate-y-1"
                >
                  <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center mb-4">
                    <service.icon className="h-7 w-7 text-success" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">{service.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                  <p className="text-primary font-semibold">{service.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 md:py-20 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Why Choose PawStay Veterinary?
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  icon: Shield,
                  title: "Trusted Care",
                  desc: "Board-certified veterinarians with decades of combined experience",
                },
                {
                  icon: Award,
                  title: "State-of-the-Art",
                  desc: "Modern diagnostic equipment and treatment facilities",
                },
                {
                  icon: Users,
                  title: "Compassionate Team",
                  desc: "We treat every pet like family with patience and understanding",
                },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                    <item.icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 md:py-20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Meet Our Team
              </h2>
              <p className="text-muted-foreground">
                Dedicated professionals who love what they do
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {team.map((member) => (
                <div key={member.name} className="bg-card rounded-2xl overflow-hidden shadow-soft">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="p-6 text-center">
                    <h3 className="font-semibold text-lg text-foreground">{member.name}</h3>
                    <p className="text-primary text-sm mb-1">{member.role}</p>
                    <p className="text-sm text-muted-foreground">{member.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-success/10 via-primary/5 to-accent/10">
          <div className="container">
            <div className="bg-card rounded-3xl p-8 md:p-12 shadow-elevated text-center max-w-3xl mx-auto">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Schedule Your Visit Today
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Whether it's a routine checkup or you have concerns about your pet's health, 
                we're here to help.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/booking">
                  <Button variant="hero" size="xl" className="gap-2">
                    <Calendar className="h-5 w-5" />
                    Book Appointment
                  </Button>
                </Link>
                <Button variant="outline" size="xl" className="gap-2">
                  <Phone className="h-5 w-5" />
                  Call Us
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Veterinary;
