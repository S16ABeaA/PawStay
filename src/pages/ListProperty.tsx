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
import PropertyTypeCard from "@/components/property-listing/PropertyTypeCard";
import StepIndicator from "@/components/property-listing/StepIndicator";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
  type MapContainerProps,
  type MarkerProps,
  type TileLayerProps,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
  MapPin,
  Phone,
  Mail,
  Upload,
  FileText,
  X,
  Image,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PropertyService, PropertySubmissionData } from "@/utils/propertyService";

const steps = [
  { number: 1, title: "Establishment Info" },
  { number: 2, title: "Property Setup" },
  { number: 3, title: "Photos" },
  { number: 4, title: "Pricing and Calendar" },
  { number: 5, title: "Legal Info" },
  { number: 6, title: "Review and Complete" },
];

const countryCodes = [
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+1", country: "Canada", flag: "🇨🇦" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+852", country: "Hong Kong", flag: "🇭🇰" },
  { code: "+886", country: "Taiwan", flag: "🇹🇼" },
];

type PropertyTypeId = "hotel" | "grooming" | "veterinary";

const propertyTypes: Array<{
  id: PropertyTypeId;
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
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
const amenityOptions: Array<{ name: string; icon: string; types?: PropertyTypeId[] }> = [
  // Boarding (hotel)
  { name: "Individual kennel / private room", icon: "🧺", types: ["hotel"] },
  { name: "Shared room", icon: "🛏️", types: ["hotel"] },
  { name: "Luxury suite", icon: "🛋️", types: ["hotel"] },
  { name: "Size-based enclosures (small / medium / large pets)", icon: "📏", types: ["hotel"] },
  { name: "Indoor boarding", icon: "🏠", types: ["hotel"] },
  { name: "Outdoor access", icon: "🌿", types: ["hotel"] },
  { name: "Air-conditioned rooms", icon: "❄️", types: ["hotel"] },
  { name: "Heated rooms", icon: "🔥", types: ["hotel"] },
  { name: "Natural ventilation", icon: "🍃", types: ["hotel"] },
  { name: "Comfortable bedding provided", icon: "🧸", types: ["hotel"] },
  { name: "Owner-provided bedding allowed", icon: "🧺", types: ["hotel"] },
  { name: "Soundproof / quiet areas", icon: "🔇", types: ["hotel"] },
  { name: "24/7 staff supervision", icon: "👁️", types: ["hotel"] },
  { name: "Scheduled feeding", icon: "🍽️", types: ["hotel"] },
  { name: "Custom diet accommodation", icon: "🥣", types: ["hotel"] },
  { name: "Medication administration", icon: "💊", types: ["hotel"] },
  { name: "Vet-supervised boarding", icon: "⚕️", types: ["hotel"] },
  { name: "Special needs care", icon: "🫶", types: ["hotel"] },
  { name: "Daily walks", icon: "🚶", types: ["hotel"] },
  { name: "Group playtime", icon: "🐕", types: ["hotel"] },
  { name: "Solo playtime", icon: "🎾", types: ["hotel"] },
  { name: "Outdoor play yard", icon: "🏕️", types: ["hotel"] },
  { name: "Enrichment toys & activities", icon: "🧩", types: ["hotel"] },
  { name: "Secure fencing", icon: "🛡️", types: ["hotel"] },
  { name: "CCTV monitoring", icon: "📹", types: ["hotel"] },
  { name: "Regular sanitation", icon: "🧼", types: ["hotel"] },
  { name: "Vaccination required", icon: "✅", types: ["hotel"] },
  { name: "Separate cat and dog areas", icon: "🐶", types: ["hotel"] },
  { name: "Photo / video updates", icon: "📷", types: ["hotel"] },
  { name: "Live pet cam", icon: "📡", types: ["hotel"] },
  { name: "Emergency contact support", icon: "🆘", types: ["hotel"] },
  { name: "Long-stay discounts", icon: "🏷️", types: ["hotel"] },

  // Veterinary
  { name: "Consultation / exam rooms", icon: "🩺", types: ["veterinary"] },
  { name: "Diagnostic laboratory", icon: "🧪", types: ["veterinary"] },
  { name: "X-ray services", icon: "🦴", types: ["veterinary"] },
  { name: "Ultrasound services", icon: "📡", types: ["veterinary"] },
  { name: "Surgical suite", icon: "🏥", types: ["veterinary"] },
  { name: "Recovery / observation area", icon: "🛏️", types: ["veterinary"] },
  { name: "Isolation ward", icon: "🚪", types: ["veterinary"] },
  { name: "General check-ups", icon: "✅", types: ["veterinary"] },
  { name: "Vaccinations", icon: "💉", types: ["veterinary"] },
  { name: "Emergency care", icon: "🚑", types: ["veterinary"] },
  { name: "Dental services", icon: "🦷", types: ["veterinary"] },
  { name: "Minor procedures", icon: "🩹", types: ["veterinary"] },
  { name: "Major surgery", icon: "⚕️", types: ["veterinary"] },
  { name: "Chronic illness management", icon: "📋", types: ["veterinary"] },
  { name: "Licensed veterinarian on-site", icon: "👩‍⚕️", types: ["veterinary"] },
  { name: "Veterinary technicians", icon: "🧑‍⚕️", types: ["veterinary"] },
  { name: "24/7 emergency availability", icon: "🕐", types: ["veterinary"] },
  { name: "Appointment booking", icon: "📅", types: ["veterinary"] },
  { name: "Walk-in accepted", icon: "🚶", types: ["veterinary"] },
  { name: "Digital medical records", icon: "💾", types: ["veterinary"] },
  { name: "Online prescription refills", icon: "💊", types: ["veterinary"] },
  { name: "Health reminders", icon: "🔔", types: ["veterinary"] },
  { name: "Post-treatment follow-ups", icon: "☎️", types: ["veterinary"] },

  // Grooming
  { name: "Bath & blow-dry", icon: "🛁", types: ["grooming"] },
  { name: "Haircut / trimming", icon: "✂️", types: ["grooming"] },
  { name: "Breed-specific styling", icon: "🐩", types: ["grooming"] },
  { name: "Nail trimming", icon: "🧷", types: ["grooming"] },
  { name: "Ear cleaning", icon: "👂", types: ["grooming"] },
  { name: "Eye cleaning", icon: "👁️", types: ["grooming"] },
  { name: "De-shedding treatment", icon: "🧽", types: ["grooming"] },
  { name: "Medicated baths", icon: "🧴", types: ["grooming"] },
  { name: "Flea & tick treatment", icon: "🪲", types: ["grooming"] },
  { name: "Anal gland expression", icon: "🧼", types: ["grooming"] },
  { name: "Teeth brushing", icon: "🦷", types: ["grooming"] },
  { name: "Professional grooming tables", icon: "🪑", types: ["grooming"] },
  { name: "Dedicated bathing stations", icon: "🚿", types: ["grooming"] },
  { name: "Cage-free grooming", icon: "🐾", types: ["grooming"] },
  { name: "Low-stress handling", icon: "🌿", types: ["grooming"] },
  { name: "Separate drying area", icon: "💨", types: ["grooming"] },
  { name: "Hypoallergenic products", icon: "🧴", types: ["grooming"] },
  { name: "Sensitive-skin products", icon: "🌼", types: ["grooming"] },
  { name: "One-pet-at-a-time grooming", icon: "🐶", types: ["grooming"] },
  { name: "Vet-on-call for grooming", icon: "☎️", types: ["grooming"] },
  { name: "Same-day service", icon: "⚡", types: ["grooming"] },
  { name: "Appointment scheduling", icon: "📅", types: ["grooming"] },
  { name: "Grooming packages", icon: "🎁", types: ["grooming"] },
  { name: "Add-on spa services", icon: "🫧", types: ["grooming"] },
];

const bookingRuleOptions: Array<{ name: string; description: string; types?: PropertyTypeId[] }> = [
  { name: "Advance booking required", description: "Set minimum notice period" },
  { name: "Same-day booking allowed", description: "Accept last-minute bookings" },
  { name: "Minimum stay requirements", description: "Set minimum nights/days", types: ["hotel"] },
  { name: "Maximum stay limits", description: "Set maximum stay duration", types: ["hotel"] },
  { name: "Deposit required", description: "Require payment to secure booking" },
  { name: "Full payment upfront", description: "Require full payment at booking" },
];

const addOnOptions: Array<{ name: string; types?: PropertyTypeId[] }> = [
  { name: "Flea & tick treatment", types: ["grooming", "hotel"] },
  { name: "De-shedding", types: ["grooming", "hotel"] },
  { name: "Nail grinding", types: ["grooming"] },
  { name: "Teeth brushing", types: ["grooming"] },
  { name: "Medication administration", types: ["hotel"] },
  { name: "Extra playtime", types: ["hotel"] },
  { name: "Special diet handling", types: ["hotel"] },
];

const pricingDisclaimerOptions: Array<{ name: string; types?: PropertyTypeId[] }> = [
  { name: "Prices may vary based on pet condition" },
  { name: "Final price confirmed after inspection" },
  { name: "Vet procedures require assessment first", types: ["veterinary"] },
  { name: "Emergency fees apply for after-hours service", types: ["veterinary", "grooming"] },
  { name: "Holiday surcharges apply during peak seasons" },
  { name: "Multi-pet discounts available" },
  { name: "Deposit required to secure booking" },
  { name: "Cancellation fees apply as per policy" },
];

const groomingServicesList = [
  "Bath & blow dry",
  "Haircut / trimming",
  "Nail clipping",
  "Ear cleaning",
  "Teeth brushing",
  "De-shedding",
  "Breed-specific grooming",
  "Add-ons (flea treatment, spa packages)",
];

const vetServicesList = [
  "General consultation",
  "Vaccination",
  "Deworming",
  "Minor / major surgery",
  "Laboratory tests",
  "Emergency care",
  "Pharmacy / pet meds",
  "Home visits",
];

const boardingServicesList = [
  "Daycare",
  "Overnight / long-term boarding",
  "Cage-free boarding",
  "Private rooms / suites",
  "Playtime & socialization",
  "Special care (senior pets, medication)",
];

const petTypesList = [
  "Dogs (small / medium / large)",
  "Cats",
  "Exotic pets (birds, rabbits, reptiles)",
];

const facilitiesAmenitiesList = [
  "Air-conditioned facilities",
  "CCTV / pet cams",
  "Indoor & outdoor play areas",
  "Separate areas for dogs & cats",
  "Isolation room (vet / boarding)",
  "Grooming equipment quality",
  "Medical equipment (for vets)",
  "Feeding bowls / bedding provided",
  "24/7 supervision (boarding)",
];

const bookingRulesList = [
  "Advance booking required",
  "Same-day booking allowed",
  "Cancellation & rescheduling policy",
  "Vaccination requirements",
  "Health declaration required",
  "Liability waiver",
  "Aggressive behavior policy",
];

const healthSafetyList = [
  "Required vaccination records",
  "Parasite prevention requirement",
  "Emergency protocol",
  "Vet on-call (for grooming/boarding)",
  "Isolation procedure for sick pets",
  "Cleaning & sanitation routine",
];

const ListProperty = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [establishmentStep, setEstablishmentStep] = useState(1);
  const [propertySetupStep, setPropertySetupStep] = useState(1);
  const [propertySetupCompleted, setPropertySetupCompleted] = useState(0);
  const [pricingCalendarStep, setPricingCalendarStep] = useState(1);
  const [pricingCalendarCompleted, setPricingCalendarCompleted] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<PropertyTypeId[]>([]);
  const [formData, setFormData] = useState({
            propertyName: "",
            addressSearch: "",
            addressLine2: "",
            country: "",
            city: "",
            zipCode: "",
            latitude: 14.5995,
            longitude: 120.9842,
            phone: "",
            ownerName: "",
            email: "",
            password: "",
            confirmPassword: "",
            description: "",
            isPinAccurate: true,
            services: [] as string[],
            petTypesAccepted: [] as string[],
            dogSizes: [] as string[],
            exoticPetTypes: "",
            breedRestrictions: false,
            breedRestrictionDetails: "",
            aggressivePolicy: false,
            aggressivePolicyDetails: "",
            unvaccinatedPolicy: false,
            unvaccinatedPolicyDetails: "",
            facilitiesAmenities: [] as string[],
            sameHoursEveryDay: false,
            dailyOpenTime: "",
            dailyCloseTime: "",
            weeklyHours: {} as Record<string, { open: string; close: string }>,
            weekendAvailability: false,
            holidayAvailability: false,
            emergencyServices: false,
            checkInCutoff: "",
            pickupStart: "",
            pickupEnd: "",
            appointmentOnly: "",
            bookingRules: [] as string[],
            cancellationPolicy: { freeCancellation: "24hours", lateFee: "", noShow: "" },
            complianceRequirements: [] as string[],
            healthSafety: [] as string[],
            vetAvailability: [] as string[],
            sanitationProtocols: [] as string[],
            emergencyContact: "",
            nearestVetHospital: "",
            emergencyResponseTime: "",
            baseServices: [] as { name: string; priceType: string; price: string; minPrice: string; maxPrice: string; duration: string }[],
            petSizePricing: { small: "", medium: "", large: "", giant: "", cats: "", exotic: "" },
            addOns: [] as { name: string; price: string; type: string }[],
            vetFees: {} as Record<string, string>,
            boardingRules: { advanceBooking: false, sameDayBooking: false, freeCancellation: false, lateCancellationFee: false, lateCancellationFeeAmount: "", vaccinationRequired: false, healthDeclaration: false, noAggressivePets: false, liabilityWaiver: false },
            feesCharges: { serviceFee: "", taxes: "Included", noShow: "", latePickup: "", cleaningFee: "", emergencyFee: "", holidaySurcharge: "", cancellationFee: "" },
            paymentOptions: { deposit: false, methods: [] as string[], refundPolicy: "" },
            pricingNotes: "",
            additionalPricingNotes: "",
            propertyImages: [] as File[],
            lguPermits: [] as File[],
            baiDocument: null as File | null,
            contractDocument: null as File | null,
            occupancyRate: 0,
            animalCapacity: 0,
            legalEntityType: "" as "" | "individual" | "business",
            contractingParty: {
              firstName: "",
              middleName: "",
              lastName: "",
              email: "",
              phone: "",
              phoneCountryCode: "+63",
            },
            contractingPartyAddress: {
              country: "Philippines",
              streetAddress: "",
              addressLine2: "",
              city: "",
              postalCode: "",
            },
            legalAgreementAccepted: {
              termsAccepted: false,
              dataProcessing: false,
            },
            finalAgreementAccepted: false,
  });

  const hasBoarding = selectedTypes.includes("hotel");
  const hasGrooming = selectedTypes.includes("grooming");
  const hasVet = selectedTypes.includes("veterinary");

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

  const visibleAmenities = useMemo(
    () =>
      amenityOptions.filter(
        (amenity) =>
          !amenity.types || amenity.types.some((type) => selectedTypes.includes(type)),
      ),
    [selectedTypes],
  );

  const visibleBookingRules = useMemo(
    () =>
      bookingRuleOptions.filter(
        (rule) => !rule.types || rule.types.some((type) => selectedTypes.includes(type)),
      ),
    [selectedTypes],
  );

  const visibleAddOns = useMemo(
    () =>
      addOnOptions.filter(
        (addon) => !addon.types || addon.types.some((type) => selectedTypes.includes(type)),
      ),
    [selectedTypes],
  );

  const visiblePricingDisclaimers = useMemo(
    () =>
      pricingDisclaimerOptions.filter(
        (disclaimer) =>
          !disclaimer.types || disclaimer.types.some((type) => selectedTypes.includes(type)),
      ),
    [selectedTypes],
  );

  const redPinIcon = useMemo(
    () =>
      L.icon({
        iconUrl:
          "data:image/svg+xml;utf8," +
          encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='46' viewBox='0 0 32 46'>
              <path d='M16 0C7.7 0 1 6.7 1 15c0 10.5 15 31 15 31s15-20.5 15-31C31 6.7 24.3 0 16 0z' fill='#e11d48'/>
              <circle cx='16' cy='15' r='6' fill='white'/>
            </svg>`,
          ),
        iconSize: [32, 46],
        iconAnchor: [16, 46],
      }),
    [],
  );

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const params = new URLSearchParams({
        format: "json",
        lat: String(lat),
        lon: String(lng),
        addressdetails: "1",
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );
      if (!response.ok) return;
      const data = await response.json();
      const address = data?.address ?? {};
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
    } catch {
      setFormData((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
    }
  };

  const MapClickHandler = ({
    enabled,
    onSelect,
  }: {
    enabled: boolean;
    onSelect: (lat: number, lng: number) => void;
  }) => {
    useMapEvents({
      click(e) {
        if (!enabled) return;
        onSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

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
        setPropertySetupCompleted(propertySetupStep);
        setPropertySetupStep((prev) => prev + 1);
      } else {
        setPropertySetupCompleted(5);
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
        setPricingCalendarCompleted(pricingCalendarStep);
        setPricingCalendarStep(nextStep);
      } else {
        setPricingCalendarCompleted(pricingSteps[pricingSteps.length - 1] ?? pricingCalendarStep);
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
        setPropertySetupCompleted((prev) => prev - 1);
        return;
      }
      setCurrentStep(1);
      setEstablishmentStep(2);
      return;
    }

    if (currentStep === 3) {
      setCurrentStep(2);
      setPropertySetupStep(5);
      setPropertySetupCompleted(6);
      return;
    }

    if (currentStep === 4) {
      const currentIndex = pricingSteps.indexOf(pricingCalendarStep);
      const previousStep = pricingSteps[currentIndex - 1];

      if (previousStep) {
        setPricingCalendarStep(previousStep);
        setPricingCalendarCompleted((prev) => Math.max(prev - 1, 0));
      } else {
        setCurrentStep(3);
      }
      return;
    }

    if (currentStep === 5) {
      setCurrentStep(4);
      const lastPricingStep = pricingSteps[pricingSteps.length - 1] ?? pricingCalendarStep;
      setPricingCalendarStep(lastPricingStep);
      setPricingCalendarCompleted(lastPricingStep);
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
        visibleAmenities.some((option) => option.name === amenity),
      );

      const filteredBookingRules = formData.bookingRules.filter((rule) =>
        visibleBookingRules.some((option) => option.name === rule),
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

  const mapProps = {
    center: [formData.latitude, formData.longitude] as L.LatLngExpression,
    zoom: 16,
    scrollWheelZoom: true,
    className: "h-full w-full",
  } as unknown as MapContainerProps;

  const tileLayerProps = {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  } as unknown as TileLayerProps;

  const markerProps = {
    position: [formData.latitude, formData.longitude] as L.LatLngExpression,
    icon: redPinIcon,
    draggable: true,
    eventHandlers: {
      dragend: (event: L.DragEndEvent) => {
        const marker = event.target as L.Marker;
        const { lat, lng } = marker.getLatLng();
        void reverseGeocode(lat, lng);
      },
    },
  } as unknown as MarkerProps;

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
            <div className="grid gap-8">
              {/* Form Section */}
              <div>
                <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
                  <StepIndicator
                    steps={steps}
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
                    <div className="space-y-6">
                      <div className="md:col-span-3 space-y-2">
                        <Label htmlFor="propertyName" className="text-base font-semibold text-foreground">
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
                          className="h-12 text-base"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Property Type
                        </h3>
                        <p className="text-muted-foreground">
                          Select all that apply to your business
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
                              selectedTypes.includes(type.id)
                            }
                            onClick={() =>
                              setSelectedTypes((prev) =>
                                prev.includes(type.id)
                                  ? prev.filter((item) => item !== type.id)
                                  : [...prev, type.id],
                              )
                            }
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep === 1 && establishmentStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Basic Info
                        </h3>
                        <p className="text-muted-foreground">
                          Provide your address details for accurate listing placement
                        </p>
                      </div>
                      <div className="grid lg:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-border overflow-hidden h-[420px]">
                            <MapContainer {...mapProps}>
                              <TileLayer {...tileLayerProps} />
                              <Marker {...markerProps} />
                            <MapClickHandler
                              enabled
                              onSelect={(lat, lng) => void reverseGeocode(lat, lng)}
                            />
                          </MapContainer>
                        </div>
                        <div className="rounded-2xl border border-border bg-background p-5">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-2">
                              <Label htmlFor="addressSearch">
                                Find Your Address
                              </Label>
                              <Input
                                id="addressSearch"
                                placeholder="De La Salle University Manila"
                                value={formData.addressSearch}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    addressSearch: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <Label htmlFor="addressLine2">
                                Apartment or floor number (optional)
                              </Label>
                              <Input
                                id="addressLine2"
                                placeholder="Apartment, building, floor, etc"
                                value={formData.addressLine2}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    addressLine2: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="country">Country/region</Label>
                              <Input
                                id="country"
                                placeholder="Philippines"
                                value={formData.country}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    country: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="city">City</Label>
                              <Input
                                id="city"
                                placeholder="Manila"
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
                              <Label htmlFor="zipCode">Zip code</Label>
                              <Input
                                id="zipCode"
                                placeholder="1004"
                                value={formData.zipCode}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    zipCode: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  id="pinAccurate"
                                  checked={formData.isPinAccurate}
                                  onCheckedChange={(checked) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      isPinAccurate: Boolean(checked),
                                    }))
                                  }
                                  className="mt-1"
                                />
                                <Label
                                  htmlFor="pinAccurate"
                                  className="text-sm cursor-pointer text-muted-foreground"
                                >
                                  Update the address by moving the pin on the map.
                                </Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Property Setup */}
                  {currentStep === 2 && propertySetupStep === 1 && (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-semibold text-foreground mb-2">
                            Pet Types Accepted
                          </h2>
                          <p className="text-muted-foreground">
                            Specify which types of pets you accept and any restrictions
                          </p>
                        </div>

                        <div className="space-y-8">
                          {/* Pet Types */}
                          <div>
                            <h3 className="text-lg font-medium mb-6">Pet Types</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {[
                                { name: "Dogs", icon: "🐶", sizes: ["Small", "Medium", "Large"] },
                                { name: "Cats", icon: "🐱", sizes: null },
                                { name: "Exotic Pets", icon: "🐦", sizes: null }
                              ].map((type) => {
                                const isSelected = formData.petTypesAccepted.includes(type.name);
                                return (
                                  <div key={type.name} className="space-y-4">
                                    <div
                                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all text-center ${
                                        isSelected
                                          ? "border-primary bg-primary/5"
                                          : "border-border hover:border-primary/30"
                                      }`}
                                      onClick={() => {
                                        const newTypes = isSelected
                                          ? formData.petTypesAccepted.filter(t => t !== type.name)
                                          : [...formData.petTypesAccepted, type.name];
                                        setFormData((prev) => ({ ...prev, petTypesAccepted: newTypes }));
                                      }}
                                    >
                                      <div className="text-4xl mb-2">{type.icon}</div>
                                      <div className="text-lg font-medium">{type.name}</div>
                                    </div>

                                    {isSelected && type.name === "Dogs" && (
                                      <div className="bg-secondary/30 rounded-xl p-4 animate-in slide-in-from-top-2">
                                        <h4 className="text-sm font-medium mb-3">Dog Sizes Accepted</h4>
                                        <div className="flex gap-2">
                                          {type.sizes?.map((size) => (
                                            <label key={size} className="flex items-center gap-2 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                className="w-4 h-4"
                                                checked={formData.dogSizes?.includes(size) || false}
                                                onChange={(e) => {
                                                  const newSizes = e.target.checked
                                                    ? [...(formData.dogSizes || []), size]
                                                    : (formData.dogSizes || []).filter(s => s !== size);
                                                  setFormData((prev) => ({ ...prev, dogSizes: newSizes }));
                                                }}
                                              />
                                              <span className="text-sm font-medium">{size}</span>
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {isSelected && type.name === "Exotic Pets" && (
                                      <div className="bg-secondary/30 rounded-xl p-4 animate-in slide-in-from-top-2">
                                        <Label className="text-sm font-medium">Specify Exotic Pet Types</Label>
                                        <Input
                                          placeholder="e.g., Birds, reptiles, small mammals"
                                          value={formData.exoticPetTypes || ""}
                                          onChange={(e) => setFormData((prev) => ({ ...prev, exoticPetTypes: e.target.value }))}
                                          className="mt-2"
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Policies */}
                          <div className="bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-6">Policies</h3>
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Breed restrictions</Label>
                                  <select
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={formData.breedRestrictions ? "Yes" : "No"}
                                    onChange={(e) => {
                                      if (e.target.value === "No") {
                                        setFormData((prev) => ({ ...prev, breedRestrictions: false, breedRestrictionDetails: "" }));
                                      } else {
                                        setFormData((prev) => ({ ...prev, breedRestrictions: true }));
                                      }
                                    }}
                                  >
                                    <option value="No">No restrictions</option>
                                    <option value="Yes">Has restrictions</option>
                                  </select>
                                  {formData.breedRestrictions && (
                                    <Input
                                      placeholder="e.g., No pit bulls, no aggressive breeds"
                                      value={formData.breedRestrictionDetails || ""}
                                      onChange={(e) => setFormData((prev) => ({ ...prev, breedRestrictionDetails: e.target.value }))}
                                      className="mt-2"
                                    />
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Aggressive pet policy</Label>
                                  <select
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={formData.aggressivePolicy ? "Yes" : "No"}
                                    onChange={(e) => {
                                      if (e.target.value === "No") {
                                        setFormData((prev) => ({ ...prev, aggressivePolicy: false, aggressivePolicyDetails: "" }));
                                      } else {
                                        setFormData((prev) => ({ ...prev, aggressivePolicy: true }));
                                      }
                                    }}
                                  >
                                    <option value="No">Accept all pets</option>
                                    <option value="Yes">Has policy</option>
                                  </select>
                                  {formData.aggressivePolicy && (
                                    <Input
                                      placeholder="Describe your policy for aggressive pets"
                                      value={formData.aggressivePolicyDetails || ""}
                                      onChange={(e) => setFormData((prev) => ({ ...prev, aggressivePolicyDetails: e.target.value }))}
                                      className="mt-2"
                                    />
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Unvaccinated pet policy</Label>
                                <select
                                  className="w-full px-3 py-2 border rounded-md"
                                  value={formData.unvaccinatedPolicy ? "Yes" : "No"}
                                  onChange={(e) => {
                                    if (e.target.value === "No") {
                                      setFormData((prev) => ({ ...prev, unvaccinatedPolicy: false, unvaccinatedPolicyDetails: "" }));
                                    } else {
                                      setFormData((prev) => ({ ...prev, unvaccinatedPolicy: true }));
                                    }
                                  }}
                                >
                                  <option value="No">Accept unvaccinated pets</option>
                                  <option value="Yes">Vaccination required</option>
                                </select>
                                {formData.unvaccinatedPolicy && (
                                  <Input
                                    placeholder="Describe vaccination requirements"
                                    value={formData.unvaccinatedPolicyDetails || ""}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, unvaccinatedPolicyDetails: e.target.value }))}
                                    className="mt-2"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && propertySetupStep === 2 && (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-semibold text-foreground mb-2">
                            Facilities & Amenities
                          </h2>
                          <p className="text-muted-foreground">
                            Describe your facilities and available amenities
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {visibleAmenities.map((amenity) => (
                            <div
                              key={amenity.name}
                              className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                formData.facilitiesAmenities.includes(amenity.name)
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/30"
                              }`}
                              onClick={() => {
                                const newAmenities = formData.facilitiesAmenities.includes(amenity.name)
                                  ? formData.facilitiesAmenities.filter(a => a !== amenity.name)
                                  : [...formData.facilitiesAmenities, amenity.name];
                                setFormData((prev) => ({ ...prev, facilitiesAmenities: newAmenities }));
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">{amenity.icon}</div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{amenity.name}</div>
                                </div>
                                <input
                                  type="checkbox"
                                  className="w-4 h-4"
                                  checked={formData.facilitiesAmenities.includes(amenity.name)}
                                  onChange={() => {}} // Handled by onClick
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && propertySetupStep === 3 && (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-semibold text-foreground mb-2">
                            Operating Hours & Availability
                          </h2>
                          <p className="text-muted-foreground">
                            Set your operating hours and availability details
                          </p>
                        </div>

                        <div className="space-y-8">
                          {/* Operating Hours */}
                          <div className="bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-6">Operating Hours</h3>
                            
                              <div className="space-y-4">
                              <div
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={() => setFormData((prev) => ({ ...prev, sameHoursEveryDay: !prev.sameHoursEveryDay }))}
                              >
                                <input
                                  type="checkbox"
                                  className="w-5 h-5"
                                  checked={formData.sameHoursEveryDay || false}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, sameHoursEveryDay: e.target.checked }))}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Label className="text-sm font-medium">Same hours every day</Label>
                              </div>

                              {formData.sameHoursEveryDay ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                                  <div className="space-y-2">
                                    <Label>Open Time</Label>
                                    <Input
                                      type="time"
                                      value={formData.dailyOpenTime || ""}
                                      onChange={(e) => setFormData((prev) => ({ ...prev, dailyOpenTime: e.target.value }))}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Close Time</Label>
                                    <Input
                                      type="time"
                                      value={formData.dailyCloseTime || ""}
                                      onChange={(e) => setFormData((prev) => ({ ...prev, dailyCloseTime: e.target.value }))}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4 ml-8">
                                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                                    <div key={day} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                      <Label className="text-sm font-medium">{day}</Label>
                                      <Input
                                        type="time"
                                        placeholder="Open"
                                        value={formData.weeklyHours?.[day]?.open || ""}
                                        onChange={(e) => setFormData((prev) => ({
                                          ...prev,
                                          weeklyHours: {
                                            ...prev.weeklyHours,
                                            [day]: { ...prev.weeklyHours?.[day], open: e.target.value }
                                          }
                                        }))}
                                      />
                                      <Input
                                        type="time"
                                        placeholder="Close"
                                        value={formData.weeklyHours?.[day]?.close || ""}
                                        onChange={(e) => setFormData((prev) => ({
                                          ...prev,
                                          weeklyHours: {
                                            ...prev.weeklyHours,
                                            [day]: { ...prev.weeklyHours?.[day], close: e.target.value }
                                          }
                                        }))}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Availability */}
                          <div className="bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-6">Availability</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div
                                className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer"
                                onClick={() => setFormData((prev) => ({ ...prev, weekendAvailability: !prev.weekendAvailability }))}
                              >
                                <div>
                                  <Label className="text-sm font-medium">Weekend availability</Label>
                                  <p className="text-xs text-muted-foreground">Open on weekends</p>
                                </div>
                                <input
                                  type="checkbox"
                                  className="w-5 h-5"
                                  checked={formData.weekendAvailability || false}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, weekendAvailability: e.target.checked }))}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div
                                className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer"
                                onClick={() => setFormData((prev) => ({ ...prev, holidayAvailability: !prev.holidayAvailability }))}
                              >
                                <div>
                                  <Label className="text-sm font-medium">Holiday availability</Label>
                                  <p className="text-xs text-muted-foreground">Open on holidays</p>
                                </div>
                                <input
                                  type="checkbox"
                                  className="w-5 h-5"
                                  checked={formData.holidayAvailability || false}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, holidayAvailability: e.target.checked }))}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              {hasVet && (
                                <div
                                  className="flex items-center justify-between p-3 bg-background rounded-lg border md:col-span-2 cursor-pointer"
                                  onClick={() => setFormData((prev) => ({ ...prev, emergencyServices: !prev.emergencyServices }))}
                                >
                                  <div>
                                    <Label className="text-sm font-medium">24/7 emergency services</Label>
                                    <p className="text-xs text-muted-foreground">Available for emergencies</p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    className="w-5 h-5"
                                    checked={formData.emergencyServices || false}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, emergencyServices: e.target.checked }))}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Boarding Rules */}
                          {hasBoarding && (
                            <div className="bg-secondary/30 rounded-xl p-6">
                              <h3 className="text-lg font-medium mb-6">Boarding Rules</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <Label>Check-in cut-off</Label>
                                  <Input
                                    type="time"
                                    placeholder="6:00 PM"
                                    value={formData.checkInCutoff || ""}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, checkInCutoff: e.target.value }))}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Pick-up window start</Label>
                                  <Input
                                    type="time"
                                    placeholder="8:00 AM"
                                    value={formData.pickupStart || ""}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, pickupStart: e.target.value }))}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Pick-up window end</Label>
                                  <Input
                                    type="time"
                                    placeholder="6:00 PM"
                                    value={formData.pickupEnd || ""}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, pickupEnd: e.target.value }))}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Booking Type */}
                          {(hasGrooming || hasVet) && (
                            <div className="bg-secondary/30 rounded-xl p-6">
                              <h3 className="text-lg font-medium mb-6">Booking Type</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div
                                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                    formData.appointmentOnly === "appointment"
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/30"
                                  }`}
                                  onClick={() => setFormData((prev) => ({ ...prev, appointmentOnly: "appointment" }))}
                                >
                                  <div className="text-center">
                                    <div className="text-2xl mb-2">📅</div>
                                    <div className="text-sm font-medium">Appointment-only</div>
                                    <div className="text-xs text-muted-foreground mt-1">Scheduled bookings only</div>
                                  </div>
                                </div>
                                <div
                                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                    formData.appointmentOnly === "walkins"
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/30"
                                  }`}
                                  onClick={() => setFormData((prev) => ({ ...prev, appointmentOnly: "walkins" }))}
                                >
                                  <div className="text-center">
                                    <div className="text-2xl mb-2">🚶</div>
                                    <div className="text-sm font-medium">Walk-ins accepted</div>
                                    <div className="text-xs text-muted-foreground mt-1">Accept same-day visits</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && propertySetupStep === 4 && (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-semibold text-foreground mb-2">
                            Booking Rules & Policies
                          </h2>
                          <p className="text-muted-foreground">
                            Set your booking requirements and policies
                          </p>
                        </div>

                        <div className="space-y-8">
                          {/* Booking Rules */}
                          <div className="bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-6">Booking Rules</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {visibleBookingRules.map((rule) => (
                                <div
                                  key={rule.name}
                                  className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer"
                                  onClick={() => {
                                    const newRules = formData.bookingRules.includes(rule.name)
                                      ? formData.bookingRules.filter(r => r !== rule.name)
                                      : [...formData.bookingRules, rule.name];
                                    setFormData((prev) => ({ ...prev, bookingRules: newRules }));
                                  }}
                                >
                                  <div>
                                    <Label className="text-sm font-medium">{rule.name}</Label>
                                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    className="w-5 h-5"
                                    checked={formData.bookingRules.includes(rule.name)}
                                    onChange={(e) => {
                                      const newRules = formData.bookingRules.includes(rule.name)
                                        ? formData.bookingRules.filter(r => r !== rule.name)
                                        : [...formData.bookingRules, rule.name];
                                      setFormData((prev) => ({ ...prev, bookingRules: newRules }));
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Compliance Requirements */}
                          <div className="bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-6">Compliance Requirements</h3>
                            <div className="space-y-4">
                              {[
                                { name: "Vaccination records required", required: true, description: "Proof of up-to-date vaccinations" },
                                { name: "Health certificate required", required: false, description: "Vet health check certificate" },
                                { name: "Parasite prevention proof", required: false, description: "Flea/tick/heartworm prevention" },
                                { name: "Microchip identification", required: false, description: "Pet must have microchip ID" },
                                { name: "Breed-specific restrictions apply", required: false, description: "Certain breeds not accepted" },
                                { name: "Age restrictions apply", required: false, description: "Minimum/maximum pet age" }
                              ].map((requirement) => (
                                <div
                                  key={requirement.name}
                                  className="flex items-start gap-3 p-3 bg-background rounded-lg border cursor-pointer"
                                  onClick={() => {
                                    const newRequirements = formData.complianceRequirements?.includes(requirement.name)
                                      ? formData.complianceRequirements.filter(r => r !== requirement.name)
                                      : [...(formData.complianceRequirements || []), requirement.name];
                                    setFormData((prev) => ({ ...prev, complianceRequirements: newRequirements }));
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 mt-1"
                                    checked={formData.complianceRequirements?.includes(requirement.name) || false}
                                    onChange={(e) => {
                                      const newRequirements = formData.complianceRequirements?.includes(requirement.name)
                                        ? formData.complianceRequirements.filter(r => r !== requirement.name)
                                        : [...(formData.complianceRequirements || []), requirement.name];
                                      setFormData((prev) => ({ ...prev, complianceRequirements: newRequirements }));
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm font-medium">{requirement.name}</Label>
                                      {requirement.required && <span className="text-red-500 text-xs">*</span>}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{requirement.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && propertySetupStep === 5 && (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-card rounded-2xl shadow-elevated p-6 md:p-8">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-semibold text-foreground mb-2">
                            Health & Safety
                          </h2>
                          <p className="text-muted-foreground">
                            Outline your health and safety protocols
                          </p>
                        </div>

                        <div className="space-y-6">
                          {/* Vaccination & Parasite Requirements */}
                          {(hasBoarding || hasGrooming) && (
                            <div className="bg-secondary/30 rounded-xl p-6">
                              <h3 className="text-lg font-medium mb-4">Vaccination & Parasite Requirements</h3>
                              <div className="space-y-4">
                                {[
                                  "DHPP vaccination (Distemper, Hepatitis, Parvovirus, Parainfluenza)",
                                  "Rabies vaccination",
                                  "Bordetella vaccination (Kennel Cough)",
                                  "Leptospirosis vaccination",
                                  "Heartworm prevention",
                                  "Flea and tick prevention",
                                  "Internal parasite prevention"
                                ].map((requirement) => (
                                  <div
                                    key={requirement}
                                    className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer"
                                    onClick={() => {
                                      const newRequirements = formData.healthSafety.includes(requirement)
                                        ? formData.healthSafety.filter(r => r !== requirement)
                                        : [...formData.healthSafety, requirement];
                                      setFormData((prev) => ({ ...prev, healthSafety: newRequirements }));
                                    }}
                                  >
                                    <div>
                                      <Label className="text-sm font-medium">{requirement}</Label>
                                      <p className="text-xs text-muted-foreground">Required for all pets</p>
                                    </div>
                                    <input
                                      type="checkbox"
                                      className="w-5 h-5"
                                      checked={formData.healthSafety.includes(requirement)}
                                      onChange={(e) => {
                                        const newRequirements = formData.healthSafety.includes(requirement)
                                          ? formData.healthSafety.filter(r => r !== requirement)
                                          : [...formData.healthSafety, requirement];
                                        setFormData((prev) => ({ ...prev, healthSafety: newRequirements }));
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Emergency Procedures */}
                          <div className="bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-4">Emergency Procedures</h3>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Emergency contact number</Label>
                                <Input
                                  placeholder="+63 XXX XXX XXXX"
                                  value={formData.emergencyContact || ""}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, emergencyContact: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Nearest veterinary hospital</Label>
                                <Input
                                  placeholder="Hospital name and address"
                                  value={formData.nearestVetHospital || ""}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, nearestVetHospital: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Emergency response time</Label>
                                <Input
                                  placeholder="Within 30 minutes"
                                  value={formData.emergencyResponseTime || ""}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, emergencyResponseTime: e.target.value }))}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Vet Availability */}
                          {(hasVet || hasBoarding) && (
                            <div className="bg-secondary/30 rounded-xl p-6">
                              <h3 className="text-lg font-medium mb-4">Vet Availability</h3>
                              <div className="space-y-4">
                                {[
                                  "On-site veterinarian available",
                                  "24/7 vet on-call service",
                                  "Emergency vet clinic partnership",
                                  "Telemedicine consultations",
                                  "Mobile vet services"
                                ].map((service) => (
                                  <div
                                    key={service}
                                    className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer"
                                    onClick={() => {
                                      const newServices = formData.vetAvailability?.includes(service)
                                        ? formData.vetAvailability.filter(s => s !== service)
                                        : [...(formData.vetAvailability || []), service];
                                      setFormData((prev) => ({ ...prev, vetAvailability: newServices }));
                                    }}
                                  >
                                    <div>
                                      <Label className="text-sm font-medium">{service}</Label>
                                      <p className="text-xs text-muted-foreground">
                                        {service === "On-site veterinarian available" && "Vet present at facility"}
                                        {service === "24/7 vet on-call service" && "Emergency vet support"}
                                        {service === "Emergency vet clinic partnership" && "Affiliated with emergency clinic"}
                                        {service === "Telemedicine consultations" && "Remote vet consultations"}
                                        {service === "Mobile vet services" && "Vet visits facility"}
                                      </p>
                                    </div>
                                    <input
                                      type="checkbox"
                                      className="w-5 h-5"
                                      checked={formData.vetAvailability?.includes(service) || false}
                                      onChange={(e) => {
                                        const newServices = formData.vetAvailability?.includes(service)
                                          ? formData.vetAvailability.filter(s => s !== service)
                                          : [...(formData.vetAvailability || []), service];
                                        setFormData((prev) => ({ ...prev, vetAvailability: newServices }));
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Isolation & Sanitation Protocols */}
                          <div className="bg-secondary/30 rounded-xl p-6">
                            <h3 className="text-lg font-medium mb-4">Isolation & Sanitation Protocols</h3>
                            <div className="space-y-4">
                              {[
                                "Separate isolation area for sick pets",
                                "Quarantine period for new arrivals",
                                "Daily health monitoring",
                                "Sanitation between pets",
                                "Disinfection protocols",
                                "Waste disposal procedures",
                                "Hand washing stations",
                                "PPE availability"
                                ].map((protocol) => (
                                <div
                                  key={protocol}
                                  className="flex items-start gap-3 p-3 bg-background rounded-lg border cursor-pointer"
                                  onClick={() => {
                                    const newProtocols = formData.sanitationProtocols?.includes(protocol)
                                      ? formData.sanitationProtocols.filter(p => p !== protocol)
                                      : [...(formData.sanitationProtocols || []), protocol];
                                    setFormData((prev) => ({ ...prev, sanitationProtocols: newProtocols }));
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 mt-1"
                                    checked={formData.sanitationProtocols?.includes(protocol) || false}
                                    onChange={(e) => {
                                      const newProtocols = formData.sanitationProtocols?.includes(protocol)
                                        ? formData.sanitationProtocols.filter(p => p !== protocol)
                                        : [...(formData.sanitationProtocols || []), protocol];
                                      setFormData((prev) => ({ ...prev, sanitationProtocols: newProtocols }));
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex-1">
                                    <Label className="text-sm font-medium">{protocol}</Label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {protocol === "Separate isolation area for sick pets" && "Isolated space for ill animals"}
                                      {protocol === "Quarantine period for new arrivals" && "Observation period before mixing"}
                                      {protocol === "Daily health monitoring" && "Regular health checks"}
                                      {protocol === "Sanitation between pets" && "Cleaning between animals"}
                                      {protocol === "Disinfection protocols" && "Proper disinfection procedures"}
                                      {protocol === "Waste disposal procedures" && "Safe waste handling"}
                                      {protocol === "Hand washing stations" && "Hygiene facilities"}
                                      {protocol === "PPE availability" && "Protective equipment"}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Photos */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          Property Photos
                        </h2>
                        <p className="text-muted-foreground">
                          Upload at least 5 photos of your property. The more you upload, the more likely you are to get bookings. You can add more later.
                        </p>
                      </div>
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
                          {formData.propertyImages.length} {formData.propertyImages.length === 1 ? 'photo' : 'photos'} uploaded {formData.propertyImages.length >= 5 ? '(minimum met)' : `(${5 - formData.propertyImages.length} more needed)`}
                        </p>
                      )}
                    </div>
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {[
                                { name: "Credit/Debit", icon: "💳" },
                                { name: "GCash / Maya", icon: "📱" },
                                { name: "Cash", icon: "💵" },
                                { name: "Bank Transfer", icon: "🏦" }
                              ].map((method) => (
                                <div
                                  key={method.name}
                                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                    formData.paymentOptions?.methods?.includes(method.name)
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/30"
                                  }`}
                                  onClick={() => {
                                    const methods = formData.paymentOptions?.methods?.includes(method.name)
                                      ? formData.paymentOptions.methods.filter(m => m !== method.name)
                                      : [...(formData.paymentOptions?.methods || []), method.name];
                                    setFormData((prev) => ({
                                      ...prev,
                                      paymentOptions: { ...prev.paymentOptions, methods }
                                    }));
                                  }}
                                >
                                  <div className="text-center">
                                    <div className="text-2xl mb-2">{method.icon}</div>
                                    <div className="text-sm font-medium">{method.name}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

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
                                        {countryCodes.map((country) => (
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