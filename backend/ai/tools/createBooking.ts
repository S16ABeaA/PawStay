import { backendApiClient } from "../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../schemas";
import { ToolContext, ToolDefinition } from "../types";

export interface CreateBookingArgs {
  user_id: string;
  service_id: string;
  date: string;
  time: string;
}

interface CreateBookingResult {
  booking: {
    id: string | null;
    status: string | null;
    payment_status: string | null;
    total_price: number | null;
    checkin: string | null;
  };
  message: string;
}

export const createBookingTool: ToolDefinition<CreateBookingArgs, CreateBookingResult> = {
  name: "create_booking",
  description: "Create a booking for a user and service",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.create_booking,
  run: async (args, context?: ToolContext) => {
    const response = await backendApiClient.request<any>("/api/bookings", {
      method: "POST",
      body: args,
      authToken: context?.authToken,
    });

    const booking = response?.booking ?? response?.data ?? response;
    return {
      booking: {
        id: booking?.id ?? null,
        status: booking?.status ?? null,
        payment_status: booking?.payment_status ?? null,
        total_price: typeof booking?.total_price === "number" ? booking.total_price : (Number(booking?.total_price) || null),
        checkin: booking?.checkin ?? null,
      },
      message: response?.message ?? "Booking request submitted.",
    };
  },
};
