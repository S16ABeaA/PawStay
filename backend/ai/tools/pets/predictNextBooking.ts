import { backendApiClient } from "../../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../../schemas";
import { ToolContext, ToolDefinition } from "../../types";

export interface PredictNextBookingArgs {
  pet_id?: string;
  pet_name?: string;
  include_breed_recommendations?: boolean;
  include_health_recommendations?: boolean;
  include_booking_pattern?: boolean;
}

interface BookingPrediction {
  service_type: string;
  likelihood: number;
  reasoning: string;
  recommended_date_range?: string;
  estimated_cost_range?: {
    min: number;
    max: number;
  };
}

interface PredictNextBookingResult {
  pet: {
    id: string;
    name: string;
    breed: string;
    species: string;
  };
  predictions: BookingPrediction[];
  analysis: {
    booking_frequency: string;
    last_service_date: string | null;
    most_used_service: string | null;
    health_considerations: string[];
    breed_specific_services: string[];
  };
  confidence_level: "high" | "medium" | "low";
  message: string;
}

const normalize = (value: unknown): string => String(value ?? "").trim().toLowerCase();

/**
 * Helper function to calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Helper function to calculate average interval between bookings
 */
function calculateAverageInterval(dates: Date[]): number | null {
  if (dates.length < 2) return null;

  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  let totalDays = 0;
  let intervals = 0;

  for (let i = 1; i < sortedDates.length; i++) {
    totalDays += daysBetween(sortedDates[i - 1], sortedDates[i]);
    intervals++;
  }

  return intervals > 0 ? Math.round(totalDays / intervals) : null;
}

/**
 * Helper to get breed-specific service recommendations
 */
function getBreedSpecificServices(breed: string): string[] {
  const breedLower = breed.toLowerCase();
  const recommendations: string[] = [];

  // Long-haired breeds need frequent grooming
  const longHairedBreeds = ["poodle", "doodle", "maltese", "shih tzu", "persian", "afghan", "collie", "golden", "rough"];
  if (longHairedBreeds.some(b => breedLower.includes(b))) {
    recommendations.push("grooming");
  }

  // Short-haired breeds
  const shortHairedBreeds = ["labrador", "bulldog", "boxer", "beagle", "dachshund", "doberman"];
  if (shortHairedBreeds.some(b => breedLower.includes(b))) {
    recommendations.push("general grooming");
  }

  // Breeds prone to specific health issues
  if (breedLower.includes("german shepherd") || breedLower.includes("corgi") || breedLower.includes("dachshund")) {
    recommendations.push("veterinary check-up");
  }

  if (breedLower.includes("persian") || breedLower.includes("exotic")) {
    recommendations.push("specialized grooming", "eye care");
  }

  return recommendations;
}

/**
 * Helper to extract health considerations from service history
 */
function extractHealthConsiderations(serviceHistory: any[]): string[] {
  const considerations: string[] = [];
  const serviceTypes = new Set(serviceHistory.map((h: any) => h.service_type?.toLowerCase()));

  if (serviceTypes.has("veterinary")) {
    considerations.push("Regular veterinary check-ups are part of the pet's routine");
  }
  if (serviceTypes.has("grooming")) {
    considerations.push("Grooming services are important for this pet's coat health");
  }
  if (serviceTypes.has("vaccination") || serviceTypes.has("health check")) {
    considerations.push("This pet requires regular health monitoring");
  }

  return considerations;
}

/**
 * Helper to predict next booking based on historical data
 */
function predictNextBooking(
  serviceHistory: any[],
  breed: string,
  petSpecies: string
): BookingPrediction[] {
  const predictions: BookingPrediction[] = [];
  const serviceTypeFrequency: Map<string, { count: number; lastDate?: Date; dates: Date[] }> = new Map();

  // Process service history
  serviceHistory.forEach((item: any) => {
    const serviceType = item.service_type || item.service_name;
    if (!serviceType) return;

    const date = item.performed_at ? new Date(item.performed_at) : null;
    const existing = serviceTypeFrequency.get(serviceType) || { count: 0, dates: [] };

    existing.count += 1;
    if (date) {
      existing.dates.push(date);
      if (!existing.lastDate || date > existing.lastDate) {
        existing.lastDate = date;
      }
    }

    serviceTypeFrequency.set(serviceType, existing);
  });

  // Generate predictions based on frequency
  serviceTypeFrequency.forEach((data, serviceType) => {
    const avgInterval = calculateAverageInterval(data.dates);
    let likelihood = Math.min(100, (data.count / serviceHistory.length) * 100 * 1.2); // Slightly boost common services
    let recommendedRange = "Based on history";

    if (avgInterval && data.lastDate) {
      const daysSinceLastService = daysBetween(data.lastDate, new Date());
      const percentThroughCycle = (daysSinceLastService / avgInterval) * 100;

      // If past the average interval, increase likelihood
      if (percentThroughCycle > 80) {
        likelihood = Math.min(100, likelihood * 1.5);
      }

      const nextDate = new Date(data.lastDate);
      nextDate.setDate(nextDate.getDate() + avgInterval);
      recommendedRange = `${avgInterval} days after last service (around ${nextDate.toLocaleDateString()})`;
    }

    predictions.push({
      service_type: serviceType,
      likelihood: Math.round(likelihood),
      reasoning:
        data.count === 1
          ? `Pet has used this service once before`
          : `Pet uses this service frequently (${data.count} times, avg every ${calculateAverageInterval(data.dates) || "unknown"} days)`,
      recommended_date_range: recommendedRange,
    });
  });

  // Add breed-specific recommendations with lower priority if not in history
  const breedServices = getBreedSpecificServices(breed);
  const existingServices = new Set(predictions.map(p => p.service_type.toLowerCase()));

  breedServices.forEach(service => {
    if (!existingServices.has(service.toLowerCase())) {
      predictions.push({
        service_type: service,
        likelihood: 45,
        reasoning: `This ${breed} breed typically benefits from regular ${service}`,
      });
    }
  });

  return predictions.sort((a, b) => b.likelihood - a.likelihood).slice(0, 5);
}

