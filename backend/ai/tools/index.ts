import { cancelBookingTool } from "./cancelBooking";
import { createBookingTool } from "./createBooking";
import { getProviderRevenueTool } from "./getProviderRevenue";
import { getUserBookingsTool } from "./getUserBookings";
import { searchServicesTool } from "./discovery/searchServices"
import { getReviewCountTool } from "./reviews/getReviewCount";
import { getPetProfileTool } from "./pets/getPetProfile";
import { getPetsTool } from "./pets/getPets";
import { getPetServiceHistoryTool } from "./pets/getPetServiceHistory";
import { readImageTextTool } from "./ocr/readImageText";

export const defaultTools = [
  searchServicesTool,
  createBookingTool,
  getUserBookingsTool,
  cancelBookingTool,
  getProviderRevenueTool,
  getReviewCountTool,
  readImageTextTool,
  getPetsTool,
  getPetProfileTool,
  getPetServiceHistoryTool,
];
