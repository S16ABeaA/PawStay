import { backendApiClient } from "../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../schemas";
import { ToolContext, ToolDefinition } from "../types";

export interface GetUserBookingsArgs {
  user_id: string;
}

interface UserBookingItem {
  id: string;
  property: string | null;
  service: string | null;
  checkin: string | null;
  status: string | null;
  payment_status: string | null;
  total_price: number | null;
}

interface GetUserBookingsResult {
  total: number;
  bookings: UserBookingItem[];
}

export const getUserBookingsTool: ToolDefinition<GetUserBookingsArgs, GetUserBookingsResult> = {
  name: "get_user_bookings",
  description: "Get bookings for a specific user",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_user_bookings,
  run: async (_args, context?: ToolContext) => {
    const response = await backendApiClient.request<any>("/api/bookings/mine", {
      method: "GET",
      authToken: context?.authToken,
    });

    const rows = Array.isArray(response?.bookings)
      ? response.bookings
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

    return {
      total: rows.length,
      bookings: rows.slice(0, 5).map((row: any) => ({
        id: String(row?.id ?? ""),
        property: row?.property_name ?? row?.property_id ?? null,
        service: row?.service_type ?? row?.service_name ?? null,
        checkin: row?.checkin ?? null,
        status: row?.status ?? null,
        payment_status: row?.payment_status ?? null,
        total_price: typeof row?.total_price === "number" ? row.total_price : (Number(row?.total_price) || null),
      })),
    };
  },
};
