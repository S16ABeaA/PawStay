import { backendApiClient } from "../../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../../schemas";
import { ToolContext, ToolDefinition } from "../../types";

export interface AnalyzeBookingPatternsArgs {
  user_id?: string;
}

interface Booking {
  id: string;
  property_name: string;
  service_type: string;
  checkin: string;
  checkout: string;
  status: string;
  payment_status: string;
  total_price: number;
  created_at: string;
}

interface BookingPatternAnalysis {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  bookingFrequency: {
    perMonth: number;
    perYear: number;
    description: string;
  };
  serviceTypePreferences: Array<{
    service: string;
    count: number;
    percentage: number;
  }>;
  averageCost: number;
  costRange: {
    min: number;
    max: number;
  };
  bookingStatusBreakdown: Record<string, number>;
  paymentStatusBreakdown: Record<string, number>;
  datePatterns: {
    mostCommonMonth: string | null;
    mostCommonDay: string | null;
    averageDaysBetweenBookings: number | null;
  };
  lastBookingDate: string | null;
  nextUpcomingBooking: string | null;
  summary: string;
}

interface AnalyzeBookingPatternsResult {
  userId: string;
  analysis: BookingPatternAnalysis;
  instruction: string;
}

function daysBetween(date1: Date, date2: Date): number {
  return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
}

function getMonthName(date: Date): string {
  return date.toLocaleString("en-US", { month: "long" });
}

function getDayName(date: Date): string {
  return date.toLocaleString("en-US", { weekday: "long" });
}

