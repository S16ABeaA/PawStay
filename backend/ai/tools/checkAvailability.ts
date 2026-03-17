import { supabaseAdmin } from "../../config/supabaseAdmin";
import { TOOL_INPUT_SCHEMA_TEXT } from "../schemas";
import { ToolContext, ToolDefinition } from "../types";

export interface CheckAvailabilityArgs {
  property_id: string;
  date: string;
  time_slots?: string[];
  service_id?: string;
}

interface PropertyService {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
}

interface AvailabilitySlot {
  time_slot: string;
  available: boolean;
  capacity_remaining?: number;
}

interface CheckAvailabilityResult {
  property_id: string;
  property_name?: string;
  services?: PropertyService[];
  date: string;
  available_slots: AvailabilitySlot[];
  total_capacity: number;
  booked_count: number;
  message: string;
}

export const checkAvailabilityTool: ToolDefinition<CheckAvailabilityArgs, CheckAvailabilityResult> = {
  name: "check_availability",
  description: "Check availability for a specific date and optional time slots at a property",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.check_availability,
  run: async (args, context?: ToolContext) => {
    try {
      // Fetch property name and services with capacity
      let propertyName: string | undefined = undefined;
      let services: PropertyService[] | undefined = undefined;
      let totalCapacity = 0;
      
      const { data: propertyData, error: propError } = await supabaseAdmin
        .from("properties")
        .select(
          `
          name,
          property_services(
            id,
            name,
            category,
            price,
            description,
            capacity,
            is_active
          )
          `
        )
        .eq("id", args.property_id)
        .single();
      
      if (propError) {
        throw new Error(`Failed to fetch property: ${propError.message}`);
      }

      if (propertyData) {
        propertyName = propertyData.name;
        
        // Filter active services and map to the response format
        const activeServices = (propertyData.property_services || [])
          .filter((s: any) => s.is_active)
          .map((s: any) => ({
            id: s.id,
            name: s.name,
            category: s.category,
            price: parseFloat(s.price),
            description: s.description,
          }));
        
        if (activeServices.length > 0) {
          services = activeServices;
        }

        // Calculate total capacity from all active services
        totalCapacity = (propertyData.property_services || [])
          .filter((s: any) => s.is_active)
          .reduce((sum: number, s: any) => sum + (s.capacity || 0), 0);
      }

      // Count bookings for the specified date
      const { data: bookings, error: bookingError } = await supabaseAdmin
        .from("bookings")
        .select("id, time_slot")
        .eq("property_id", args.property_id)
        .eq("checkin", args.date)
        .eq("is_deleted", false)
        .in("status", ["pending", "confirmed", "checked_in"]);

      if (bookingError) {
        throw new Error(`Failed to fetch bookings: ${bookingError.message}`);
      }

      const bookedCount = bookings?.length || 0;
      const availableSlots: AvailabilitySlot[] = [];

      // If time_slots are specified, check availability for each slot
      if (args.time_slots && args.time_slots.length > 0) {
        const bookedSlots = new Set((bookings || []).map((b: any) => b.time_slot));
        
        args.time_slots.forEach((slot) => {
          const isAvailable = !bookedSlots.has(slot);
          availableSlots.push({
            time_slot: slot,
            available: isAvailable,
            capacity_remaining: isAvailable ? totalCapacity - bookedCount : 0,
          });
        });
      }

      const remainingCapacity = Math.max(0, totalCapacity - bookedCount);

      return {
        property_id: args.property_id,
        property_name: propertyName,
        ...(services && { services }),
        date: args.date,
        available_slots: availableSlots,
        total_capacity: totalCapacity,
        booked_count: bookedCount,
        message: `${propertyName || "Property"} has ${remainingCapacity} slots available out of ${totalCapacity} total capacity on ${args.date}`,
      };
    } catch (error: any) {
      return {
        property_id: args.property_id,
        date: args.date,
        available_slots: [],
        total_capacity: 0,
        booked_count: 0,
        message: error?.message ?? "Unable to check availability",
      };
    }
  },
};
