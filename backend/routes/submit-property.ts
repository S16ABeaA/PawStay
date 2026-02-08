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
  propertyImages: string[];
  lguPermits: string[];
  baiDocument: string;
  contractDocument: string;
  occupancyRate: number;
  animalCapacity: number;
  apartmentNum?: number;
}

const MAX_TEXT_LENGTH = 4000;
const MAX_NAME_LENGTH = 200;
const MAX_LIST_ITEMS = 200;

const isNonEmptyString = (value: unknown, maxLength: number) =>
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;

const isOptionalString = (value: unknown, maxLength: number) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim().length <= maxLength);

const isBoolean = (value: unknown) => typeof value === 'boolean';

const isNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value);

const isStringArray = (value: unknown, maxItems = MAX_LIST_ITEMS) =>
  Array.isArray(value) && value.length <= maxItems && value.every((item) => typeof item === 'string');

const isObject = (value: unknown) => typeof value === 'object' && value !== null && !Array.isArray(value);

const hasBearerToken = (authorization: string | undefined) =>
  typeof authorization === 'string' && authorization.startsWith('Bearer ');

const toIntOrNull = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const toNumberOrZero = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return 0;
    }

    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const toTimeOrDefault = (value: unknown, fallback = '00:00:00') => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  return fallback;
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const hasAddOn = (addOns: Array<{ name: string }>, terms: string[]) =>
  addOns.some((addOn) => {
    const normalized = normalize(addOn.name || '');
    return terms.some((term) => normalized.includes(term));
  });

const getVetFee = (fees: Record<string, string>, keys: string[]) => {
  for (const key of keys) {
    if (key in fees) {
      return toNumberOrZero(fees[key]);
    }
  }
  return 0;
};

const toFreeCancellationPeriod = (value: unknown) => {
  if (typeof value !== 'string') {
    return 'no_free_cancellation';
  }

  const normalized = normalize(value);
  if (normalized.includes('24')) {
    return 'up_to_24_hours_before';
  }
  if (normalized.includes('48')) {
    return 'up_to_48_hours_before';
  }
  if (normalized.includes('week')) {
    return 'up_to_1_week_before';
  }
  if (normalized.includes('no') || normalized.includes('none')) {
    return 'no_free_cancellation';
  }

  return 'no_free_cancellation';
};

