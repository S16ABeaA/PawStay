import { PropertyAvailabilityInitial } from "./propertyAvailabilityInitial"
import { PropertyBasicInfoInitial } from "./propertyBasicInfoInitial"
import { PropertyBookingInitial } from "./propertyBookingInitial"
import { PropertyCapacityInitial } from "./propertyCapacityInitial"
import { PropertyLegalInitial } from "./propertyLegalInitial"
import { PropertyOperatingHoursInitial } from "./propertyOperatingHoursInitial"
import { PropertyPetTypesInitial } from "./propertyPetTypesInitial"
import { PropertyPoliciesInitial } from "./propertyPoliciesInitial"
import { PropertyPricingInitial } from "./propertyPricingInitial"
import { PropertySafetyInitial } from "./propertySafetyInitial"

export type PropertyInitalData = 
  PropertyBasicInfoInitial &
  PropertyPetTypesInitial &
  PropertyPoliciesInitial &
  PropertyCapacityInitial &
  PropertyOperatingHoursInitial &
  PropertyAvailabilityInitial &
  PropertyBookingInitial &
  PropertySafetyInitial &
  PropertyPricingInitial &
  PropertyLegalInitial

export type {
  PropertyBasicInfoInitial,
  PropertyPetTypesInitial,
  PropertyPoliciesInitial,
  PropertyCapacityInitial,
  PropertyOperatingHoursInitial,
  PropertyAvailabilityInitial,
  PropertyBookingInitial,
  PropertySafetyInitial,
  PropertyPricingInitial,
  PropertyLegalInitial
}