function analyzeBookings(bookings: Booking[]): BookingPatternAnalysis {
  if (bookings.length === 0) {
    return {
      totalBookings: 0,
      activeBookings: 0,
      completedBookings: 0,
      bookingFrequency: { perMonth: 0, perYear: 0, description: "No booking history" },
      serviceTypePreferences: [],
      averageCost: 0,
      costRange: { min: 0, max: 0 },
      bookingStatusBreakdown: {},
      paymentStatusBreakdown: {},
      datePatterns: { mostCommonMonth: null, mostCommonDay: null, averageDaysBetweenBookings: null },
      lastBookingDate: null,
      nextUpcomingBooking: null,
      summary: "No booking data available.",
    };
  }

  // Basic counts
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length;
  const completedBookings = bookings.filter((b) => b.status === "completed" || b.status === "checked_out").length;

  // Sort by checkin date
  const sortedByCheckin = [...bookings].sort(
    (a, b) => new Date(a.checkin).getTime() - new Date(b.checkin).getTime(),
  );

  const lastBookingDate = sortedByCheckin[sortedByCheckin.length - 1]?.checkin || null;
  const nextUpcomingBooking = bookings
    .filter((b) => new Date(b.checkin) > new Date())
    .sort((a, b) => new Date(a.checkin).getTime() - new Date(b.checkin).getTime())[0]?.checkin || null;

  // Service type preferences
  const serviceTypeMap = new Map<string, number>();
  bookings.forEach((b) => {
    const service = b.service_type || "Unknown";
    serviceTypeMap.set(service, (serviceTypeMap.get(service) || 0) + 1);
  });

  const serviceTypePreferences = Array.from(serviceTypeMap.entries())
    .map(([service, count]) => ({
      service,
      count,
      percentage: Math.round((count / totalBookings) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Cost analysis
  const costs = bookings.map((b) => b.total_price || 0).filter((c) => c > 0);
  const averageCost = costs.length > 0 ? Math.round(costs.reduce((a, b) => a + b, 0) / costs.length) : 0;
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const costRange = { min: minCost === Infinity ? 0 : minCost, max: maxCost === -Infinity ? 0 : maxCost };

  // Status breakdowns
  const bookingStatusBreakdown: Record<string, number> = {};
  const paymentStatusBreakdown: Record<string, number> = {};

  bookings.forEach((b) => {
    bookingStatusBreakdown[b.status] = (bookingStatusBreakdown[b.status] || 0) + 1;
    paymentStatusBreakdown[b.payment_status] = (paymentStatusBreakdown[b.payment_status] || 0) + 1;
  });

  // Date patterns
  const checkinDates = bookings.map((b) => new Date(b.checkin));
  const monthCounts = new Map<string, number>();
  const dayCounts = new Map<string, number>();

  checkinDates.forEach((date) => {
    const month = getMonthName(date);
    const day = getDayName(date);
    monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  });

  const mostCommonMonth =
    monthCounts.size > 0
      ? Array.from(monthCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  const mostCommonDay =
    dayCounts.size > 0 ? Array.from(dayCounts.entries()).sort((a, b) => b[1] - a[1])[0][0] : null;

  // Calculate average days between bookings
  let averageDaysBetweenBookings: number | null = null;
  if (sortedByCheckin.length >= 2) {
    let totalDays = 0;
    for (let i = 1; i < sortedByCheckin.length; i++) {
      totalDays += daysBetween(
        new Date(sortedByCheckin[i - 1].checkin),
        new Date(sortedByCheckin[i].checkin),
      );
    }
    averageDaysBetweenBookings = Math.round(totalDays / (sortedByCheckin.length - 1));
  }

  // Calculate booking frequency
  const oldestBooking = sortedByCheckin[0]?.checkin;
  const newestBooking = sortedByCheckin[sortedByCheckin.length - 1]?.checkin;
  let bookingFrequencyPerMonth = 0;
  let bookingFrequencyPerYear = 0;
  let frequencyDescription = "";

  if (oldestBooking && newestBooking) {
    const monthsDiff = daysBetween(new Date(oldestBooking), new Date(newestBooking)) / 30;
    bookingFrequencyPerMonth = monthsDiff > 0 ? Math.round(totalBookings / monthsDiff) : totalBookings;
    bookingFrequencyPerYear = bookingFrequencyPerMonth * 12;

    if (bookingFrequencyPerMonth < 1) {
      frequencyDescription = `Less than 1 booking per month (${bookingFrequencyPerYear.toFixed(1)} per year)`;
    } else if (bookingFrequencyPerMonth === 1) {
      frequencyDescription = `About 1 booking per month`;
    } else {
      frequencyDescription = `${Math.round(bookingFrequencyPerMonth)} bookings per month (${Math.round(bookingFrequencyPerYear)} per year)`;
    }
  } else {
    frequencyDescription = "Insufficient data for frequency analysis";
  }

  return {
    totalBookings,
    activeBookings,
    completedBookings,
    bookingFrequency: {
      perMonth: bookingFrequencyPerMonth,
      perYear: bookingFrequencyPerYear,
      description: frequencyDescription,
    },
    serviceTypePreferences,
    averageCost,
    costRange,
    bookingStatusBreakdown,
    paymentStatusBreakdown,
    datePatterns: { mostCommonMonth, mostCommonDay, averageDaysBetweenBookings },
    lastBookingDate,
    nextUpcomingBooking,
    summary: `User has made ${totalBookings} total bookings with ${activeBookings} active and ${completedBookings} completed. ${frequencyDescription}`,
  };
}

export const analyzeBookingPatternsTool: ToolDefinition<AnalyzeBookingPatternsArgs, AnalyzeBookingPatternsResult> =
  {
    name: "analyze_booking_patterns",
    description:
      "Analyze a user's booking frequency and patterns, including service preferences, costs, dates, and booking status",
    inputSchema: TOOL_INPUT_SCHEMA_TEXT.analyze_booking_patterns,
    run: async (args, context?: ToolContext) => {
      const response = await backendApiClient.request<any>("/api/bookings/mine", {
        method: "GET",
        authToken: context?.authToken,
      });

      const bookingsRaw = Array.isArray(response?.bookings)
        ? response.bookings
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

      const bookings: Booking[] = bookingsRaw.map((row: any) => ({
        id: String(row?.id ?? ""),
        property_name: row?.property_name ?? row?.property_id ?? "Unknown",
        service_type: row?.service_type ?? row?.service_name ?? "Unknown",
        checkin: row?.checkin ?? new Date().toISOString(),
        checkout: row?.checkout ?? new Date().toISOString(),
        status: row?.status ?? "unknown",
        payment_status: row?.payment_status ?? "unknown",
        total_price: typeof row?.total_price === "number" ? row.total_price : Number(row?.total_price) || 0,
        created_at: row?.created_at ?? new Date().toISOString(),
      }));

      const analysis = analyzeBookings(bookings);

      return {
        userId: context?.userId || "current_user",
        analysis,
        instruction:
          "Based on this booking analysis, provide insights about: 1) How frequently the user books services, 2) Their preferred service types, 3) Spending patterns, 4) Booking timing preferences, 5) Any notable trends or recommendations for future bookings.",
      };
    },
  };
