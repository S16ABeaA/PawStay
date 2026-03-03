import { PropertyTypeId } from "../static/propertyTypeIDs";

import { PropertyInitalData } from "../types/initial_types/propertyInitialData";

import EstablishmentInfo01 from "./EstablishmentInfoSections/EstablishmentInfo01";
import EstablishmentInfo02 from "./EstablishmentInfoSections/EstablishmentInfo02";

interface Props {
  formData: PropertyInitalData;
  updateForm: (values: Partial<PropertyInitalData>) => void;
  selectedTypes: PropertyTypeId[];
  updateSelectedTypes: (type) => void;
  updateAddress: (lat, lng, data, address) => void;
  establishmentStep: number;
}

const EstablishmentInfo = ({formData, updateForm, selectedTypes, updateSelectedTypes, updateAddress, establishmentStep}: Props) => {

  if (establishmentStep === 1) {
    return (
      <EstablishmentInfo01 
        formData={formData} 
        onChange={updateForm} 
        selectedTypes={selectedTypes} 
        updateSelectedTypes={updateSelectedTypes}                      
      />
    )
  } 
  
  if (establishmentStep === 2) {
    return (
      <EstablishmentInfo02
        formData={formData}
        onChange={updateForm}
        updateAddress={updateAddress}
      />
    )
  }
}

export default EstablishmentInfo;