import { PropertyAvailability } from "./propertyAvailability";
import { PropertyBasicInfo } from "./propertyBasicInfo";
import { PropertyBooking } from "./propertyBooking";
import { PropertyCapacity } from "./propertyCapacity";
import { PropertyLegal } from "./propertyLegal";
import { PropertyOperatingHours } from "./propertyOperatingHours";
import { PropertyPetTypes } from "./propertyPetTypes";
import { PropertyPolicies } from "./propertyPolicies";
import { PropertyPricing } from "./propertyPricing";
import { PropertySafety } from "./propertySafety";

export type PropertySubmissionData = 
  PropertyBasicInfo &
  PropertyPetTypes &
  PropertyPolicies &
  PropertyCapacity &
  PropertyOperatingHours &
  PropertyAvailability &
  PropertyBooking &
  PropertySafety &
  PropertyPricing &
  PropertyLegal

export type {
  PropertyBasicInfo,
  PropertyPetTypes,
  PropertyPolicies,
  PropertyCapacity,
  PropertyOperatingHours,
  PropertyAvailability,
  PropertyBooking,
  PropertySafety,
  PropertyPricing,
  PropertyLegal
}