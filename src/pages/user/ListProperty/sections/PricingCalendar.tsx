import { PropertyTypeId } from "../static/propertyTypeIDs";

import { PropertyInitalData } from "../types/initial_types/propertyInitialData";

import PricingCalendar01 from "./PricingCalendarSections/PricingCalendar01";
import PricingCalendar02 from "./PricingCalendarSections/PricingCalendar02";
import PricingCalendar03 from "./PricingCalendarSections/PricingCalendar03";
import PricingCalendar04 from "./PricingCalendarSections/PricingCalendar04";
import PricingCalendar05 from "./PricingCalendarSections/PricingCalendar05";
import PricingCalendar06 from "./PricingCalendarSections/PricingCalendar06";
import PricingCalendar07 from "./PricingCalendarSections/PricingCalendar07";

interface Props {
  formData: PropertyInitalData
  updateForm: (values: Partial<PropertyInitalData>) => void;
  selectedTypes: PropertyTypeId[];
  hasBoarding: boolean;
  hasGrooming: boolean;
  hasVet: boolean;
  pricingCalendarStep: Number;
}

const PricingCalendar = ({formData, updateForm, selectedTypes, hasBoarding, hasGrooming, hasVet, pricingCalendarStep}: Props) => {
  if (pricingCalendarStep === 1) {
    return (
      <PricingCalendar01 
        formData={formData}
        onChange={updateForm}
      />
    )
  }

  if (pricingCalendarStep === 2 && (hasBoarding || hasGrooming)) {
    return (
      <PricingCalendar02 
        formData={formData}
        onChange={updateForm}
        selectedTypes={selectedTypes}
      />
    )
  }

  if (pricingCalendarStep === 3 && hasVet) {
    return (
      <PricingCalendar03 
        formData={formData}
        onChange={updateForm}
      />
    )
  }

  if (pricingCalendarStep === 4 && hasBoarding) {
    return (      
      <PricingCalendar04
        formData={formData}
        onChange={updateForm}
      />
    )
  }

  if (pricingCalendarStep === 5) {
    return (      
      <PricingCalendar05 
        formData={formData}
        onChange={updateForm}
        hasBoarding={hasBoarding}
        hasGrooming={hasGrooming}
        hasVet={hasVet}
      />
    )
  }

  if (pricingCalendarStep === 6) {
    return (      
      <PricingCalendar06
        formData={formData}
        onChange={updateForm}
      />
    )
  }

  if (pricingCalendarStep === 7) {
    return (      
      <PricingCalendar07
        formData={formData}
        onChange={updateForm}
        selectedTypes={selectedTypes}
      />
    )
  }
}

export default PricingCalendar;