import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "../config/supabaseAdmin";
import {
  extractTextFromBase64Document,
  extractTextFromDocumentBuffer,
} from "./ocrService";

type ValidationStatus = "valid" | "incomplete" | "suspicious";
type Priority = "high" | "medium" | "low";

export interface PipelineInputDocument {
  fileName?: string;
  mimeType?: string;
  fileBuffer?: Buffer;
  base64?: string;
}

export interface AnalyzePetHealthDataInput {
  petId: string;
  ownerId: string;
  detectedBreed: string;
  detectedBreedConfidence?: number;
  petSnapshot?: {
    name?: string;
    species?: string;
    breed?: string;
    birthday?: string | null;
  };
  documents: PipelineInputDocument[];
  rerunStage?: "extract_medical_data" | "validate_record_authenticity" | "generate_pet_care_predictions" | "compile_pet_health_timeline";
  priorExtractedData?: ExtractMedicalDataResult["structured"];
  sourceFileName?: string;
}

export interface ExtractMedicalDataResult {
  stage: "extract_medical_data";
  structured: {
    pet: {
      name: string | null;
      species: string | null;
      breed: string | null;
      date_of_birth: string | null;
    };
    owner: {
      name: string | null;
      contact: string | null;
    };
    vet: {
      name: string | null;
      clinic: string | null;
    };
    vaccines: Array<{
      name: string;
      date: string | null;
      next_due_date: string | null;
      confidence?: number;
      source?: string;
    }>;
    diagnosed_conditions: string[];
    prescribed_medications: string[];
    medical_visits: Array<{
      date: string | null;
      details: string;
      confidence?: number;
      source?: string;
    }>;
    last_grooming_date: string | null;
  };
  lowConfidenceFields: string[];
  breedMismatch: {
    hasMismatch: boolean;
    detectedBreed: string;
    recordBreed: string | null;
    note: string | null;
  };
  ocrConfidenceScore: number;
  rawOcr: Array<{
    source: string;
    text: string;
    confidence: number;
  }>;
}

export interface ValidateRecordAuthenticityResult {
  stage: "validate_record_authenticity";
  status: ValidationStatus;
  issues: string[];
  shouldPauseForReview: boolean;
}

export interface PredictionResult {
  stage: "generate_pet_care_predictions";
  grooming: {
    breed: string;
    coat_type: string;
    interval_days: number;
    recommended_next_grooming_date: string;
    based_on: string;
  };
  wellness_milestones: Array<{
    title: string;
    date: string;
    priority: Priority;
    rationale: string;
  }>;
}

export interface TimelineEntry {
  date: string;
  event_type: "vaccination" | "diagnosis" | "booking" | "grooming" | "vet_visit";
  details: string;
  source_record: string;
  confidence: number | null;
}

export interface CompileTimelineResult {
  stage: "compile_pet_health_timeline";
  timeline: TimelineEntry[];
  careGapFlags: string[];
}

export interface AnalyzePetHealthDataOutput {
  extracted: ExtractMedicalDataResult;
  validation: ValidateRecordAuthenticityResult;
  predictions: PredictionResult | null;
  timeline: CompileTimelineResult | null;
  flags: string[];
}

const toText = (value: unknown): string => String(value ?? "").trim();

const normalizeConfidence = (value: unknown, fallback = 50): number => {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return fallback;
  const normalized = raw >= 0 && raw <= 1 ? raw * 100 : raw;
  return Math.max(0, Math.min(100, Math.round(normalized)));
};

const extractJsonObject = (text: string): Record<string, unknown> | null => {
  const cleaned = String(text || "").replace(/```json|```/gi, "").trim();
  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
};

