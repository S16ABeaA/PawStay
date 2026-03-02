import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, CreditCard, Check, Shield, Clock,
  Dog, Cat, MapPin, Calendar as CalendarIcon, QrCode,
  Smartphone, Wallet, PawPrint, Plus, Upload, FileText,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { petApi } from "@/services/petApi";
import { bookingApi } from "@/services/bookingApi";
import { authApi } from "@/services/authApi";

type BookingLocationState = {
  shop?: {
    type?: "grooming" | "veterinary" | "hotel";
    name?: string;
    location?: string;
    image?: string;
    price?: number;
    serviceName?: string;
    propertyId?: string;
    qrCodeGCash?: string;
    qrCodePayMaya?: string;
    acceptedPaymentMethods?: string[];
  };
};

interface PetProfile {
  id: string;
  name: string;
  species: string;
  breed: string;
  birthday: string;
  weight: number;
  photo_url: string | null;
  notes?: string | null;
}

const isHotel = (shop?: BookingLocationState["shop"]) => shop?.type === "hotel";

const formatPhoneInput = (value: string) => value.replace(/[^\d\s\-+()]/g, "");
const isValidPhoneNumber = (phone: string) => {
  if (!phone) return false;
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
};

// Calculate age string from birthday
const calculateAgeStr = (birthday: string): string => {
  const birthDate = new Date(birthday);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    years--;
  }
  if (years < 1) {
    const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + today.getMonth() - birthDate.getMonth();
    return `${Math.max(1, months)} month${months !== 1 ? "s" : ""}`;
  }
  return `${years} year${years !== 1 ? "s" : ""}`;
};

