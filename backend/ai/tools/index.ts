import { cancelBookingTool } from "./cancelBooking";
import { createBookingTool } from "./createBooking";
import { getProviderRevenueTool } from "./getProviderRevenue";
import { getUserBookingsTool } from "./getUserBookings";
import { analyzeBookingPatternsTool } from "./bookings/analyzeBookingPatterns";
import { getAccountDetailsTool } from "./account/getAccountDetails";
import { searchServicesTool } from "./discovery/searchServices"
import { getPropertyServicesTool } from "./discovery/getPropertyServices";
import { getReviewCountTool } from "./reviews/getReviewCount";
import { getReviewSummaryTool } from "./reviews/getReviewSummary";
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
  getPropertyServicesTool,
  createBookingTool,
  getUserBookingsTool,
  analyzeBookingPatternsTool,
  getAccountDetailsTool,
  cancelBookingTool,
  checkAvailabilityTool,
  getCancellationPolicyTool,
  getBookingSummaryTool,
  getProviderRevenueTool,
  getReviewCountTool,
  getReviewSummaryTool,
  readImageTextTool,
  getPetsTool,
  getPetProfileTool,
  getPetServiceHistoryTool,
  predictNextBookingTool,
];
