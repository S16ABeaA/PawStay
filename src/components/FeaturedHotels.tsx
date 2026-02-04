import { useState } from "react";
import HotelCard from "./HotelCard";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, ArrowUpDown, Grid3X3, List } from "lucide-react";

const hotels = [
  {
    id: 1,
    name: "Pawsome Paradise Resort",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop",
    location: "Los Angeles, CA",
    rating: 4.9,
    reviews: 328,
    price: 65,
    originalPrice: 85,
    amenities: ["WiFi", "24/7 Care", "Vet On-site", "Parking"],
    featured: true,
    availability: "3 rooms left",
  },
  {
    id: 2,
    name: "Happy Tails Pet Hotel",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop",
    location: "San Francisco, CA",
    rating: 4.8,
    reviews: 256,
    price: 55,
    amenities: ["WiFi", "Parking", "24/7 Care"],
    featured: false,
    availability: "Available",
  },
  {
    id: 3,
    name: "The Paw Retreat",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop",
    location: "Seattle, WA",
    rating: 4.7,
    reviews: 189,
    price: 48,
    amenities: ["24/7 Care", "Vet On-site"],
    featured: true,
    availability: "5 rooms left",
  },
  {
    id: 4,
    name: "Luxury Pet Suites",
    image: "https://images.unsplash.com/photo-1587559070757-f72a388edbba?w=800&auto=format&fit=crop",
    location: "New York, NY",
    rating: 4.9,
    reviews: 412,
    price: 89,
    originalPrice: 110,
    amenities: ["WiFi", "24/7 Care", "Parking", "Vet On-site"],
    featured: false,
    availability: "1 room left",
  },
  {
    id: 5,
    name: "Cozy Paws Inn",
    image: "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=800&auto=format&fit=crop",
    location: "Chicago, IL",
    rating: 4.6,
    reviews: 145,
    price: 42,
    amenities: ["WiFi", "Parking"],
    featured: false,
    availability: "Available",
  },
  {
    id: 6,
    name: "Pet Palace Resort",
    image: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800&auto=format&fit=crop",
    location: "Miami, FL",
    rating: 4.8,
    reviews: 278,
    price: 72,
    amenities: ["WiFi", "24/7 Care", "Vet On-site"],
    featured: true,
    availability: "Available",
  },
];

const FeaturedHotels = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <section className="py-16 md:py-20 bg-secondary/30">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Featured Pet Hotels
            </h2>
            <p className="text-muted-foreground">
              Handpicked stays loved by fur babies and their parents
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </Button>
            <div className="hidden md:flex items-center gap-1 ml-2 p-1 bg-secondary rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid" ? "bg-card shadow-sm" : "hover:bg-card/50"
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list" ? "bg-card shadow-sm" : "hover:bg-card/50"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Hotel Grid */}
        <div className={`grid gap-6 ${
          viewMode === "grid" 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
            : "grid-cols-1"
        }`}>
          {hotels.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-10">
          <Button variant="outline" size="lg">
            Load More Hotels
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedHotels;
