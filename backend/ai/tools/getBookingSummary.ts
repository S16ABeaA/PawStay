import { supabaseAdmin } from "../../config/supabaseAdmin";
import { TOOL_INPUT_SCHEMA_TEXT } from "../schemas";
import { ToolContext, ToolDefinition } from "../types";

export interface GetBookingSummaryArgs {
  booking_id?: string;
}

interface BookingSummary {
  id: string;
  booking_reference?: string;
  property_name?: string;
  service_name?: string;
  checkin: string;
  checkout?: string;
  time_slot?: string;
  pet_name?: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  subtotal: number;
  service_fee: number;
  total_price: number;
  payment_method?: string;
  status: string;
  payment_status: string;
  special_requirements?: string;
  notes?: string;
}

interface GetBookingSummaryResult {
  booking: BookingSummary | null;
  message: string;
}

export const getBookingSummaryTool: ToolDefinition<GetBookingSummaryArgs, GetBookingSummaryResult> = {
  name: "get_booking_summary",
  description: "Retrieve a comprehensive summary of a recently made booking including status, costs, and pet details",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_booking_summary,
  run: async (args, context?: ToolContext) => {
    try {
      const userId = context?.userId;

      // If booking_id is provided, retrieve that specific booking
      if (args.booking_id) {
        if (!userId) {
          return {
            booking: null,
            message: "User authentication is required to retrieve booking details.",
          };
        }

        const { data: bookings, error } = await supabaseAdmin
          .from("bookings")
          .select(
            `
            id,
            checkin,
            checkout,
            time_slot,
            pet_name,
            owner_name,
            owner_email,
            owner_phone,
            subtotal,
            service_fee,
            total_price,
            payment_method,
            status,
            payment_status,
            special_requirements,
            notes,
            property_id,
            service_id,
            properties(name),
            property_services(name)
            `
          )
          .eq("id", args.booking_id)
          .eq("user_id", userId)
          .eq("is_deleted", false)
          .limit(1);

        if (error || !bookings || bookings.length === 0) {
          return {
            booking: null,
            message: `Booking not found or has been deleted`,
          };
        }

        const booking = bookings[0];
        const summary: BookingSummary = {
          id: booking.id,
          property_name: (booking.properties as any)?.name ?? undefined,
          service_name: (booking.property_services as any)?.name ?? undefined,
          checkin: booking.checkin,
          checkout: booking.checkout ?? undefined,
          time_slot: booking.time_slot ?? undefined,
          pet_name: booking.pet_name ?? undefined,
          owner_name: booking.owner_name ?? undefined,
          owner_email: booking.owner_email ?? undefined,
          owner_phone: booking.owner_phone ?? undefined,
          subtotal: Number(booking.subtotal) || 0,
          service_fee: Number(booking.service_fee) || 0,
          total_price: Number(booking.total_price) || 0,
          payment_method: booking.payment_method ?? undefined,
          status: booking.status,
          payment_status: booking.payment_status,
          special_requirements: booking.special_requirements ?? undefined,
          notes: booking.notes ?? undefined,
        };

        return {
          booking: summary,
          message: `Booking ${booking.id} summary retrieved successfully`,
        };
      }

      // If no booking_id provided, need userId to get most recent booking
      if (!userId) {
        return {
          booking: null,
          message: "User authentication required to retrieve most recent booking. Please provide a booking_id or ensure you are logged in.",
        };
      }

      // Get most recent booking for this user
      const { data: bookings, error } = await supabaseAdmin
        .from("bookings")
        .select(
          `
          id,
          checkin,
          checkout,
          time_slot,
          pet_name,
          owner_name,
          owner_email,
          owner_phone,
          subtotal,
          service_fee,
          total_price,
          payment_method,
          status,
          payment_status,
          special_requirements,
          notes,
          property_id,
          service_id,
          properties(name),
          property_services(name)
          `
        )
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !bookings || bookings.length === 0) {
        return {
          booking: null,
          message: `No bookings found for this user`,
        };
      }

      const booking = bookings[0];
      const summary: BookingSummary = {
        id: booking.id,
        property_name: (booking.properties as any)?.name ?? undefined,
        service_name: (booking.property_services as any)?.name ?? undefined,
        checkin: booking.checkin,
        checkout: booking.checkout ?? undefined,
        time_slot: booking.time_slot ?? undefined,
        pet_name: booking.pet_name ?? undefined,
        owner_name: booking.owner_name ?? undefined,
        owner_email: booking.owner_email ?? undefined,
        owner_phone: booking.owner_phone ?? undefined,
        subtotal: Number(booking.subtotal) || 0,
        service_fee: Number(booking.service_fee) || 0,
        total_price: Number(booking.total_price) || 0,
        payment_method: booking.payment_method ?? undefined,
        status: booking.status,
        payment_status: booking.payment_status,
        special_requirements: booking.special_requirements ?? undefined,
        notes: booking.notes ?? undefined,
      };

      return {
        booking: summary,
        message: `Most recent booking summary retrieved successfully`,
      };
    } catch (error: any) {
      return {
        booking: null,
        message: error?.message ?? "Unable to retrieve booking summary",
      };
    }
  },
};
