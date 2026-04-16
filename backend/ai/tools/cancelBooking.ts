import { backendApiClient } from "../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../schemas";
import { ToolContext, ToolDefinition } from "../types";

export interface CancelBookingArgs {
  booking_id: string;
}

interface CancelBookingResult {
  booking: {
    id: string | null;
    status: string | null;
    payment_status: string | null;
  };
  message: string;
}

export const cancelBookingTool: ToolDefinition<CancelBookingArgs, CancelBookingResult> = {
  name: "cancel_booking",
  description: "Cancel an existing booking",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.cancel_booking,
  run: async (args, context?: ToolContext) => {
    let response: any;

    try {
      response = await backendApiClient.request<any>(`/api/bookings/${args.booking_id}/cancel`, {
        method: "PATCH",
        authToken: context?.authToken,
      });
    } catch (error: any) {
      const message = String(error?.message || "");
      const routeMissing = /\b404\b|\b405\b|Cannot\s+PATCH|not\s+found|method\s+not\s+allowed/i.test(message);

      if (!routeMissing) {
        throw error;
      }

      response = await backendApiClient.request<any>(`/api/bookings/${args.booking_id}/status`, {
        method: "POST",
        authToken: context?.authToken,
        body: { status: "cancelled" },
      });
    }

    const booking = response?.booking ?? response?.data ?? response;
    return {
      booking: {
        id: booking?.id ?? args.booking_id ?? null,
        status: booking?.status ?? "cancelled",
        payment_status: booking?.payment_status ?? null,
      },
      message: response?.message ?? "Booking cancellation processed.",
    };
  },
};
