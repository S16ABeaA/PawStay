import { reverseGeocode } from "@/services/reverseGeocode";
import { authApi } from "@/services/authApi";

export const AI_AUTOFILL_PET_KEY = "pawstay.ai.autofill.pet";
export const AI_AUTOFILL_MIN_CONFIDENCE = Number(import.meta.env.VITE_AUTOFILL_MIN_CONFIDENCE || 0.8);

export type PetAutofillField = {
  value: string;
  confidence: number;
  source: string;
};

export type PetAutofillPayload = {
  createdAt: string;
  imageDataUrl?: string;
  breed?: PetAutofillField;
  ageYears?: PetAutofillField;
  weightKg?: PetAutofillField;
  notes?: Record<string, string>;
};

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> => {
  return new Promise((resolve) => {
    const id = window.setTimeout(() => resolve(null), ms);
    promise
      .then((result) => {
        window.clearTimeout(id);
        resolve(result);
      })
      .catch(() => {
        window.clearTimeout(id);
        resolve(null);
      });
  });
};

const getCurrentCoords = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 60000,
      },
    );
  });
};

export const resolveLocationForSearch = async (): Promise<{
  location: string;
  source: "geolocation" | "profile" | "none";
  geoPending: boolean;
}> => {
  const quickGeo = await withTimeout(
    (async () => {
      const coords = await getCurrentCoords();
      const geoName = await reverseGeocode(coords.lat, coords.lng);
      return String(geoName || "").trim();
    })(),
    3000,
  );

  if (quickGeo) {
    return { location: quickGeo, source: "geolocation", geoPending: false };
  }

  try {
    const profile = await authApi.getProfile();
    const profileAddress = String(profile?.user?.address || "").trim();
    if (profileAddress) {
      return { location: profileAddress, source: "profile", geoPending: true };
    }
  } catch {
    // fall through
  }

  return { location: "", source: "none", geoPending: true };
};

export const savePetAutofillPayload = (payload: PetAutofillPayload) => {
  try {
    sessionStorage.setItem(AI_AUTOFILL_PET_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
};

export const consumePetAutofillPayload = (): PetAutofillPayload | null => {
  try {
    const raw = sessionStorage.getItem(AI_AUTOFILL_PET_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(AI_AUTOFILL_PET_KEY);
    return JSON.parse(raw) as PetAutofillPayload;
  } catch {
    return null;
  }
};

export const estimateYearsFromRange = (range: string | null | undefined): number | null => {
  const raw = String(range || "").toLowerCase();
  if (!raw) return null;

  const numbers = raw.match(/\d+(?:\.\d+)?/g)?.map(Number).filter((n) => Number.isFinite(n)) || [];
  if (numbers.length === 0) return null;

  const avg = numbers.length >= 2 ? (numbers[0] + numbers[1]) / 2 : numbers[0];
  if (avg <= 0 || avg > 30) return null;
  return Math.round(avg * 10) / 10;
};

export const estimateWeightKgFromRange = (range: string | null | undefined): number | null => {
  const raw = String(range || "").toLowerCase();
  if (!raw) return null;

  const numbers = raw.match(/\d+(?:\.\d+)?/g)?.map(Number).filter((n) => Number.isFinite(n)) || [];
  if (numbers.length === 0) return null;

  const avg = numbers.length >= 2 ? (numbers[0] + numbers[1]) / 2 : numbers[0];
  if (avg <= 0 || avg > 200) return null;
  return Math.round(avg * 10) / 10;
};
