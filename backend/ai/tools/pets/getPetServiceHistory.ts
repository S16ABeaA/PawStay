import { backendApiClient } from "../../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../../schemas";
import { ToolContext, ToolDefinition } from "../../types";

export interface GetPetServiceHistoryArgs {
  pet_id?: string;
  pet_name?: string;
}

interface HistoryItem {
  id: string;
  bookingId: string | null;
  type: string | null;
  serviceName: string | null;
  date: string | null;
  notes: string | null;
}

interface GetPetServiceHistoryResult {
  pet: {
    id: string;
    name: string;
  };
  total: number;
  history: HistoryItem[];
}

const normalize = (value: unknown): string => String(value ?? "").trim().toLowerCase();

export const getPetServiceHistoryTool: ToolDefinition<
  GetPetServiceHistoryArgs,
  GetPetServiceHistoryResult
> = {
  name: "get_pet_service_history",
  description: "Get service history entries for one pet by pet ID or pet name",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_pet_service_history,
  run: async (args, context?: ToolContext) => {
    if (!context?.authToken) {
      throw new Error("Please log in to view pet service history.");
    }

    const petId = String(args?.pet_id ?? "").trim();
    const petName = String(args?.pet_name ?? "").trim();

    if (!petId && !petName) {
      throw new Error("pet_id or pet_name is required");
    }

    let response: any;
    try {
      response = await backendApiClient.request<any>("/api/pets", {
        method: "GET",
        authToken: context.authToken,
      });
    } catch (error: any) {
      const message = String(error?.message ?? "");
      if (message.includes("401")) {
        throw new Error("Your session expired. Please sign in again to view pet service history.");
      }
      throw error;
    }

    const pets = Array.isArray(response?.pets) ? response.pets : [];

    const matchedPet = pets.find((pet: any) => {
      if (petId && String(pet?.id ?? "") === petId) return true;
      if (petName && normalize(pet?.name) === normalize(petName)) return true;
      return false;
    });

    if (!matchedPet) {
      throw new Error("Pet not found. Please provide a valid pet ID or exact pet name.");
    }

    const historyRows = Array.isArray(matchedPet?.serviceHistory)
      ? matchedPet.serviceHistory
      : [];

    const history = historyRows.slice(0, 20).map((item: any) => ({
      id: String(item?.id ?? ""),
      bookingId: item?.bookingId ?? null,
      type: item?.type ?? null,
      serviceName: item?.serviceName ?? null,
      date: item?.date ?? null,
      notes: item?.notes ?? null,
    }));

    return {
      pet: {
        id: String(matchedPet?.id ?? ""),
        name: String(matchedPet?.name ?? "Unnamed Pet"),
      },
      total: history.length,
      history,
    };
  },
};
