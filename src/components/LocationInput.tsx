import { useState } from "react";
import { MapPin } from "lucide-react";

type Location = {
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSelect: (loc: Location) => void;
};

export const LocationInput = ({ value, onChange, onSelect }: Props) => {
  const [suggestions, setSuggestions] = useState<Location[]>([]);

  const fetchSuggestions = async (query: string) => {
    if (!query) return setSuggestions([]);
    try {
      const res = await fetch(
        `/api/location/search?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSuggestions(Array.isArray(data.locations) ? data.locations : []);
    } catch (err) {
      console.error("Location search error:", err);
      setSuggestions([]);
    }
  };

  const handleInput = (text: string) => {
    onChange(text);
    fetchSuggestions(text);
  };

  const handleSelect = (loc: Location) => {
    setSuggestions([]);
    onSelect(loc);
    onChange(loc.name);
  };

  return (
    <div className="flex-1 group relative">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background hover:bg-secondary/50 transition-colors">
        <MapPin className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Location</p>
          <input
            type="text"
            value={value}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSuggestions([]);
              }
            }}
            placeholder="Where are you going?"
            className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
        </div>
      </div>

      {suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 bg-background border border-gray-200 rounded-b-xl max-h-60 overflow-auto z-10 shadow-lg">
          {suggestions.map((loc) => (
            <li
              key={loc.name}
              className="px-4 py-2 text-sm hover:bg-primary/10 cursor-pointer"
              onClick={() => {
                handleSelect(loc);

              }}
            >
              {loc.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