const parseDate = (value: string | null | undefined): Date | null => {
  const raw = toText(value);
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const toIsoDate = (value: Date): string => value.toISOString().slice(0, 10);

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const extractStructuredFromGemini = async (payload: {
  detectedBreed: string;
  petSnapshot?: AnalyzePetHealthDataInput["petSnapshot"];
  ocrTexts: Array<{ source: string; text: string; confidence: number }>;
}): Promise<ExtractMedicalDataResult["structured"]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const modelName = process.env.GEMINI_OCR_MODEL || process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: modelName });

  const prompt = [
    "Extract structured pet medical record data from OCR text.",
    "Return strict JSON only with this shape:",
    "{",
    '  "pet": {"name": string|null, "species": string|null, "breed": string|null, "date_of_birth": string|null},',
    '  "owner": {"name": string|null, "contact": string|null},',
    '  "vet": {"name": string|null, "clinic": string|null},',
    '  "vaccines": [{"name": string, "date": string|null, "next_due_date": string|null, "confidence": number, "source": string}],',
    '  "diagnosed_conditions": string[],',
    '  "prescribed_medications": string[],',
    '  "medical_visits": [{"date": string|null, "details": string, "confidence": number, "source": string}],',
    '  "last_grooming_date": string|null',
    "}",
    "If unknown, use null or empty arrays.",
    `Detected breed from existing image pipeline: ${payload.detectedBreed || "unknown"}`,
    `Known pet snapshot: ${JSON.stringify(payload.petSnapshot || {})}`,
    "OCR sources:",
    ...payload.ocrTexts.map((o) => `[${o.source}] confidence=${o.confidence}\n${o.text.slice(0, 5000)}`),
  ].join("\n\n");

  const response = await model.generateContent(prompt);
  const text = response.response.text();
  const parsed = extractJsonObject(text);
  if (!parsed) {
    return {
      pet: { name: null, species: null, breed: null, date_of_birth: null },
      owner: { name: null, contact: null },
      vet: { name: null, clinic: null },
      vaccines: [],
      diagnosed_conditions: [],
      prescribed_medications: [],
      medical_visits: [],
      last_grooming_date: null,
    };
  }

  const pet = (parsed.pet ?? {}) as Record<string, unknown>;
  const owner = (parsed.owner ?? {}) as Record<string, unknown>;
  const vet = (parsed.vet ?? {}) as Record<string, unknown>;

  const vaccines = Array.isArray(parsed.vaccines)
    ? parsed.vaccines.map((v) => {
        const row = (v ?? {}) as Record<string, unknown>;
        return {
          name: toText(row.name),
          date: toText(row.date) || null,
          next_due_date: toText(row.next_due_date) || null,
          confidence: normalizeConfidence(row.confidence, 60),
          source: toText(row.source) || "ocr",
        };
      }).filter((v) => Boolean(v.name))
    : [];

  const medicalVisits = Array.isArray(parsed.medical_visits)
    ? parsed.medical_visits.map((v) => {
        const row = (v ?? {}) as Record<string, unknown>;
        return {
          date: toText(row.date) || null,
          details: toText(row.details),
          confidence: normalizeConfidence(row.confidence, 60),
          source: toText(row.source) || "ocr",
        };
      }).filter((v) => Boolean(v.details))
    : [];

  const conditions = Array.isArray(parsed.diagnosed_conditions)
    ? parsed.diagnosed_conditions.map((c) => toText(c)).filter(Boolean)
    : [];

  const medications = Array.isArray(parsed.prescribed_medications)
    ? parsed.prescribed_medications.map((m) => toText(m)).filter(Boolean)
    : [];

  return {
    pet: {
      name: toText(pet.name) || null,
      species: toText(pet.species) || null,
      breed: toText(pet.breed) || null,
      date_of_birth: toText(pet.date_of_birth) || null,
    },
    owner: {
      name: toText(owner.name) || null,
      contact: toText(owner.contact) || null,
    },
    vet: {
      name: toText(vet.name) || null,
      clinic: toText(vet.clinic) || null,
    },
    vaccines,
    diagnosed_conditions: conditions,
    prescribed_medications: medications,
    medical_visits: medicalVisits,
    last_grooming_date: toText(parsed.last_grooming_date) || null,
  };
};

