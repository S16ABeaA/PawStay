import { cancelBookingTool } from "./cancelBooking";
import { createBookingTool } from "./createBooking";
import { getProviderRevenueTool } from "./getProviderRevenue";
import { getUserBookingsTool } from "./getUserBookings";
import { searchServicesTool } from "./searchServices";

export const defaultTools = [
  searchServicesTool,
  createBookingTool,
  getUserBookingsTool,
  cancelBookingTool,
  getProviderRevenueTool,
];
