import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, CreditCard, Check, Shield, Clock,
  Dog, Cat, MapPin, Calendar as CalendarIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const Booking = () => {
  const [step, setStep] = useState(1);
  const [petType, setPetType] = useState("dog");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const shop = (location.state as any)?.shop;

  const handleConfirm = () => {
    toast({
      title: "Booking Confirmed! 🎉",
      description: "Check your email for confirmation details.",
    });
    setTimeout(() => navigate("/"), 2000);
  };

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
              <div className="flex items-center gap-4 mb-8">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= s 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {step > s ? <Check className="h-4 w-4" /> : s}
                    </div>
                    <span className={`text-sm hidden sm:inline ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                      {s === 1 ? "Booking Details" : s === 2 ? "Pet Details" : s === 3 ? "Your Info" : "Payment"}
                    </span>
                    {s < 4 && <div className="w-8 sm:w-16 h-px bg-border" />}
                  </div>
                ))}
              </div>

              {/* Step 1: Booking Details */}
              {step === 1 && (
                <div className="bg-card rounded-2xl p-6 md:p-8 shadow-soft">
                  <h2 className="font-semibold text-xl mb-6">Booking Details</h2>

                  <div className="space-y-6">
                    {/* Date Selection */}
                    <div className="space-y-2">
                      <Label>Select Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${
                              !selectedDate && "text-muted-foreground"
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Time Selection */}
                    <div className="space-y-2">
                      <Label>Select Time</Label>
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a time slot" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="9:00">9:00 AM</SelectItem>
                          <SelectItem value="10:00">10:00 AM</SelectItem>
                          <SelectItem value="11:00">11:00 AM</SelectItem>
                          <SelectItem value="14:00">2:00 PM</SelectItem>
                          <SelectItem value="15:00">3:00 PM</SelectItem>
                          <SelectItem value="16:00">4:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Service Selection for grooming/veterinary */}
                    {shop?.type === "grooming" && (
                      <div className="space-y-2">
                        <Label>Select Service</Label>
                        <Select value={selectedService} onValueChange={setSelectedService}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a grooming service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic Grooming - $45</SelectItem>
                            <SelectItem value="full">Full Spa Package - $85</SelectItem>
                            <SelectItem value="premium">Premium VIP - $150</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {shop?.type === "veterinary" && (
                      <div className="space-y-2">
                        <Label>Select Service</Label>
                        <Select value={selectedService} onValueChange={setSelectedService}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a veterinary service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wellness">Wellness Exam - From $75</SelectItem>
                            <SelectItem value="vaccination">Vaccinations - From $35</SelectItem>
                            <SelectItem value="sick">Sick Pet Visit - From $95</SelectItem>
                            <SelectItem value="refill">Prescription Refills - From $15</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button variant="hero" className="w-full" onClick={() => setStep(2)}>
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Pet Details */}
              {step === 2 && (
                <div className="bg-card rounded-2xl p-6 md:p-8 shadow-soft">
                  <h2 className="font-semibold text-xl mb-6">Pet Information</h2>

                  <div className="space-y-6">
                    <div>
                      <Label className="mb-3 block">Pet Type</Label>
                      <RadioGroup value={petType} onValueChange={setPetType} className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="dog" id="dog" />
                          <Label htmlFor="dog" className="flex items-center gap-2 cursor-pointer">
                            <Dog className="h-5 w-5" />
                            Dog
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="cat" id="cat" />
                          <Label htmlFor="cat" className="flex items-center gap-2 cursor-pointer">
                            <Cat className="h-5 w-5" />
                            Cat
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="petName">Pet Name</Label>
                        <Input id="petName" placeholder="e.g., Max" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="breed">Breed</Label>
                        <Input id="breed" placeholder="e.g., Golden Retriever" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input id="age" placeholder="e.g., 3 years" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight</Label>
                        <Input id="weight" placeholder="e.g., 25 lbs" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="special">Special Requirements</Label>
                      <Textarea 
                        id="special" 
                        placeholder="Any allergies, medications, dietary needs, or special care instructions..."
                        rows={4}
                      />
                    </div>

                    <Button variant="hero" className="w-full" onClick={() => setStep(3)}>
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Owner Info */}
              {step === 3 && (
                <div className="bg-card rounded-2xl p-6 md:p-8 shadow-soft">
                  <h2 className="font-semibold text-xl mb-6">Your Information</h2>

                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" placeholder="John" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" placeholder="Doe" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="you@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" type="tel" placeholder="(555) 123-4567" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergency">Emergency Contact</Label>
                      <Input id="emergency" placeholder="Name and phone number" />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                        Back
                      </Button>
                      <Button variant="hero" className="flex-1" onClick={() => setStep(4)}>
                        Continue
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Payment */}
              {step === 4 && (
                <div className="bg-card rounded-2xl p-6 md:p-8 shadow-soft">
                  <h2 className="font-semibold text-xl mb-6">Payment Details</h2>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input id="cardName" placeholder="John Doe" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="cardNumber" placeholder="4242 4242 4242 4242" className="pl-10" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" placeholder="MM/YY" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input id="cvc" placeholder="123" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-4 rounded-xl bg-success/10 text-success">
                      <Shield className="h-5 w-5 shrink-0" />
                      <p className="text-sm">Your payment information is encrypted and secure</p>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>
                        Back
                      </Button>
                      <Button variant="hero" className="flex-1" onClick={handleConfirm}>
                        Confirm Booking
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
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
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedDate ? format(selectedDate, "PPP") : "Select date"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedTime ? `${selectedTime} AM/PM` : "Select time"}</span>
                  </div>
                  {selectedService && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedService}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 py-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">$65 x 3 nights</span>
                    <span>$195</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service fee</span>
                    <span>$10</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between py-4 font-semibold">
                  <span>Total</span>
                  <span>$205</span>
                </div>

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