const coatIntervalByBreed = (breed: string): { coatType: string; intervalDays: number } => {
  const b = toText(breed).toLowerCase();
  if (!b) return { coatType: "unknown", intervalDays: 45 };
  if (/poodle|shih tzu|maltese|bichon|lhasa/.test(b)) return { coatType: "curly/long", intervalDays: 28 };
  if (/golden|labrador|husky|shepherd|akita/.test(b)) return { coatType: "double", intervalDays: 42 };
  if (/beagle|dachshund|doberman|boxer|pug/.test(b)) return { coatType: "short", intervalDays: 56 };
  return { coatType: "mixed", intervalDays: 45 };
};

export const petHealthRecordPipelineService = {
  async extractMedicalData(input: AnalyzePetHealthDataInput): Promise<ExtractMedicalDataResult> {
    const rawOcr: Array<{ source: string; text: string; confidence: number }> = [];

    for (const doc of input.documents) {
      const sourceName = toText(doc.fileName) || "uploaded_document";
      try {
        if (doc.fileBuffer?.length) {
          const ocr = await extractTextFromDocumentBuffer(
            doc.fileBuffer,
            toText(doc.mimeType) || "application/octet-stream",
          );
          rawOcr.push({ source: sourceName, text: ocr.text, confidence: ocr.text ? 80 : 35 });
          continue;
        }

        if (toText(doc.base64)) {
          const ocr = await extractTextFromBase64Document(String(doc.base64));
          rawOcr.push({ source: sourceName, text: ocr.text, confidence: ocr.text ? 78 : 35 });
        }
      } catch {
        rawOcr.push({ source: sourceName, text: "", confidence: 20 });
      }
    }

    let structured = input.priorExtractedData as ExtractMedicalDataResult["structured"] | undefined;
    if (!structured) {
      try {
        structured = await extractStructuredFromGemini({
          detectedBreed: input.detectedBreed,
          petSnapshot: input.petSnapshot,
          ocrTexts: rawOcr,
        });
      } catch {
        structured = {
          pet: { name: null, species: null, breed: null, date_of_birth: null },
          owner: { name: null, contact: null },
          vet: { name: null, clinic: null },
          vaccines: [],
          diagnosed_conditions: [],
          prescribed_medications: [],
          medical_visits: [],
          last_grooming_date: null,
        };
      }
    }

    if (!structured.pet.name && input.petSnapshot?.name) structured.pet.name = input.petSnapshot.name;
    if (!structured.pet.species && input.petSnapshot?.species) structured.pet.species = input.petSnapshot.species;
    if (!structured.pet.date_of_birth && input.petSnapshot?.birthday) structured.pet.date_of_birth = input.petSnapshot.birthday;

    const detectedBreed = toText(input.detectedBreed);
    const recordBreed = toText(structured.pet.breed) || null;
    const hasMismatch = Boolean(
      detectedBreed &&
      recordBreed &&
      detectedBreed.toLowerCase() !== recordBreed.toLowerCase(),
    );

    const lowConfidenceFields: string[] = [];
    if (!structured.pet.name) lowConfidenceFields.push("pet.name");
    if (!structured.pet.species) lowConfidenceFields.push("pet.species");
    if (!structured.pet.date_of_birth) lowConfidenceFields.push("pet.date_of_birth");
    if (!structured.owner.name) lowConfidenceFields.push("owner.name");
    if (structured.vaccines.some((v) => (v.confidence ?? 0) < 60)) {
      lowConfidenceFields.push("vaccines[*]");
    }

    const ocrConfidenceScore = rawOcr.length
      ? Math.round(rawOcr.reduce((sum, row) => sum + row.confidence, 0) / rawOcr.length)
      : 0;

    return {
      stage: "extract_medical_data",
      structured,
      lowConfidenceFields,
      breedMismatch: {
        hasMismatch,
        detectedBreed,
        recordBreed,
        note: hasMismatch
          ? `Detected breed (${detectedBreed}) differs from record breed (${recordBreed}).`
          : null,
      },
      ocrConfidenceScore,
      rawOcr,
    };
  },

  validateRecordAuthenticity(extracted: ExtractMedicalDataResult): ValidateRecordAuthenticityResult {
    const issues: string[] = [];
    const petDob = parseDate(extracted.structured.pet.date_of_birth);

    if (!extracted.structured.pet.name) issues.push("Missing pet name");
    if (!extracted.structured.pet.species) issues.push("Missing species");
    if (!petDob) issues.push("Missing or invalid date of birth");

    for (const vaccine of extracted.structured.vaccines) {
      const vaccineDate = parseDate(vaccine.date);
      if (petDob && vaccineDate && vaccineDate < petDob) {
        issues.push(`Vaccine date precedes birth date for ${vaccine.name}`);
      }
      if (!vaccine.name) {
        issues.push("Vaccine entry without name");
      }
    }

    if (extracted.breedMismatch.hasMismatch) {
      issues.push(extracted.breedMismatch.note || "Breed mismatch detected");
    }

    if (extracted.lowConfidenceFields.length > 4) {
      issues.push("Many low-confidence OCR fields detected");
    }

    let status: ValidationStatus = "valid";
    if (issues.length > 0) {
      status = issues.some((i) => /precedes birth|mismatch|fraud|tamper/i.test(i))
        ? "suspicious"
        : "incomplete";
    }

    return {
      stage: "validate_record_authenticity",
      status,
      issues,
      shouldPauseForReview: status === "suspicious",
    };
  },

  async generatePetCarePredictions(input: {
    extracted: ExtractMedicalDataResult;
    petSnapshot?: AnalyzePetHealthDataInput["petSnapshot"];
  }): Promise<PredictionResult> {
    const breed = toText(input.extracted.breedMismatch.detectedBreed) || toText(input.extracted.structured.pet.breed) || "mixed";
    const coat = coatIntervalByBreed(breed);

    const lastGrooming =
      parseDate(input.extracted.structured.last_grooming_date) ||
      parseDate(input.extracted.structured.medical_visits.find((v) => /groom/i.test(v.details))?.date);

    const groomingBaseDate = lastGrooming || new Date();
    const nextGroomingDate = toIsoDate(addDays(groomingBaseDate, coat.intervalDays));

    const dob = parseDate(input.extracted.structured.pet.date_of_birth || input.petSnapshot?.birthday || null);
    const ageYears = dob ? (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000) : null;

    const latestVaccineDue = input.extracted.structured.vaccines
      .map((v) => parseDate(v.next_due_date || v.date || null))
      .filter((d): d is Date => Boolean(d))
      .sort((a, b) => a.getTime() - b.getTime())
      .pop();

    const now = new Date();
    const milestones: PredictionResult["wellness_milestones"] = [];

    milestones.push({
      title: "Next grooming session",
      date: nextGroomingDate,
      priority: "medium",
      rationale: `Based on ${coat.coatType} coat needs and breed profile (${breed}).`,
    });

    milestones.push({
      title: "Annual wellness exam",
      date: toIsoDate(addDays(now, 180)),
      priority: "medium",
      rationale: "Routine preventive exam for ongoing health monitoring.",
    });

    milestones.push({
      title: "Deworming schedule",
      date: toIsoDate(addDays(now, 90)),
      priority: "medium",
      rationale: "Recommended recurring deworming cycle.",
    });

    milestones.push({
      title: "Dental checkup",
      date: toIsoDate(addDays(now, 210)),
      priority: "low",
      rationale: "Preventive oral health check and cleaning guidance.",
    });

    if (latestVaccineDue) {
      milestones.push({
        title: "Vaccine due",
        date: toIsoDate(latestVaccineDue),
        priority: latestVaccineDue < addDays(now, 45) ? "high" : "medium",
        rationale: "Derived from record vaccine due dates.",
      });
    }

    if (ageYears !== null && ageYears >= 7) {
      milestones.push({
        title: "Senior screening eligibility",
        date: toIsoDate(addDays(now, 30)),
        priority: "high",
        rationale: "Age-based senior wellness screening recommendation.",
      });
    }

    milestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      stage: "generate_pet_care_predictions",
      grooming: {
        breed,
        coat_type: coat.coatType,
        interval_days: coat.intervalDays,
        recommended_next_grooming_date: nextGroomingDate,
        based_on: lastGrooming ? "last grooming date from records" : "breed baseline interval",
      },
      wellness_milestones: milestones,
    };
  },

  async compilePetHealthTimeline(input: {
    petId: string;
    extracted: ExtractMedicalDataResult;
  }): Promise<CompileTimelineResult> {
    const events: TimelineEntry[] = [];

    for (const vaccine of input.extracted.structured.vaccines) {
      if (!vaccine.date) continue;
      events.push({
        date: vaccine.date,
        event_type: "vaccination",
        details: `${vaccine.name}${vaccine.next_due_date ? ` (next due ${vaccine.next_due_date})` : ""}`,
        source_record: vaccine.source || "medical_record",
        confidence: vaccine.confidence ?? null,
      });
    }

    for (const visit of input.extracted.structured.medical_visits) {
      if (!visit.date) continue;
      events.push({
        date: visit.date,
        event_type: /groom/i.test(visit.details) ? "grooming" : "vet_visit",
        details: visit.details,
        source_record: visit.source || "medical_record",
        confidence: visit.confidence ?? null,
      });
    }

    for (const condition of input.extracted.structured.diagnosed_conditions) {
      events.push({
        date: toIsoDate(new Date()),
        event_type: "diagnosis",
        details: condition,
        source_record: "medical_record",
        confidence: 70,
      });
    }

    const { data: bookings } = await supabaseAdmin
      .from("bookings")
      .select("id, created_at, checkin, service_name, service_type")
      .eq("pet_id", input.petId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    (bookings ?? []).forEach((b: any) => {
      const bookingDate = toText(b.checkin) || toText(b.created_at);
      if (!bookingDate) return;
      events.push({
        date: bookingDate.slice(0, 10),
        event_type: /groom/i.test(toText(b.service_type) + toText(b.service_name)) ? "grooming" : "booking",
        details: `${toText(b.service_name) || "Service booking"} (${toText(b.service_type) || "service"})`,
        source_record: `booking:${b.id}`,
        confidence: 100,
      });
    });

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const careGapFlags: string[] = [];
    const lastVetLike = [...events].reverse().find((e) => e.event_type === "vet_visit" || e.event_type === "vaccination");
    if (lastVetLike) {
      const lastDate = new Date(lastVetLike.date);
      const diffDays = Math.floor((Date.now() - lastDate.getTime()) / (24 * 60 * 60 * 1000));
      if (diffDays > 365) {
        careGapFlags.push("No vet visit or vaccination recorded in over 12 months");
      }
    } else {
      careGapFlags.push("No vet visit or vaccination history found");
    }

    return {
      stage: "compile_pet_health_timeline",
      timeline: events,
      careGapFlags,
    };
  },

  async analyzePetHealthData(input: AnalyzePetHealthDataInput): Promise<AnalyzePetHealthDataOutput> {
    const extracted = await this.extractMedicalData(input);
    const validation = this.validateRecordAuthenticity(extracted);

    const flags = [
      ...validation.issues,
      ...extracted.lowConfidenceFields.map((field) => `Low confidence field: ${field}`),
    ];

    if (validation.shouldPauseForReview) {
      return {
        extracted,
        validation,
        predictions: null,
        timeline: null,
        flags,
      };
    }

    const predictions = await this.generatePetCarePredictions({
      extracted,
      petSnapshot: input.petSnapshot,
    });

    const timeline = await this.compilePetHealthTimeline({
      petId: input.petId,
      extracted,
    });

    flags.push(...timeline.careGapFlags);

    return {
      extracted,
      validation,
      predictions,
      timeline,
      flags,
    };
  },
};
