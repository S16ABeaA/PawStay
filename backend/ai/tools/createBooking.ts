import { backendApiClient } from "../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../schemas";
import { ToolContext, ToolDefinition } from "../types";

export interface CreateBookingArgs {
  property_id: string;
  checkin: string;
  time_slot?: string;
  service_id?: string;
  service_name?: string;
  service_type?: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  pet_name?: string;
  pet_type?: string;
  pet_breed?: string;
  special_requirements?: string;
  payment_method?: string;
  confirmed?: boolean;
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
    if (args.confirmed !== true) {
      return {
        booking: {
          id: null,
          status: null,
          payment_status: null,
          total_price: null,
          checkin: args.checkin ?? null,
        },
        message: "Please confirm first before I create this reservation.",
      };
    }

    const response = await backendApiClient.request<any>("/api/bookings", {
      method: "POST",
      body: {
        property_id: args.property_id,
        checkin: args.checkin,
        time_slot: args.time_slot ?? null,
        service_id: args.service_id ?? null,
        service_name: args.service_name ?? null,
        service_type: args.service_type ?? null,
        owner_name: args.owner_name ?? null,
        owner_email: args.owner_email ?? null,
        owner_phone: args.owner_phone ?? null,
        pet_name: args.pet_name ?? null,
        pet_type: args.pet_type ?? null,
        pet_breed: args.pet_breed ?? null,
        special_requirements: args.special_requirements ?? null,
        payment_method: args.payment_method ?? "cash",
      },
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
