import { cancelBookingTool } from "./cancelBooking";
import { confirmMatchTool } from "./confirmMatch";
import { createBookingTool } from "./createBooking";
import { getCancellationPolicyTool } from "./getCancellationPolicy";
import { getProviderRevenueTool } from "./getProviderRevenue";
import { getUserBookingsTool } from "./getUserBookings";
import { predictNextBookingTool } from "./predictNextBooking";
import { searchServicesTool } from "./discovery/searchServices"
import { getReviewCountTool } from "./reviews/getReviewCount";
import { getPetProfileTool } from "./pets/getPetProfile";
import { getPetsTool } from "./pets/getPets";
import { getPetServiceHistoryTool } from "./pets/getPetServiceHistory";
import { readImageTextTool } from "./ocr/readImageText";

export const defaultTools = [
  searchServicesTool,
  confirmMatchTool,
  createBookingTool,
  getUserBookingsTool,
  cancelBookingTool,
  getCancellationPolicyTool,
  predictNextBookingTool,
  getProviderRevenueTool,
  getReviewCountTool,
  readImageTextTool,
  getPetsTool,
  getPetProfileTool,
  getPetServiceHistoryTool,
];
