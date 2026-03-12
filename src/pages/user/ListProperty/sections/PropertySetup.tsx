import { PropertyTypeId } from "../static/propertyTypeIDs";

import { PropertyInitalData } from "../types/initial_types/propertyInitialData";

import PropertySetup01 from "./PropertySetupSections/PropertySetup01";
import PropertySetup02 from "./PropertySetupSections/PropertySetup02";
import PropertySetup03 from "./PropertySetupSections/PropertySetup03";
import PropertySetup04 from "./PropertySetupSections/PropertySetup04";
import PropertySetup05 from "./PropertySetupSections/PropertySetup05";

interface Props {
  formData: PropertyInitalData
  updateForm: (values: Partial<PropertyInitalData>) => void;
  selectedTypes: PropertyTypeId[];
  hasBoarding: boolean;
  hasGrooming: boolean;
  hasVet: boolean;
  propertySetupStep: Number;
}

const PropertySetup = ({formData, updateForm, selectedTypes, hasBoarding, hasGrooming, hasVet, propertySetupStep}: Props) => {
  if (propertySetupStep === 1) {
    return (
      <PropertySetup01
        formData={formData}
        onChange={updateForm}
        hasBoarding={hasBoarding}
        hasGrooming={hasGrooming}
      />
    )
  }

  if (propertySetupStep === 2) {
    return (
      <PropertySetup02 
        formData={formData}
        onChange={updateForm}
        selectedTypes={selectedTypes}
      />
    )
  }

  if (propertySetupStep === 3) {
    return (
      <PropertySetup03 
        formData={formData}
        onChange={updateForm}
        hasBoarding={hasBoarding}
        hasGrooming={hasGrooming}
        hasVet={hasVet}
      />
    )
  }

  if (propertySetupStep === 4) {
    return (
      <PropertySetup04
        formData={formData}
        onChange={updateForm}
        selectedTypes={selectedTypes}
      />
    )
  }

  if (propertySetupStep === 5) {
    return (
      <PropertySetup05
        formData={formData}
        onChange={updateForm}
        hasBoarding={hasBoarding}
        hasGrooming={hasGrooming}
        hasVet={hasVet}
      />
    )
  }
}

export default PropertySetup;