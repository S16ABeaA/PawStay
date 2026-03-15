import { cancelBookingTool } from "./cancelBooking";
import { createBookingTool } from "./createBooking";
import { getProviderRevenueTool } from "./getProviderRevenue";
import { getUserBookingsTool } from "./getUserBookings";
import { searchServicesTool } from "./searchServices";
import { getReviewCountTool } from "./getReviewCount";

export const defaultTools = [
  searchServicesTool,
  createBookingTool,
  getUserBookingsTool,
  cancelBookingTool,
  getProviderRevenueTool,
  getReviewCountTool,
];