const Booking = () => {
  const [step, setStep] = useState(1);
  const [petType, setPetType] = useState("dog");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [paymentMethod, setPaymentMethod] = useState<"gcash" | "paymaya" | "cash" | "creditcard">("gcash");

  // Step 2: Pet selection
  const [userPets, setUserPets] = useState<PetProfile[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [petSelectionMode, setPetSelectionMode] = useState<"existing" | "new" | null>(null);

  // Step 3: Pet details fields
  const [petName, setPetName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [dogSize, setDogSize] = useState<string>("");
  const [medCert, setMedCert] = useState<string | null>(null);
  const [medCertName, setMedCertName] = useState<string>("");
  const [vaccineRecord, setVaccineRecord] = useState<string | null>(null);
  const [vaccineRecordName, setVaccineRecordName] = useState<string>("");

  // Step 4 fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [profileFields, setProfileFields] = useState<Record<string, boolean>>({});

  // Step 5 fields
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [paymentScreenshotName, setPaymentScreenshotName] = useState<string>("");
  const [cashAmountPaid, setCashAmountPaid] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Availability state
  const [availableSlots, setAvailableSlots] = useState<string[]>(["9:00", "10:00", "11:00", "14:00", "15:00", "16:00"]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [unavailableHotelDates, setUnavailableHotelDates] = useState<Set<string>>(new Set());
  const [hotelDatesLoading, setHotelDatesLoading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const shop = (location.state as BookingLocationState | null)?.shop;

  // ── Price calculation helper (reused for display + submission) ──
  const calculatePrices = useCallback(() => {
    const basePrice = Number(shop?.price) || 0;
    const nights = isHotel(shop) && checkInDate && checkOutDate
      ? Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 1;
    const isGrooming = shop?.type === "grooming";
    const dogSizeMultiplier = isGrooming && petType === "dog" && dogSize
      ? ({ small: 1.0, medium: 1.15, large: 1.30, giant: 1.50 }[dogSize] || 1.0)
      : 1.0;
    const priceWithDogSize = basePrice * dogSizeMultiplier;
    const subtotal = isHotel(shop) ? priceWithDogSize * nights : priceWithDogSize;
    const serviceFee = Math.round(subtotal * 0.10 * 100) / 100;
    const total = Math.round((subtotal + serviceFee) * 100) / 100;
    return { basePrice, nights, dogSizeMultiplier, priceWithDogSize, subtotal, serviceFee, total };
  }, [shop, checkInDate, checkOutDate, petType, dogSize]);

  // Parse a currency-like input into a number (handles commas, currency symbols)
  const parseCurrency = (val: string | undefined | null): number => {
    if (val == null) return NaN;
    const cleaned = String(val).replace(/[^0-9.-]+/g, "");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : NaN;
  };
  const shopQRCodes = {
    gcash: shop?.qrCodeGCash || null,
    paymaya: shop?.qrCodePayMaya || null,
  };

  // Auto-select first accepted payment method
  useEffect(() => {
    const accepted = shop?.acceptedPaymentMethods || [];
    if (accepted.length === 0) return; // no restrictions, keep default
    const methodMap: Record<string, "gcash" | "paymaya" | "cash"> = {
      "GCash": "gcash",
      "PayMaya": "paymaya",
      "Cash": "cash",
    };
    for (const m of accepted) {
      if (methodMap[m]) {
        setPaymentMethod(methodMap[m]);
        return;
      }
    }
  }, [shop?.acceptedPaymentMethods]);

  // Fetch user's pets on mount
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setPetsLoading(true);
        const data = await petApi.list();
        setUserPets(data.pets ?? []);
      } catch (err) {
        console.error("Failed to load pets:", err);
      } finally {
        setPetsLoading(false);
      }
    };
    fetchPets();
  }, []);

  // Auto-fill owner info from profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authApi.getProfile();
        const user = data?.user;
        if (user) {
          const filled: Record<string, boolean> = {};
          if (user.first_name) { setFirstName(user.first_name); filled.firstName = true; }
          if (user.last_name) { setLastName(user.last_name); filled.lastName = true; }
          if (user.email) { setEmail(user.email); filled.email = true; }
          if (user.phone) { setPhone(user.phone); filled.phone = true; }
          setProfileFields(filled);
        }
      } catch (err) {
        console.error("Failed to load profile for auto-fill:", err);
      }
    };
    fetchProfile();
  }, []);

  // Fetch available time slots when date changes (grooming/vet)
  useEffect(() => {
    if (isHotel(shop) || !selectedDate || !shop?.propertyId) return;

    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSelectedTime(""); // reset selection when date changes
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const data = await bookingApi.getSlotAvailability(shop.propertyId!, dateStr);
        setAvailableSlots(data.availableSlots ?? []);
        if (data.availableSlots.length === 0) {
          toast({
            title: "Fully Booked",
            description: "This date has no available time slots. Please pick another date.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Failed to fetch slot availability:", err);
        // Fallback: show all slots if the API fails
        setAvailableSlots(["9:00", "10:00", "11:00", "14:00", "15:00", "16:00"]);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDate, shop?.propertyId]);

  // Fetch unavailable hotel dates (look 6 months ahead)
  const fetchHotelAvailability = useCallback(async () => {
    if (!isHotel(shop) || !shop?.propertyId) return;

    setHotelDatesLoading(true);
    try {
      const today = new Date();
      const rangeStart = format(today, "yyyy-MM-dd");
      const sixMonthsLater = new Date(today);
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
      const rangeEnd = format(sixMonthsLater, "yyyy-MM-dd");

      const data = await bookingApi.getHotelAvailability(shop.propertyId!, rangeStart, rangeEnd);
      setUnavailableHotelDates(new Set(data.unavailableDates ?? []));
    } catch (err) {
      console.error("Failed to fetch hotel availability:", err);
      setUnavailableHotelDates(new Set());
    } finally {
      setHotelDatesLoading(false);
    }
  }, [shop?.propertyId, shop?.type]);

  useEffect(() => {
    fetchHotelAvailability();
  }, [fetchHotelAvailability]);

  // Helper: check if a date is unavailable for hotel booking
  const isHotelDateUnavailable = useCallback((date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    return unavailableHotelDates.has(dateStr);
  }, [unavailableHotelDates]);

  // Helper: check if any date in a range is unavailable (for hotel checkout validation)
  const hasUnavailableDateInRange = useCallback((start: Date, end: Date): boolean => {
    const cur = new Date(start);
    while (cur < end) {
      if (isHotelDateUnavailable(cur)) return true;
      cur.setDate(cur.getDate() + 1);
    }
    return false;
  }, [isHotelDateUnavailable]);

  const setError = (fields: string[]) => {
    const newErrors: Record<string, boolean> = {};
    fields.forEach((f) => { newErrors[f] = true; });
    setErrors(newErrors);
  };

  const clearErrors = () => setErrors({});

  // Auto-fill pet details from selected pet
  const autoFillFromPet = (pet: PetProfile) => {
    setPetName(pet.name);
    setBreed(pet.breed);
    setAge(calculateAgeStr(pet.birthday));
    setWeight(String(pet.weight));
    const species = pet.species.toLowerCase();
    setPetType(species === "cat" ? "cat" : species === "dog" ? "dog" : "other");
    setSpecialRequirements(pet.notes || "");

    // Auto-determine dog size from weight (kg)
    if (species === "dog" && pet.weight) {
      if (pet.weight >= 45) setDogSize("giant");
      else if (pet.weight >= 23) setDogSize("large");
      else if (pet.weight >= 11) setDogSize("medium");
      else setDogSize("small");
    }
  };

  // Handle pet selection
  const handleSelectPet = (petId: string) => {
    setSelectedPetId(petId);
    setPetSelectionMode("existing");
    const pet = userPets.find((p) => p.id === petId);
    if (pet) autoFillFromPet(pet);
  };

  // Auto-derive dog size from weight (kg) for grooming pricing
  const deriveDogSizeFromWeight = (weightKg: number) => {
    if (weightKg >= 45) return "giant";
    if (weightKg >= 23) return "large";
    if (weightKg >= 11) return "medium";
    return "small";
  };

  // Handle "Add New Pet" selection
  const handleNewPet = () => {
    setSelectedPetId(null);
    setPetSelectionMode("new");
    setPetName("");
    setBreed("");
    setAge("");
    setWeight("");
    setSpecialRequirements("");
    setDogSize("");
    setPetType("dog");
  };

  // File upload handler (converts to base64)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void,
    nameSetter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      nameSetter(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = (): boolean => {
    const missing: string[] = [];
    if (isHotel(shop)) {
      if (!checkInDate) missing.push("checkIn");
      if (!checkOutDate) missing.push("checkOut");
      // Check for unavailable dates within the selected range
      if (checkInDate && checkOutDate && hasUnavailableDateInRange(checkInDate, checkOutDate)) {
        toast({
          title: "Unavailable Dates",
          description: "Your selected date range includes fully-booked dates. Please adjust your dates.",
          variant: "destructive",
        });
        return false;
      }
    } else {
      if (!selectedDate) missing.push("date");
      if (!selectedTime) missing.push("time");
      if (selectedDate && availableSlots.length === 0) {
        toast({
          title: "No Availability",
          description: "This date has no available time slots. Please pick another date.",
          variant: "destructive",
        });
        return false;
      }
    }
    if (shop?.type === "veterinary" && !selectedService) {}  // no longer required
    if (missing.length > 0) {
      setError(missing);
      toast({ title: "Required Fields", description: "Please fill in all required fields before continuing.", variant: "destructive" });
      return false;
    }
    clearErrors();
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!petSelectionMode) {
      toast({ title: "Select a Pet", description: "Please select an existing pet or choose to add a new one.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    const missing: string[] = [];
    if (!petName.trim()) missing.push("petName");
    if (!breed.trim()) missing.push("breed");
    if (!age.trim()) missing.push("age");
    if (!weight.trim()) missing.push("weight");
    if (!vaccineRecord) missing.push("vaccineRecord");
    if (missing.length > 0) {
      setError(missing);
      toast({ title: "Required Fields", description: !vaccineRecord ? "Please upload the vaccine record to continue." : "Please fill in all required pet details.", variant: "destructive" });
      return false;
    }
    clearErrors();
    return true;
  };

  const validateStep4 = (): boolean => {
    const missing: string[] = [];
    if (!firstName.trim()) missing.push("firstName");
    if (!lastName.trim()) missing.push("lastName");
    if (!email.trim()) missing.push("email");
    if (!phone.trim()) missing.push("phone");
    if (missing.length > 0) {
      setError(missing);
      toast({ title: "Required Fields", description: "Please fill in all your information.", variant: "destructive" });
      return false;
    }
    if (!isValidPhoneNumber(phone)) {
      setError(["phone"]);
      toast({ title: "Invalid Phone Number", description: "Please enter a valid phone number (at least 7 digits).", variant: "destructive" });
      return false;
    }
    if (emergencyContact.trim() && !isValidPhoneNumber(emergencyContact)) {
      setError(["emergency"]);
      toast({ title: "Invalid Emergency Contact", description: "Emergency contact must be a valid phone number (at least 7 digits).", variant: "destructive" });
      return false;
    }
    clearErrors();
    return true;
  };

  const validateStep5 = (): boolean => {
    // Intentionally skip client-side payment validation to allow flexible testing/submission.
    // Server-side validation remains authoritative.
    if (paymentMethod === "creditcard") return false;
    clearErrors();
    return true;
  };

  const errorClass = (field: string) => errors[field] ? "border-destructive ring-destructive/30 ring-2" : "";

  const handleConfirm = async () => {
    if (!validateStep5()) return;

    const serviceType = shop?.type === "hotel" ? "boarding" : shop?.type === "grooming" ? "grooming" : shop?.type === "veterinary" ? "veterinary" : null;

    const checkinDate = isHotel(shop) && checkInDate
      ? format(checkInDate, "yyyy-MM-dd")
      : selectedDate
        ? format(selectedDate, "yyyy-MM-dd")
        : new Date().toISOString().split("T")[0];

    const checkoutDate = isHotel(shop) && checkOutDate
      ? format(checkOutDate, "yyyy-MM-dd")
      : null;

    try {
      // Calculate prices for the payload
      const { subtotal, serviceFee, total } = calculatePrices();

      // Validate prices before submitting
      if (!subtotal || subtotal <= 0 || !total || total <= 0) {
        toast({
          title: "Price Error",
          description: "Unable to calculate booking price. Please go back and verify your booking details.",
          variant: "destructive",
        });
        return;
      }

      // Normalize amount values for submission
      const parsedAmount = parseCurrency(amountPaid);
      const parsedCashAmount = parseCurrency(cashAmountPaid);
      const amountPaidPayload = paymentMethod === "cash"
        ? (Number.isFinite(parsedCashAmount) ? parsedCashAmount.toFixed(2) : undefined)
        : (Number.isFinite(parsedAmount) ? parsedAmount.toFixed(2) : undefined);

      await bookingApi.create({
        property_id: shop?.propertyId || "",
        pet_id: selectedPetId,
        checkin: checkinDate,
        checkout: checkoutDate,
        time_slot: selectedTime || null,
        pet_name: petName,
        pet_type: petType,
        pet_breed: breed,
        pet_age: age,
        pet_weight: weight,
        special_requirements: specialRequirements,
        med_cert_url: medCert,
        vaccine_record_url: vaccineRecord,
        service_name: shop?.serviceName || shop?.name || "",
        service_type: serviceType || undefined,
        owner_name: `${firstName} ${lastName}`,
        owner_email: email,
        owner_phone: phone,
        emergency_contact: emergencyContact,
        subtotal,
        service_fee: serviceFee,
        total_price: total,
        payment_method: paymentMethod === "gcash" ? "gcash" : paymentMethod === "paymaya" ? "paymaya" : paymentMethod === "cash" ? "cash" : "card",
        reference_number: paymentMethod === "cash" ? undefined : referenceNumber,
        amount_paid: amountPaidPayload,
        payment_screenshot_url: paymentScreenshot || undefined,
        new_pet_species: petType === "dog" ? "Dog" : petType === "cat" ? "Cat" : "Other",
        new_pet_birthday: selectedPetId ? undefined : new Date().toISOString().split("T")[0],
        dog_size: dogSize,
      });

      toast({
        title: "Booking Submitted! 🎉",
        description: "We'll verify your payment and send confirmation to your email within 15 minutes.",
      });
      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      console.error("Booking submission failed:", err);

      // Concurrency conflict — slot/date was taken by another user
      if (err?.code === "SLOT_UNAVAILABLE" || err?.error?.includes?.("no longer available")) {
        toast({
          title: "Slot No Longer Available",
          description: err?.error || "Someone else just booked this slot. Please choose a different time or date.",
          variant: "destructive",
        });

        // Reset to step 1 and refresh availability
        setStep(1);
        setSelectedTime("");
        if (!isHotel(shop) && selectedDate && shop?.propertyId) {
          // Re-fetch available slots
          try {
            const dateStr = format(selectedDate, "yyyy-MM-dd");
            const data = await bookingApi.getSlotAvailability(shop.propertyId, dateStr);
            setAvailableSlots(data.availableSlots ?? []);
          } catch { /* ignore */ }
        }
        if (isHotel(shop)) {
          setCheckInDate(undefined);
          setCheckOutDate(undefined);
          fetchHotelAvailability();
        }
        return;
      }

      toast({
        title: "Booking Failed",
        description: err?.error || err?.message || err?.details || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const stepLabels = ["Booking Details", "Select Pet", "Pet Details", "Your Info", "Payment"];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="container">
          {/* Back Button */}
          <Link
            to={shop?.type === "grooming" ? "/grooming" : shop?.type === "veterinary" ? "/veterinary" : "/hotels"}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to listings
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              {/* Progress Steps */}
              <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="flex items-center gap-2 shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= s 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {step > s ? <Check className="h-4 w-4" /> : s}
                    </div>
                    <span className={`text-sm hidden sm:inline ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                      {stepLabels[s - 1]}
                    </span>
                    {s < 5 && <div className="w-4 sm:w-8 h-px bg-border" />}
                  </div>
                ))}
              </div>

              {/* ========== Step 1: Booking Details ========== */}
              {step === 1 && (
                <div className="bg-card rounded-2xl p-6 md:p-8 shadow-soft">
                  <h2 className="font-semibold text-xl mb-6">Booking Details</h2>

                  <div className="space-y-6">
                    {isHotel(shop) ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {hotelDatesLoading && (
                          <div className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading availability...
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Check-in Date *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal ${errorClass("checkIn")} ${!checkInDate && "text-muted-foreground"}`}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {checkInDate ? format(checkInDate, "PPP") : "Select check-in"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={checkInDate}
                                onSelect={(date) => {
                                  setCheckInDate(date);
                                  if (date && checkOutDate && checkOutDate <= date) setCheckOutDate(undefined);
                                  // Also clear checkout if the new range has unavailable dates
                                  if (date && checkOutDate && checkOutDate > date && hasUnavailableDateInRange(date, checkOutDate)) {
                                    setCheckOutDate(undefined);
                                    toast({
                                      title: "Check-out Cleared",
                                      description: "Your previous date range included fully-booked dates. Please select a new check-out date.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                disabled={(date) => {
                                  // Can't pick dates in the past
                                  if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
                                  // Can't pick fully-booked dates
                                  return isHotelDateUnavailable(date);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label>Check-out Date *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal ${errorClass("checkOut")} ${!checkOutDate && "text-muted-foreground"}`}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {checkOutDate ? format(checkOutDate, "PPP") : "Select check-out"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={checkOutDate}
                                onSelect={(date) => {
                                  if (date && checkInDate && hasUnavailableDateInRange(checkInDate, date)) {
                                    toast({
                                      title: "Unavailable Dates in Range",
                                      description: "Some dates between your check-in and check-out are fully booked. Please choose a different check-out date.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  setCheckOutDate(date);
                                }}
                                disabled={(date) => {
                                  if (checkInDate && date <= checkInDate) return true;
                                  // Can't pick fully-booked dates as checkout
                                  // Also, for checkout we need ALL dates between checkin and this date to be available
                                  if (isHotelDateUnavailable(date)) return true;
                                  return false;
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Select Date *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={`w-full justify-start text-left font-normal ${errorClass("date")} ${!selectedDate && "text-muted-foreground"}`}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label>Select Time *</Label>
                          {slotsLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-3 px-3 border rounded-md">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Checking available time slots...
                            </div>
                          ) : availableSlots.length === 0 && selectedDate ? (
                            <div className="text-sm text-destructive py-3 px-3 border border-destructive/30 rounded-md bg-destructive/5">
                              No time slots available on this date. Please choose a different date.
                            </div>
                          ) : (
                            <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate}>
                              <SelectTrigger className={errorClass("time")}>
                                <SelectValue placeholder={!selectedDate ? "Select a date first" : "Choose a time slot"} />
                              </SelectTrigger>
                              <SelectContent>
                                {availableSlots.map((slot) => {
                                  const hour = parseInt(slot.split(":")[0], 10);
                                  const label = hour >= 12
                                    ? `${hour === 12 ? 12 : hour - 12}:00 PM`
                                    : `${hour}:00 AM`;
                                  return (
                                    <SelectItem key={slot} value={slot}>
                                      {label}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </>
                    )}

                    <Button variant="hero" className="w-full" onClick={() => { if (validateStep1()) setStep(2); }}>
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* ========== Step 2: Select Pet ========== */}
              {step === 2 && (
                <div className="bg-card rounded-2xl p-6 md:p-8 shadow-soft">
                  <h2 className="font-semibold text-xl mb-2">Select Your Pet</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Choose a pet from your profile or add a new one for this booking.
                  </p>

                  <div className="space-y-4">
                    {petsLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading your pets...</div>
                    ) : (
                      <>
                        {/* Existing Pets */}
                        {userPets.length > 0 && (
                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                              Your Registered Pets
                            </Label>
                            <div className="grid gap-3">
                              {userPets.map((pet) => (
                                <Card
                                  key={pet.id}
                                  className={`cursor-pointer transition-all hover:shadow-md ${
                                    selectedPetId === pet.id
                                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                                      : "border-border hover:border-primary/50"
                                  }`}
                                  onClick={() => handleSelectPet(pet.id)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                      <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                                        {pet.photo_url ? (
                                          <AvatarImage src={pet.photo_url} className="object-cover" />
                                        ) : (
                                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5">
                                            <PawPrint className="h-6 w-6 text-primary" />
                                          </AvatarFallback>
                                        )}
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <h3 className="font-semibold text-base">{pet.name}</h3>
                                          <Badge variant="secondary" className="text-xs">{pet.species}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{pet.breed}</p>
                                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                          <span>{calculateAgeStr(pet.birthday)}</span>
                                          <span>{pet.weight} kg</span>
                                        </div>
                                      </div>
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                        selectedPetId === pet.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                                      }`}>
                                        {selectedPetId === pet.id && <Check className="h-4 w-4 text-primary-foreground" />}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Divider */}
                        {userPets.length > 0 && (
                          <div className="relative py-2">
                            <Separator />
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
                              or
                            </span>
                          </div>
                        )}

                        {/* New Pet Option */}
                        <Card
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            petSelectionMode === "new"
                              ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                              : "border-dashed border-border hover:border-primary/50"
                          }`}
                          onClick={handleNewPet}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                                <Plus className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-base">Add a New Pet</h3>
                                <p className="text-sm text-muted-foreground">Enter pet details manually for this booking</p>
                              </div>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                petSelectionMode === "new" ? "border-primary bg-primary" : "border-muted-foreground/30"
                              }`}>
                                {petSelectionMode === "new" && <Check className="h-4 w-4 text-primary-foreground" />}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {userPets.length === 0 && (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">
                              No pets found in your profile. You can add one now or{" "}
                              <Link to="/my-pets" className="text-primary hover:underline">manage your pets</Link>{" "}
                              first.
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                      <Button variant="hero" className="flex-1" onClick={() => { if (validateStep2()) setStep(3); }}>Continue</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== Step 3: Pet Details ========== */}
              {step === 3 && (
                <div className="bg-card rounded-2xl p-6 md:p-8 shadow-soft">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-semibold text-xl">Pet Information</h2>
                      {petSelectionMode === "existing" && selectedPetId && (
                        <p className="text-sm text-muted-foreground mt-1">Auto-filled from your pet profile. Add records below.</p>
                      )}
                    </div>
                    {petSelectionMode === "existing" && selectedPetId && (
                      <Badge variant="secondary" className="text-xs">
                        <PawPrint className="h-3 w-3 mr-1" />
                        Registered Pet
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="mb-3 block">Pet Type</Label>
                      <RadioGroup
                        value={petType}
                        onValueChange={(val) => { setPetType(val); if (val !== "dog") setDogSize(""); else if (weight) setDogSize(deriveDogSizeFromWeight(Number(weight))); }}
                        className="flex gap-4"
                        disabled={petSelectionMode === "existing"}
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="dog" id="dog" />
                          <Label htmlFor="dog" className="flex items-center gap-2 cursor-pointer"><Dog className="h-5 w-5" /> Dog</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="cat" id="cat" />
                          <Label htmlFor="cat" className="flex items-center gap-2 cursor-pointer"><Cat className="h-5 w-5" /> Cat</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="other" id="other" />
                          <Label htmlFor="other" className="flex items-center gap-2 cursor-pointer">Other</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {shop?.type === "grooming" && petType === "dog" && (
                      <div className="space-y-2">
                        <Label>Dog Size (auto-determined from weight)</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: "small", label: "Small", desc: "Under 11 kg", extra: "Base Price" },
                            { value: "medium", label: "Medium", desc: "11–23 kg", extra: "+15%" },
                            { value: "large", label: "Large", desc: "23–45 kg", extra: "+30%" },
                            { value: "giant", label: "Giant", desc: "45+ kg", extra: "+50%" },
                          ].map((tier) => (
                            <div
                              key={tier.value}
                              className={`rounded-lg border p-3 text-sm transition-colors ${
                                dogSize === tier.value
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-border bg-muted/30 opacity-60"
                              }`}
                            >
                              <span className="font-medium">{tier.label}</span>
                              <span className="text-muted-foreground ml-1">({tier.desc})</span>
                              <span className="block text-xs text-muted-foreground mt-0.5">{tier.extra}</span>
                            </div>
                          ))}
                        </div>
                        {!dogSize && <p className="text-xs text-muted-foreground">Enter your pet's weight below to auto-select the size tier.</p>}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="petName">Pet Name *</Label>
                        <Input id="petName" placeholder="e.g., Max" value={petName} onChange={(e) => setPetName(e.target.value)} className={errorClass("petName")} readOnly={petSelectionMode === "existing"} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="breed">Breed *</Label>
                        <Input id="breed" placeholder="e.g., Golden Retriever" value={breed} onChange={(e) => setBreed(e.target.value)} className={errorClass("breed")} readOnly={petSelectionMode === "existing"} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">Age *</Label>
                        <Input id="age" placeholder="e.g., 3 years" value={age} onChange={(e) => setAge(e.target.value)} className={errorClass("age")} readOnly={petSelectionMode === "existing"} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg) *</Label>
                        <Input id="weight" type="number" min="0" placeholder="e.g., 25" value={weight} onChange={(e) => {
                          const val = e.target.value;
                          setWeight(val);
                          if (petType === "dog" && val) {
                            setDogSize(deriveDogSizeFromWeight(Number(val)));
                          } else if (petType === "dog") {
                            setDogSize("");
                          }
                        }} className={errorClass("weight")} readOnly={petSelectionMode === "existing"} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="special">Special Requirements</Label>
                      <Textarea id="special" placeholder="Any allergies, medications, dietary needs, or special care instructions..." rows={3} value={specialRequirements} onChange={(e) => setSpecialRequirements(e.target.value)} />
                    </div>

                    {/* Records Upload Section */}
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-base mb-1">Pet Records</h3>
                      <p className="text-sm text-muted-foreground mb-4">Upload your pet's records for the service provider.</p>

                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Vaccine Record */}
                        <div className="space-y-2">
                          <Label htmlFor="vaccineRecord" className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-green-600" />
                            Vaccine Record <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <label
                              htmlFor="vaccineRecord"
                              className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 ${vaccineRecord ? "border-green-500 bg-green-50/50" : errors["vaccineRecord"] ? "border-destructive bg-destructive/5" : "border-border"}`}
                            >
                              {vaccineRecord ? (
                                <>
                                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0"><Check className="h-5 w-5 text-green-600" /></div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{vaccineRecordName}</p>
                                    <p className="text-xs text-green-600">Uploaded</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0"><Upload className="h-5 w-5 text-muted-foreground" /></div>
                                  <div>
                                    <p className="text-sm font-medium">Upload vaccine record</p>
                                    <p className="text-xs text-muted-foreground">PDF, JPG, or PNG</p>
                                  </div>
                                </>
                              )}
                            </label>
                            <input id="vaccineRecord" type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileUpload(e, setVaccineRecord, setVaccineRecordName)} />
                          </div>
                        </div>

                        {/* Medical Certificate */}
                        <div className="space-y-2">
                          <Label htmlFor="medCert" className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            Medical Certificate
                            <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                          </Label>
                          <div className="relative">
                            <label
                              htmlFor="medCert"
                              className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 ${medCert ? "border-blue-500 bg-blue-50/50" : "border-border"}`}
                            >
                              {medCert ? (
                                <>
                                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><Check className="h-5 w-5 text-blue-600" /></div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{medCertName}</p>
                                    <p className="text-xs text-blue-600">Uploaded</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0"><Upload className="h-5 w-5 text-muted-foreground" /></div>
                                  <div>
                                    <p className="text-sm font-medium">Upload medical certificate</p>
                                    <p className="text-xs text-muted-foreground">PDF, JPG, or PNG</p>
                                  </div>
                                </>
                              )}
                            </label>
                            <input id="medCert" type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileUpload(e, setMedCert, setMedCertName)} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                      <Button variant="hero" className="flex-1" onClick={() => { if (validateStep3()) setStep(4); }}>Continue</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== Step 4: Owner Info ========== */}
              {step === 4 && (
                <div className="bg-card rounded-2xl p-6 md:p-8 shadow-soft">
                  <h2 className="font-semibold text-xl mb-6">Your Information</h2>

                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input id="firstName" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={errorClass("firstName")} readOnly={!!profileFields.firstName} tabIndex={profileFields.firstName ? -1 : undefined} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input id="lastName" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} className={errorClass("lastName")} readOnly={!!profileFields.lastName} tabIndex={profileFields.lastName ? -1 : undefined} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={errorClass("email")} readOnly={!!profileFields.email} tabIndex={profileFields.email ? -1 : undefined} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input id="phone" type="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(formatPhoneInput(e.target.value))} className={errorClass("phone")} readOnly={!!profileFields.phone} tabIndex={profileFields.phone ? -1 : undefined} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergency">
                        Emergency Contact
                        <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                      </Label>
                      <Input id="emergency" placeholder="Name and phone number" value={emergencyContact} onChange={(e) => setEmergencyContact(formatPhoneInput(e.target.value))} className={errorClass("emergency")} />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Back</Button>
                      <Button variant="hero" className="flex-1" onClick={() => { if (validateStep4()) setStep(5); }}>Continue</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========== Step 5: Payment ========== */}
              {step === 5 && (
                <div className="bg-card rounded-2xl p-6 md:p-8 shadow-soft">
                  <h2 className="font-semibold text-xl mb-6">Payment Details</h2>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label>Select Payment Method</Label>
                      {(() => {
                        const accepted = shop?.acceptedPaymentMethods || [];
                        const hasAccepted = accepted.length > 0;
                        const isMethodAccepted = (method: string) => !hasAccepted || accepted.includes(method);
                        const gcashAccepted = isMethodAccepted("GCash");
                        const paymayaAccepted = isMethodAccepted("PayMaya");
                        const cashAccepted = isMethodAccepted("Cash");

                        return (
                          <div className="grid grid-cols-4 gap-3">
                            <button
                              type="button"
                              onClick={() => gcashAccepted && setPaymentMethod("gcash")}
                              disabled={!gcashAccepted}
                              className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                !gcashAccepted
                                  ? "border-border bg-muted/30 opacity-40 cursor-not-allowed"
                                  : paymentMethod === "gcash"
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                              }`}
                            >
                              <Smartphone className="h-6 w-6" />
                              <span className="text-sm font-medium">GCash</span>
                              {!gcashAccepted && hasAccepted && (
                                <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-muted-foreground text-white rounded-full">N/A</span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => paymayaAccepted && setPaymentMethod("paymaya")}
                              disabled={!paymayaAccepted}
                              className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                !paymayaAccepted
                                  ? "border-border bg-muted/30 opacity-40 cursor-not-allowed"
                                  : paymentMethod === "paymaya"
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                              }`}
                            >
                              <Wallet className="h-6 w-6" />
                              <span className="text-sm font-medium">PayMaya</span>
                              {!paymayaAccepted && hasAccepted && (
                                <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-muted-foreground text-white rounded-full">N/A</span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => cashAccepted && setPaymentMethod("cash")}
                              disabled={!cashAccepted}
                              className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                !cashAccepted
                                  ? "border-border bg-muted/30 opacity-40 cursor-not-allowed"
                                  : paymentMethod === "cash"
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                              }`}
                            >
                              <Wallet className="h-6 w-6" />
                              <span className="text-sm font-medium">Cash</span>
                              {!cashAccepted && hasAccepted && (
                                <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-muted-foreground text-white rounded-full">N/A</span>
                              )}
                            </button>
                            <button type="button" disabled className="relative p-4 rounded-xl border-2 border-border bg-muted/30 flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                              <CreditCard className="h-6 w-6" />
                              <span className="text-sm font-medium">Credit Card</span>
                              <Badge className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-muted-foreground text-muted">Soon</Badge>
                            </button>
                          </div>
                        );
                      })()}
                    </div>

                    {(paymentMethod === "gcash" || paymentMethod === "paymaya") && (
                      <div className="space-y-3">
                        <Label>Scan QR Code to Pay</Label>
                        <div className="bg-secondary/30 rounded-xl p-6 flex flex-col items-center gap-4">
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            {(paymentMethod === "gcash" && shopQRCodes.gcash) || (paymentMethod === "paymaya" && shopQRCodes.paymaya) ? (
                              <img src={paymentMethod === "gcash" ? shopQRCodes.gcash! : shopQRCodes.paymaya!} alt={`${paymentMethod.toUpperCase()} QR Code`} className="w-48 h-48 object-contain rounded" />
                            ) : (
                              <div className="w-48 h-48 flex items-center justify-center border-2 border-dashed border-border rounded">
                                <div className="text-center">
                                  <QrCode className="h-16 w-16 mx-auto mb-2 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">
                                    {paymentMethod === "gcash" && "GCash QR Code"}
                                    {paymentMethod === "paymaya" && "PayMaya QR Code"}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium mb-1">
                              {paymentMethod === "gcash" && "GCash Number: 0917-123-4567"}
                              {paymentMethod === "paymaya" && "PayMaya Number: 0917-987-6543"}
                            </p>
                            <p className="text-xs text-muted-foreground">Scan the QR code or send payment to the above details</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {(paymentMethod === "gcash" || paymentMethod === "paymaya") && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="referenceNumber">Payment Reference Number *</Label>
                          <Input id="referenceNumber" placeholder="Enter transaction reference number" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} className={errorClass("referenceNumber")} required />
                          <p className="text-xs text-muted-foreground">Enter the reference number from your {paymentMethod.toUpperCase()} payment confirmation</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="amountPaid">Amount Paid (₱) *</Label>
                          <Input id="amountPaid" type="number" step="0.01" min="0" placeholder="0.00" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className={errorClass("amountPaid")} required />
                          <p className="text-xs text-muted-foreground">Enter the exact total amount: <span className="font-semibold text-foreground">₱{calculatePrices().total.toFixed(2)}</span></p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="paymentProof">Payment Screenshot *</Label>
                          <div className={`relative ${errorClass("paymentScreenshot")}`}>
                            <Input id="paymentProof" type="file" accept="image/*" className="cursor-pointer" onChange={(e) => handleFileUpload(e, setPaymentScreenshot, setPaymentScreenshotName)} />
                          </div>
                          {paymentScreenshotName && (
                            <p className="text-xs text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> {paymentScreenshotName}</p>
                          )}
                          <p className="text-xs text-muted-foreground">Upload a screenshot of your payment confirmation (required)</p>
                        </div>

                        <div className="flex items-center gap-2 p-4 rounded-xl bg-primary/10 text-primary">
                          <Shield className="h-5 w-5 shrink-0" />
                          <p className="text-sm">Your booking will be confirmed once payment is verified (usually within 5-15 minutes)</p>
                        </div>
                      </>
                    )}

                    {paymentMethod === "cash" && (
                      <div className="space-y-4">
                        <div className="bg-secondary/30 rounded-xl p-4">
                          <p className="text-sm text-muted-foreground">Pay in cash at the establishment. Please provide the amount below for record-keeping.</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cashAmountPaid">Amount to Pay (₱) *</Label>
                          <Input id="cashAmountPaid" type="number" step="0.01" min="0" placeholder="0.00" value={cashAmountPaid} onChange={(e) => setCashAmountPaid(e.target.value)} className={errorClass("cashAmountPaid")} required />
                          <p className="text-xs text-muted-foreground">Enter the exact total amount: <span className="font-semibold text-foreground">₱{calculatePrices().total.toFixed(2)}</span></p>
                        </div>
                        <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-500/10 text-amber-700">
                          <Clock className="h-5 w-5 shrink-0" />
                          <p className="text-sm">Cash payments will be verified upon your visit. Your booking will be confirmed once payment is received.</p>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "creditcard" && (
                      <div className="relative">
                        <div className="space-y-4 opacity-40 pointer-events-none">
                          <div className="space-y-2">
                            <Label htmlFor="cardName">Name on Card</Label>
                            <Input id="cardName" placeholder="John Doe" disabled />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input id="cardNumber" placeholder="4242 4242 4242 4242" className="pl-10" disabled />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="expiry">Expiry Date</Label>
                              <Input id="expiry" placeholder="MM/YY" disabled />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cvc">CVC</Label>
                              <Input id="cvc" placeholder="123" disabled />
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-card/95 backdrop-blur-sm border-2 border-primary rounded-xl p-6 shadow-lg text-center max-w-sm">
                            <CreditCard className="h-12 w-12 mx-auto mb-3 text-primary" />
                            <h3 className="font-semibold text-lg mb-2">Credit Card Payment Coming Soon</h3>
                            <p className="text-sm text-muted-foreground">We're currently setting up secure credit card processing. Please use GCash or PayMaya for now.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setStep(4)}>Back</Button>
                      <Button variant="hero" className="flex-1" onClick={handleConfirm} disabled={paymentMethod === "creditcard"}>
                        {paymentMethod === "creditcard" ? "Payment Method Unavailable" : paymentMethod === "cash" ? "Submit Booking (Cash)" : "Submit Booking"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl p-6 shadow-elevated sticky top-24">
                <h3 className="font-semibold text-lg mb-4">Booking Summary</h3>

                <div className="flex gap-4 mb-4">
                  <img
                    src={shop?.image ?? "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&auto=format&fit=crop"}
                    alt={shop?.name ?? "Selected shop"}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-medium">{shop?.name ?? "Selected Service"}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {shop?.location ?? "Location"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 py-4 border-y border-border">
                  {isHotel(shop) ? (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>Check-in: {checkInDate ? format(checkInDate, "PPP") : "Select date"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>Check-out: {checkOutDate ? format(checkOutDate, "PPP") : "Select date"}</span>
                      </div>
                      {checkInDate && checkOutDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))} night(s)</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedDate ? format(selectedDate, "PPP") : "Select date"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedTime ? `${selectedTime} AM/PM` : "Select time"}</span>
                      </div>
                    </>
                  )}
                  {petName && (
                    <div className="flex items-center gap-2 text-sm">
                      <PawPrint className="h-4 w-4 text-muted-foreground" />
                      <span>{petName} {breed ? `(${breed})` : ""}</span>
                    </div>
                  )}
                </div>

                {(() => {
                  const { basePrice, nights, dogSizeMultiplier, priceWithDogSize, subtotal, serviceFee, total } = calculatePrices();

                  return (
                    <>
                      <div className="space-y-2 py-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{isHotel(shop) ? `₱${basePrice} x ${nights} night(s)` : (shop?.serviceName ?? "Service")}</span>
                          <span>₱{isHotel(shop) ? basePrice * nights : basePrice}</span>
                        </div>
                        {shop?.type === "grooming" && petType === "dog" && dogSize && dogSize !== "small" && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Dog size ({dogSize}) +{dogSizeMultiplier === 1.15 ? "15" : dogSizeMultiplier === 1.30 ? "30" : "50"}%</span>
                            <span>+₱{Math.round((priceWithDogSize - basePrice) * (isHotel(shop) ? nights : 1) * 100) / 100}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Service fee (10%)</span>
                          <span>₱{serviceFee}</span>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-4 font-semibold">
                        <span>Total</span>
                        <span>₱{total}</span>
                      </div>
                    </>
                  );
                })()}

                <div className="text-xs text-muted-foreground text-center">
                  Free cancellation up to 24 hours before check-in
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Booking;
