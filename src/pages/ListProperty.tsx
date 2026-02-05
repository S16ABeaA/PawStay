import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import PropertyTypeCard from "@/components/property-listing/PropertyTypeCard";
import StepIndicator from "@/components/property-listing/StepIndicator";
import EarningsCalculator from "@/components/property-listing/EarningsCalculator";
import {
  Building2,
  Scissors,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  Star,
  Users,
  TrendingUp,
  Shield,
  CheckCircle2,
  Clock,
  Globe,
  Headphones,
  MapPin,
  Phone,
  Mail,
  Upload,
  FileText,
  X,
  Image,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { number: 1, title: "Establishment Info" },
  { number: 2, title: "Property Setup" },
  { number: 3, title: "Photos" },
  { number: 4, title: "Pricing & Calendar" },
  { number: 5, title: "Legal Info" },
];

const propertyTypes = [
  {
    id: "hotel",
    icon: Building2,
    title: "Pet Hotel / Boarding",
    description: "Overnight stays and daycare for pets",
  },
  {
    id: "grooming",
    icon: Scissors,
    title: "Grooming Salon",
    description: "Bathing, haircuts, and spa services",
  },
  {
    id: "veterinary",
    icon: Stethoscope,
    title: "Veterinary Clinic",
    description: "Medical care and wellness services",
  },
];

const benefits = [
  {
    icon: Globe,
    title: "Global Reach",
    description: "Access millions of pet parents worldwide",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Guaranteed payouts every month",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated partner support team",
  },
  {
    icon: TrendingUp,
    title: "Growth Tools",
    description: "Analytics and marketing tools",
  },
];

const hotelAmenities = [
  "24/7 Supervision",
  "Outdoor Play Area",
  "Webcam Access",
  "Grooming Services",
  "Training Sessions",
  "Vet On-site",
  "Climate Control",
  "Individual Suites",
];

const groomingServices = [
  "Bath & Dry",
  "Haircut & Styling",
  "Nail Trimming",
  "Ear Cleaning",
  "Teeth Brushing",
  "De-shedding",
  "Flea Treatment",
  "Spa Packages",
];

const vetServices = [
  "General Checkups",
  "Vaccinations",
  "Surgery",
  "Emergency Care",
  "Dental Care",
  "Lab Tests",
  "X-Ray & Imaging",
  "Pharmacy",
];

