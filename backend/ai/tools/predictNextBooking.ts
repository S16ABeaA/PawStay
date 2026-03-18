import { backendApiClient } from "../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../schemas";
import { ToolContext, ToolDefinition } from "../types";

export interface PredictNextBookingArgs {
  pet_id?: string;
  service_type?: string;
}

interface PredictNextBookingResult {
  predicted_date: string | null;
  service_type: string;
  confidence: number;
  basis: string;
}

const normalizeServiceType = (value?: string): string => {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return "grooming";
  if (["hotel", "boarding", "pet hotel"].includes(v)) return "boarding";
  if (["vet", "veterinary", "clinic"].includes(v)) return "veterinary";
  if (["groom", "grooming"].includes(v)) return "grooming";
  if (["day care", "daycare"].includes(v)) return "daycare";
  return v;
};

const defaultCadenceDays: Record<string, number> = {
  grooming: 30,
  veterinary: 180,
  boarding: 60,
  daycare: 14,
  transport: 30,
};

const daysBetween = (a: string, b: string): number => {
  const aMs = new Date(a).getTime();
  const bMs = new Date(b).getTime();
  return Math.max(1, Math.round((bMs - aMs) / (1000 * 60 * 60 * 24)));
};

export const predictNextBookingTool: ToolDefinition<
  PredictNextBookingArgs,
  PredictNextBookingResult
> = {
  name: "predict_next_booking",
  description:
    "Predict likely next booking date from booking history and common service cadence",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.predict_next_booking,
  run: async (args, context?: ToolContext) => {
    if (!context?.authToken) {
      throw new Error("Please log in to predict your next booking.");
    }

    const selectedServiceType = normalizeServiceType(args.service_type);

    const response = await backendApiClient.request<any>("/api/bookings/mine", {
      method: "GET",
      authToken: context.authToken,
    });

    const rows = Array.isArray(response?.bookings)
      ? response.bookings
      : Array.isArray(response)
        ? response
        : [];

    const filtered = rows
      .filter((row: any) => {
        if (args.pet_id && String(row?.pet_id || "") !== String(args.pet_id)) return false;
        const rowType = normalizeServiceType(row?.service_type || row?.service_name);
        return rowType === selectedServiceType;
      })
      .filter((row: any) => /^\d{4}-\d{2}-\d{2}/.test(String(row?.checkin || "")))
      .sort((a: any, b: any) => String(a.checkin).localeCompare(String(b.checkin)));

    const today = new Date();
    const defaultDays = defaultCadenceDays[selectedServiceType] ?? 30;

    if (filtered.length === 0) {
      const predicted = new Date(today);
      predicted.setDate(predicted.getDate() + defaultDays);
      return {
        predicted_date: predicted.toISOString().slice(0, 10),
        service_type: selectedServiceType,
        confidence: 0.35,
        basis: `No matching historical bookings; used default ${defaultDays}-day cadence.`,
      };
    }

    const last = filtered[filtered.length - 1];
    let cadence = defaultDays;
    let confidence = 0.55;
    let basis = `Used default ${defaultDays}-day cadence from latest booking.`;

    if (filtered.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < filtered.length; i += 1) {
        intervals.push(daysBetween(String(filtered[i - 1].checkin), String(filtered[i].checkin)));
      }

      const sorted = [...intervals].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)] || defaultDays;
      cadence = Math.max(1, median);
      confidence = Math.min(0.9, 0.6 + Math.min(0.3, intervals.length * 0.08));
      basis = `Based on ${intervals.length} historical interval(s), median cadence is ${cadence} day(s).`;
    }

    const predicted = new Date(String(last.checkin));
    predicted.setDate(predicted.getDate() + cadence);

    return {
      predicted_date: predicted.toISOString().slice(0, 10),
      service_type: selectedServiceType,
      confidence: Number(confidence.toFixed(2)),
      basis,
    };
  },
};
