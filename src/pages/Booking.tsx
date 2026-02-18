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
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, CreditCard, Check, Shield, Clock,
  Dog, Cat, MapPin, Calendar as CalendarIcon, QrCode,
  Smartphone, Wallet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type BookingLocationState = {
  shop?: {
    type?: "grooming" | "veterinary" | "hotel";
    name?: string;
    location?: string;
    image?: string;
    price?: number;
    serviceName?: string;
    qrCodeGCash?: string;  // URL to GCash QR image uploaded by business
    qrCodePayMaya?: string; // URL to PayMaya QR image uploaded by business
  };
};

const isHotel = (shop?: BookingLocationState["shop"]) => shop?.type === "hotel";

const Booking = () => {
  const [step, setStep] = useState(1);
  const [petType, setPetType] = useState("dog");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [paymentMethod, setPaymentMethod] = useState<"gcash" | "paymaya" | "creditcard">("gcash");

  // Step 2 fields
  const [petName, setPetName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [dogSize, setDogSize] = useState<string>("");

  // Step 3 fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Step 4 fields
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amountPaid, setAmountPaid] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const shop = (location.state as BookingLocationState | null)?.shop;
  
  const shopQRCodes = {
    gcash: shop?.qrCodeGCash || null,
    paymaya: shop?.qrCodePayMaya || null,
  };

  const setError = (fields: string[]) => {
    const newErrors: Record<string, boolean> = {};
    fields.forEach((f) => { newErrors[f] = true; });
    setErrors(newErrors);
  };

  const clearErrors = () => setErrors({});

  const validateStep1 = (): boolean => {
    const missing: string[] = [];
    if (isHotel(shop)) {
      if (!checkInDate) missing.push("checkIn");
      if (!checkOutDate) missing.push("checkOut");
    } else {
      if (!selectedDate) missing.push("date");
      if (!selectedTime) missing.push("time");
    }
    if (shop?.type === "veterinary" && !selectedService) missing.push("service");
    if (missing.length > 0) {
      setError(missing);
      toast({ title: "Required Fields", description: "Please fill in all required fields before continuing.", variant: "destructive" });
      return false;
    }
    clearErrors();
    return true;
  };

  const validateStep2 = (): boolean => {
    const missing: string[] = [];
    if (!petName.trim()) missing.push("petName");
    if (!breed.trim()) missing.push("breed");
    if (!age.trim()) missing.push("age");
    if (!weight.trim()) missing.push("weight");
    if (petType === "dog" && !dogSize) missing.push("dogSize");
    if (missing.length > 0) {
      setError(missing);
      toast({ title: "Required Fields", description: petType === "dog" ? "Please fill in all required pet details including dog size." : "Please fill in all required pet details.", variant: "destructive" });
      return false;
    }
    clearErrors();
    return true;
  };

  const validateStep3 = (): boolean => {
    const missing: string[] = [];
    if (!firstName.trim()) missing.push("firstName");
    if (!lastName.trim()) missing.push("lastName");
    if (!email.trim()) missing.push("email");
    if (!phone.trim()) missing.push("phone");
    if (!emergencyContact.trim()) missing.push("emergency");
    if (missing.length > 0) {
      setError(missing);
      toast({ title: "Required Fields", description: "Please fill in all your information.", variant: "destructive" });
      return false;
    }
    clearErrors();
    return true;
  };

  const validateStep4 = (): boolean => {
    if (paymentMethod === "creditcard") return false;
    const missing: string[] = [];
    if (!referenceNumber.trim()) missing.push("referenceNumber");
    if (!amountPaid.trim() || Number(amountPaid) <= 0) missing.push("amountPaid");
    if (missing.length > 0) {
      setError(missing);
      toast({ title: "Required Fields", description: "Please enter your payment reference number and amount paid.", variant: "destructive" });
      return false;
    }
    clearErrors();
    return true;
  };

  const errorClass = (field: string) => errors[field] ? "border-destructive ring-destructive/30 ring-2" : "";

  const handleConfirm = () => {
    if (!validateStep4()) return;
    toast({
      title: "Booking Submitted! 🎉",
      description: "We'll verify your payment and send confirmation to your email within 15 minutes.",
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
                    {/* Hotel: Check-in / Check-out Date Selection */}
                    {isHotel(shop) ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Check-in Date *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal ${errorClass("checkIn")} ${
                                  !checkInDate && "text-muted-foreground"
                                }`}
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
                                  if (date && checkOutDate && checkOutDate <= date) {
                                    setCheckOutDate(undefined);
                                  }
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
                                className={`w-full justify-start text-left font-normal ${errorClass("checkOut")} ${
                                  !checkOutDate && "text-muted-foreground"
                                }`}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {checkOutDate ? format(checkOutDate, "PPP") : "Select check-out"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={checkOutDate}
                                onSelect={setCheckOutDate}
                                disabled={(date) => checkInDate ? date <= checkInDate : false}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Date Selection */}
                        <div className="space-y-2">
                          <Label>Select Date *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal ${errorClass("date")} ${
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
                          <Label>Select Time *</Label>
                          <Select value={selectedTime} onValueChange={setSelectedTime}>
                            <SelectTrigger className={errorClass("time")}>
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
                      </>
                    )}

                    {/* Service Selection for grooming/veterinary */}
                    {shop?.type === "veterinary" && (
                      <div className="space-y-2">
                        <Label>Select Service *</Label>
                        <Select value={selectedService} onValueChange={setSelectedService}>
                          <SelectTrigger className={errorClass("service")}>
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

                    <Button variant="hero" className="w-full" onClick={() => { if (validateStep1()) setStep(2); }}>
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
                      <RadioGroup value={petType} onValueChange={(val) => { setPetType(val); if (val !== "dog") setDogSize(""); }} className="flex gap-4">
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
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="other" id="other" />
                          <Label htmlFor="other" className="flex items-center gap-2 cursor-pointer">
                            Other
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {petType === "dog" && (
                      <div className="space-y-2">
                        <Label>Dog Size *</Label>
                        <Select value={dogSize} onValueChange={setDogSize}>
                          <SelectTrigger className={errorClass("dogSize")}>
                            <SelectValue placeholder="Select dog size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small (under 25 lbs) - Base Price</SelectItem>
                            <SelectItem value="medium">Medium (25-50 lbs) - +15%</SelectItem>
                            <SelectItem value="large">Large (50-100 lbs) - +30%</SelectItem>
                            <SelectItem value="giant">Giant (100+ lbs) - +50%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="petName">Pet Name *</Label>
                        <Input id="petName" placeholder="e.g., Max" value={petName} onChange={(e) => setPetName(e.target.value)} className={errorClass("petName")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="breed">Breed *</Label>
                        <Input id="breed" placeholder="e.g., Golden Retriever" value={breed} onChange={(e) => setBreed(e.target.value)} className={errorClass("breed")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">Age *</Label>
                        <Input id="age" placeholder="e.g., 3 years" value={age} onChange={(e) => setAge(e.target.value)} className={errorClass("age")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight *</Label>
                        <Input id="weight" placeholder="e.g., 25 lbs" value={weight} onChange={(e) => setWeight(e.target.value)} className={errorClass("weight")} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="special">Special Requirements</Label>
                      <Textarea 
                        id="special" 
                        placeholder="Any allergies, medications, dietary needs, or special care instructions..."
                        rows={4}
                        value={specialRequirements}
                        onChange={(e) => setSpecialRequirements(e.target.value)}
                      />
                    </div>

                    <Button variant="hero" className="w-full" onClick={() => { if (validateStep2()) setStep(3); }}>
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
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input id="firstName" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={errorClass("firstName")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input id="lastName" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} className={errorClass("lastName")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={errorClass("email")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input id="phone" type="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} className={errorClass("phone")} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergency">Emergency Contact *</Label>
                      <Input id="emergency" placeholder="Name and phone number" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} className={errorClass("emergency")} />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                        Back
                      </Button>
                      <Button variant="hero" className="flex-1" onClick={() => { if (validateStep3()) setStep(4); }}>
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
                    {/* Payment Method Selection */}
                    <div className="space-y-3">
                      <Label>Select Payment Method</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("gcash")}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            paymentMethod === "gcash"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Smartphone className="h-6 w-6" />
                          <span className="text-sm font-medium">GCash</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("paymaya")}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            paymentMethod === "paymaya"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Wallet className="h-6 w-6" />
                          <span className="text-sm font-medium">PayMaya</span>
                        </button>
                        <button
                          type="button"
                          disabled
                          className="relative p-4 rounded-xl border-2 border-border bg-muted/30 flex flex-col items-center gap-2 opacity-50 cursor-not-allowed"
                        >
                          <CreditCard className="h-6 w-6" />
                          <span className="text-sm font-medium">Credit Card</span>
                          <Badge className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-muted-foreground text-muted">
                            Soon
                          </Badge>
                        </button>
                      </div>
                    </div>

                    {/* QR Code Display (only for GCash/PayMaya) */}
                    {(paymentMethod === "gcash" || paymentMethod === "paymaya") && (
                      <div className="space-y-3">
                        <Label>Scan QR Code to Pay</Label>
                        <div className="bg-secondary/30 rounded-xl p-6 flex flex-col items-center gap-4">
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            {/* Show business-uploaded QR image if available, otherwise placeholder */}
                            {(paymentMethod === "gcash" && shopQRCodes.gcash) || (paymentMethod === "paymaya" && shopQRCodes.paymaya) ? (
                              <img
                                src={paymentMethod === "gcash" ? shopQRCodes.gcash! : shopQRCodes.paymaya!}
                                alt={`${paymentMethod.toUpperCase()} QR Code`}
                                className="w-48 h-48 object-contain rounded"
                              />
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
                            <p className="text-xs text-muted-foreground">
                              Scan the QR code or send payment to the above details
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Digital Wallet Payment Fields (GCash/PayMaya) */}
                    {(paymentMethod === "gcash" || paymentMethod === "paymaya") && (
                      <>
                        {/* Reference Number */}
                        <div className="space-y-2">
                          <Label htmlFor="referenceNumber">Payment Reference Number *</Label>
                          <Input 
                            id="referenceNumber" 
                            placeholder="Enter transaction reference number" 
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter the reference number from your {paymentMethod.toUpperCase()} payment confirmation
                          </p>
                        </div>

                        {/* Amount Paid */}
                        <div className="space-y-2">
                          <Label htmlFor="amountPaid">Amount Paid (₱) *</Label>
                          <Input 
                            id="amountPaid" 
                            type="number"
                            step="0.01"
                            placeholder="0.00" 
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Confirm the exact amount you transferred
                          </p>
                        </div>

                        {/* Screenshot Upload (Optional) */}
                        <div className="space-y-2">
                          <Label htmlFor="paymentProof">Payment Screenshot (Optional)</Label>
                          <Input 
                            id="paymentProof" 
                            type="file"
                            accept="image/*"
                            className="cursor-pointer"
                          />
                          <p className="text-xs text-muted-foreground">
                            Upload a screenshot of your payment confirmation for faster verification
                          </p>
                        </div>

                        <div className="flex items-center gap-2 p-4 rounded-xl bg-primary/10 text-primary">
                          <Shield className="h-5 w-5 shrink-0" />
                          <p className="text-sm">Your booking will be confirmed once payment is verified (usually within 5-15 minutes)</p>
                        </div>
                      </>
                    )}

                    {/* Credit Card Form (Disabled for now) */}
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
                            <p className="text-sm text-muted-foreground">
                              We're currently setting up secure credit card processing. Please use GCash or PayMaya for now.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>
                        Back
                      </Button>
                      <Button 
                        variant="hero" 
                        className="flex-1" 
                        onClick={handleConfirm}
                        disabled={paymentMethod === "creditcard"}
                      >
                        {paymentMethod === "creditcard" ? "Payment Method Unavailable" : "Submit Booking"}
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
                  {selectedService && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedService}</span>
                    </div>
                  )}
                </div>

                {(() => {
                  const basePrice = shop?.price ?? 0;
                  const nights = isHotel(shop) && checkInDate && checkOutDate
                    ? Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
                    : 1;
                  
                  // Dog size multiplier
                  const dogSizeMultiplier = petType === "dog" && dogSize ? {
                    small: 1.0,
                    medium: 1.15,
                    large: 1.30,
                    giant: 1.50
                  }[dogSize] || 1.0 : 1.0;
                  
                  const priceWithDogSize = basePrice * dogSizeMultiplier;
                  const subtotal = isHotel(shop) ? priceWithDogSize * nights : priceWithDogSize;
                  const serviceFee = Math.round(subtotal * 0.10 * 100) / 100;
                  const total = subtotal + serviceFee;

                  return (
                    <>
                      <div className="space-y-2 py-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {isHotel(shop)
                              ? `$${basePrice} x ${nights} night(s)`
                              : (shop?.serviceName ?? "Service")}
                          </span>
                          <span>${isHotel(shop) ? basePrice * nights : basePrice}</span>
                        </div>
                        {petType === "dog" && dogSize && dogSize !== "small" && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Dog size ({dogSize}) +{dogSizeMultiplier === 1.15 ? "15" : dogSizeMultiplier === 1.30 ? "30" : "50"}%
                            </span>
                            <span>+${Math.round((priceWithDogSize - basePrice) * (isHotel(shop) ? nights : 1) * 100) / 100}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Service fee (10%)</span>
                          <span>${serviceFee}</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-between py-4 font-semibold">
                        <span>Total</span>
                        <span>${total}</span>
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
