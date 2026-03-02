import { PropertyTypeId } from "./propertyTypeIDs";

export const ADD_ON_OPTIONS: Array<{ name: string; types?: PropertyTypeId[] }> = [
  { name: "Flea & tick treatment", types: ["grooming", "hotel"] },
  { name: "De-shedding", types: ["grooming", "hotel"] },
  { name: "Nail grinding", types: ["grooming"] },
  { name: "Teeth brushing", types: ["grooming"] },
  { name: "Medication administration", types: ["hotel"] },
  { name: "Extra playtime", types: ["hotel"] },
  { name: "Special diet handling", types: ["hotel"] },
];