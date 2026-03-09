import { Star, Heart, MapPin, Scissors, Bath, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link } from "react-router-dom";

interface GroomingCardProps {
  grooming: {
    id: number;
    name: string;
    image: string;
    location: string;
    rating: number;
    reviews: number;
    price: number;
    originalPrice?: number;
    services: string[];
    featured?: boolean;
    availability: string;
  };
}

const serviceIcons: Record<string, React.ElementType> = {
  "Full Grooming": Scissors,
  "Bath & Dry": Bath,
  "Nail Trim": Sparkles,
  "De-shedding": Scissors,
};

const GroomingCard = ({ grooming }: GroomingCardProps) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <Link to={`/grooming/${grooming.id}`} className="block relative aspect-[4/3] overflow-hidden">
        <img
          src={grooming.image}
          alt={grooming.name}
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
        {grooming.featured && (
          <Badge className="absolute top-3 left-3 bg-gradient-hero text-primary-foreground border-0">
            Featured
          </Badge>
        )}

        {/* Availability */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-foreground">
            {grooming.availability}
          </Badge>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 md:p-5">
        {/* Location */}
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-2">
          <MapPin className="h-3.5 w-3.5" />
          <span>{grooming.location}</span>
        </div>

        {/* Name */}
        <Link to={`/grooming/${grooming.id}`}>
          <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {grooming.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-rating/10">
            <Star className="h-4 w-4 fill-rating text-rating" />
            <span className="text-sm font-bold text-foreground">{grooming.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({grooming.reviews} reviews)
          </span>
        </div>

        {/* Services */}
        <div className="flex flex-wrap gap-2 mb-4">
          {grooming.services.slice(0, 3).map((service, index) => {
            const Icon = serviceIcons[service] || Scissors;
            return (
              <div
                key={index}
                className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md"
              >
                <Icon className="h-3 w-3" />
                <span>{service}</span>
              </div>
            );
          })}
        </div>

        {/* Price & CTA */}
        <div className="flex items-end justify-between pt-3 border-t border-border">
          <div>
            <div className="flex items-baseline gap-1.5">
              {grooming.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ₱{grooming.originalPrice}
                </span>
              )}
              <span className="text-2xl font-bold text-foreground">₱{grooming.price}</span>
            </div>
            <span className="text-xs text-muted-foreground">starting from</span>
          </div>
          <Link to={`/grooming/${grooming.id}`}>
            <Button variant="hero" size="sm">
              Book Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GroomingCard;
