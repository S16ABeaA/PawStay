import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HotelCard from "@/components/HotelCard";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight } from "lucide-react";

const favoriteHotels = [
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
];

const Favorites = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              My Favorites
            </h1>
            <p className="text-muted-foreground">
              {favoriteHotels.length} saved hotels
            </p>
          </div>

          {favoriteHotels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <Heart className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                No favorites yet
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Start exploring pet hotels and save your favorites here for easy access later.
              </p>
              <Link to="/hotels">
                <Button variant="hero" size="lg" className="gap-2">
                  Browse Hotels
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;