const ListProperty = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<
    string | null
  >(null);
  const [formData, setFormData] = useState({
    propertyName: "",
    address: "",
    city: "",
    phone: "",
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: "",
    description: "",
    services: [] as string[],
    propertyImages: [] as File[],
    lguPermits: [] as File[],
    baiDocument: null as File | null,
    contractDocument: null as File | null,
  });

  const getServicesForType = () => {
    switch (selectedType) {
      case "hotel":
        return hotelAmenities;
      case "grooming":
        return groomingServices;
      case "veterinary":
        return vetServices;
      default:
        return [];
    }
  };

  const handleServiceToggle = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleNext = () => {
    if (currentStep === 1 && !selectedType) {
      toast({
        title: "Please select a property type",
        variant: "destructive",
      });
      return;
    }
    if (currentStep === 2) {
      // Validate password fields
      if (!formData.password || !formData.confirmPassword) {
        toast({
          title: "Please enter and confirm your password",
          variant: "destructive",
        });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Passwords do not match",
          variant: "destructive",
        });
        return;
      }
      if (formData.password.length < 8) {
        toast({
          title: "Password must be at least 8 characters long",
          variant: "destructive",
        });
        return;
      }
    }
    if (currentStep < 5) setCurrentStep((prev) => prev + 1);
  };

  const handleFileChange = (
    field:
      | "baiDocument"
      | "contractDocument",
    file: File | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const removeFile = (
    field:
      | "baiDocument"
      | "contractDocument",
  ) => {
    setFormData((prev) => ({ ...prev, [field]: null }));
  };

  const handleLguPermitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPermits = Array.from(files);
      setFormData((prev) => ({
        ...prev,
        lguPermits: [...prev.lguPermits, ...newPermits].slice(0, 5), // Max 5 permits
      }));
    }
  };

  const removeLguPermit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      lguPermits: prev.lguPermits.filter((_, i) => i !== index),
    }));
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    toast({
      title: "Application Submitted! 🎉",
      description:
        "We'll review your property and contact you within 24-48 hours.",
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files);
      setFormData((prev) => ({
        ...prev,
        propertyImages: [...prev.propertyImages, ...newImages].slice(0, 10), // Max 10 images
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      propertyImages: prev.propertyImages.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-12 md:py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                List Your Property on{" "}
                <span className="text-gradient">PawStay</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Join thousands of pet care providers and start
                earning today. It only takes 10 minutes to get
                started.
              </p>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Free to list</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Go live in 24 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                <span>2,500+ active partners</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-rating" />
                <span>4.8 partner satisfaction</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-2">
                <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
                  <StepIndicator
                    steps={steps}
                    currentStep={currentStep}
                  />

                  {/* Step 1: Property Type */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          Establishment Info
                        </h2>
                        <p className="text-muted-foreground">
                          Tell us about your property so we can
                          create your listing.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Property Type
                        </h3>
                        <p className="text-muted-foreground">
                          Select the category that best
                          describes your business
                        </p>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        {propertyTypes.map((type) => (
                          <PropertyTypeCard
                            key={type.id}
                            icon={type.icon}
                            title={type.title}
                            description={type.description}
                            isSelected={
                              selectedType === type.id
                            }
                            onClick={() =>
                              setSelectedType(type.id)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Basic Info */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          Establishment Info
                        </h2>
                        <p className="text-muted-foreground">
                          This information will be displayed on
                          your listing
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Basic Info
                        </h3>
                        <p className="text-muted-foreground">
                          Provide your business and contact
                          details
                        </p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="propertyName">
                            Property Name *
                          </Label>
                          <Input
                            id="propertyName"
                            placeholder="e.g., Happy Tails Pet Hotel"
                            value={formData.propertyName}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                propertyName: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="address">
                            Street Address *
                          </Label>
                          <Input
                            id="address"
                            placeholder="123 Pet Street"
                            value={formData.address}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            placeholder="San Francisco"
                            value={formData.city}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                city: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">
                            Phone Number *
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ownerName">
                            Contact Name *
                          </Label>
                          <Input
                            id="ownerName"
                            placeholder="John Smith"
                            value={formData.ownerName}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                ownerName: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">
                            Password *
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter a strong password"
                            value={formData.password}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                password: e.target.value,
                              }))
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Must be at least 8 characters long
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">
                            Confirm Password *
                          </Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Re-enter your password"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                confirmPassword: e.target.value,
                              }))
                            }
                            className={
                              formData.confirmPassword &&
                              formData.password !==
                                formData.confirmPassword
                                ? "border-destructive"
                                : formData.confirmPassword &&
                                    formData.password ===
                                      formData.confirmPassword
                                  ? "border-success"
                                  : ""
                            }
                          />
                          {formData.confirmPassword &&
                            formData.password !==
                              formData.confirmPassword && (
                              <p className="text-xs text-destructive flex items-center gap-1">
                                <X className="h-3 w-3" />
                                Passwords do not match
                              </p>
                            )}
                          {formData.confirmPassword &&
                            formData.password ===
                              formData.confirmPassword && (
                              <p className="text-xs text-success flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Passwords match
                              </p>
                            )}
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="description">
                            Property Description
                          </Label>
                          <Textarea
                            id="description"
                            placeholder="Tell pet parents what makes your property special..."
                            rows={4}
                            value={formData.description}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Services */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          What services do you offer?
                        </h2>
                        <p className="text-muted-foreground">
                          Select all that apply to help pet
                          parents find you
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {getServicesForType().map((service) => (
                          <label
                            key={service}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              formData.services.includes(
                                service,
                              )
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <Checkbox
                              checked={formData.services.includes(
                                service,
                              )}
                              onCheckedChange={() =>
                                handleServiceToggle(service)
                              }
                            />
                            <span className="text-sm font-medium">
                              {service}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Documents */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          Upload Required Documents
                        </h2>
                        <p className="text-muted-foreground">
                          Please upload your business license,
                          BAI document, and signed contract
                        </p>
                      </div>

                      {/* Upload Progress Indicator */}
                      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">
                              Upload Progress
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {[
                                formData.lguPermits.length > 0,
                                formData.baiDocument,
                                formData.contractDocument,
                              ].filter(Boolean).length}{" "}
                              of 3 required documents uploaded
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {[
                                formData.lguPermits.length > 0,
                                formData.baiDocument,
                                formData.contractDocument,
                              ].map((file, index) => (
                                <div
                                  key={index}
                                  className={`w-2 h-2 rounded-full ${
                                    file ? "bg-success" : "bg-border"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* LGU Permits */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="lguPermits"
                            className="flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4 text-primary" />
                            LGU Permit * (Max 5)
                          </Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Upload your Local Government Unit permits and clearances
                          </p>
                          
                          {/* LGU Permits Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            {formData.lguPermits.map((permit, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-xl"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                                  <span className="text-sm font-medium truncate">
                                    {permit.name}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLguPermit(index)}
                                  className="h-8 w-8 p-0 shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            
                            {/* Upload Button */}
                            {formData.lguPermits.length < 5 && (
                              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-sm font-medium text-foreground">
                                  Add Permit
                                </span>
                                <span className="text-xs text-muted-foreground mt-1">
                                  {formData.lguPermits.length}/5
                                </span>
                                <input
                                  type="file"
                                  id="lguPermits"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  multiple
                                  className="hidden"
                                  onChange={handleLguPermitUpload}
                                />
                              </label>
                            )}
                          </div>
                          {formData.lguPermits.length > 0 && (
                            <p className="text-xs text-success flex items-center gap-1 mt-2">
                              <CheckCircle2 className="h-3 w-3" />
                              {formData.lguPermits.length} {formData.lguPermits.length === 1 ? 'permit' : 'permits'} uploaded
                            </p>
                          )}
                        </div>

                        {/* BAI Document */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="baiDocument"
                            className="flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4 text-primary" />
                            BAI Document *
                          </Label>
                          <div className="relative">
                            {formData.baiDocument ? (
                              <div className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-xl">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-5 w-5 text-success" />
                                  <span className="text-sm font-medium">
                                    {
                                      formData
                                        .baiDocument
                                        .name
                                    }
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeFile(
                                      "baiDocument",
                                    )
                                  }
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-sm font-medium text-foreground">
                                  Click to upload
                                </span>
                                <span className="text-xs text-muted-foreground mt-1">
                                  PDF, JPG, PNG up to 10MB
                                </span>
                                <input
                                  type="file"
                                  id="baiDocument"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleFileChange(
                                      "baiDocument",
                                      e.target.files?.[0] ||
                                        null,
                                    )
                                  }
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Contract Document */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="contractDocument"
                            className="flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4 text-primary" />
                            Signed Partner Contract *
                          </Label>
                          <div className="relative">
                            {formData.contractDocument ? (
                              <div className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-xl">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-5 w-5 text-success" />
                                  <span className="text-sm font-medium">
                                    {
                                      formData.contractDocument
                                        .name
                                    }
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeFile(
                                      "contractDocument",
                                    )
                                  }
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-sm font-medium text-foreground">
                                  Click to upload
                                </span>
                                <span className="text-xs text-muted-foreground mt-1">
                                  PDF up to 10MB
                                </span>
                                <input
                                  type="file"
                                  id="contractDocument"
                                  accept=".pdf"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleFileChange(
                                      "contractDocument",
                                      e.target.files?.[0] ||
                                        null,
                                    )
                                  }
                                />
                              </label>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Download the{" "}
                            <a
                              href="#"
                              className="text-primary hover:underline"
                            >
                              Partner Agreement Template
                            </a>{" "}
                            to review and sign
                          </p>
                        </div>

                        {/* Property Images */}
                        <div className="space-y-2 pt-4">
                          <Label
                            htmlFor="propertyImages"
                            className="flex items-center gap-2"
                          >
                            <Image className="h-4 w-4 text-primary" />
                            Property Photos * (Max 10)
                          </Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Upload high-quality photos of your property to attract more customers
                          </p>
                          
                          {/* Image Upload Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {formData.propertyImages.map((image, index) => (
                              <div
                                key={index}
                                className="relative aspect-square rounded-xl overflow-hidden bg-secondary/50 border-2 border-border group"
                              >
                                <img
                                  src={URL.createObjectURL(image)}
                                  alt={`Property ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            
                            {/* Upload Button */}
                            {formData.propertyImages.length < 10 && (
                              <label className="aspect-square flex flex-col items-center justify-center p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-xs font-medium text-foreground text-center">
                                  Add Photo
                                </span>
                                <span className="text-xs text-muted-foreground mt-1">
                                  {formData.propertyImages.length}/10
                                </span>
                                <input
                                  type="file"
                                  id="propertyImages"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={handleImageUpload}
                                />
                              </label>
                            )}
                          </div>
                          {formData.propertyImages.length > 0 && (
                            <p className="text-xs text-success flex items-center gap-1 mt-2">
                              <CheckCircle2 className="h-3 w-3" />
                              {formData.propertyImages.length} {formData.propertyImages.length === 1 ? 'photo' : 'photos'} uploaded
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Review */}
                  {currentStep === 5 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          Review your listing
                        </h2>
                        <p className="text-muted-foreground">
                          Make sure everything looks good before
                          submitting
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-secondary/50 rounded-xl p-4">
                          <h3 className="font-medium text-foreground mb-3">
                            Property Details
                          </h3>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span>
                                {formData.propertyName ||
                                  "Not provided"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {formData.city ||
                                  "Not provided"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>
                                {formData.phone ||
                                  "Not provided"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span>
                                {formData.email ||
                                  "Not provided"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-secondary/50 rounded-xl p-4">
                          <h3 className="font-medium text-foreground mb-3">
                            Selected Services
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {formData.services.length > 0 ? (
                              formData.services.map(
                                (service) => (
                                  <span
                                    key={service}
                                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                                  >
                                    {service}
                                  </span>
                                ),
                              )
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                No services selected
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="bg-secondary/50 rounded-xl p-4">
                          <h3 className="font-medium text-foreground mb-3">
                            Uploaded Documents
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              {formData.lguPermits.length > 0 ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : (
                                <X className="h-4 w-4 text-destructive" />
                              )}
                              <span
                                className={
                                  formData.lguPermits.length > 0
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }
                              >
                                LGU Permits:{" "}
                                {formData.lguPermits.length > 0
                                  ? `${formData.lguPermits.length} uploaded`
                                  : "Not uploaded"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {formData.baiDocument ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : (
                                <X className="h-4 w-4 text-destructive" />
                              )}
                              <span
                                className={
                                  formData.baiDocument
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }
                              >
                                BAI Document:{" "}
                                {formData.baiDocument
                                  ?.name || "Not uploaded"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {formData.contractDocument ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : (
                                <X className="h-4 w-4 text-destructive" />
                              )}
                              <span
                                className={
                                  formData.contractDocument
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }
                              >
                                Partner Contract:{" "}
                                {formData.contractDocument
                                  ?.name || "Not uploaded"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Property Images Review */}
                        <div className="bg-secondary/50 rounded-xl p-4">
                          <h3 className="font-medium text-foreground mb-3">
                            Property Photos
                          </h3>
                          {formData.propertyImages.length > 0 ? (
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                              {formData.propertyImages.map((image, index) => (
                                <div
                                  key={index}
                                  className="aspect-square rounded-lg overflow-hidden bg-secondary border border-border"
                                >
                                  <img
                                    src={URL.createObjectURL(image)}
                                    alt={`Property ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm">
                              <X className="h-4 w-4 text-destructive" />
                              <span className="text-muted-foreground">No photos uploaded</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-success/10 rounded-xl">
                          <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">
                              What happens next?
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Our team will review your
                              application and contact you within
                              24-48 hours. Once approved, you
                              can start receiving bookings
                              immediately!
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Checkbox
                            id="terms"
                            className="mt-1"
                          />
                          <Label
                            htmlFor="terms"
                            className="text-sm text-muted-foreground cursor-pointer"
                          >
                            I agree to the{" "}
                            <a
                              href="#"
                              className="text-primary hover:underline"
                            >
                              Terms of Service
                            </a>{" "}
                            and{" "}
                            <a
                              href="#"
                              className="text-primary hover:underline"
                            >
                              Partner Agreement
                            </a>
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between mt-8 pt-6 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 1}
                      className="gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    {currentStep < 5 ? (
                      <Button
                        variant="hero"
                        onClick={handleNext}
                        className="gap-2"
                      >
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="hero"
                        onClick={handleSubmit}
                        className="gap-2"
                      >
                        Submit Application
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <EarningsCalculator />

                {/* Benefits */}
                <div className="bg-card rounded-2xl p-6 shadow-soft">
                  <h3 className="font-semibold text-lg text-foreground mb-4">
                    Why Partner With Us?
                  </h3>
                  <div className="space-y-4">
                    {benefits.map((benefit) => (
                      <div
                        key={benefit.title}
                        className="flex items-start gap-3"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <benefit.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {benefit.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Support */}
                <div className="bg-secondary/50 rounded-2xl p-6">
                  <h3 className="font-semibold text-foreground mb-2">
                    Need Help?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Our partner support team is here to help you
                    get started.
                  </p>
                  <Button variant="outline" className="w-full">
                    <Headphones className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ListProperty;