import { cancelBookingTool } from "./cancelBooking";
import { createBookingTool } from "./createBooking";
import { getProviderRevenueTool } from "./getProviderRevenue";
import { getUserBookingsTool } from "./getUserBookings";
import { searchServicesTool } from "./discovery/searchServices"
import { getReviewCountTool } from "./reviews/getReviewCount";
import { getPetProfileTool } from "./pets/getPetProfile";
import { getPetsTool } from "./pets/getPets";
import { getPetServiceHistoryTool } from "./pets/getPetServiceHistory";
import { predictNextBookingTool } from "./pets/predictNextBooking";
import { readImageTextTool } from "./ocr/readImageText";
import { checkAvailabilityTool } from "./checkAvailability";
import { getCancellationPolicyTool } from "./getCancellationPolicy";
import { getBookingSummaryTool } from "./getBookingSummary";

export const defaultTools = [
  searchServicesTool,
  createBookingTool,
  getUserBookingsTool,
  cancelBookingTool,
  checkAvailabilityTool,
  getCancellationPolicyTool,
  getBookingSummaryTool,
  getProviderRevenueTool,
  getReviewCountTool,
  readImageTextTool,
  getPetsTool,
  getPetProfileTool,
  getPetServiceHistoryTool,
  predictNextBookingTool,
];
