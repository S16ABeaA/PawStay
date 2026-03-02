import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "leaflet/dist/leaflet.css";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Upload,
  FileText,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PropertyService } from "@/utils/propertyService";

// Components
import ListPropertyHero from "./components/listPropertyHero";
import StepIndicator from "./components/listPropertyStepIndicator";

// Constants
import { PropertyTypeId } from "./static/propertyTypeIDs";
import { INITIAL_FORM_DATA } from "./static/initialFormData";
import { LIST_PROPERTY_STEPS } from "./static/listPropertySteps";
import { COUNTRY_CODES } from "./static/countryCodes";
import { AMENITY_OPTIONS } from "./static/amenityOptions";
import { BOOKING_RULE_OPTIONS } from "./static/bookingRuleOptions";
import { ADD_ON_OPTIONS } from "./static/addOnOptions";
import { PRICING_DISCLAIMER_OPTIONS } from "./static/priceDisclaimerOptions";

// Types
import { PropertyInitalData } from "./types/initial_types/propertyInitialData";
import { PropertySubmissionData } from "./types/submission_types/propertySubmissionData";

// Sections
import EstablishmentInfo01 from "./sections/EstablishmentInfo01";
import EstablishmentInfo02 from "./sections/EstablishmentInfo02";
import PropertySetup01 from "./sections/PropertySetup01";
import PropertySetup02 from "./sections/PropertySetup02";
import PropertySetup03 from "./sections/PropertySetup03";
import PropertySetup04 from "./sections/PropertySetup04";
import PropertySetup05 from "./sections/PropertySetup05";
import Photos from "./sections/Photos";