export const predictNextBookingTool: ToolDefinition<
  PredictNextBookingArgs,
  PredictNextBookingResult
> = {
  name: "predict_next_booking",
  description:
    "Predict the next likely booking for a pet based on its breed, health records, and booking history. Returns predictions ranked by likelihood.",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.predict_next_booking,
  run: async (args, context?: ToolContext) => {
    if (!context?.authToken) {
      throw new Error("Please log in to predict pet bookings.");
    }

    const petId = String(args?.pet_id ?? "").trim();
    const petName = String(args?.pet_name ?? "").trim();

    if (!petId && !petName) {
      throw new Error("pet_id or pet_name is required");
    }

    // Fetch all pets
    let petsResponse: any;
    try {
      petsResponse = await backendApiClient.request<any>("/api/pets", {
        method: "GET",
        authToken: context.authToken,
      });
    } catch (error: any) {
      const message = String(error?.message ?? "");
      if (message.includes("401")) {
        throw new Error("Your session expired. Please sign in again.");
      }
      throw error;
    }

    const pets = Array.isArray(petsResponse?.pets) ? petsResponse.pets : [];

    const matchedPet = pets.find((pet: any) => {
      if (petId && String(pet?.id ?? "") === petId) return true;
      if (petName && normalize(pet?.name) === normalize(petName)) return true;
      return false;
    });

    if (!matchedPet) {
      throw new Error("Pet not found. Please provide a valid pet ID or exact pet name.");
    }

    // Get service history for the pet
    const historyResponse = await backendApiClient.request<any>("/api/pets/service-history", {
      method: "GET",
      authToken: context.authToken,
      query: { petId: matchedPet.id },
    }).catch(() => ({ serviceHistory: [] }));

    const serviceHistory = Array.isArray(historyResponse?.serviceHistory)
      ? historyResponse.serviceHistory
      : Array.isArray(matchedPet?.serviceHistory)
        ? matchedPet.serviceHistory
        : [];

    // Calculate predictions
    const predictions = predictNextBooking(serviceHistory, matchedPet.breed || "mixed", matchedPet.species || "unknown");

    // Extract analysis
    const sortedHistory = [...serviceHistory].sort(
      (a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime()
    );

    const lastServiceDate = sortedHistory[0]?.performed_at || null;
    const serviceDates = serviceHistory
      .filter((h: any) => h.performed_at)
      .map((h: any) => new Date(h.performed_at));

    const avgInterval = calculateAverageInterval(serviceDates);

    const serviceTypeCount: Record<string, number> = {};
    serviceHistory.forEach((h: any) => {
      const type = h.service_type || h.service_name || "unknown";
      serviceTypeCount[type] = (serviceTypeCount[type] || 0) + 1;
    });

    const mostUsedService = Object.entries(serviceTypeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Determine confidence level
    let confidenceLevel: "high" | "medium" | "low" = "low";
    if (serviceHistory.length > 8) {
      confidenceLevel = "high";
    } else if (serviceHistory.length > 3) {
      confidenceLevel = "medium";
    }

    const bookingFrequency =
      avgInterval && avgInterval > 0
        ? `Every approximately ${avgInterval} days`
        : serviceHistory.length > 2
          ? "Regular but variable intervals"
          : serviceHistory.length > 0
            ? "Limited history"
            : "No previous bookings";

    return {
      pet: {
        id: String(matchedPet.id),
        name: String(matchedPet.name ?? "Unnamed Pet"),
        breed: String(matchedPet.breed ?? "Unknown"),
        species: String(matchedPet.species ?? "Unknown"),
      },
      predictions: predictions.length > 0 ? predictions : [
        {
          service_type: "General Grooming",
          likelihood: 50,
          reasoning: "Recommended for pet maintenance based on species",
        },
      ],
      analysis: {
        booking_frequency: bookingFrequency,
        last_service_date: lastServiceDate,
        most_used_service: mostUsedService,
        health_considerations: extractHealthConsiderations(serviceHistory),
        breed_specific_services: getBreedSpecificServices(matchedPet.breed || ""),
      },
      confidence_level: confidenceLevel,
      message:
        confidenceLevel === "high"
          ? "Based on extensive booking history, these predictions are highly likely."
          : confidenceLevel === "medium"
            ? "Based on moderate booking history, these are reasonable predictions."
            : "Limited booking history. Predictions based primarily on breed and species recommendations.",
    };
  },
};
