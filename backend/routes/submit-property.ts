import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

interface PropertySubmissionData {
  propertyName: string;
  addressSearch: string;
  addressLine2: string;
  country: string;
  city: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone: string;
  ownerName: string;
  email: string;
  password: string;
  description: string;
  isPinAccurate: boolean;
  services: string[];
  petTypesAccepted: string[];
  dogSizes: string[];
  exoticPetTypes: string;
  breedRestrictions: boolean;
  breedRestrictionDetails: string;
  aggressivePolicy: boolean;
  aggressivePolicyDetails: string;
  unvaccinatedPolicy: boolean;
  unvaccinatedPolicyDetails: string;
  facilitiesAmenities: string[];
  sameHoursEveryDay: boolean;
  dailyOpenTime: string;
  dailyCloseTime: string;
  weeklyHours: Record<string, { open: string; close: string }>;
  weekendAvailability: boolean;
  holidayAvailability: boolean;
  emergencyServices: boolean;
  checkInCutoff: string;
  pickupStart: string;
  pickupEnd: string;
  appointmentOnly: string;
  bookingRules: string[];
  cancellationPolicy: { freeCancellation: string; lateFee: string; noShow: string };
  complianceRequirements: string[];
  healthSafety: string[];
  vetAvailability: string[];
  sanitationProtocols: string[];
  emergencyContact: string;
  nearestVetHospital: string;
  emergencyResponseTime: string;
  baseServices: Array<{ name: string; priceType: string; price: string; duration: string }>;
  petSizePricing: { small: string; medium: string; large: string; giant: string; cats: string; exotic: string };
  addOns: Array<{ name: string; price: string; type: string }>;
  vetFees: Record<string, string>;
  boardingRules: {
    advanceBooking: boolean;
    sameDayBooking: boolean;
    freeCancellation: boolean;
    lateCancellationFee: boolean;
    lateCancellationFeeAmount: string;
    vaccinationRequired: boolean;
    healthDeclaration: boolean;
    noAggressivePets: boolean;
    liabilityWaiver: boolean;
  };
  feesCharges: {
    serviceFee: string;
    taxes: string;
    noShow: string;
    latePickup: string;
    cleaningFee: string;
    emergencyFee: string;
    holidaySurcharge: string;
    cancellationFee: string;
  };
  paymentOptions: { deposit: boolean; methods: string[]; refundPolicy: string };
  pricingNotes: string;
  additionalPricingNotes: string;
  legalEntityType: 'individual' | 'business';
  contractingParty: {
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    phone: string;
    phoneCountryCode: string;
  };
  contractingPartyAddress: {
    country: string;
    streetAddress: string;
    addressLine2: string;
    city: string;
    postalCode: string;
  };
  legalAgreementAccepted: {
    termsAccepted: boolean;
    dataProcessing: boolean;
  };
  finalAgreementAccepted: boolean;
  propertyType: 'hotel' | 'grooming' | 'veterinary';
  propertyTypes?: Array<'hotel' | 'grooming' | 'veterinary'>;
  propertyImages: string[];
  lguPermits: string[];
  baiDocument: string;
  contractDocument: string;
  occupancyRate: number;
  animalCapacity: number;
  apartmentNum?: number;
}

const isObject = (value: unknown) => typeof value === 'object' && value !== null && !Array.isArray(value);

