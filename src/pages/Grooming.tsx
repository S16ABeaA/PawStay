import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, Star, 
  ArrowRight, Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import ShopCard from "@/components/ShopCard";
import { groomingShops } from "@/lib/shops";
import { SlidersHorizontal, ArrowUpDown, Grid3X3, List, MapPin } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

const Grooming = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-accent/10 to-background">
          <div className="container text-center">
            <Badge className="bg-accent/10 text-accent border-accent/20 mb-4">
              Professional Pet Grooming
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Find Grooming Services for Your{" "}
              <span className="text-gradient">Furry Friend</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Connect with certified grooming salons offering top-quality services to keep your 
              pet looking and feeling their absolute best.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="#salons">
                <Button variant="hero" size="xl" className="gap-2">
                  Browse Salons
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="xl">View Gallery</Button>
            </div>
          </div>
        </section>

        {/* Listing (similar to Hotels) */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="mb-6">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">Grooming Salons</h2>
              <p className="text-muted-foreground">Choose a salon from {groomingShops.length} nearby options</p>
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
                    <label className="text-sm font-medium text-foreground mb-3 block">Services</label>
                    <div className="space-y-3">
                      {["Bath & Dry", "Haircut", "Nail Trim", "De-matting"].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                          <Checkbox id={s} />
                          <label htmlFor={s} className="text-sm text-muted-foreground cursor-pointer">{s}</label>
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
                  {groomingShops.map((shop) => (
                    <ShopCard key={shop.id} shop={shop} />
                  ))}
                </div>

                <div className="text-center mt-10">
                  <Button variant="outline" size="lg">Load More Salons</Button>
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

export default Grooming;
