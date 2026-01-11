import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Search, Dog, Cat, Rabbit } from "lucide-react";

const SearchBar = () => {
  const [petType, setPetType] = useState("dog");
  const [location, setLocation] = useState("");
  const navigate = useNavigate();

  const petTypes = [
    { id: "dog", icon: Dog, label: "Dog" },
    { id: "cat", icon: Cat, label: "Cat" },
    { id: "other", icon: Rabbit, label: "Other" },
  ];

  const handleSearch = () => {
    navigate(`/search?location=${encodeURIComponent(location)}&pet=${petType}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-card rounded-2xl shadow-elevated p-2 md:p-3">
        <div className="flex flex-col lg:flex-row gap-2">
          {/* Location */}
          <div className="flex-1 group">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background hover:bg-secondary/50 transition-colors cursor-pointer">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Location</p>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where are you going?"
                  className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-border" />

          {/* Check-in */}
          <div className="flex-1 group">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background hover:bg-secondary/50 transition-colors cursor-pointer">
              <Calendar className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Check-in</p>
                <input
                  type="text"
                  placeholder="Add date"
                  className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-border" />

          {/* Check-out */}
          <div className="flex-1 group">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background hover:bg-secondary/50 transition-colors cursor-pointer">
              <Calendar className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Check-out</p>
                <input
                  type="text"
                  placeholder="Add date"
                  className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-border" />

          {/* Pet Type */}
          <div className="flex-1">
            <div className="px-4 py-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Pet Type</p>
              <div className="flex gap-1">
                {petTypes.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => setPetType(pet.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      petType === pet.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <pet.icon className="h-3.5 w-3.5" />
                    {pet.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex items-center">
            <Button variant="hero" size="lg" className="w-full lg:w-auto lg:px-6" onClick={handleSearch}>
              <Search className="h-5 w-5" />
              <span className="lg:hidden">Search</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
