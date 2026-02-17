-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.addons_extras (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  flea_tick boolean NOT NULL DEFAULT false,
  deshedding boolean NOT NULL DEFAULT false,
  nail_grinding boolean NOT NULL DEFAULT false,
  teeth_brushing boolean NOT NULL DEFAULT false,
  med_administration boolean NOT NULL DEFAULT false,
  extra_playtime boolean NOT NULL DEFAULT false,
  special_diet_handling boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT addons_extras_pkey PRIMARY KEY (id)
);
CREATE TABLE public.amenities (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  amenity character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  icon text,
  CONSTRAINT amenities_pkey PRIMARY KEY (id)
);
CREATE TABLE public.amenity_categories (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  name USER-DEFINED NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT amenity_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.amenity_category_map (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  amenity_id bigint NOT NULL,
  category_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT amenity_category_map_pkey PRIMARY KEY (id),
  CONSTRAINT amenity_category_map_amenity_id_fkey FOREIGN KEY (amenity_id) REFERENCES public.amenities(id),
  CONSTRAINT amenity_category_map_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.amenity_categories(id)
);
CREATE TABLE public.application_amenities (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  application_id bigint NOT NULL,
  amenity_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT application_amenities_pkey PRIMARY KEY (id),
  CONSTRAINT application_amenities_amenity_id_fkey FOREIGN KEY (amenity_id) REFERENCES public.amenities(id),
  CONSTRAINT application_amenities_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id)
);
CREATE TABLE public.applications (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  property_name character varying NOT NULL,
  property_type USER-DEFINED NOT NULL,
  address character varying NOT NULL,
  city character varying NOT NULL,
  contact_name character varying NOT NULL,
  phone character varying NOT NULL,
  email character varying NOT NULL,
  description character varying NOT NULL,
  lgu_permit character varying NOT NULL,
  bai_doc character varying NOT NULL,
  partner_contract character varying NOT NULL,
  property_pics ARRAY NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  apartment_num smallint,
  country character varying NOT NULL,
  zip_code smallint NOT NULL,
  dog_policy_id bigint,
  cat_policy_id bigint,
  exotic_pet_policy_id bigint,
  property_policy_id bigint,
  availability_policy_id bigint,
  boarding_rules_id bigint,
  booking_type_id bigint,
  compliance_requirements_id bigint,
  vaccination_parasite_requirement_id bigint,
  vet_availability_id bigint,
  isolation_sanitation_protocol_id bigint,
  same_hours_every_day boolean NOT NULL DEFAULT false,
  pricing_notes bigint,
  addons_extras_id bigint,
  vet_fees_id bigint,
  fees_charges_id bigint,
  payment_options_id bigint,
  services_id bigint,
  cancellation_resched_id bigint,
  emergency_proc_id bigint,
  additional_pricing_notes text,
  animal_capacity integer,
  occupancy_rate numeric,
  user_id uuid,
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_cat_policy_id_fkey FOREIGN KEY (cat_policy_id) REFERENCES public.cat_policy(id),
  CONSTRAINT applications_dog_policy_id_fkey FOREIGN KEY (dog_policy_id) REFERENCES public.dog_policy(id),
  CONSTRAINT applications_exotic_pet_policy_id_fkey FOREIGN KEY (exotic_pet_policy_id) REFERENCES public.exotic_pet_policy(id),
  CONSTRAINT applications_property_policy_id_fkey FOREIGN KEY (property_policy_id) REFERENCES public.property_policies(id),
  CONSTRAINT applications_availability_policy_id_fkey FOREIGN KEY (availability_policy_id) REFERENCES public.availability_policies(id),
  CONSTRAINT applications_boarding_rules_id_fkey FOREIGN KEY (boarding_rules_id) REFERENCES public.boarding_rules(id),
  CONSTRAINT applications_booking_type_id_fkey FOREIGN KEY (booking_type_id) REFERENCES public.booking_types(id),
  CONSTRAINT applications_compiance_requirements_id_fkey FOREIGN KEY (compliance_requirements_id) REFERENCES public.compliance_requirements(id),
  CONSTRAINT applications_vaccination_parasite_requirement_id_fkey FOREIGN KEY (vaccination_parasite_requirement_id) REFERENCES public.vaccination_parasite_requirements(id),
  CONSTRAINT applications_vet_availability_id_fkey FOREIGN KEY (vet_availability_id) REFERENCES public.vet_availability(id),
  CONSTRAINT applications_isolation_sanitation_protocol_id_fkey FOREIGN KEY (isolation_sanitation_protocol_id) REFERENCES public.isolation_sanitation_protocols(id),
  CONSTRAINT applications_isolation_sanitation_protocol_id_fkey1 FOREIGN KEY (isolation_sanitation_protocol_id) REFERENCES public.isolation_sanitation_protocols(id),
  CONSTRAINT applications_addons_extras_id_fkey FOREIGN KEY (addons_extras_id) REFERENCES public.addons_extras(id),
  CONSTRAINT applications_vet_fees_id_fkey FOREIGN KEY (vet_fees_id) REFERENCES public.vet_fees(id),
  CONSTRAINT applications_fees_charges_id_fkey FOREIGN KEY (fees_charges_id) REFERENCES public.fees_and_charges(id),
  CONSTRAINT applications_payment_options_id_fkey FOREIGN KEY (payment_options_id) REFERENCES public.payment_options(id),
  CONSTRAINT applications_pricing_notes_fkey FOREIGN KEY (pricing_notes) REFERENCES public.pricing_notes(id),
  CONSTRAINT applications_services_id_fkey FOREIGN KEY (services_id) REFERENCES public.services(id),
  CONSTRAINT applications_cancellation_resched_id_fkey FOREIGN KEY (cancellation_resched_id) REFERENCES public.cancellations_reschedulings(id),
  CONSTRAINT applications_emergency_proc_id_fkey FOREIGN KEY (emergency_proc_id) REFERENCES public.emergency_procedures(id),
  CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.availability_policies (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  weekend_availability boolean NOT NULL DEFAULT false,
  holiday_availability boolean NOT NULL DEFAULT false,
  24/7_emergency_services boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT availability_policies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.boarding_rules (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  check_in_cut_off time without time zone NOT NULL,
  pick_up_window_start time without time zone NOT NULL,
  pick_up_window_end time without time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  vaccination_required boolean NOT NULL DEFAULT false,
  health_declaration boolean NOT NULL DEFAULT false,
  no_aggressive_pets boolean NOT NULL DEFAULT false,
  liability_waiver boolean NOT NULL DEFAULT false,
  free_cancellation boolean NOT NULL,
  late_cancellation_fee boolean NOT NULL,
  CONSTRAINT boarding_rules_pkey PRIMARY KEY (id)
);
CREATE TABLE public.booking_rules (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  advance_booking_required boolean NOT NULL DEFAULT false,
  same_day_booking_allowed boolean NOT NULL DEFAULT false,
  minimum_stayy_requirements boolean NOT NULL DEFAULT false,
  maximum_stay_limits boolean NOT NULL DEFAULT false,
  deposit_required boolean NOT NULL DEFAULT false,
  full_payment_upfront boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT booking_rules_pkey PRIMARY KEY (id)
);
CREATE TABLE public.booking_types (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  appointment_only boolean NOT NULL DEFAULT false,
  walk_ins_accepted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT booking_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cancellations_reschedulings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  free_cancellation_period USER-DEFINED NOT NULL,
  late_cancellation_fee character varying NOT NULL,
  no_show_policy character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cancellations_reschedulings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cat_policy (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cat_policy_pkey PRIMARY KEY (id)
);
CREATE TABLE public.compliance_requirements (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  vaccination_records_required boolean NOT NULL,
  health_certificate_required boolean NOT NULL,
  parasite_prevention_proof boolean NOT NULL,
  microchip_identification boolean NOT NULL,
  breed_specific_restrictions_apply boolean NOT NULL,
  age_restrictions_apply boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT compliance_requirements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.contracting_parties (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  legal_entity_type USER-DEFINED NOT NULL,
  first_name character varying NOT NULL,
  middle_name character varying,
  last_name character varying NOT NULL,
  email character varying NOT NULL,
  phone character varying NOT NULL,
  phone_country_code character varying NOT NULL DEFAULT '+63'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contracting_parties_pkey PRIMARY KEY (id)
);
CREATE TABLE public.contracting_party_addresses (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  contracting_party_id bigint NOT NULL,
  country character varying NOT NULL,
  street_address character varying NOT NULL,
  address_line_2 character varying,
  city character varying NOT NULL,
  postal_code character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contracting_party_addresses_pkey PRIMARY KEY (id),
  CONSTRAINT contracting_party_addresses_contracting_party_id_fkey FOREIGN KEY (contracting_party_id) REFERENCES public.contracting_parties(id)
);
CREATE TABLE public.dog_policy (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  small boolean NOT NULL DEFAULT false,
  medium boolean NOT NULL DEFAULT false,
  large boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dog_policy_pkey PRIMARY KEY (id)
);
CREATE TABLE public.emergency_procedures (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  contact_num character varying NOT NULL,
  nearest_vet character varying NOT NULL,
  emergency_res_time character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT emergency_procedures_pkey PRIMARY KEY (id)
);
CREATE TABLE public.exotic_pet_policy (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  specifications character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exotic_pet_policy_pkey PRIMARY KEY (id)
);
CREATE TABLE public.favorites (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  property_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_property_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id)
);
CREATE TABLE public.fees_and_charges (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  service_fee numeric NOT NULL,
  taxes character varying NOT NULL DEFAULT 'Included'::character varying,
  no_show_fee numeric NOT NULL,
  late_pickup_fee numeric NOT NULL,
  cleaning_fee numeric NOT NULL,
  emergency_fee numeric NOT NULL,
  holiday_surcharge numeric NOT NULL,
  cancellation_fee numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fees_and_charges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.hotel_bookings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  property_id bigint NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  service_id bigint NOT NULL,
  checkin_date date NOT NULL,
  checkin_time time without time zone NOT NULL,
  checkout_date date NOT NULL,
  special_reqs character varying NOT NULL,
  total_price numeric NOT NULL,
  emergency_contact character varying NOT NULL,
  gcash_num character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  phone_num character varying NOT NULL,
  room_count smallint NOT NULL,
  pet_id bigint NOT NULL,
  CONSTRAINT hotel_bookings_pkey PRIMARY KEY (id),
  CONSTRAINT hotel_bookings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT hotel_bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
  CONSTRAINT hotel_bookings_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id)
);
CREATE TABLE public.isolation_sanitation_protocols (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  separate_isolation boolean NOT NULL DEFAULT false,
  quarantine_new_arrivals boolean NOT NULL DEFAULT false,
  daily_health boolean NOT NULL DEFAULT false,
  sanitation_between boolean NOT NULL DEFAULT false,
  disinfection_protocols boolean NOT NULL DEFAULT false,
  waste_disposal boolean NOT NULL DEFAULT false,
  hand_washing boolean NOT NULL DEFAULT false,
  ppe_availability boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT isolation_sanitation_protocols_pkey PRIMARY KEY (id)
);
CREATE TABLE public.legal_agreements (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  application_id bigint NOT NULL,
  terms_accepted boolean NOT NULL DEFAULT false,
  data_processing_accepted boolean NOT NULL DEFAULT false,
  final_agreement_accepted boolean NOT NULL DEFAULT false,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT legal_agreements_pkey PRIMARY KEY (id),
  CONSTRAINT legal_agreements_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id)
);
CREATE TABLE public.operating_hours (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  start_day USER-DEFINED NOT NULL,
  end_day USER-DEFINED NOT NULL,
  open_time time without time zone NOT NULL,
  close_time time without time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT operating_hours_pkey PRIMARY KEY (id)
);
CREATE TABLE public.other_bookings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  property_id bigint NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  service_id bigint NOT NULL,
  selected_date date NOT NULL,
  selected_time time without time zone NOT NULL,
  special_reqs character varying NOT NULL,
  phone_num character varying NOT NULL,
  emergency_contact character varying NOT NULL,
  gcash_num character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  pet_id bigint NOT NULL,
  CONSTRAINT other_bookings_pkey PRIMARY KEY (id),
  CONSTRAINT other_bookings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT other_bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
  CONSTRAINT other_bookings_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id)
);
CREATE TABLE public.payment_options (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  deposit_required boolean NOT NULL DEFAULT false,
  payment_methods ARRAY,
  refund_policy text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_options_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pet_size_pricing (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  application_id bigint NOT NULL,
  pet_size USER-DEFINED NOT NULL,
  price numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pet_size_pricing_pkey PRIMARY KEY (id),
  CONSTRAINT pet_size_pricing_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id)
);
CREATE TABLE public.pets (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  name character varying NOT NULL,
  age smallint NOT NULL,
  weight numeric NOT NULL,
  type USER-DEFINED NOT NULL,
  breed character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT pets_pkey PRIMARY KEY (id),
  CONSTRAINT pets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.pricing_notes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  prices_vary boolean NOT NULL,
  price_after_inspection boolean NOT NULL,
  procedure_assessment boolean NOT NULL,
  emergency_fees boolean NOT NULL,
  holiday_surcharges boolean NOT NULL,
  multipet_discounts boolean NOT NULL,
  deposit_required boolean NOT NULL,
  cancellation_fees boolean NOT NULL,
  additional_notes character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pricing_notes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'customer'::role_type,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false,
  phone text,
  address text,
  avatar_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.properties (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  application_id bigint NOT NULL,
  property_name character varying NOT NULL,
  contact_name character varying NOT NULL,
  phone character varying NOT NULL,
  email character varying NOT NULL,
  description character varying NOT NULL,
  pics character varying NOT NULL,
  dog_policy_id bigint NOT NULL,
  cat_policy_id bigint NOT NULL,
  exotic_pet_policy_id bigint NOT NULL,
  property_policy_id bigint NOT NULL,
  availability_policy_id bigint NOT NULL,
  boarding_rule_id bigint NOT NULL,
  booking_type_id bigint NOT NULL,
  cancellation_resched_id bigint NOT NULL,
  compliance_requirement_id bigint NOT NULL,
  vaccination_parasite_req_id bigint NOT NULL,
  emergency_proc_id bigint NOT NULL,
  vet_availability_id bigint NOT NULL,
  isolation_sanitation_protocol_id bigint NOT NULL,
  pricing_notes_id bigint NOT NULL,
  addons_extras_id bigint NOT NULL,
  vet_fees_id bigint NOT NULL,
  fees_charges_id bigint NOT NULL,
  payment_options_id bigint NOT NULL,
  services_id bigint NOT NULL,
  CONSTRAINT properties_pkey PRIMARY KEY (id),
  CONSTRAINT properties_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id),
  CONSTRAINT properties_dog_policy_id_fkey FOREIGN KEY (dog_policy_id) REFERENCES public.dog_policy(id),
  CONSTRAINT properties_cat_policy_id_fkey FOREIGN KEY (cat_policy_id) REFERENCES public.cat_policy(id),
  CONSTRAINT properties_exotic_pet_policy_id_fkey FOREIGN KEY (exotic_pet_policy_id) REFERENCES public.exotic_pet_policy(id),
  CONSTRAINT properties_property_policy_id_fkey FOREIGN KEY (property_policy_id) REFERENCES public.property_policies(id),
  CONSTRAINT properties_availability_policy_id_fkey FOREIGN KEY (availability_policy_id) REFERENCES public.availability_policies(id),
  CONSTRAINT properties_boarding_rule_id_fkey FOREIGN KEY (boarding_rule_id) REFERENCES public.boarding_rules(id),
  CONSTRAINT properties_booking_type_id_fkey FOREIGN KEY (booking_type_id) REFERENCES public.booking_types(id),
  CONSTRAINT properties_cancellation_resched_id_fkey FOREIGN KEY (cancellation_resched_id) REFERENCES public.cancellations_reschedulings(id),
  CONSTRAINT properties_compliance_requirement_id_fkey FOREIGN KEY (compliance_requirement_id) REFERENCES public.compliance_requirements(id),
  CONSTRAINT properties_vaccination_parasite_req_id_fkey FOREIGN KEY (vaccination_parasite_req_id) REFERENCES public.vaccination_parasite_requirements(id),
  CONSTRAINT properties_emergency_proc_id_fkey FOREIGN KEY (emergency_proc_id) REFERENCES public.emergency_procedures(id),
  CONSTRAINT properties_vet_availability_id_fkey FOREIGN KEY (vet_availability_id) REFERENCES public.vet_availability(id),
  CONSTRAINT properties_isolation_sanitation_protocol_id_fkey FOREIGN KEY (isolation_sanitation_protocol_id) REFERENCES public.isolation_sanitation_protocols(id),
  CONSTRAINT properties_pricing_notes_id_fkey FOREIGN KEY (pricing_notes_id) REFERENCES public.pricing_notes(id),
  CONSTRAINT properties_addons_extras_id_fkey FOREIGN KEY (addons_extras_id) REFERENCES public.addons_extras(id),
  CONSTRAINT properties_vet_fees_id_fkey FOREIGN KEY (vet_fees_id) REFERENCES public.vet_fees(id),
  CONSTRAINT properties_fees_charges_id_fkey FOREIGN KEY (fees_charges_id) REFERENCES public.fees_and_charges(id),
  CONSTRAINT properties_payment_options_id_fkey FOREIGN KEY (payment_options_id) REFERENCES public.payment_options(id),
  CONSTRAINT properties_services_id_fkey FOREIGN KEY (services_id) REFERENCES public.services(id)
);
CREATE TABLE public.property_amenities (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  amenity_id bigint NOT NULL,
  property_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT property_amenities_pkey PRIMARY KEY (id),
  CONSTRAINT property_amenities_amenity_id_fkey FOREIGN KEY (amenity_id) REFERENCES public.amenities(id),
  CONSTRAINT property_amenities_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id)
);
CREATE TABLE public.property_base_services (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  application_id bigint NOT NULL,
  service_name character varying NOT NULL,
  price_type USER-DEFINED NOT NULL,
  price numeric NOT NULL,
  duration character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT property_base_services_pkey PRIMARY KEY (id),
  CONSTRAINT property_base_services_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id)
);
CREATE TABLE public.property_operating_hours (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  application_id bigint NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time without time zone,
  close_time time without time zone,
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT property_operating_hours_pkey PRIMARY KEY (id),
  CONSTRAINT property_operating_hours_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id)
);
CREATE TABLE public.property_policies (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  breed_restrictions USER-DEFINED NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  agg_pet_policy USER-DEFINED NOT NULL,
  unvac_pet_policy USER-DEFINED NOT NULL,
  CONSTRAINT property_policies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reviews (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  property_id bigint NOT NULL,
  review character varying NOT NULL,
  rating smallint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_property_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.services (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  name character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  price numeric NOT NULL,
  description character varying NOT NULL,
  available boolean NOT NULL,
  price_type USER-DEFINED NOT NULL,
  property_id bigint NOT NULL,
  duration_hours numeric NOT NULL,
  small_size numeric NOT NULL,
  medium_size numeric NOT NULL,
  large_size numeric NOT NULL,
  giant_size numeric NOT NULL,
  cat_pricing numeric NOT NULL,
  exotic_pet_pricing numeric NOT NULL,
  category USER-DEFINED NOT NULL,
  metadata json NOT NULL,
  CONSTRAINT services_pkey PRIMARY KEY (id),
  CONSTRAINT services_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id)
);
CREATE TABLE public.vaccination_parasite_requirements (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  dhpp boolean NOT NULL DEFAULT false,
  rabies boolean NOT NULL DEFAULT false,
  bordetella boolean NOT NULL DEFAULT false,
  leptospirosis boolean NOT NULL DEFAULT false,
  heartworm boolean NOT NULL DEFAULT false,
  flea_tick boolean NOT NULL DEFAULT false,
  internal_parasite boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vaccination_parasite_requirements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vet_availability (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  on_site_available boolean NOT NULL DEFAULT false,
  24/7_on_call boolean NOT NULL DEFAULT false,
  emergency_vet_clinic boolean NOT NULL DEFAULT false,
  telemed_consult boolean NOT NULL DEFAULT false,
  mobile_vet boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vet_availability_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vet_fees (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  initial_consult numeric NOT NULL,
  followup_visit numeric NOT NULL,
  rabies_vaccine numeric NOT NULL,
  dhpp_vaccine numeric NOT NULL,
  heartworm_test numeric NOT NULL,
  flea_treatment numeric NOT NULL,
  emergency_visit numeric NOT NULL,
  minor_surgery numeric NOT NULL,
  dental_cleaning numeric NOT NULL,
  x-ray numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vet_fees_pkey PRIMARY KEY (id)
);