import { backendApiClient } from "../../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../../schemas";
import { ToolContext, ToolDefinition } from "../../types";

export interface GetPetsArgs {}

interface PetServiceHistoryItem {
  id: string;
  bookingId: string | null;
  type: string | null;
  serviceName: string | null;
  date: string | null;
  notes: string | null;
}

interface PetSummary {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  birthday: string | null;
  weight: number | null;
  photo_url: string | null;
  notes: string | null;
  serviceHistory: PetServiceHistoryItem[];
}

interface GetPetsResult {
  total: number;
  pets: PetSummary[];
}

const asNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const getPetsTool: ToolDefinition<GetPetsArgs, GetPetsResult> = {
  name: "get_pets",
  description: "Get the current user's pet profiles",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_pets,
  run: async (_args, context?: ToolContext) => {
    if (!context?.authToken) {
      throw new Error("Please log in to view your pet profiles.");
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
        throw new Error("Your session expired. Please sign in again to view your pets.");
      }
      throw error;
    }

    const rows = Array.isArray(response?.pets) ? response.pets : [];

    return {
      total: rows.length,
      pets: rows.slice(0, 20).map((row: any) => ({
        id: String(row?.id ?? ""),
        name: String(row?.name ?? "Unnamed Pet"),
        species: row?.species ?? null,
        breed: row?.breed ?? null,
        birthday: row?.birthday ?? null,
        weight: asNumber(row?.weight),
        photo_url: row?.photo_url ?? null,
        notes: row?.notes ?? null,
        serviceHistory: Array.isArray(row?.serviceHistory)
          ? row.serviceHistory.slice(0, 10).map((item: any) => ({
              id: String(item?.id ?? ""),
              bookingId: item?.bookingId ?? null,
              type: item?.type ?? null,
              serviceName: item?.serviceName ?? null,
              date: item?.date ?? null,
              notes: item?.notes ?? null,
            }))
          : [],
      })),
    };
  },
};
