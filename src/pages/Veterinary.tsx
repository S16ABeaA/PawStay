import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Stethoscope, Syringe, HeartPulse, Pill, Clock, Phone,
  Calendar, Check, ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import ShopCard from "@/components/ShopCard";
import { veterinaryShops } from "@/lib/shops";
import { SlidersHorizontal, ArrowUpDown, Grid3X3, List, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";



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
                  Find Expert Care for Your{" "}
                  <span className="text-gradient">Beloved Pets</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Connect with trusted veterinary clinics offering compassionate, comprehensive care 
                  for all your pet's health needs. Available 7 days a week.
                </p>
                <div className="flex flex-wrap gap-4 mb-8">
                  <Link to="#clinics">
                    <Button variant="hero" size="xl" className="gap-2">
                      Browse Clinics
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

        {/* Listing (similar to Hotels) */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="mb-6">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">Veterinary Clinics</h2>
              <p className="text-muted-foreground">Find the right clinic from {veterinaryShops.length} nearby options</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              <aside className="lg:w-72 shrink-0 hidden lg:block">
                <div className="bg-card rounded-2xl p-6 shadow-soft sticky top-24">
                  <h3 className="font-semibold text-lg mb-6">Filters</h3>
                  <div className="mb-6">
                    <label className="text-sm font-medium text-foreground mb-2 block">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Enter city or area" className="pl-10" />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="text-sm font-medium text-foreground mb-3 block">Amenities</label>
                    <div className="space-y-3">
                      {["Vaccinations", "Surgery", "On-site Lab", "Emergency Care"].map((amenity) => (
                        <div key={amenity} className="flex items-center gap-2">
                          <Checkbox id={amenity} />
                          <label htmlFor={amenity} className="text-sm text-muted-foreground cursor-pointer">{amenity}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button variant="hero" className="w-full">Apply Filters</Button>
                </div>
              </aside>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div />
                  <div className="flex items-center gap-2 ml-auto">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Sort
                    </Button>
                    <div className="hidden md:flex items-center gap-1 p-1 bg-secondary rounded-lg">
                      <button className="p-2 rounded-md transition-colors bg-card shadow-sm">
                        <Grid3X3 className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-md transition-colors hover:bg-card/50">
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {veterinaryShops.map((shop) => (
                    <ShopCard key={shop.id} shop={shop} />
                  ))}
                </div>

                <div className="text-center mt-10">
                  <Button variant="outline" size="lg">Load More Clinics</Button>
                </div>
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
