import { LucideIcon, Building2, Scissors, Stethoscope } from "lucide-react";
import { PropertyTypeId } from "./propertyTypeIDs";

export const PROPERTY_TYPES: Array<{
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