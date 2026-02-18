import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Search, Dog, Cat, Rabbit } from "lucide-react";
import { LocationInput } from "./LocationInput";


const SearchBar = () => {
  const [petType, setPetType] = useState("dog");
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [dateError, setDateError] = useState<string>("");

  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<{name: string; lat: number; lng: number} | null>(null);



  const petTypes = [
    { id: "dog", icon: Dog, label: "Dog" },
    { id: "cat", icon: Cat, label: "Cat" },
    { id: "others", icon: Rabbit, label: "Others" },
  ];

  const [error, setError] = useState("");

  // Get today's date at midnight for comparison
  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  // Format date for min attribute (YYYY-MM-DD)
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Validate date string
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false;
    
    // Check format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Check year range (current year to 2100)
    const currentYear = new Date().getFullYear();
    if (year < currentYear || year > 2100) return false;
    
    // Check month range
    if (month < 1 || month > 12) return false;
    
    // Check day range based on month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return false;
    
    // Check if date is valid
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && 
           date.getFullYear() === year &&
           date.getMonth() + 1 === month &&
           date.getDate() === day;
  };

  // Check if date is not before today
  const isDateNotBeforeToday = (dateString: string): boolean => {
    if (!isValidDate(dateString)) return false;
    
    const inputDate = new Date(dateString);
    inputDate.setHours(0, 0, 0, 0);
    const today = getToday();
    
    return inputDate >= today;
  };

  // Get min date for check-out based on check-in date
  const getMinCheckOutDate = () => {
    if (!checkIn || !isValidDate(checkIn)) return formatDateForInput(getToday());
    
    const checkInDate = new Date(checkIn);
    const nextDay = new Date(checkInDate);
    nextDay.setDate(checkInDate.getDate() + 1);
    
    return formatDateForInput(nextDay);
  };

  const handleDateChange = (
    value: string,
    setDate: (date: string) => void,
    isCheckIn: boolean
  ) => {
    // Clear any previous date errors
    setDateError("");
    
    if (!value) {
      setDate("");
      return;
    }
    
    // Validate the date format
    if (!isValidDate(value)) {
      setDateError(`Please enter a valid ${isCheckIn ? 'check-in' : 'check-out'} date in MM-DD-YYYY format`);
      setDate(value);
      return;
    }
    
    // Check if date is not before today
    if (!isDateNotBeforeToday(value)) {
      const today = getToday();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (isCheckIn) {
        setDateError(`Check-in date cannot be before today (${formatDateForInput(today)})`);
      } else {
        setDateError(`Check-out date cannot be before today (${formatDateForInput(today)})`);
      }
      setDate(value);
      return;
    }
    
    setDate(value);
    
    // For check-in changes, validate against check-out
    if (isCheckIn && checkOut && isValidDate(checkOut) && isDateNotBeforeToday(checkOut)) {
      const newCheckIn = new Date(value);
      newCheckIn.setHours(0, 0, 0, 0);
      const currentCheckOut = new Date(checkOut);
      currentCheckOut.setHours(0, 0, 0, 0);
      
      if (currentCheckOut <= newCheckIn) {
        setCheckOut("");
      }
    }
  };

  const handleSearch = () => {
    // Clear previous errors
    setError("");
    setDateError("");

    // Validate required fields
    if (!location || !checkIn) {
      setError("Please fill in location and check-in date.");
      return;
    }

    // Validate check-in date
    if (!isValidDate(checkIn)) {
      setDateError("Please enter a valid check-in date");
      return;
    }
    
    if (!isDateNotBeforeToday(checkIn)) {
      setDateError("Check-in date cannot be before today");
      return;
    }

    // Validate check-out date only if provided
    if (checkOut) {
      if (!isValidDate(checkOut)) {
        setDateError("Please enter a valid check-out date");
        return;
      }
      
      if (!isDateNotBeforeToday(checkOut)) {
        setDateError("Check-out date cannot be before today");
        return;
      }

      const checkInDate = new Date(checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      const checkOutDate = new Date(checkOut);
      checkOutDate.setHours(0, 0, 0, 0);
      
      if (checkOutDate <= checkInDate) {
        setError("Check-out must be after check-in.");
        return;
      }
    }

    const params = new URLSearchParams();
    params.set("location", location);
    params.set("pet", petType);
    params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);

    navigate(`/search?${params.toString()}`);
  };

  // Handle manual input with onBlur for better UX
  const handleDateBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    isCheckIn: boolean
  ) => {
    const value = e.target.value;
    if (!value) return;
    
    // Try to parse various date formats
    const parseDate = (input: string): string | null => {
      // Already in YYYY-MM-DD format
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(input)) {
        const [year, month, day] = input.split('-').map(Number);
        const paddedMonth = month.toString().padStart(2, '0');
        const paddedDay = day.toString().padStart(2, '0');
        return `${year}-${paddedMonth}-${paddedDay}`;
      }
      
      // MM/DD/YYYY format
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input)) {
        const [month, day, year] = input.split('/').map(Number);
        const paddedMonth = month.toString().padStart(2, '0');
        const paddedDay = day.toString().padStart(2, '0');
        return `${year}-${paddedMonth}-${paddedDay}`;
      }
      
      // DD-MM-YYYY format
      if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(input)) {
        const [day, month, year] = input.split('-').map(Number);
        const paddedMonth = month.toString().padStart(2, '0');
        const paddedDay = day.toString().padStart(2, '0');
        return `${year}-${paddedMonth}-${paddedDay}`;
      }
      
      return null;
    };
    
    const formattedDate = parseDate(value);
    if (formattedDate) {
      if (isCheckIn) {
        setCheckIn(formattedDate);
        // Re-validate with new value
        handleDateChange(formattedDate, setCheckIn, true);
      } else {
        setCheckOut(formattedDate);
        // Re-validate with new value
        handleDateChange(formattedDate, setCheckOut, false);
      }
    } else if (value) {
      setDateError(`Please enter a valid date in YYYY-MM-DD format`);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-card rounded-2xl shadow-elevated p-2 md:p-3">
        <div className="flex flex-col lg:flex-row gap-2">
        {/* Location */}
        <LocationInput
          value={location}
          onChange={setLocation}
          onSelect={(loc) => {
            setSelectedLocation(loc); // full object for backend
            setLocation(loc.name);    // display name in input
          }}
        />


          {/* Check-in */}
          <div className="flex-1 group">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background hover:bg-secondary/50 transition-colors">
              <Calendar className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Check-in</p>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => handleDateChange(e.target.value, setCheckIn, true)}
                  onFocus={() => {
                    if (!isValidDate(checkIn) || !isDateNotBeforeToday(checkIn)) {
                      const todayStr = formatDateForInput(getToday());
                      setCheckIn(todayStr);
                      setDateError("");
                    }
                  }}
                  onBlur={(e) => handleDateBlur(e, true)}
                  min={formatDateForInput(getToday())}
                  max="2100-12-31"
                  className={`w-full bg-transparent text-sm font-semibold focus:outline-none ${
                    !checkIn ? "text-muted-foreground/70" : "text-foreground"
                  }`}
                  title="Enter check-in date (cannot be before today)"
                />
              </div>
            </div>
          </div>

          {/* Check-out */}
          <div className="flex-1 group">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background hover:bg-secondary/50 transition-colors">
              <Calendar className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Check-out</p>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => handleDateChange(e.target.value, setCheckOut, false)}
                  onFocus={() => {
                    if (!isValidDate(checkOut) || !isDateNotBeforeToday(checkOut)) {
                      const todayStr = formatDateForInput(getToday());
                      setCheckOut("");
                      setDateError("");
                    }
                  }}
                  onBlur={(e) => handleDateBlur(e, false)}
                  min={getMinCheckOutDate()}
                  max="2100-12-31"
                  className={`w-full bg-transparent text-sm font-semibold focus:outline-none ${
                    !checkOut ? "text-muted-foreground/70" : "text-foreground"
                  }`}
                  title="Enter check-out date (must be after check-in)"
                />
              </div>
            </div>
          </div>

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
            <Button
              variant="hero"
              size="lg"
              className="w-full lg:w-auto lg:px-6"
              onClick={handleSearch}
              disabled={!!dateError || !checkIn || !location}
            >
              <Search className="h-5 w-5" />
              <span className="lg:hidden">Search</span>
            </Button>
          </div>
        </div>
        
        {/* Date-specific error */}
        {dateError && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {dateError}
          </div>
        )}
        
        {/* General error */}
        {error && !dateError && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Date format hint with today's date */}
        <div className="mt-2 text-xs text-muted-foreground px-1 flex flex-wrap items-center gap-2">
          <span>Date format: MM-DD-YYYY</span>
          <span className="text-primary font-medium">
            • Today: {formatDateMMDDYYYY(getToday())}
          </span>
          <span className="text-muted-foreground/70">
            • Dates cannot be before today
          </span>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;

function formatDateMMDDYYYY(date: Date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}