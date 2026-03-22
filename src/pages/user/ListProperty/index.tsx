import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import "leaflet/dist/leaflet.css";

import { useToast } from "@/hooks/use-toast";
import { PropertyService } from "@/utils/propertyService";

// Components
import ListPropertyHero from "./components/listPropertyHero";
import StepIndicator from "./components/listPropertyStepIndicator";
import ListPropertyFooter from "./components/listPropertyFooter";

// Constants
import { PropertyTypeId } from "./static/propertyTypeIDs";
import { INITIAL_FORM_DATA } from "./static/initialFormData";
import { LIST_PROPERTY_STEPS } from "./static/listPropertySteps";
import { AMENITY_OPTIONS } from "./static/amenityOptions";
import { BOOKING_RULE_OPTIONS } from "./static/bookingRuleOptions";

// Types
import { PropertyInitalData } from "./types/initial_types/propertyInitialData";
import { PropertySubmissionData } from "./types/submission_types/propertySubmissionData";

// Sections
import EstablishmentInfo from "./sections/EstablishmentInfo";
import PropertySetup from "./sections/PropertySetup";
import Photos from "./sections/Photos";
import PricingCalendar from "./sections/PricingCalendar";
import LegalInfo from "./sections/LegalInfo";
import ReviewComplete from "./sections/ReviewComplete";

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
      stepsList.push(2);
    }

    if (hasVet) {
      stepsList.push(3);
    }

    if (hasBoarding) {
      stepsList.push(4);
    }

    stepsList.push(5, 6, 7);
    return stepsList;
  }, [hasBoarding, hasGrooming, hasVet]);

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
      ].filter((field) => {
        const value = formData[field.key as keyof typeof formData];
        if (typeof value === "string") return value.trim() === "";
        return !value;
      });

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

      const isValidZipCode = (zip: string) => /^\d{4}$/.test(zip);

      if (!isValidZipCode(formData.zipCode)) {
        toast({
          title: "Invalid zip code.",
          variant: "destructive",
        });
        return;
      }

      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (propertySetupStep === 1) {
        if (formData.petTypesAccepted.length === 0) {
          toast({
            title: "Please choose a Pet Type",
            description: "You need to choose at least one pet type to continue.",
            variant: "destructive",
          });
          return;
        }

        if (formData.petTypesAccepted.includes("Dogs") && formData.dogSizes.length === 0) {
          toast({
            title: "Please choose a dog size",
            description: "You need to choose at least one dog size to continue.",
            variant: "destructive",
          });
          return;
        }

        if (formData.breedRestrictions && formData.breedRestrictionDetails.trim() === "") {
          toast({
            title: "Please fill out the missing fields",
            description: "You need to detail your breeding restrictions.",
            variant: "destructive",
          });
          return;
        }

        if (formData.aggressivePolicy && formData.aggressivePolicyDetails.trim() === "") {
          toast({
            title: "Please fill out the missing fields",
            description: "You need to detail your aggressive pet policies.",
            variant: "destructive",
          });
          return;
        }

        if (formData.unvaccinatedPolicy && formData.unvaccinatedPolicyDetails.trim() === "") {
          toast({
            title: "Please fill out the missing fields",
            description: "You need to detail your vaccination requirements.",
            variant: "destructive",
          });
          return;
        }

        if (formData.animalCapacity === 0) {
          toast({
            title: "Please fill out the missing fields",
            description: "You need to fill in your total animal capacity.",
            variant: "destructive",
          });
          return;
        }

        if (!formData.petTypesAccepted.includes("Dogs") && formData.dogSizes.length != 0) {
          updateForm({ dogSizes: [] });
        }

        if (!formData.petTypesAccepted.includes("Exotic Pets") && formData.dogSizes.length != 0) {
          updateForm({ exoticPetTypes: "" });
        }
      }

      if (propertySetupStep === 2) {
        if (formData.facilitiesAmenities.length === 0) {
          toast({
            title: "Please choose your Facilities and Amenities",
            description: "You need to choose at least one facility or amenity to continue.",
            variant: "destructive",
          });
          return;
        }
      }

      if (propertySetupStep == 3) {
        if (formData.sameHoursEveryDay && (formData.dailyOpenTime.trim() === "" || formData.dailyCloseTime.trim() === "")) {
          toast({
            title: "Please fill in the missing fields",
            description: "You need to fill in your open and close times to continue.",
            variant: "destructive",
          });
          return;
        }

        if (hasBoarding && (formData.checkInCutoff.trim() === "" || formData.pickupStart.trim() === "" || formData.pickupEnd.trim() === "")) {
          toast({
            title: "Please fill in the missing fields",
            description: "You need to fill in your boarding rules to continue.",
            variant: "destructive",
          });
          return;
        }

        if ((hasGrooming || hasVet) && (formData.appointmentOnly.trim() === "")) {
          toast({
            title: "Please select a Booking Type",
            variant: "destructive",
          });
          return;
        }

        if (formData.sameHoursEveryDay) {
          updateForm({ weeklyHours: {} });
        } else {
          updateForm({ dailyOpenTime: "", dailyCloseTime: "" });
        }

        if (!(hasGrooming || hasVet)) {
          updateForm({ appointmentOnly: "" });
        }
      }

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

      if (pricingCalendarStep === 1) {
        const missingFields = formData.baseServices.filter(service => 
          service.name.trim() === "" ||
          (service.priceType === "Fixed price" && service.price.trim() === "") ||
          (service.priceType === "Starting from" && service.minPrice.trim() === "") ||
          (service.priceType === "Starting from" && service.maxPrice.trim() === "") ||
          service.duration.trim() === ""
        );

        if (missingFields.length > 0) {
          toast({
            title: "Please fill in the missing fields",
            variant: "destructive",
          });
          return;
        }
      }

      if (nextStep) {
        setPricingCalendarStep(nextStep);
      } else {
        setCurrentStep(5);
      }
      return;
    }

    if (currentStep === 5) {
      if (formData.lguPermits.length === 0 || !formData.baiDocument || !formData.contractDocument) {
        toast({
          title: "Please upload all required documents",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(6);
      return;
    }
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
    const missingFields = [
      // Entity type
      { key: "legalEntityType", label: "Legal Entity Type", value: formData.legalEntityType },

      // Contracting party
      { key: "firstName", label: "First Name", value: formData.contractingParty.firstName },
      { key: "lastName", label: "Last Name", value: formData.contractingParty.lastName },
      { key: "email", label: "Email", value: formData.contractingParty.email },
      { key: "phone", label: "Phone", value: formData.contractingParty.phone },
      { key: "phoneCountryCode", label: "Phone Country Code", value: formData.contractingParty.phoneCountryCode },

      // Contracting party address
      { key: "country", label: "Country", value: formData.contractingPartyAddress.country },
      { key: "streetAddress", label: "Street Address", value: formData.contractingPartyAddress.streetAddress },
      { key: "city", label: "City", value: formData.contractingPartyAddress.city },
      { key: "postalCode", label: "Postal Code", value: formData.contractingPartyAddress.postalCode },
    ].filter(field => {
      if (typeof field.value === "string") return field.value.trim() === "";
      return !field.value;
    });

    // booleans checked separately since false is a meaningful invalid value
    const missingAgreements = [
      { key: "termsAccepted", label: "Terms and Conditions", value: formData.legalAgreementAccepted.termsAccepted },
      { key: "dataProcessing", label: "Data Processing Agreement", value: formData.legalAgreementAccepted.dataProcessing },
      { key: "finalAgreementAccepted", label: "Final Agreement", value: formData.finalAgreementAccepted },
    ].filter(field => field.value !== true);

    if (missingFields.length > 0) {
      toast({
        title: "Please fill in the missing fields",
        description: missingFields.map(f => f.label).join(", "),
        variant: "destructive"
      });
      return;
    }

    if (missingAgreements.length > 0) {
      toast({
        title: "Please accept all agreements",
        description: missingAgreements.map(f => f.label).join(", "),
        variant: "destructive"
      });
      return;
    }

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
                  {currentStep === 1 && (
                    <EstablishmentInfo
                      formData={formData} 
                      updateForm={updateForm} 
                      selectedTypes={selectedTypes} 
                      updateSelectedTypes={updateSelectedTypes}
                      updateAddress={updateAddress}
                      establishmentStep={establishmentStep}                    
                    />
                  )}

                  {/* Step 2: Property Setup */}
                  {currentStep === 2 && (
                    <PropertySetup 
                      formData={formData}
                      updateForm={updateForm}
                      selectedTypes={selectedTypes}
                      hasBoarding={hasBoarding}
                      hasGrooming={hasGrooming}
                      hasVet={hasVet}
                      propertySetupStep={propertySetupStep}
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
                  {currentStep === 4 && (
                    <PricingCalendar 
                      formData={formData}
                      updateForm={updateForm}
                      selectedTypes={selectedTypes}
                      hasBoarding={hasBoarding}
                      hasGrooming={hasGrooming}
                      hasVet={hasVet}
                      pricingCalendarStep={pricingCalendarStep}
                    />
                  )}

                  {/* Step 5: Legal Info */}
                  {currentStep === 5 && (
                    <LegalInfo 
                      formData={formData}
                      onChange={updateForm}
                    />
                  )}

                  {/* Step 6: Review and Complete */}
                  {currentStep === 6 && (
                    <ReviewComplete 
                      formData={formData}
                      onChange={updateForm}
                    />
                  )}

                  {/* Sticky Footer Navigation */}
                  <ListPropertyFooter 
                    currentStep={currentStep} 
                    establishmentStep={establishmentStep} 
                    handleNext={handleNext} 
                    handleBack={handleBack} 
                    handleSubmit={handleSubmit} 
                    isSubmitting={isSubmitting}                    
                  />
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
