import { backendApiClient } from "../../http/backendApiClient";
import { TOOL_INPUT_SCHEMA_TEXT } from "../../schemas";
import { ToolContext, ToolDefinition } from "../../types";

export interface GetPetProfileArgs {
  pet_id?: string;
  id?: string;
}

interface PetProfileResult {
  pet: {
    id: string;
    name: string;
    species: string | null;
    breed: string | null;
    birthday: string | null;
    weight: number | null;
    photo_url: string | null;
    notes: string | null;
  };
}

const asNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const getPetProfileTool: ToolDefinition<GetPetProfileArgs, PetProfileResult> = {
  name: "get_pet_profile",
  description: "Get one pet profile by ID for the current user",
  inputSchema: TOOL_INPUT_SCHEMA_TEXT.get_pet_profile,
  run: async (args, context?: ToolContext) => {
    const source = (args || {}) as GetPetProfileArgs;
    const petId = String(source.pet_id || source.id || "").trim();

    if (!petId) {
      throw new Error("pet_id is required");
    }

    if (!context?.authToken) {
      throw new Error("Please log in to view pet profiles.");
    }

    let response: any;
    try {
      response = await backendApiClient.request<any>(`/api/pets/${encodeURIComponent(petId)}`, {
        method: "GET",
        authToken: context.authToken,
      });
    } catch (error: any) {
      const message = String(error?.message ?? "");
      if (message.includes("404")) {
        throw new Error("Pet profile not found. Please check the pet ID and try again.");
      }
      if (message.includes("401")) {
        throw new Error("Your session expired. Please sign in again to view this pet profile.");
      }
      throw error;
    }

    const pet = response?.pet ?? response;

    return {
      pet: {
        id: String(pet?.id ?? petId),
        name: String(pet?.name ?? "Unnamed Pet"),
        species: pet?.species ?? null,
        breed: pet?.breed ?? null,
        birthday: pet?.birthday ?? null,
        weight: asNumber(pet?.weight),
        photo_url: pet?.photo_url ?? null,
        notes: pet?.notes ?? null,
      },
    };
  },
};