const ListProperty = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [establishmentStep, setEstablishmentStep] = useState(1);
  const [propertySetupStep, setPropertySetupStep] = useState(1);
  const [pricingCalendarStep, setPricingCalendarStep] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<PropertyTypeId[]>([]);
  const [formData, setFormData] = useState<PropertyInitalData>(INITIAL_FORM_DATA);

  const hasBoarding = selectedTypes.includes("hotel");
  const hasGrooming = selectedTypes.includes("grooming");
  const hasVet = selectedTypes.includes("veterinary");

  const updateForm = (section: Partial<PropertyInitalData>) => {
    setFormData(prev => ({ ...prev, ...section }));
  };

  const updateSelectedTypes = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type.id)
        ? prev.filter((item) => item !== type.id)
        : [...prev, type.id],
    )
  }

  const updateAddress = (lat, lng, data, address) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      addressSearch: data?.display_name ?? prev.addressSearch,
      country: address.country ?? prev.country,
      city:
        address.city ??
        address.town ??
        address.village ??
        address.state ??
        prev.city,
      zipCode: address.postcode ?? prev.zipCode,
    }));
  }

  const pricingSteps = useMemo(() => {
    const stepsList = [1];

    if (hasBoarding || hasGrooming) {
      stepsList.push(3);
    }

    if (hasVet) {
      stepsList.push(4);
    }

    if (hasBoarding) {
      stepsList.push(5);
    }

    stepsList.push(6, 7, 8);
    return stepsList;
  }, [hasBoarding, hasGrooming, hasVet]);

  const visibleAddOns = useMemo(
    () =>
      ADD_ON_OPTIONS.filter(
        (addon) => !addon.types || addon.types.some((type) => selectedTypes.includes(type)),
      ),
    [selectedTypes],
  );

  const visiblePricingDisclaimers = useMemo(
    () =>
      PRICING_DISCLAIMER_OPTIONS.filter(
        (disclaimer) =>
          !disclaimer.types || disclaimer.types.some((type) => selectedTypes.includes(type)),
      ),
    [selectedTypes],
  );

  const handleNext = () => {
    if (currentStep === 1) {
      if (establishmentStep === 1) {
        if (!formData.propertyName || selectedTypes.length === 0) {
          toast({
            title: "Please complete Property Name and Property Type",
            variant: "destructive",
          });
          return;
        }
        setEstablishmentStep(2);
        return;
      }

      const missingFields = [
        { key: "addressSearch", label: "Find Your Address" },
        { key: "country", label: "Country/region" },
        { key: "city", label: "City" },
        { key: "zipCode", label: "Zip code" },
      ].filter((field) => !formData[field.key as keyof typeof formData]);

      if (missingFields.length > 0) {
        toast({
          title: "Please complete Basic Info",
          description: `Missing: ${missingFields
            .map((field) => field.label)
            .join(", ")}`,
          variant: "destructive",
        });
        return;
      }

      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (propertySetupStep < 5) {
        setPropertySetupStep((prev) => prev + 1);
      } else {
        setCurrentStep(3);
      }
      return;
    }

    if (currentStep === 3) {
      if (formData.propertyImages.length < 5) {
        toast({
          title: "Please upload at least 5 photos",
          description: "You need to upload a minimum of 5 photos to continue.",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      const currentIndex = pricingSteps.indexOf(pricingCalendarStep);
      const nextStep = pricingSteps[currentIndex + 1];

      if (nextStep) {
        setPricingCalendarStep(nextStep);
      } else {
        setCurrentStep(5);
      }
      return;
    }

    if (currentStep === 5) {
      setCurrentStep(6);
      return;
    }
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
    if (currentStep === 1 && establishmentStep === 2) {
      setEstablishmentStep(1);
      return;
    }

    if (currentStep === 2) {
      if (propertySetupStep > 1) {
        setPropertySetupStep((prev) => prev - 1);
        return;
      }
      setCurrentStep(1);
      setEstablishmentStep(2);
      return;
    }

    if (currentStep === 3) {
      setCurrentStep(2);
      setPropertySetupStep(5);
      return;
    }

    if (currentStep === 4) {
      const currentIndex = pricingSteps.indexOf(pricingCalendarStep);
      const previousStep = pricingSteps[currentIndex - 1];

      if (previousStep) {
        setPricingCalendarStep(previousStep);
      } else {
        setCurrentStep(3);
      }
      return;
    }

    if (currentStep === 5) {
      setCurrentStep(4);
      const lastPricingStep = pricingSteps[pricingSteps.length - 1] ?? pricingCalendarStep;
      setPricingCalendarStep(lastPricingStep);
      return;
    }

    if (currentStep === 6) {
      setCurrentStep(5);
      return;
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Temporarily disabled authentication for backend testing

      // Validate required fields
      if (!formData.propertyName || selectedTypes.length === 0 || !formData.contractingParty.firstName || !formData.legalEntityType) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Upload files first
      const uploadedImages: string[] = [];
      const uploadedPermits: string[] = [];
      let uploadedBAI: string = '';
      let uploadedContract: string = '';

      // Upload property images
      if (formData.propertyImages.length > 0) {
        const imageUrls = await PropertyService.uploadMultipleFiles(
          formData.propertyImages,
          'property-images',
          `applications/${Date.now()}`
        );
        uploadedImages.push(...imageUrls);
      }

      // Upload permits
      if (formData.lguPermits.length > 0) {
        const permitUrls = await PropertyService.uploadMultipleFiles(
          formData.lguPermits,
          'legal-documents',
          `applications/${Date.now()}/permits`
        );
        if (permitUrls.length !== formData.lguPermits.length) {
          throw new Error('Some permit files failed to upload. Ensure the "legal-documents" bucket exists in Supabase Storage.');
        }
        uploadedPermits.push(...permitUrls);
      }

      // Upload BAI document
      if (formData.baiDocument) {
        const baiUrl = await PropertyService.uploadFile(
          formData.baiDocument,
          'legal-documents',
          `applications/${Date.now()}/bai-${Date.now()}.pdf`
        );
        if (!baiUrl) {
          throw new Error('BAI document upload failed. Ensure the "legal-documents" bucket exists in Supabase Storage.');
        }
        uploadedBAI = baiUrl;
      }

      // Upload contract document
      if (formData.contractDocument) {
        const contractUrl = await PropertyService.uploadFile(
          formData.contractDocument,
          'legal-documents',
          `applications/${Date.now()}/contract-${Date.now()}.pdf`
        );
        if (!contractUrl) {
          throw new Error('Contract document upload failed. Ensure the "legal-documents" bucket exists in Supabase Storage.');
        }
        uploadedContract = contractUrl;
      }

      // Prepare submission data
      const filteredAmenities = formData.facilitiesAmenities.filter((amenity) =>
        AMENITY_OPTIONS.some((option) => option.name === amenity),
      );

      const filteredBookingRules = formData.bookingRules.filter((rule) =>
        BOOKING_RULE_OPTIONS.some((option) => option.name === rule),
      );

      const primaryType = (selectedTypes[0] ?? "hotel") as PropertyTypeId;

      const submissionData: PropertySubmissionData = {
        ...formData,
        propertyImages: uploadedImages,
        lguPermits: uploadedPermits,
        baiDocument: uploadedBAI,
        contractDocument: uploadedContract,
        propertyType: primaryType,
        propertyTypes: selectedTypes,
        legalEntityType: formData.legalEntityType as 'individual' | 'business',
        facilitiesAmenities: filteredAmenities,
        bookingRules: filteredBookingRules,
        checkInCutoff: hasBoarding ? formData.checkInCutoff : "",
        pickupStart: hasBoarding ? formData.pickupStart : "",
        pickupEnd: hasBoarding ? formData.pickupEnd : "",
        appointmentOnly: hasGrooming || hasVet ? formData.appointmentOnly : "",
        emergencyServices: hasVet ? formData.emergencyServices : false,
        petSizePricing:
          hasBoarding || hasGrooming
            ? formData.petSizePricing
            : { small: "", medium: "", large: "", giant: "", cats: "", exotic: "" },
        addOns: hasBoarding || hasGrooming ? formData.addOns : [],
        vetFees: hasVet ? formData.vetFees : {},
        vetAvailability: hasVet || hasBoarding ? formData.vetAvailability : [],
        healthSafety: hasBoarding || hasGrooming ? formData.healthSafety : [],
        boardingRules: hasBoarding
          ? formData.boardingRules
          : {
            advanceBooking: false,
            sameDayBooking: false,
            freeCancellation: false,
            lateCancellationFee: false,
            lateCancellationFeeAmount: "",
            vaccinationRequired: false,
            healthDeclaration: false,
            noAggressivePets: false,
            liabilityWaiver: false,
          },
        feesCharges: {
          ...formData.feesCharges,
          latePickup: hasBoarding ? formData.feesCharges.latePickup : "",
          cleaningFee: hasBoarding ? formData.feesCharges.cleaningFee : "",
          emergencyFee: hasVet || hasGrooming ? formData.feesCharges.emergencyFee : "",
          noShow: formData.cancellationPolicy?.noShow || "",
          cancellationFee: formData.cancellationPolicy?.lateFee || "",
        },
      };

      // Submit the application
      const response = await PropertyService.submitProperty(submissionData);

      if (response.success) {
        toast({
          title: "Application Submitted! 🎉",
          description: "We'll review your property and contact you within 24-48 hours.",
        });
        // Redirect to home after successful submission
        navigate('/', { replace: true });
      } else {
        toast({
          title: "Submission Failed",
          description: response.error || "An error occurred while submitting your application.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const propertySetupTotal = 5;
  const propertySetupCompletedDisplay = currentStep > 2
    ? propertySetupTotal
    : currentStep < 2
    ? 0
    : Math.max(1, Math.min(propertySetupStep, propertySetupTotal));
  const pricingCalendarTotal = pricingSteps.length;
  const pricingCalendarCompletedDisplay = currentStep > 4
    ? pricingCalendarTotal
    : currentStep < 4
    ? 0
    : Math.max(1, pricingSteps.indexOf(pricingCalendarStep) + 1);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <ListPropertyHero />

        {/* Main Content */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="grid gap-8">
              {/* Form Section */}
              <div>
                <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
                  <StepIndicator
                    steps={LIST_PROPERTY_STEPS}
                    currentStep={currentStep}
                    establishmentSubstep={establishmentStep}
                    propertySetupCompleted={propertySetupCompletedDisplay}
                    propertySetupTotal={propertySetupTotal}
                    photosCompleted={formData.propertyImages.length >= 5}
                    pricingCalendarCompleted={pricingCalendarCompletedDisplay}
                    pricingCalendarTotal={pricingCalendarTotal}
                  />

                  {/* Step 1: Establishment Info */}
                  {currentStep === 1 && establishmentStep === 1 && (
                    <EstablishmentInfo01 
                      formData={formData} 
                      onChange={updateForm} 
                      selectedTypes={selectedTypes} 
                      updateSelectedTypes={updateSelectedTypes}                      
                    />
                  )}

                  {currentStep === 1 && establishmentStep === 2 && (
                    <EstablishmentInfo02
                      formData={formData}
                      onChange={updateForm}
                      updateAddress={updateAddress}
                    />
                  )}

                  {/* Step 2: Property Setup */}
                  {currentStep === 2 && propertySetupStep === 1 && (
                    <PropertySetup01
                      formData={formData}
                      onChange={updateForm}
                      hasBoarding={hasBoarding}
                      hasGrooming={hasGrooming}
                    />
                  )}

                  {currentStep === 2 && propertySetupStep === 2 && (
                    <PropertySetup02 
                      formData={formData}
                      onChange={updateForm}
                      selectedTypes={selectedTypes}
                    />
                  )}

                  {currentStep === 2 && propertySetupStep === 3 && (
                    <PropertySetup03 
                      formData={formData}
                      onChange={updateForm}
                      hasBoarding={hasBoarding}
                      hasGrooming={hasGrooming}
                      hasVet={hasVet}
                    />
                  )}

                  {currentStep === 2 && propertySetupStep === 4 && (
                    <PropertySetup04
                      formData={formData}
                      onChange={updateForm}
                      selectedTypes={selectedTypes}
                    />
                  )}

                  {currentStep === 2 && propertySetupStep === 5 && (
                    <PropertySetup05
                      formData={formData}
                      onChange={updateForm}
                      hasBoarding={hasBoarding}
                      hasGrooming={hasGrooming}
                      hasVet={hasVet}
                    />
                  )}

                  {/* Step 3: Photos */}
                  {currentStep === 3 && (
                    <Photos 
                      formData={formData}
                      onChange={updateForm}
                    />
                  )}

                  {/* Step 4: Pricing & Calendar */}
                  {currentStep === 4 && pricingCalendarStep === 1 && (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-semibold text-foreground mb-2">
                            Base Service Pricing
                          </h2>
                          <p className="text-muted-foreground">
                            Set your base prices for main services
                          </p>
                        </div>

                        <div className="space-y-4 mb-6">
                          {formData.baseServices.map((service, index) => (
                            <div key={index} className="bg-secondary/50 rounded-xl p-4 border border-border">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-2">
                                  <Label>Service Name</Label>
                                  <Input
                                    placeholder="e.g., Basic Grooming"
                                    value={service.name}
                                    onChange={(e) => {
                                      const newServices = [...formData.baseServices];
                                      newServices[index].name = e.target.value;
                                      setFormData((prev) => ({ ...prev, baseServices: newServices }));
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Price Type</Label>
                                  <select
                                    className="w-full px-3 py-2 border rounded-md h-10"
                                    value={service.priceType}
                                    onChange={(e) => {
                                      const newServices = [...formData.baseServices];
                                      newServices[index].priceType = e.target.value;
                                      setFormData((prev) => ({ ...prev, baseServices: newServices }));
                                    }}
                                  >
                                    <option value="Fixed price">Fixed price</option>
                                    <option value="Starting from">Starting from</option>
                                  </select>
                                </div>
                                {service.priceType === "Starting from" ? (
                                  <>
                                    <div className="space-y-2">
                                      <Label>Min Price</Label>
                                      <Input
                                        placeholder="₱800"
                                        value={service.minPrice}
                                        onChange={(e) => {
                                          const newServices = [...formData.baseServices];
                                          newServices[index].minPrice = e.target.value;
                                          setFormData((prev) => ({ ...prev, baseServices: newServices }));
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Max Price</Label>
                                      <Input
                                        placeholder="₱1,500"
                                        value={service.maxPrice}
                                        onChange={(e) => {
                                          const newServices = [...formData.baseServices];
                                          newServices[index].maxPrice = e.target.value;
                                          setFormData((prev) => ({ ...prev, baseServices: newServices }));
                                        }}
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="space-y-2">
                                      <Label>Price</Label>
                                      <Input
                                        placeholder="₱1,200"
                                        value={service.price}
                                        onChange={(e) => {
                                          const newServices = [...formData.baseServices];
                                          newServices[index].price = e.target.value;
                                          setFormData((prev) => ({ ...prev, baseServices: newServices }));
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Duration</Label>
                                      <Input
                                        placeholder="1–1.5 hrs"
                                        value={service.duration}
                                        onChange={(e) => {
                                          const newServices = [...formData.baseServices];
                                          newServices[index].duration = e.target.value;
                                          setFormData((prev) => ({ ...prev, baseServices: newServices }));
                                        }}
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                              {service.priceType === "Starting from" && (
                                <div className="mt-4">
                                  <Label>Duration</Label>
                                  <Input
                                    placeholder="1–1.5 hrs"
                                    value={service.duration}
                                    onChange={(e) => {
                                      const newServices = [...formData.baseServices];
                                      newServices[index].duration = e.target.value;
                                      setFormData((prev) => ({ ...prev, baseServices: newServices }));
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="text-center">
                          <Button
                            variant="outline"
                            onClick={() => setFormData((prev) => ({
                              ...prev,
                              baseServices: [...prev.baseServices, { name: "", priceType: "Fixed price", price: "", minPrice: "", maxPrice: "", duration: "" }]
                            }))}
                            className="mb-4"
                          >
                            + Add Service
                          </Button>
                          <p className="text-sm text-muted-foreground">
                            Add another service to expand your offerings
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && pricingCalendarStep === 3 && (hasBoarding || hasGrooming) && (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-semibold text-foreground mb-2">
                            Add-Ons & Extras
                          </h2>
                          <p className="text-muted-foreground">
                            Extras increase your booking value
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {visibleAddOns.map((addon) => {
                            const addonName = addon.name;
                            const existingAddon = formData.addOns.find(a => a.name === addonName);
                            const isEnabled = !!existingAddon;
                            return (
                              <div 
                                key={addonName} 
                                className="bg-secondary/50 rounded-xl p-4 border border-border cursor-pointer hover:bg-secondary/70 transition-colors"
                                onClick={() => {
                                  if (isEnabled) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      addOns: prev.addOns.filter(a => a.name !== addonName)
                                    }));
                                  } else {
                                    setFormData((prev) => ({
                                      ...prev,
                                      addOns: [...prev.addOns, { name: addonName, price: "", type: "One-time" }]
                                    }));
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <Label className="text-sm font-medium">{addonName}</Label>
                                  <input
                                    type="checkbox"
                                    className="w-5 h-5 pointer-events-none"
                                    checked={isEnabled}
                                    readOnly
                                  />
                                </div>
                                {isEnabled && (
                                  <div className="space-y-3 animate-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
                                    <Input
                                      placeholder="Price"
                                      value={existingAddon.price}
                                      onChange={(e) => {
                                        const newAddons = formData.addOns.map(a =>
                                          a.name === addonName ? { ...a, price: e.target.value } : a
                                        );
                                        setFormData((prev) => ({ ...prev, addOns: newAddons }));
                                      }}
                                    />
                                    <select
                                      className="w-full px-3 py-2 border rounded-md"
                                      value={existingAddon.type}
                                      onChange={(e) => {
                                        const newAddons = formData.addOns.map(a =>
                                          a.name === addonName ? { ...a, type: e.target.value } : a
                                        );
                                        setFormData((prev) => ({ ...prev, addOns: newAddons }));
                                      }}
                                    >
                                      <option value="One-time">One-time</option>
                                      <option value="Per-day">Per-day</option>
                                    </select>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && pricingCalendarStep === 4 && hasVet && (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-semibold text-foreground mb-2">
                            Veterinary Fees
                          </h2>
                          <p className="text-muted-foreground">
                            Set fees for veterinary services
                          </p>
                        </div>

                        <div className="space-y-6">
                          <div className="bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-4">Consultation Fees</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Initial Consultation</Label>
                                <Input
                                  placeholder="₱0"
                                  value={formData.vetFees?.initialConsultation || ""}
                                  onChange={(e) => setFormData((prev) => ({
                                    ...prev,
                                    vetFees: { ...prev.vetFees, initialConsultation: e.target.value }
                                  }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Follow-up Visit</Label>
                                <Input
                                  placeholder="₱0"
                                  value={formData.vetFees?.followUpVisit || ""}
                                  onChange={(e) => setFormData((prev) => ({
                                    ...prev,
                                    vetFees: { ...prev.vetFees, followUpVisit: e.target.value }
                                  }))}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-4">Vaccination & Preventive Care</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Rabies Vaccination</Label>
                                <Input
                                  placeholder="₱0"
                                  value={formData.vetFees?.rabiesVaccination || ""}
                                  onChange={(e) => setFormData((prev) => ({
                                    ...prev,
                                    vetFees: { ...prev.vetFees, rabiesVaccination: e.target.value }
                                  }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>DHPP Vaccination</Label>
                                <Input
                                  placeholder="₱0"
                                  value={formData.vetFees?.dhppVaccination || ""}
                                  onChange={(e) => setFormData((prev) => ({
                                    ...prev,
                                    vetFees: { ...prev.vetFees, dhppVaccination: e.target.value }
                                  }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Heartworm Test</Label>
                                <Input
                                  placeholder="₱0"
                                  value={formData.vetFees?.heartwormTest || ""}
                                  onChange={(e) => setFormData((prev) => ({
                                    ...prev,
                                    vetFees: { ...prev.vetFees, heartwormTest: e.target.value }
                                  }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Flea Treatment</Label>
                                <Input
                                  placeholder="₱0"
                                  value={formData.vetFees?.fleaTreatment || ""}
                                  onChange={(e) => setFormData((prev) => ({
                                    ...prev,
                                    vetFees: { ...prev.vetFees, fleaTreatment: e.target.value }
                                  }))}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-4">Emergency & Treatment</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Emergency Visit</Label>
                                <Input
                                  placeholder="₱0"
                                  value={formData.vetFees?.emergencyVisit || ""}
                                  onChange={(e) => setFormData((prev) => ({
                                    ...prev,
                                    vetFees: { ...prev.vetFees, emergencyVisit: e.target.value }
                                  }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Surgery (Minor)</Label>
                                <Input
                                  placeholder="₱0"
                                  value={formData.vetFees?.minorSurgery || ""}
                                  onChange={(e) => setFormData((prev) => ({
                                    ...prev,
                                    vetFees: { ...prev.vetFees, minorSurgery: e.target.value }
                                  }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Dental Cleaning</Label>
                                <Input
                                  placeholder="₱0"
                                  value={formData.vetFees?.dentalCleaning || ""}
                                  onChange={(e) => setFormData((prev) => ({
                                    ...prev,
                                    vetFees: { ...prev.vetFees, dentalCleaning: e.target.value }
                                  }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>X-Ray</Label>
                                <Input
                                  placeholder="₱0"
                                  value={formData.vetFees?.xRay || ""}
                                  onChange={(e) => setFormData((prev) => ({
                                    ...prev,
                                    vetFees: { ...prev.vetFees, xRay: e.target.value }
                                  }))}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && pricingCalendarStep === 5 && hasBoarding && (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-semibold text-foreground mb-2">
                            Boarding Rules
                          </h2>
                          <p className="text-muted-foreground">
                            Set your boarding policies and restrictions
                          </p>
                        </div>

                        <div className="space-y-6">
                          <div className="bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-4">Booking Policies</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div 
                                className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors"
                                onClick={() => setFormData((prev) => ({
                                  ...prev,
                                  boardingRules: { ...prev.boardingRules, advanceBooking: !prev.boardingRules?.advanceBooking }
                                }))}
                              >
                                <div>
                                  <Label className="text-sm font-medium">Advance booking required</Label>
                                  <p className="text-xs text-muted-foreground">Minimum notice period</p>
                                </div>
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 pointer-events-none"
                                  checked={formData.boardingRules?.advanceBooking || false}
                                  readOnly
                                />
                              </div>
                              <div 
                                className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors"
                                onClick={() => setFormData((prev) => ({
                                  ...prev,
                                  boardingRules: { ...prev.boardingRules, sameDayBooking: !prev.boardingRules?.sameDayBooking }
                                }))}
                              >
                                <div>
                                  <Label className="text-sm font-medium">Same-day booking allowed</Label>
                                  <p className="text-xs text-muted-foreground">Accept last-minute bookings</p>
                                </div>
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 pointer-events-none"
                                  checked={formData.boardingRules?.sameDayBooking || false}
                                  readOnly
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-4">Pet Restrictions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div 
                                className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors"
                                onClick={() => setFormData((prev) => ({
                                  ...prev,
                                  boardingRules: { ...prev.boardingRules, vaccinationRequired: !prev.boardingRules?.vaccinationRequired }
                                }))}
                              >
                                <div>
                                  <Label className="text-sm font-medium">Vaccination required</Label>
                                  <p className="text-xs text-muted-foreground">Up-to-date vaccinations</p>
                                </div>
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 pointer-events-none"
                                  checked={formData.boardingRules?.vaccinationRequired || false}
                                  readOnly
                                />
                              </div>
                              <div 
                                className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors"
                                onClick={() => setFormData((prev) => ({
                                  ...prev,
                                  boardingRules: { ...prev.boardingRules, healthDeclaration: !prev.boardingRules?.healthDeclaration }
                                }))}
                              >
                                <div>
                                  <Label className="text-sm font-medium">Health declaration required</Label>
                                  <p className="text-xs text-muted-foreground">Vet health certificate</p>
                                </div>
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 pointer-events-none"
                                  checked={formData.boardingRules?.healthDeclaration || false}
                                  readOnly
                                />
                              </div>
                              <div 
                                className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors"
                                onClick={() => setFormData((prev) => ({
                                  ...prev,
                                  boardingRules: { ...prev.boardingRules, noAggressivePets: !prev.boardingRules?.noAggressivePets }
                                }))}
                              >
                                <div>
                                  <Label className="text-sm font-medium">Aggressive behavior policy</Label>
                                  <p className="text-xs text-muted-foreground">No aggressive pets</p>
                                </div>
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 pointer-events-none"
                                  checked={formData.boardingRules?.noAggressivePets || false}
                                  readOnly
                                />
                              </div>
                              <div 
                                className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors"
                                onClick={() => setFormData((prev) => ({
                                  ...prev,
                                  boardingRules: { ...prev.boardingRules, liabilityWaiver: !prev.boardingRules?.liabilityWaiver }
                                }))}
                              >
                                <div>
                                  <Label className="text-sm font-medium">Liability waiver required</Label>
                                  <p className="text-xs text-muted-foreground">Signed waiver needed</p>
                                </div>
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 pointer-events-none"
                                  checked={formData.boardingRules?.liabilityWaiver || false}
                                  readOnly
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && pricingCalendarStep === 6 && (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-semibold text-foreground mb-2">
                            Fees & Charges
                          </h2>
                          <p className="text-muted-foreground">
                            Set additional fees and charges
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Platform Service Fee</Label>
                            <Input
                              placeholder="10%"
                              value={formData.feesCharges?.serviceFee || ""}
                              onChange={(e) => setFormData((prev) => ({
                                ...prev,
                                feesCharges: { ...prev.feesCharges, serviceFee: e.target.value }
                              }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Taxes</Label>
                            <select
                              className="w-full px-3 py-2 border rounded-md"
                              value={formData.feesCharges?.taxes || "Included"}
                              onChange={(e) => setFormData((prev) => ({
                                ...prev,
                                feesCharges: { ...prev.feesCharges, taxes: e.target.value }
                              }))}
                            >
                              <option value="Included">Included</option>
                              <option value="Excluded">Excluded</option>
                            </select>
                          </div>
                          <div className="md:col-span-2 bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-4">Cancellation & Rescheduling</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Free cancellation period *</Label>
                                <select
                                  className="w-full px-3 py-2 border rounded-md"
                                  value={formData.cancellationPolicy?.freeCancellation || "24hours"}
                                  onChange={(e) => setFormData((prev) => ({
                                    ...prev,
                                    cancellationPolicy: { ...prev.cancellationPolicy, freeCancellation: e.target.value }
                                  }))}
                                >
                                  <option value="24hours">Up to 24 hours before</option>
                                  <option value="48hours">Up to 48 hours before</option>
                                  <option value="1week">Up to 1 week before</option>
                                  <option value="none">No free cancellation</option>
                                </select>
                                <p className="text-xs text-muted-foreground">Customers can cancel for free within this period</p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Late cancellation fee</Label>
                                <Input
                                  placeholder="₱500 or 50% of booking"
                                  value={formData.cancellationPolicy?.lateFee || ""}
                                  onChange={(e) => setFormData((prev) => ({
                                    ...prev,
                                    cancellationPolicy: { ...prev.cancellationPolicy, lateFee: e.target.value }
                                  }))}
                                />
                                <p className="text-xs text-muted-foreground">Fee for cancellations after free period</p>
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label className="text-sm font-medium">No-show policy</Label>
                                <Input
                                  placeholder="Full charge or 100% of booking amount"
                                  value={formData.cancellationPolicy?.noShow || ""}
                                  onChange={(e) => setFormData((prev) => ({
                                    ...prev,
                                    cancellationPolicy: { ...prev.cancellationPolicy, noShow: e.target.value }
                                  }))}
                                />
                                <p className="text-xs text-muted-foreground">What happens if customer doesn't show up</p>
                              </div>
                            </div>
                          </div>
                          {hasBoarding && (
                            <div className="space-y-2">
                              <Label>Late Pickup Fee</Label>
                              <Input
                                placeholder="₱100 per hour"
                                value={formData.feesCharges?.latePickup || ""}
                                onChange={(e) => setFormData((prev) => ({
                                  ...prev,
                                  feesCharges: { ...prev.feesCharges, latePickup: e.target.value }
                                }))}
                              />
                            </div>
                          )}
                          {hasBoarding && (
                            <div className="space-y-2">
                              <Label>Cleaning Fee</Label>
                              <Input
                                placeholder="₱200"
                                value={formData.feesCharges?.cleaningFee || ""}
                                onChange={(e) => setFormData((prev) => ({
                                  ...prev,
                                  feesCharges: { ...prev.feesCharges, cleaningFee: e.target.value }
                                }))}
                              />
                            </div>
                          )}
                          {(hasVet || hasGrooming) && (
                            <div className="space-y-2">
                              <Label>Emergency Fee</Label>
                              <Input
                                placeholder="₱500"
                                value={formData.feesCharges?.emergencyFee || ""}
                                onChange={(e) => setFormData((prev) => ({
                                  ...prev,
                                  feesCharges: { ...prev.feesCharges, emergencyFee: e.target.value }
                                }))}
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Holiday Surcharge</Label>
                            <Input
                              placeholder="20% during holidays"
                              value={formData.feesCharges?.holidaySurcharge || ""}
                              onChange={(e) => setFormData((prev) => ({
                                ...prev,
                                feesCharges: { ...prev.feesCharges, holidaySurcharge: e.target.value }
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && pricingCalendarStep === 7 && (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-semibold text-foreground mb-2">
                            Payment Options
                          </h2>
                          <p className="text-muted-foreground">
                            Choose accepted payment methods
                          </p>
                        </div>

                        <div className="space-y-8">
                          <div>
                            <h3 className="text-lg font-medium mb-4">Accepted Payment Methods</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              {[
                                { name: "Credit/Debit", icon: "💳", disabled: false },
                                { name: "GCash", icon: "📱", disabled: false },
                                { name: "PayMaya", icon: "📱", disabled: false },
                                { name: "Cash", icon: "💵", disabled: false },
                                { name: "Bank Transfer", icon: "🏦", disabled: true }
                              ].map((method) => (
                                <div
                                  key={method.name}
                                  className={`relative p-4 border-2 rounded-xl transition-all ${
                                    method.disabled
                                      ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                                      : formData.paymentOptions?.methods?.includes(method.name)
                                        ? "border-primary bg-primary/5 cursor-pointer"
                                        : "border-border hover:border-primary/30 cursor-pointer"
                                  }`}
                                  onClick={() => {
                                    if (method.disabled) return;
                                    const methods = formData.paymentOptions?.methods?.includes(method.name)
                                      ? formData.paymentOptions.methods.filter(m => m !== method.name)
                                      : [...(formData.paymentOptions?.methods || []), method.name];
                                    setFormData((prev) => ({
                                      ...prev,
                                      paymentOptions: { ...prev.paymentOptions, methods }
                                    }));
                                  }}
                                >
                                  {method.disabled && (
                                    <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-muted-foreground text-white rounded-full font-medium">Soon</span>
                                  )}
                                  <div className="text-center">
                                    <div className="text-2xl mb-2">{method.icon}</div>
                                    <div className="text-sm font-medium">{method.name}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* GCash QR Code Upload */}
                          {formData.paymentOptions?.methods?.includes("GCash") && (
                            <div className="bg-secondary/30 rounded-xl p-6">
                              <h3 className="text-lg font-medium mb-2">GCash QR Code</h3>
                              <p className="text-sm text-muted-foreground mb-4">Upload a QR code image for GCash payments. Customers will see this when paying via GCash.</p>
                              <div className="flex items-center gap-4">
                                {formData.paymentOptions.qrCodeGCash ? (
                                  <div className="relative">
                                    <img src={formData.paymentOptions.qrCodeGCash} alt="GCash QR" className="w-40 h-40 object-contain rounded-lg border border-border bg-white p-2" />
                                    <button
                                      type="button"
                                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-destructive/80"
                                      onClick={() => setFormData((prev) => ({ ...prev, paymentOptions: { ...prev.paymentOptions, qrCodeGCash: "" } }))}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                    <span className="text-xs text-muted-foreground text-center">Upload GCash<br />QR Code</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setFormData((prev) => ({ ...prev, paymentOptions: { ...prev.paymentOptions, qrCodeGCash: reader.result as string } }));
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }} />
                                  </label>
                                )}
                              </div>
                            </div>
                          )}

                          {/* PayMaya QR Code Upload */}
                          {formData.paymentOptions?.methods?.includes("PayMaya") && (
                            <div className="bg-secondary/30 rounded-xl p-6">
                              <h3 className="text-lg font-medium mb-2">PayMaya QR Code</h3>
                              <p className="text-sm text-muted-foreground mb-4">Upload a QR code image for PayMaya payments. Customers will see this when paying via PayMaya.</p>
                              <div className="flex items-center gap-4">
                                {formData.paymentOptions.qrCodePayMaya ? (
                                  <div className="relative">
                                    <img src={formData.paymentOptions.qrCodePayMaya} alt="PayMaya QR" className="w-40 h-40 object-contain rounded-lg border border-border bg-white p-2" />
                                    <button
                                      type="button"
                                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-destructive/80"
                                      onClick={() => setFormData((prev) => ({ ...prev, paymentOptions: { ...prev.paymentOptions, qrCodePayMaya: "" } }))}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                    <span className="text-xs text-muted-foreground text-center">Upload PayMaya<br />QR Code</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setFormData((prev) => ({ ...prev, paymentOptions: { ...prev.paymentOptions, qrCodePayMaya: reader.result as string } }));
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }} />
                                  </label>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-4">Deposit Requirements</h3>
                            <label className="flex items-center justify-between cursor-pointer">
                              <div>
                                <div className="text-sm font-medium">Require deposit for bookings</div>
                                <p className="text-xs text-muted-foreground">Deposit amount will be set separately</p>
                              </div>
                              <input
                                type="checkbox"
                                className="w-5 h-5"
                                checked={formData.paymentOptions?.deposit || false}
                                onChange={(e) => setFormData((prev) => ({
                                  ...prev,
                                  paymentOptions: { ...prev.paymentOptions, deposit: e.target.checked }
                                }))}
                              />
                            </label>
                          </div>

                          <div className="bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-4">Refund Policy</h3>
                            <Textarea
                              placeholder="Full refund if cancelled 24hrs in advance. 50% refund for cancellations within 24hrs. No refund for no-shows."
                              value={formData.paymentOptions?.refundPolicy || ""}
                              onChange={(e) => setFormData((prev) => ({
                                ...prev,
                                paymentOptions: { ...prev.paymentOptions, refundPolicy: e.target.value }
                              }))}
                              rows={4}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && pricingCalendarStep === 8 && (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-semibold text-foreground mb-2">
                            Pricing Notes
                          </h2>
                          <p className="text-muted-foreground">
                            Add any additional pricing notes or disclaimers
                          </p>
                        </div>

                        <div className="space-y-6">
                          <div className="bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-4">Common Disclaimers</h3>
                            <div className="space-y-3">
                              {visiblePricingDisclaimers.map((disclaimer) => (
                                <label key={disclaimer.name} className="flex items-start gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="mt-1 w-4 h-4"
                                    checked={formData.pricingNotes?.includes(disclaimer.name) || false}
                                    onChange={(e) => {
                                      const currentNotes = formData.pricingNotes || "";
                                      const newNotes = e.target.checked
                                        ? currentNotes + (currentNotes ? "\n" : "") + disclaimer.name
                                        : currentNotes.split("\n").filter(note => note !== disclaimer.name).join("\n");
                                      setFormData((prev) => ({ ...prev, pricingNotes: newNotes }));
                                    }}
                                  />
                                  <span className="text-sm text-muted-foreground">{disclaimer.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-4">Additional Notes</h3>
                            <Textarea
                              placeholder="Add any other pricing information, special conditions, or important notes for customers..."
                              value={formData.additionalPricingNotes || ""}
                              onChange={(e) => setFormData((prev) => ({ ...prev, additionalPricingNotes: e.target.value }))}
                              rows={4}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Legal Info */}
                  {currentStep === 5 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          Legal Information
                        </h2>
                        <p className="text-muted-foreground">
                          Please upload your business license, BAI document, and signed contract
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
                      </div>
                    </div>
                  )}

                  {/* Step 6: Review and Complete */}
                  {currentStep === 6 && (
                    <div className="min-h-screen bg-slate-50 py-8">
                      <div className="max-w-4xl mx-auto">
                        <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
                          {/* Step Indicator */}
                          <div className="text-center mb-8">
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div className="bg-primary h-2 rounded-full w-full"></div>
                            </div>
                          </div>

                          {/* Individual vs Business Selection */}
                          <div className="mb-8">
                            <h2 className="text-2xl font-semibold text-foreground mb-2 text-center">
                              Are you listing your pet services as an individual or a business?
                            </h2>
                            <p className="text-muted-foreground text-center mb-8">
                              This information is required for legal and tax purposes
                            </p>

                            <div className="grid md:grid-cols-2 gap-4 mb-8">
                              {/* Individual Card */}
                              <div
                                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                                  formData.legalEntityType === "individual"
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => setFormData(prev => ({ ...prev, legalEntityType: "individual" }))}
                              >
                                {formData.legalEntityType === "individual" && (
                                  <div className="absolute top-4 right-4">
                                    <CheckCircle2 className="h-6 w-6 text-primary" />
                                  </div>
                                )}
                                <div className="text-center">
                                  <div className="text-4xl mb-4">👤</div>
                                  <h3 className="text-lg font-semibold mb-2">Individual</h3>
                                  <p className="text-sm text-muted-foreground">
                                    You are registering as a sole proprietor or individual service provider
                                  </p>
                                </div>
                              </div>

                              {/* Business Card */}
                              <div
                                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                                  formData.legalEntityType === "business"
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => setFormData(prev => ({ ...prev, legalEntityType: "business" }))}
                              >
                                {formData.legalEntityType === "business" && (
                                  <div className="absolute top-4 right-4">
                                    <CheckCircle2 className="h-6 w-6 text-primary" />
                                  </div>
                                )}
                                <div className="text-center">
                                  <div className="text-4xl mb-4">🏢</div>
                                  <h3 className="text-lg font-semibold mb-2">Business</h3>
                                  <p className="text-sm text-muted-foreground">
                                    You are registering on behalf of a registered business entity
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Contracting Party Information */}
                          {formData.legalEntityType && (
                            <div className="mb-8">
                              <h4 className="text-lg font-medium text-foreground mb-4">
                                Personal Information of the Contracting Party
                              </h4>
                              <p className="text-muted-foreground text-sm mb-6">
                                Must match a valid government-issued ID
                              </p>

                              <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                  <Label htmlFor="firstName">First Name *</Label>
                                  <Input
                                    id="firstName"
                                    value={formData.contractingParty.firstName || ""}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      contractingParty: { ...prev.contractingParty, firstName: e.target.value }
                                    }))}
                                    placeholder="Enter your first name"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="middleName">Middle Name(s)</Label>
                                  <Input
                                    id="middleName"
                                    value={formData.contractingParty.middleName || ""}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      contractingParty: { ...prev.contractingParty, middleName: e.target.value }
                                    }))}
                                    placeholder="Enter your middle name(s)"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="lastName">Last Name *</Label>
                                  <Input
                                    id="lastName"
                                    value={formData.contractingParty.lastName || ""}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      contractingParty: { ...prev.contractingParty, lastName: e.target.value }
                                    }))}
                                    placeholder="Enter your last name"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="email">Email Address *</Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    value={formData.contractingParty.email || ""}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      contractingParty: { ...prev.contractingParty, email: e.target.value }
                                    }))}
                                    placeholder="Enter email address"
                                    className="mt-1"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <Label htmlFor="phone">Phone Number *</Label>
                                  <div className="flex mt-1">
                                    <Select
                                      value={formData.contractingParty.phoneCountryCode || "+63"}
                                      onValueChange={(value) => setFormData(prev => ({
                                        ...prev,
                                        contractingParty: { ...prev.contractingParty, phoneCountryCode: value }
                                      }))}
                                    >
                                      <SelectTrigger className="w-32 rounded-r-none border-r-0">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {COUNTRY_CODES.map((country) => (
                                          <SelectItem key={country.code + country.country} value={country.code}>
                                            {country.flag} {country.code}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      id="phone"
                                      value={formData.contractingParty.phone || ""}
                                      onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        contractingParty: { ...prev.contractingParty, phone: e.target.value }
                                      }))}
                                      placeholder="9XX XXX XXXX"
                                      className="rounded-l-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Primary Address Section */}
                          {formData.legalEntityType && (
                            <div className="mb-8">
                              <div className="border-t border-border pt-8 mb-6"></div>
                              <h4 className="text-lg font-medium text-foreground mb-4">
                                Primary Address of the Contracting Party
                              </h4>

                              <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                  <Label htmlFor="country">Country / Region</Label>
                                  <Select
                                    value={formData.contractingPartyAddress.country || "Philippines"}
                                    onValueChange={(value) => setFormData(prev => ({
                                      ...prev,
                                      contractingPartyAddress: { ...prev.contractingPartyAddress, country: value }
                                    }))}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Philippines">🇵🇭 Philippines</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="md:col-span-2">
                                  <Label htmlFor="addressLine1">Address Line 1</Label>
                                  <Input
                                    id="addressLine1"
                                    value={formData.contractingPartyAddress.streetAddress || ""}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      contractingPartyAddress: { ...prev.contractingPartyAddress, streetAddress: e.target.value }
                                    }))}
                                    placeholder="Street address, building, apartment"
                                    className="mt-1"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <Label htmlFor="addressLine2">Address Line 2 (optional)</Label>
                                  <Input
                                    id="addressLine2"
                                    value={formData.contractingPartyAddress.addressLine2 || ""}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      contractingPartyAddress: { ...prev.contractingPartyAddress, addressLine2: e.target.value }
                                    }))}
                                    placeholder="Additional address information"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="city">City</Label>
                                  <Input
                                    id="city"
                                    value={formData.contractingPartyAddress.city || ""}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      contractingPartyAddress: { ...prev.contractingPartyAddress, city: e.target.value }
                                    }))}
                                    placeholder="Enter city"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="zipCode">Zip Code</Label>
                                  <Input
                                    id="zipCode"
                                    value={formData.contractingPartyAddress.postalCode || ""}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      contractingPartyAddress: { ...prev.contractingPartyAddress, postalCode: e.target.value }
                                    }))}
                                    placeholder="Enter zip code"
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Important Information Panel */}
                          {formData.legalEntityType && (
                            <div className="mb-8">
                              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                <div className="flex items-start gap-3 mb-4">
                                  <div className="text-blue-600 text-lg">ℹ️</div>
                                  <div>
                                    <h5 className="font-medium text-foreground mb-2">Important Information</h5>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <p className="font-medium text-foreground text-sm">Can I control when I get bookings?</p>
                                    <p className="text-muted-foreground text-sm mt-1">
                                      Yes, you have full control over your availability and can accept or decline bookings based on your schedule.
                                    </p>
                                  </div>

                                  <div>
                                    <p className="font-medium text-foreground text-sm">Are bookings confirmed instantly?</p>
                                    <p className="text-muted-foreground text-sm mt-1">
                                      Bookings are confirmed once you accept them. Pet owners can request bookings, but you have the final approval.
                                    </p>
                                  </div>

                                  <div>
                                    <p className="font-medium text-foreground text-sm">Can I choose which pets I accept?</p>
                                    <p className="text-muted-foreground text-sm mt-1">
                                      Absolutely! You can set preferences for pet types, sizes, and special requirements that you're comfortable handling.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Declaration & Agreement */}
                          {formData.legalEntityType && (
                            <div className="mb-8">
                              <div className="bg-slate-50 rounded-xl p-6">
                                <h4 className="text-lg font-medium text-foreground mb-4">
                                  Declaration & Agreement
                                </h4>

                                <div className="space-y-4">
                                  <div className="flex items-start space-x-3">
                                    <Checkbox
                                      id="termsAccepted"
                                      checked={formData.legalAgreementAccepted.termsAccepted || false}
                                      onCheckedChange={(checked) => setFormData(prev => ({
                                        ...prev,
                                        legalAgreementAccepted: { ...prev.legalAgreementAccepted, termsAccepted: checked as boolean }
                                      }))}
                                      className="mt-1"
                                    />
                                    <div className="flex-1">
                                      <Label htmlFor="termsAccepted" className="text-sm font-medium cursor-pointer">
                                        I agree to the{" "}
                                        <a href="#" className="text-primary hover:underline">
                                          Terms of Service
                                        </a>{" "}
                                        and{" "}
                                        <a href="#" className="text-primary hover:underline">
                                          Privacy Policy
                                        </a>
                                      </Label>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        By checking this box, you agree to be bound by our terms and conditions.
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-start space-x-3">
                                    <Checkbox
                                      id="dataProcessing"
                                      checked={formData.legalAgreementAccepted.dataProcessing || false}
                                      onCheckedChange={(checked) => setFormData(prev => ({
                                        ...prev,
                                        legalAgreementAccepted: { ...prev.legalAgreementAccepted, dataProcessing: checked as boolean }
                                      }))}
                                      className="mt-1"
                                    />
                                    <div className="flex-1">
                                      <Label htmlFor="dataProcessing" className="text-sm font-medium cursor-pointer">
                                        I consent to the processing of my personal/business data
                                      </Label>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        This includes data collection, storage, and processing for service provision and legal compliance.
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-start space-x-3">
                                    <Checkbox
                                      id="finalAgreement"
                                      checked={formData.finalAgreementAccepted || false}
                                      onCheckedChange={(checked) => setFormData(prev => ({
                                        ...prev,
                                        finalAgreementAccepted: checked as boolean
                                      }))}
                                      className="mt-1"
                                    />
                                    <div className="flex-1">
                                      <Label htmlFor="finalAgreement" className="text-sm font-medium cursor-pointer">
                                        I confirm that all information provided is accurate and complete
                                      </Label>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        This declaration is required for legal compliance and service registration.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sticky Footer Navigation */}
                  <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border -mx-6 -mb-6 px-6 py-4 mt-8">
                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 1 && establishmentStep === 1}
                        className="gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                      {currentStep === 2 ? (
                        <Button
                          variant="hero"
                          onClick={handleNext}
                          className="gap-2"
                        >
                         Continue
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      ) : currentStep < 6 ? (
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
                          disabled={isSubmitting}
                          className="gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              Submitting...
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            </>
                          ) : (
                            <>
                              Submit Application
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
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