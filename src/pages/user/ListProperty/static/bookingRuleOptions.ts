import { PropertyTypeId } from "./propertyTypeIDs";

export const BOOKING_RULE_OPTIONS: Array<{ name: string; description: string; types?: PropertyTypeId[] }> = [
  { name: "Advance booking required", description: "Set minimum notice period" },
  { name: "Same-day booking allowed", description: "Accept last-minute bookings" },
  { name: "Minimum stay requirements", description: "Set minimum nights/days", types: ["hotel"] },
  { name: "Maximum stay limits", description: "Set maximum stay duration", types: ["hotel"] },
  { name: "Deposit required", description: "Require payment to secure booking" },
  { name: "Full payment upfront", description: "Require full payment at booking" },
];