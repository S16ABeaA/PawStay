import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  PawPrint, Heart, Shield, Users, Award, Target,
  ArrowRight, Check
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { value: "2,500+", label: "Pet Hotels" },
  { value: "500K+", label: "Happy Pets" },
  { value: "50K+", label: "Pet Parents" },
  { value: "15+", label: "Countries" },
];

const values = [
  {
    icon: Heart,
    title: "Pet-First Approach",
    description: "Every decision we make puts the wellbeing and comfort of pets at the center.",
  },
  {
    icon: Shield,
    title: "Trust & Safety",
    description: "We verify every property and service provider to ensure the highest standards.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Building connections between pet lovers and creating a supportive network.",
  },
  {
    icon: Award,
    title: "Excellence",
    description: "Continuously improving our platform to deliver the best experience possible.",
  },
];

const team = [
  {
    name: "Alex Thompson",
    role: "CEO & Founder",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop",
  },
  {
    name: "Maria Garcia",
    role: "Head of Operations",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop",
  },
  {
    name: "David Kim",
    role: "Chief Technology Officer",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop",
  },
  {
    name: "Sophie Martin",
    role: "Head of Customer Success",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&auto=format&fit=crop",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                  <PawPrint className="h-4 w-4" />
                  About PawStay
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                  Making Pet Care{" "}
                  <span className="text-gradient">Simple & Trustworthy</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Founded in 2020, PawStay was born from a simple idea: every pet deserves 
                  exceptional care, and every pet parent deserves peace of mind. We've built 
                  the most trusted platform connecting pet owners with quality pet care services.
                </p>
                <Link to="/hotels">
                  <Button variant="hero" size="xl" className="gap-2">
                    Explore Our Services
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="relative hidden lg:block">
                <img
                  src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&auto=format&fit=crop"
                  alt="Happy dog"
                  className="rounded-2xl shadow-elevated"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 bg-card border-y border-border">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 md:py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
                <Target className="h-8 w-8" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                To create a world where finding trusted, quality care for your pet is as 
                easy as booking a hotel for yourself. We're building the future of pet care, 
                one happy tail at a time.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 md:py-20 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Our Values
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => (
                <div key={value.title} className="bg-card rounded-2xl p-6 shadow-soft">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
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
                Meet Our Leadership
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Passionate pet lovers building the future of pet care
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {team.map((member) => (
                <div key={member.name} className="text-center">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="font-semibold text-foreground">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why PawStay */}
        <section className="py-16 md:py-20 bg-secondary/30">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Why Pet Parents Choose PawStay
                </h2>
                <div className="space-y-4">
                  {[
                    "Verified and trusted pet care providers",
                    "Real reviews from real pet parents",
                    "Easy booking with flexible cancellation",
                    "24/7 customer support",
                    "Photo and video updates during stays",
                    "Secure payment processing",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="shrink-0 w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                        <Check className="h-4 w-4 text-success" />
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&auto=format&fit=crop"
                  alt="Happy pets"
                  className="rounded-2xl shadow-elevated"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 bg-gradient-hero">
          <div className="container text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Join the PawStay Family?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Whether you're a pet parent looking for care or a provider wanting to join our network.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/hotels">
                <Button variant="secondary" size="xl">Find Pet Care</Button>
              </Link>
              <Link to="/list-property">
                <Button variant="outline" size="xl" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                  List Your Property
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
