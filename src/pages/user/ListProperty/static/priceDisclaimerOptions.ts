import { PropertyTypeId } from "./propertyTypeIDs";

export const PRICING_DISCLAIMER_OPTIONS: Array<{ name: string; types?: PropertyTypeId[] }> = [
  { name: "Prices may vary based on pet condition" },
  { name: "Final price confirmed after inspection" },
  { name: "Vet procedures require assessment first", types: ["veterinary"] },
  { name: "Emergency fees apply for after-hours service", types: ["veterinary", "grooming"] },
  { name: "Holiday surcharges apply during peak seasons" },
  { name: "Multi-pet discounts available" },
  { name: "Deposit required to secure booking" },
  { name: "Cancellation fees apply as per policy" },
];
