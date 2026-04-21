import { authHelper } from "../helpers/authHelper";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

export interface AiChatRequest {
  message: string;
  sessionId?: string;
}

export interface AiChatResponse {
  message: string;
  usedTools: Array<{
    tool: string;
    args: Record<string, unknown>;
  }>;
  toolActivity?: Array<{
    tool: string;
    status: string;
  }>;
}

export interface OcrReadResponse {
  text: string;
  language: string;
  characters: number;
}

type Priority = "high" | "medium" | "low";

export interface PetAnalysisCareItem {
  category: string;
  icon: string;
  priority: Priority;
  summary: string;
  detail: string;
}

export interface PetAnalysisNextAction {
  label: string;
  intent: string;
}

export interface PetAnalysisRequest {
  sessionId?: string;
  detectedSpecies?: string;
  primaryPrediction?: string;
  primaryConfidence?: number;
  alternatives?: string[];
  ocrText?: string;
  descriptionHint?: string;
  healthCheck?: {
    status: PetHealthStatus;
    injured: boolean;
    confidence: number;
    summary: string;
    visible_signs: string[];
    recommended_actions: string[];
    age_estimate?: PetImageEstimate;
    weight_estimate?: PetImageEstimate;
  };
}

export interface PetAnalysisResponse {
  breed: {
    primary: string;
    confidence: number;
    alternatives: string[];
    description: string;
  };
  care: PetAnalysisCareItem[];
  health_flags: string[];
  health_check?: {
    status: string;
    confidence: number;
    summary: string;
    estimated_age?: { value: string | null; confidence: number };
    estimated_weight?: { value: string | null; confidence: number };
    visible_signs: string[];
  };
  next_actions: PetAnalysisNextAction[];
  low_confidence?: boolean;
  error?: string;
}

export type PetHealthStatus = "healthy" | "minor_issue" | "injured" | "urgent" | "unclear";

export interface PetImageEstimate {
  value: number | null;
  unit: string;
  confidence: number;
  range: string;
  method: string;
  note: string;
}

export interface PetHealthCheckResponse {
  breed_estimate?: {
    primary: string;
    confidence: number;
    alternatives: string[];
  };
  status: PetHealthStatus;
  injured: boolean;
  confidence: number;
  summary: string;
  visible_signs: string[];
  recommended_actions: string[];
  age_estimate: PetImageEstimate;
  weight_estimate: PetImageEstimate;
  disclaimer: string;
}

export const aiChatApi = {
  async chat(payload: AiChatRequest): Promise<AiChatResponse> {
    try {
      return await authHelper.post(`${API_BASE_URL}/api/ai/chat`, payload);
    } catch (error: any) {
      const detail = error?.error ?? error?.message ?? `status ${error?.status ?? 500}`;
      throw new Error(detail);
    }
  },

  async readImageText(file: File, language = "eng"): Promise<OcrReadResponse> {
    const form = new FormData();
    form.append("image", file);
    form.append("language", language);

    try {
      return await authHelper.fetchWithAuth(`${API_BASE_URL}/api/ai/ocr`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
    } catch (error: any) {
      const detail = error?.error ?? error?.message ?? `status ${error?.status ?? 500}`;
      throw new Error(detail);
    }
  },

  async analyzePet(payload: PetAnalysisRequest): Promise<PetAnalysisResponse> {
    try {
      return await authHelper.post(`${API_BASE_URL}/api/ai/pet-analysis`, payload);
    } catch (error: any) {
      const detail = error?.error ?? error?.message ?? `status ${error?.status ?? 500}`;
      throw new Error(detail);
    }
  },

  async checkPetHealth(file: File, detectedSpecies?: string): Promise<PetHealthCheckResponse> {
    const form = new FormData();
    form.append("image", file);
    if (detectedSpecies) {
      form.append("detectedSpecies", detectedSpecies);
    }

    try {
      return await authHelper.fetchWithAuth(`${API_BASE_URL}/api/ai/pet-health-check`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
    } catch (error: any) {
      const detail = error?.error ?? error?.message ?? `status ${error?.status ?? 500}`;
      throw new Error(detail);
    }
  },
};