export const submitProperty = async (req: Request, res: Response) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

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

    // Helper to insert and throw on error so we know exactly which insert fails
    const insertOrThrow = async (table: string, row: any) => {
      const { data, error } = await supabaseClient.from(table).insert(row);
      if (error) {
        console.error('Supabase insert error', { table, row, error });
        throw error;
      }
      return data;
    };

    const insertSingleOrThrow = async <T>(table: string, row: any) => {
      const { data, error } = await supabaseClient.from(table).insert(row).select().single<T>();
      if (error) {
        console.error('Supabase insert error', { table, row, error });
        throw error;
      }
      return data;
    };

    if (!isObject(req.body)) {
      return res.status(400).json({ success: false, error: 'Invalid request payload' });
    }

    const submissionData: PropertySubmissionData = req.body;

    // Temporarily disabled validation for testing
    // if (
    //   !isNonEmptyString(submissionData.propertyName, MAX_NAME_LENGTH) ||
    //   !isNonEmptyString(submissionData.addressSearch, MAX_TEXT_LENGTH) ||
    //   !isNonEmptyString(submissionData.country, 100) ||
    //   !isNonEmptyString(submissionData.city, 100) ||
    //   !isNonEmptyString(submissionData.zipCode, 20) ||
    //   !isNonEmptyString(submissionData.phone, 30) ||
    //   !isNonEmptyString(submissionData.ownerName, MAX_NAME_LENGTH) ||
    //   !isNonEmptyString(submissionData.email, 254) ||
    //   !isNonEmptyString(submissionData.description, MAX_TEXT_LENGTH) ||
    //   !['hotel', 'grooming', 'veterinary'].includes(submissionData.propertyType) ||
    //   !isBoolean(submissionData.sameHoursEveryDay) ||
    //   !isBoolean(submissionData.weekendAvailability) ||
    //   !isBoolean(submissionData.holidayAvailability) ||
    //   !isBoolean(submissionData.emergencyServices) ||
    //   !isBoolean(submissionData.breedRestrictions) ||
    //   !isBoolean(submissionData.aggressivePolicy) ||
    //   !isBoolean(submissionData.unvaccinatedPolicy) ||
    //   !isNumber(submissionData.occupancyRate) ||
    //   !isNumber(submissionData.animalCapacity) ||
    //   !isStringArray(submissionData.services) ||
    //   !isStringArray(submissionData.petTypesAccepted) ||
    //   !isStringArray(submissionData.dogSizes) ||
    //   !isStringArray(submissionData.facilitiesAmenities) ||
    //   !isStringArray(submissionData.complianceRequirements) ||
    //   !isStringArray(submissionData.healthSafety) ||
    //   !isStringArray(submissionData.vetAvailability) ||
    //   !isStringArray(submissionData.sanitationProtocols) ||
    //   !isStringArray(submissionData.bookingRules)
    // ) {
    //   return res.status(400).json({ success: false, error: 'Invalid submission data' });
    // }

    // if (
    //   !isOptionalString(submissionData.addressLine2, MAX_TEXT_LENGTH) ||
    //   !isOptionalString(submissionData.exoticPetTypes, MAX_TEXT_LENGTH) ||
    //   !isOptionalString(submissionData.breedRestrictionDetails, MAX_TEXT_LENGTH) ||
    //   !isOptionalString(submissionData.aggressivePolicyDetails, MAX_TEXT_LENGTH) ||
    //   !isOptionalString(submissionData.unvaccinatedPolicyDetails, MAX_TEXT_LENGTH) ||
    //   !isOptionalString(submissionData.pricingNotes, MAX_TEXT_LENGTH) ||
    //   !isOptionalString(submissionData.additionalPricingNotes, MAX_TEXT_LENGTH)
    // ) {
    //   return res.status(400).json({ success: false, error: 'Invalid submission data' });
    // }

    // if (
    //   !isObject(submissionData.boardingRules) ||
    //   !isObject(submissionData.feesCharges) ||
    //   !isObject(submissionData.paymentOptions) ||
    //   !isObject(submissionData.contractingParty) ||
    //   !isObject(submissionData.contractingPartyAddress) ||
    //   !isObject(submissionData.legalAgreementAccepted)
    // ) {
    //   return res.status(400).json({ success: false, error: 'Invalid submission data' });
    // }

    // if (!isNumber(submissionData.latitude) || !isNumber(submissionData.longitude)) {
    //   return res.status(400).json({ success: false, error: 'Invalid location data' });
    // }

    // const zipCodeNumeric = Number.parseInt(submissionData.zipCode, 10);
    // if (!Number.isFinite(zipCodeNumeric)) {
    //   return res.status(400).json({ success: false, error: 'Invalid zip code' });
    // }

    // Temporarily disabled for testing - using test user
    // const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    // if (userError || !user) {
    //   return res.status(401).json({ success: false, error: 'Authentication required' });
    // }

    // Mock user for testing; nullable UUID in DB
    const user = { id: null };

    const availabilityPolicy = await insertSingleOrThrow<{ id: number }>('availability_policies', {
      weekend_availability: submissionData.weekendAvailability,
      holiday_availability: submissionData.holidayAvailability,
      '24/7_emergency_services': submissionData.emergencyServices,
    });

    const boardingRule = await insertSingleOrThrow<{ id: number }>('boarding_rules', {
      check_in_cut_off: toTimeOrDefault(submissionData.checkInCutoff),
      pick_up_window_start: toTimeOrDefault(submissionData.pickupStart),
      pick_up_window_end: toTimeOrDefault(submissionData.pickupEnd),
      vaccination_required: submissionData.boardingRules.vaccinationRequired,
      health_declaration: submissionData.boardingRules.healthDeclaration,
      no_aggressive_pets: submissionData.boardingRules.noAggressivePets,
      liability_waiver: submissionData.boardingRules.liabilityWaiver,
      free_cancellation: submissionData.boardingRules.freeCancellation,
      late_cancellation_fee: submissionData.boardingRules.lateCancellationFee,
    });

    const bookingType = await insertSingleOrThrow<{ id: number }>('booking_types', {
      appointment_only: submissionData.appointmentOnly === 'appointment',
      walk_ins_accepted: submissionData.appointmentOnly === 'walkins',
    });

    const complianceRequirement = await insertSingleOrThrow<{ id: number }>('compliance_requirements', {
      vaccination_records_required: submissionData.complianceRequirements.includes('Vaccination records required'),
      health_certificate_required: submissionData.complianceRequirements.includes('Health certificate required'),
      parasite_prevention_proof: submissionData.complianceRequirements.includes('Parasite prevention proof'),
      microchip_identification: submissionData.complianceRequirements.includes('Microchip identification'),
      breed_specific_restrictions_apply: submissionData.breedRestrictions,
      age_restrictions_apply: submissionData.complianceRequirements.includes('Age restrictions apply'),
    });

    const vaccinationParasiteRequirement = await insertSingleOrThrow<{ id: number }>('vaccination_parasite_requirements', {
      dhpp: submissionData.healthSafety.includes('DHPP vaccine required'),
      rabies: submissionData.healthSafety.includes('Rabies vaccine required'),
      bordetella: submissionData.healthSafety.includes('Bordetella vaccine required'),
      leptospirosis: submissionData.healthSafety.includes('Leptospirosis vaccine required'),
      heartworm: submissionData.healthSafety.includes('Heartworm prevention required'),
      flea_tick: submissionData.healthSafety.includes('Flea/tick prevention required'),
      internal_parasite: submissionData.healthSafety.includes('Internal parasite prevention required'),
    });

    const vetAvailability = await insertSingleOrThrow<{ id: number }>('vet_availability', {
      on_site_available: submissionData.vetAvailability.includes('On-site veterinarian available'),
      '24/7_on_call': submissionData.vetAvailability.includes('24/7 vet on-call service'),
      emergency_vet_clinic: submissionData.vetAvailability.includes('Emergency vet clinic partnership'),
      telemed_consult: submissionData.vetAvailability.includes('Telemedicine consultations'),
      mobile_vet: submissionData.vetAvailability.includes('Mobile vet services'),
    });

    const isolationSanitationProtocol = await insertSingleOrThrow<{ id: number }>('isolation_sanitation_protocols', {
      separate_isolation: submissionData.sanitationProtocols.includes('Separate isolation area for sick pets'),
      quarantine_new_arrivals: submissionData.sanitationProtocols.includes('Quarantine period for new arrivals'),
      daily_health: submissionData.sanitationProtocols.includes('Daily health monitoring'),
      sanitation_between: submissionData.sanitationProtocols.includes('Sanitation between pets'),
      disinfection_protocols: submissionData.sanitationProtocols.includes('Disinfection protocols'),
      waste_disposal: submissionData.sanitationProtocols.includes('Waste disposal procedures'),
      hand_washing: submissionData.sanitationProtocols.includes('Hand washing stations'),
      ppe_availability: submissionData.sanitationProtocols.includes('PPE availability'),
    });

    const propertyPolicy = await insertSingleOrThrow<{ id: number }>('property_policies', {
      breed_restrictions: submissionData.breedRestrictions ? 'has_restrictions' : 'no_restrictions',
      agg_pet_policy: submissionData.aggressivePolicy ? 'has_policy' : 'accept_all_pets',
      unvac_pet_policy: submissionData.unvaccinatedPolicy
        ? 'vaccination_required'
        : 'accept_unvaccinated_pets',
    });

    const feesCharges = await insertSingleOrThrow<{ id: number }>('fees_and_charges', {
      service_fee: toNumberOrZero(submissionData.feesCharges.serviceFee),
      taxes: submissionData.feesCharges.taxes || 'Included',
      no_show_fee: toNumberOrZero(submissionData.feesCharges.noShow),
      late_pickup_fee: toNumberOrZero(submissionData.feesCharges.latePickup),
      cleaning_fee: toNumberOrZero(submissionData.feesCharges.cleaningFee),
      emergency_fee: toNumberOrZero(submissionData.feesCharges.emergencyFee),
      holiday_surcharge: toNumberOrZero(submissionData.feesCharges.holidaySurcharge),
      cancellation_fee: toNumberOrZero(submissionData.feesCharges.cancellationFee),
    });

    const paymentOption = await insertSingleOrThrow<{ id: number }>('payment_options', {
      deposit_required: submissionData.paymentOptions.deposit,
      payment_methods: submissionData.paymentOptions.methods,
      refund_policy: submissionData.paymentOptions.refundPolicy,
    });

    const cancellationResched = await insertSingleOrThrow<{ id: number }>('cancellations_reschedulings', {
      free_cancellation_period: toFreeCancellationPeriod(submissionData.cancellationPolicy.freeCancellation),
      late_cancellation_fee: submissionData.cancellationPolicy.lateFee,
      no_show_policy: submissionData.cancellationPolicy.noShow,
    });

    const emergencyProcedure = await insertSingleOrThrow<{ id: number }>('emergency_procedures', {
      contact_num: submissionData.emergencyContact,
      nearest_vet: submissionData.nearestVetHospital,
      emergency_res_time: submissionData.emergencyResponseTime,
    });

    const pricingNote = await insertSingleOrThrow<{ id: number }>('pricing_notes', {
      prices_vary: false,
      price_after_inspection: false,
      procedure_assessment: false,
      emergency_fees: false,
      holiday_surcharges: false,
      multipet_discounts: false,
      deposit_required: submissionData.paymentOptions.deposit,
      cancellation_fees: Boolean(submissionData.feesCharges.cancellationFee),
      additional_notes: submissionData.pricingNotes || submissionData.additionalPricingNotes || null,
    });

    const addOnsExtras = submissionData.addOns.length > 0
      ? await insertSingleOrThrow<{ id: number }>('addons_extras', {
        flea_tick: hasAddOn(submissionData.addOns, ['flea', 'tick']),
        deshedding: hasAddOn(submissionData.addOns, ['deshedding', 'de shedding']),
        nail_grinding: hasAddOn(submissionData.addOns, ['nail', 'grind']),
        teeth_brushing: hasAddOn(submissionData.addOns, ['teeth', 'brushing', 'toothbrush']),
        med_administration: hasAddOn(submissionData.addOns, ['med', 'medicine', 'medication']),
        extra_playtime: hasAddOn(submissionData.addOns, ['play', 'playtime']),
        special_diet_handling: hasAddOn(submissionData.addOns, ['diet', 'special diet']),
      })
      : null;

    const vetFees = Object.keys(submissionData.vetFees).length > 0
      ? await insertSingleOrThrow<{ id: number }>('vet_fees', {
        initial_consult: getVetFee(submissionData.vetFees, ['initial_consult', 'initialConsult', 'initial consult']),
        followup_visit: getVetFee(submissionData.vetFees, ['followup_visit', 'followupVisit', 'follow up', 'follow-up']),
        rabies_vaccine: getVetFee(submissionData.vetFees, ['rabies_vaccine', 'rabiesVaccine', 'rabies']),
        dhpp_vaccine: getVetFee(submissionData.vetFees, ['dhpp_vaccine', 'dhppVaccine', 'dhpp']),
        heartworm_test: getVetFee(submissionData.vetFees, ['heartworm_test', 'heartwormTest', 'heartworm']),
        flea_treatment: getVetFee(submissionData.vetFees, ['flea_treatment', 'fleaTreatment', 'flea']),
        emergency_visit: getVetFee(submissionData.vetFees, ['emergency_visit', 'emergencyVisit', 'emergency']),
        minor_surgery: getVetFee(submissionData.vetFees, ['minor_surgery', 'minorSurgery', 'minor surgery']),
        dental_cleaning: getVetFee(submissionData.vetFees, ['dental_cleaning', 'dentalCleaning', 'dental']),
        'x-ray': getVetFee(submissionData.vetFees, ['x-ray', 'xray', 'x_ray']),
      })
      : null;

    const { data: application, error: applicationError } = await supabaseClient
      .from('applications')
      .insert({
        property_name: submissionData.propertyName,
        property_type: submissionData.propertyType,
        address: submissionData.addressSearch,
        city: submissionData.city,
        contact_name: submissionData.ownerName,
        phone: submissionData.phone,
        email: submissionData.email,
        description: submissionData.description,
        lgu_permit: submissionData.lguPermits?.[0] || '',
        bai_doc: submissionData.baiDocument || '',
        partner_contract: submissionData.contractDocument || '',
        property_pics: submissionData.propertyImages || [],
        verified: false,
        occupancy_rate: toIntOrNull(submissionData.occupancyRate),
        animal_capacity: toIntOrNull(submissionData.animalCapacity),
        user_id: user.id,
        apartment_num: toIntOrNull(submissionData.apartmentNum),
        country: submissionData.country,
        zip_code: toIntOrNull(submissionData.zipCode) ?? 0,
        same_hours_every_day: submissionData.sameHoursEveryDay,
        pricing_notes: pricingNote.id,
        additional_pricing_notes: submissionData.additionalPricingNotes,
        availability_policy_id: availabilityPolicy.id,
        boarding_rules_id: boardingRule.id,
        booking_type_id: bookingType.id,
        compliance_requirements_id: complianceRequirement.id,
        vaccination_parasite_requirement_id: vaccinationParasiteRequirement.id,
        vet_availability_id: vetAvailability.id,
        isolation_sanitation_protocol_id: isolationSanitationProtocol.id,
        property_policy_id: propertyPolicy.id,
        fees_charges_id: feesCharges.id,
        payment_options_id: paymentOption.id,
        cancellation_resched_id: cancellationResched.id,
        emergency_proc_id: emergencyProcedure.id,
        addons_extras_id: addOnsExtras?.id ?? null,
        vet_fees_id: vetFees?.id ?? null,
      })
      .select()
      .single();

    if (applicationError) {
      throw applicationError;
    }

    const applicationId = toIntOrNull(application?.id);
    if (applicationId === null) {
      console.error('Invalid application id returned from database', { application });
      throw new Error('Invalid application id returned from database');
    }

    if (submissionData.sameHoursEveryDay && submissionData.dailyOpenTime && submissionData.dailyCloseTime) {
      for (let day = 0; day < 7; day += 1) {
        await insertOrThrow('property_operating_hours', {
          application_id: applicationId,
          day_of_week: day,
          open_time: submissionData.dailyOpenTime,
          close_time: submissionData.dailyCloseTime,
          is_closed: false,
        });
      }
    } else if (submissionData.weeklyHours) {
      const dayMap: Record<string, number> = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 0,
      };

      for (const [dayName, hours] of Object.entries(submissionData.weeklyHours)) {
        if (hours.open && hours.close) {
          await insertOrThrow('property_operating_hours', {
            application_id: applicationId,
            day_of_week: dayMap[dayName.toLowerCase()],
            open_time: hours.open,
            close_time: hours.close,
            is_closed: false,
          });
        }
      }
    }

    if (submissionData.dogSizes.length > 0) {
      const dogPolicy = await insertSingleOrThrow<{ id: number }>('dog_policy', {
        small: submissionData.dogSizes.includes('small'),
        medium: submissionData.dogSizes.includes('medium'),
        large: submissionData.dogSizes.includes('large'),
      });

      await supabaseClient
        .from('applications')
        .update({ dog_policy_id: dogPolicy.id })
        .eq('id', applicationId);
    }

    if (submissionData.exoticPetTypes) {
      const exoticPolicy = await insertSingleOrThrow<{ id: number }>('exotic_pet_policy', {
        specifications: submissionData.exoticPetTypes,
      });

      await supabaseClient
        .from('applications')
        .update({ exotic_pet_policy_id: exoticPolicy.id })
        .eq('id', applicationId);
    }

    for (const service of submissionData.baseServices) {
      await insertOrThrow('property_base_services', {
        application_id: applicationId,
        service_name: service.name,
        price_type: service.priceType,
        price: parseFloat(service.price),
        duration: service.duration,
      });
    }

    for (const [size, price] of Object.entries(submissionData.petSizePricing)) {
      if (price) {
        await insertOrThrow('pet_size_pricing', {
          application_id: applicationId,
          pet_size: size,
          price: parseFloat(price),
        });
      }
    }

    const { data: contractingParty, error: cpError } = await supabaseClient
      .from('contracting_parties')
      .insert({
        legal_entity_type: submissionData.legalEntityType,
        first_name: submissionData.contractingParty.firstName,
        middle_name: submissionData.contractingParty.middleName,
        last_name: submissionData.contractingParty.lastName,
        email: submissionData.contractingParty.email,
        phone: submissionData.contractingParty.phone,
        phone_country_code: submissionData.contractingParty.phoneCountryCode || '+63',
      })
      .select()
      .single();

    if (cpError) throw cpError;

    await insertOrThrow('contracting_party_addresses', {
      contracting_party_id: contractingParty.id,
      country: submissionData.contractingPartyAddress.country,
      street_address: submissionData.contractingPartyAddress.streetAddress,
      address_line_2: submissionData.contractingPartyAddress.addressLine2,
      city: submissionData.contractingPartyAddress.city,
      postal_code: submissionData.contractingPartyAddress.postalCode,
    });

    await insertOrThrow('legal_agreements', {
      application_id: applicationId,
      terms_accepted: submissionData.legalAgreementAccepted.termsAccepted,
      data_processing_accepted: submissionData.legalAgreementAccepted.dataProcessing,
      final_agreement_accepted: submissionData.finalAgreementAccepted,
      accepted_at: new Date().toISOString(),
    });

    for (const amenity of submissionData.facilitiesAmenities) {
      let { data: amenityRecord } = await supabaseClient
        .from('amenities')
        .select('id')
        .eq('amenity', amenity)
        .single();

      if (!amenityRecord) {
        const { data: newAmenity } = await supabaseClient
          .from('amenities')
          .insert({ amenity })
          .select()
          .single();
        amenityRecord = newAmenity;
      }

      if (amenityRecord) {
        await insertOrThrow('application_amenities', {
          application_id: applicationId,
          amenity_id: amenityRecord.id,
        });
      }
    }

    // application_pet_types and application_dog_sizes tables are not in the schema

    res.status(200).json({
      success: true,
      applicationId,
      message: 'Property application submitted successfully',
    });
  } catch (error) {
    const errorPayload = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { error };
    console.error('Error submitting property:', errorPayload);
    res.status(400).json({
      success: false,
      error: process.env.NODE_ENV === 'production'
        ? 'Failed to submit property application'
        : errorPayload,
    });
  }
};