export const submitProperty = async (req: Request, res: Response) => {
  try {
    const supabaseUrl = process.env.VITE_PAW_STAY_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_PAW_STAY_SUPABASE_ANON_KEY;

    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key exists:', !!supabaseKey);

    // Temporarily disabled for testing
    // if (!hasBearerToken(req.headers.authorization)) {
    //   return res.status(401).json({ success: false, error: 'Authentication required' });
    // }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      // Temporarily disabled for testing
      // global: {
      //   headers: { Authorization: req.headers.authorization || '' },
      // },
    });

    if (!isObject(req.body)) {
      return res.status(400).json({ success: false, error: 'Invalid request payload' });
    }

    const d: PropertySubmissionData = req.body;

    const ownerId = (req as any).user?.id as string | undefined;

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        error: 'Authentication required to submit property',
      });
    }

    // ── Resolve property_type as an array ──
    const propertyTypeArray: string[] =
      d.propertyTypes && d.propertyTypes.length > 0
        ? d.propertyTypes
        : [d.propertyType];

    // ================================================================
    // 1. INSERT INTO properties
    // ================================================================
    const { data: property, error: propertyError } = await supabaseClient
      .from('properties')
      .insert({
        owner_id: ownerId,
        status: 'pending',
        name: d.propertyName,
        property_type: propertyTypeArray,
        address: d.addressSearch,
        address_line2: d.addressLine2 || null,
        country: d.country || 'Philippines',
        city: d.city,
        zip_code: d.zipCode,
        latitude: d.latitude,
        longitude: d.longitude,
        phone: d.phone,
        description: d.description,
        capacity: d.animalCapacity || null,
        pet_types_accepted: d.petTypesAccepted || [],
        dog_sizes: d.dogSizes || [],
        exotic_pet_types: d.exoticPetTypes || null,
        facilities_amenities: d.facilitiesAmenities || [],
        images: d.propertyImages || [],
        cover_image: d.propertyImages?.[0] || null,
      })
      .select('id')
      .single();

    if (propertyError || !property) {
      console.error('Error inserting property:', propertyError);
      throw propertyError || new Error('Failed to create property');
    }

    const propertyId: string = property.id;

    // ================================================================
    // 2. INSERT INTO property_setup  (1-to-1)
    // ================================================================
    const { error: setupError } = await supabaseClient
      .from('property_setup')
      .insert({
        property_id: propertyId,

        // Policies (JSONB)
        policies: {
          breedRestrictions: d.breedRestrictions,
          breedRestrictionDetails: d.breedRestrictionDetails || '',
          aggressivePolicy: d.aggressivePolicy,
          aggressivePolicyDetails: d.aggressivePolicyDetails || '',
          unvaccinatedPolicy: d.unvaccinatedPolicy,
          unvaccinatedPolicyDetails: d.unvaccinatedPolicyDetails || '',
        },

        // Operating hours (JSONB)
        operating_hours: {
          sameHoursEveryDay: d.sameHoursEveryDay,
          dailyOpenTime: d.dailyOpenTime || null,
          dailyCloseTime: d.dailyCloseTime || null,
          weeklyHours: d.weeklyHours || {},
          weekendAvailability: d.weekendAvailability,
          holidayAvailability: d.holidayAvailability,
          emergencyServices: d.emergencyServices,
          checkInCutoff: d.checkInCutoff || null,
          pickupStart: d.pickupStart || null,
          pickupEnd: d.pickupEnd || null,
          appointmentOnly: d.appointmentOnly || null,
        },

        // Booking rules & compliance (text[])
        booking_rules: d.bookingRules || [],
        compliance: d.complianceRequirements || [],

        // Cancellation policy (JSONB)
        cancellation_policy: d.cancellationPolicy || {},

        // Health & safety (text[])
        health_safety: d.healthSafety || [],
        vet_availability: d.vetAvailability || [],
        sanitation_protocols: d.sanitationProtocols || [],

        // Emergency info
        emergency_contact: d.emergencyContact || null,
        nearest_vet_hospital: d.nearestVetHospital || null,
        emergency_response_time: d.emergencyResponseTime || null,
      });

    if (setupError) {
      console.error('Error inserting property_setup:', setupError);
      throw setupError;
    }

    // ================================================================
    // 3. INSERT INTO property_pricing  (1-to-1)
    // ================================================================
    const { error: pricingError } = await supabaseClient
      .from('property_pricing')
      .insert({
        property_id: propertyId,

        // Base services (JSONB array)
        base_services: d.baseServices || [],

        // Size-based pricing (JSONB object)
        pet_size_pricing: d.petSizePricing || {},

        // Add-ons (JSONB array)
        add_ons: d.addOns || [],

        // Vet fees (JSONB object)
        vet_fees: d.vetFees || {},

        // Boarding rules (JSONB object)
        boarding_rules: d.boardingRules || {},

        // Fees & charges (JSONB object)
        fees_charges: d.feesCharges || {},

        // Payment options (JSONB object)
        payment_options: d.paymentOptions || {},

        pricing_notes: d.pricingNotes || null,
        additional_pricing_notes: d.additionalPricingNotes || null,
      });

    if (pricingError) {
      console.error('Error inserting property_pricing:', pricingError);
      throw pricingError;
    }

    // ================================================================
    // 4. INSERT INTO property_legal  (1-to-1)
    // ================================================================
    const { error: legalError } = await supabaseClient
      .from('property_legal')
      .insert({
        property_id: propertyId,

        legal_entity_type: d.legalEntityType || '',

        // Contracting party info (JSONB)
        contracting_party: d.contractingParty || {},
        contracting_party_address: d.contractingPartyAddress || {},

        // Document uploads (Supabase Storage URLs)
        lgu_permits: d.lguPermits || [],
        bai_document: d.baiDocument || null,
        contract_document: d.contractDocument || null,

        // Legal agreements (JSONB)
        legal_agreements: {
          termsAccepted: d.legalAgreementAccepted?.termsAccepted ?? false,
          dataProcessing: d.legalAgreementAccepted?.dataProcessing ?? false,
          finalAgreementAccepted: d.finalAgreementAccepted ?? false,
          acceptedAt: new Date().toISOString(),
        },
      });

    if (legalError) {
      console.error('Error inserting property_legal:', legalError);
      throw legalError;
    }

    // ================================================================
    // 5. UPSERT amenities + INSERT property_amenities  (many-to-many)
    // ================================================================
    if (d.facilitiesAmenities && d.facilitiesAmenities.length > 0) {
      for (const amenityName of d.facilitiesAmenities) {
        // Look up existing amenity
        let { data: amenityRecord } = await supabaseClient
          .from('amenities')
          .select('id')
          .eq('amenity', amenityName)
          .single();

        // Create if it doesn't exist
        if (!amenityRecord) {
          const { data: newAmenity, error: amenityErr } = await supabaseClient
            .from('amenities')
            .insert({
              amenity: amenityName,
              service_types: propertyTypeArray,
            })
            .select('id')
            .single();

          if (amenityErr) {
            console.error('Error inserting amenity:', amenityErr);
            continue; // skip this amenity, don't fail the whole submission
          }
          amenityRecord = newAmenity;
        }

        if (amenityRecord) {
          const { error: paError } = await supabaseClient
            .from('property_amenities')
            .insert({
              property_id: propertyId,
              amenity_id: amenityRecord.id,
            });

          if (paError) {
            console.error('Error inserting property_amenity:', paError);
            // non-fatal — continue
          }
        }
      }
    }

    // ================================================================
    // 6. INSERT initial property_services from baseServices
    //    (populates the service catalogue for the new property)
    // ================================================================
    if (d.baseServices && d.baseServices.length > 0) {
      const categoryMap: Record<string, string> = {
        hotel: 'Boarding',
        grooming: 'Grooming',
        veterinary: 'Veterinary',
      };
      const defaultCategory = categoryMap[d.propertyType] || 'Other';

      for (const svc of d.baseServices) {
        const price = parseFloat(svc.price) || 0;
        const { error: svcError } = await supabaseClient
          .from('property_services')
          .insert({
            property_id: propertyId,
            name: svc.name,
            description: `${svc.priceType || 'Fixed'} — ${svc.duration || 'N/A'}`,
            price,
            category: defaultCategory,
          });

        if (svcError) {
          console.error('Error inserting property_service:', svcError);
          // non-fatal
        }
      }
    }

    res.status(200).json({
      success: true,
      propertyId,
      message: 'Property listing submitted successfully',
    });
  } catch (error) {
    const errorPayload = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { error };
    console.error('Error submitting property:', errorPayload);
    res.status(400).json({
      success: false,
      error: process.env.NODE_ENV === 'production'
        ? 'Failed to submit property listing'
        : errorPayload,
    });
  }
};
