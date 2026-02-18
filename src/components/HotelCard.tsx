import { Star, Heart, MapPin, Wifi, Car, Coffee, Shield, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link } from "react-router-dom";

interface HotelCardProps {
  hotel: {
    id: string | number;
    name: string;
    image: string;
    location: string;
    rating: number;
    reviews: number;
    price: number;
    originalPrice?: number;
    amenities: string[];
    featured?: boolean;
    availability: string;
    distance?: number | null;  // distance in km
  };
}

const amenityIcons: Record<string, React.ElementType> = {
  WiFi: Wifi,
  Parking: Car,
  "24/7 Care": Coffee,
  "Vet On-site": Shield,
};

const HotelCard = ({ hotel }: HotelCardProps) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <Link to={`/hotels/${hotel.id}`} className="block relative aspect-[4/3] overflow-hidden">
        <img
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Like Button */}
        <button
          onClick={(e) => { e.preventDefault(); setIsLiked(!isLiked); }}
          className="absolute top-3 right-3 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
        >
          <Heart
            className={`h-5 w-5 transition-colors ${
              isLiked ? "fill-primary text-primary" : "text-foreground"
            }`}
          />
        </button>

        {/* Featured Badge */}
        {hotel.featured && (
          <Badge className="absolute top-3 left-3 bg-gradient-hero text-primary-foreground border-0">
            Featured
          </Badge>
        )}

        {/* Availability */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-foreground">
            {hotel.availability}
          </Badge>
          {hotel.distance != null && (
            <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-foreground gap-1">
              <Navigation className="h-3 w-3" />
              {hotel.distance < 1
                ? `${(hotel.distance * 1000).toFixed(0)}m`
                : `${hotel.distance.toFixed(1)}km`}
            </Badge>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 md:p-5">
        {/* Location */}
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-2">
          <MapPin className="h-3.5 w-3.5" />
          <span>{hotel.location}</span>
        </div>

        {/* Name */}
        <Link to={`/hotels/${hotel.id}`}>
          <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {hotel.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-rating/10">
            <Star className="h-4 w-4 fill-rating text-rating" />
            <span className="text-sm font-bold text-foreground">{hotel.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({hotel.reviews} reviews)
          </span>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-4">
          {hotel.amenities.slice(0, 3).map((amenity, index) => {
            const Icon = amenityIcons[amenity];
            return (
              <div
                key={index}
                className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md"
              >
                {Icon && <Icon className="h-3 w-3" />}
                <span>{amenity}</span>
              </div>
            );
          })}
        </div>

        {/* Price & CTA */}
        <div className="flex items-end justify-between pt-3 border-t border-border">
          <div>
            <div className="flex items-baseline gap-1.5">
              {hotel.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  &#8369;{hotel.originalPrice}
                </span>
              )}
              {hotel.price > 0 ? (
                <span className="text-2xl font-bold text-foreground">
                  &#8369;{hotel.price}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Contact for price</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">depends on service</span>
          </div>
          <Link to={`/hotels/${hotel.id}`}>
            <Button variant="hero" size="sm">
              Book Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
