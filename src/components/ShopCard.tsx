import { Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface ShopCardProps {
  shop: {
    id: number;
    type: "veterinary" | "grooming";
    name: string;
    image: string;
    location: string;
    rating: number;
    reviews: number;
    priceFrom?: number;
    availability?: string;
    amenities?: string[];
  };
}

const ShopCard = ({ shop }: ShopCardProps) => {
  return (
    <div className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
      <Link to={`/shops/${shop.id}`} className="block relative aspect-[4/3] overflow-hidden">
        <img
          src={shop.image}
          alt={shop.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {shop.availability && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-foreground">
              {shop.availability}
            </Badge>
          </div>
        )}
      </Link>

      <div className="p-4 md:p-5">
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-2">
          <MapPin className="h-3.5 w-3.5" />
          <span>{shop.location}</span>
        </div>

        <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-1">
          {shop.name}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-rating/10">
            <Star className="h-4 w-4 fill-rating text-rating" />
            <span className="text-sm font-bold text-foreground">{shop.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">({shop.reviews} reviews)</span>
        </div>

        <div className="flex items-end justify-between pt-3 border-t border-border">
          <div>
            {shop.priceFrom ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-foreground">${shop.priceFrom}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Pricing varies</span>
            )}
            <span className="text-xs text-muted-foreground"> starting</span>
          </div>
          <Link to={`/shops/${shop.id}`}>
            <Button variant="hero" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShopCard;
