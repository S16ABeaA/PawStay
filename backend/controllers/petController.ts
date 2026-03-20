import { Request, Response } from "express";
import { petModel } from "../models/petModel";
import { serviceHistoryModel } from "../models/serviceHistoryModel";
import PDFDocument from "pdfkit";
import { petHealthRecordPipelineService } from "../services/petHealthRecordPipelineService";
import { petHealthRecordModel } from "../models/petHealthRecordModel";
import { petHealthCheckService } from "../ai/petHealthCheckService";
import {
  clearPetCareNotificationsForPet,
  dispatchPetCareNotificationsForPet,
} from "../services/petCareNotificationJobs";
import { supabaseAdmin } from "../config/supabaseAdmin";
import { extractTextFromDocumentBuffer } from "../services/ocrService";

const toDate = (value: unknown): Date | null => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toStatus = (record: any): "All Good" | "Needs Attention" | "Urgent" => {
  const validation = String(record?.validation_status || record?.compiled_record?.validation?.status || "").toLowerCase();
  const flagged = Number(record?.compiled_record?.diagnostic_summary?.flagged_fields || 0);
  if (validation === "suspicious") return "Urgent";
  if (validation === "incomplete" || flagged > 0) return "Needs Attention";
  return "All Good";
};

const toPdfFileName = (petName: string, createdAt: string) => {
  const day = new Date(createdAt || Date.now()).toISOString().slice(0, 10);
  const clean = String(petName || "Pet").replace(/[^a-zA-Z0-9_-]+/g, "_");
  return `${clean}_Diagnostic_${day}.pdf`;
};

const writeDiagnosticPdf = async (res: Response, input: { pet: any; record: any }) => {
  const { pet, record } = input;
  const compiled = (record?.compiled_record || {}) as any;
  const extracted = (compiled?.pet_profile?.extracted || {}) as any;
  const predictions = (compiled?.predictions || {}) as any;
  const timeline = Array.isArray(compiled?.timeline?.timeline) ? compiled.timeline.timeline : [];
  const summary = (compiled?.diagnostic_summary || {}) as any;

  const filename = toPdfFileName(pet?.name || "Pet", record?.created_at || new Date().toISOString());
  const doc = new PDFDocument({ margin: 42, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  doc.on("end", () => {
    const pdfBuffer = Buffer.concat(chunks);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
    res.status(200).send(pdfBuffer);
  });

  const photo = String(pet?.photo_url || "").trim();
  if (photo.startsWith("data:image/")) {
    const match = photo.match(/^data:[^;]+;base64,(.+)$/i);
    if (match) {
      try { doc.image(Buffer.from(match[1], "base64"), 42, 42, { fit: [90, 90] }); } catch {}
    }
  }

  doc.fontSize(18).text("PawStay Full Health Diagnostic Report", 145, 44);
  doc.moveDown(2);
  doc.fontSize(11).text(`Pet: ${pet?.name || "N/A"}`);
  doc.text(`Breed: ${pet?.breed || extracted?.pet?.breed || "N/A"}`);
  doc.text(`Owner ID: ${record?.owner_id || "N/A"}`);
  doc.text(`Run Date: ${new Date(record?.created_at || Date.now()).toLocaleString()}`);
  doc.text(`Overall Status: ${toStatus(record)}`);
  doc.text(`Pet ID: ${record?.pet_id || pet?.id || "N/A"}`);

  doc.moveDown();
  doc.fontSize(13).text("1) Breed and Identity Verification", { underline: true });
  doc.fontSize(10).text(`Detected Breed: ${compiled?.pet_profile?.detected_breed || pet?.breed || "Unknown"}`);
  doc.text(`Saved Breed: ${pet?.breed || "Unknown"}`);
  doc.text(`Confidence: ${summary?.overall_confidence_score || record?.ocr_confidence_score || 0}%`);

  doc.moveDown(0.7);
  doc.fontSize(13).text("2) Extracted Health Data", { underline: true });
  doc.fontSize(10).text(`Vet: ${extracted?.vet?.name || "N/A"}`);
  doc.text(`Last Grooming Date: ${extracted?.last_grooming_date || "N/A"}`);
  doc.text(`Conditions: ${(extracted?.diagnosed_conditions || []).join(", ") || "None"}`);
  doc.text(`Medications: ${(extracted?.prescribed_medications || []).join(", ") || "None"}`);
  doc.text(`Vaccines:`);
  (extracted?.vaccines || []).slice(0, 8).forEach((v: any) => {
    doc.text(`- ${v.name || "Vaccine"} | date: ${v.date || "N/A"} | due: ${v.next_due_date || "N/A"}`);
  });

  doc.moveDown(0.7);
  doc.fontSize(13).text("3) Validation and Flags", { underline: true });
  doc.fontSize(10).text(`Validation Status: ${record?.validation_status || compiled?.validation?.status || "N/A"}`);
  const flags = Array.isArray(compiled?.flags) ? compiled.flags : [];
  if (flags.length) flags.slice(0, 12).forEach((f: string) => doc.text(`- ${f}`));
  else doc.text("No flagged issues.");

  doc.moveDown(0.7);
  doc.fontSize(13).text("4) Care Gap Analysis", { underline: true });
  const milestones = Array.isArray(predictions?.wellness_milestones) ? predictions.wellness_milestones : [];
  if (milestones.length) {
    milestones.slice(0, 8).forEach((m: any) => {
      doc.fontSize(10).text(`- ${m.title || "Milestone"}: ${m.date || "N/A"} (${m.priority || "medium"})`);
    });
  } else {
    doc.fontSize(10).text("No milestone recommendations were generated.");
  }

  doc.moveDown(0.7);
  doc.fontSize(13).text("5) Ranked Recommendations", { underline: true });
  const recs = milestones
    .map((m: any) => ({
      text: `${m.title || "Care action"} — ${m.rationale || "Based on diagnostic analysis."}`,
      priority: String(m.priority || "medium").toLowerCase(),
    }))
    .sort((a: any, b: any) => {
      const rank: Record<string, number> = { high: 0, urgent: 0, medium: 1, low: 2 };
      return (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3);
    });
  if (recs.length) recs.slice(0, 10).forEach((r: any) => doc.fontSize(10).text(`- ${r.text}`));
  else doc.fontSize(10).text("No recommendations generated.");

  doc.moveDown(0.7);
  doc.fontSize(13).text("6) Chronological Timeline", { underline: true });
  if (timeline.length) {
    timeline.slice(0, 40).forEach((e: any) => {
      doc.fontSize(10).text(`- ${e.date || "N/A"} | ${e.event_type || "event"} | ${e.details || ""}`);
    });
  } else {
    doc.fontSize(10).text("No timeline entries available.");
  }

  doc.moveDown();
  doc.fontSize(9).fillColor("#666666").text(
    `Generated by PawStay • ${new Date().toISOString()} • Pet ID: ${record?.pet_id || pet?.id || "N/A"}`,
  );
  doc.end();
};

/** GET /api/pets — list current user's pets (with service history) */
export const listPets = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const pets = await petModel.getByOwner(userId);

    // Attach service history to each pet
    const petsWithHistory = await Promise.all(
      pets.map(async (pet) => {
        try {
          const history = await serviceHistoryModel.getByPet(pet.id);
          return {
            ...pet,
            serviceHistory: history.map((h) => ({
              id: h.id,
              bookingId: h.booking_id,
              type: h.service_type,
              serviceName: h.service_name,
              date: h.performed_at,
              notes: h.notes,
            })),
          };
        } catch {
          return { ...pet, serviceHistory: [] };
        }
      })
    );

    return res.json({ pets: petsWithHistory });
  } catch (err: any) {
    console.error("listPets error:", err);
    return res.status(500).json({ error: "Failed to fetch pets." });
  }
};

/** GET /api/pets/:id — get one pet (must belong to user) */
export const getPet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const rawId = String(req.params.id ?? "").trim();

    const isUUID = (s: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);

    let pet = null as any;
    if (isUUID(rawId)) {
      pet = await petModel.getById(rawId, userId);
    } else {
      // Fallback: treat the param as a pet name and try to resolve by owner+name
      pet = await petModel.getByOwnerAndName(userId, rawId);
    }

    if (!pet) return res.status(404).json({ error: "Pet not found." });

    return res.json({ pet });
  } catch (err: any) {
    console.error("getPet error:", err);
    return res.status(500).json({ error: "Failed to fetch pet." });
  }
};

/** POST /api/pets — create a new pet */
export const createPet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { name, species, breed, birthday, weight, photo_url, notes } = req.body;

    if (!name || !species || !birthday || weight == null) {
      return res.status(400).json({ error: "Missing required fields: name, species, birthday, weight." });
    }

    const pet = await petModel.create(userId, {
      name,
      species,
      breed: breed || "",
      birthday,
      weight: parseFloat(weight),
      photo_url: photo_url || null,
      notes: notes || null,
    });

    return res.status(201).json({ pet });
  } catch (err: any) {
    console.error("createPet error:", err);
    return res.status(500).json({ error: "Failed to create pet.", details: err?.message || err });
  }
};

/** PUT /api/pets/:id — update a pet */
export const updatePet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { name, species, breed, birthday, weight, photo_url, notes } = req.body;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (species !== undefined) updates.species = species;
    if (breed !== undefined) updates.breed = breed;
    if (birthday !== undefined) updates.birthday = birthday;
    if (weight !== undefined) updates.weight = parseFloat(weight);
    if (photo_url !== undefined) updates.photo_url = photo_url;
    if (notes !== undefined) updates.notes = notes;

    const pet = await petModel.update(req.params.id as string, userId, updates);
    return res.json({ pet });
  } catch (err: any) {
    console.error("updatePet error:", err);
    return res.status(500).json({ error: "Failed to update pet." });
  }
};

/** DELETE /api/pets/:id — soft-delete a pet */
export const deletePet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await petModel.softDelete(req.params.id as string, userId);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("deletePet error:", err);
    return res.status(500).json({ error: "Failed to delete pet." });
  }
};

/** POST /api/pets/:id/health-record — run extraction/prediction/timeline pipeline and save a new version */
export const processPetHealthRecord = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const petId = String(req.params.id || "").trim();
    if (!petId) return res.status(400).json({ error: "Pet ID is required" });

    const pet = await petHealthRecordModel.getPetByOwner(petId, userId);
    if (!pet) return res.status(404).json({ error: "Pet not found" });

    const uploadedFile = (req as any).file as Express.Multer.File | undefined;
    const body = (req.body ?? {}) as {
      documentBase64?: string;
      detectedBreed?: string;
      detectedBreedConfidence?: number;
      sourceFileName?: string;
      rerunStage?: "extract_medical_data" | "validate_record_authenticity" | "generate_pet_care_predictions" | "compile_pet_health_timeline";
      priorExtractedData?: Record<string, unknown>;
    };

    const documentBase64 = String(body.documentBase64 || "").trim();
    const hasPriorExtracted = Boolean(body.priorExtractedData && Object.keys(body.priorExtractedData).length > 0);
    if (!uploadedFile?.buffer?.length && !documentBase64 && !hasPriorExtracted) {
      return res.status(400).json({ error: "Provide file upload, documentBase64, or priorExtractedData for stage reruns" });
    }

    const detectedBreed = String(body.detectedBreed || pet.breed || "Unknown").trim();

    const result = await petHealthRecordPipelineService.analyzePetHealthData({
      petId,
      ownerId: userId,
      detectedBreed,
      detectedBreedConfidence: Number(body.detectedBreedConfidence) || 0,
      petSnapshot: {
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        birthday: pet.birthday,
      },
      documents: [
        {
          fileName: uploadedFile?.originalname || body.sourceFileName || "health-record",
          mimeType: uploadedFile?.mimetype,
          fileBuffer: uploadedFile?.buffer,
          base64: documentBase64 || undefined,
        },
      ],
      sourceFileName: uploadedFile?.originalname || body.sourceFileName || undefined,
      rerunStage: body.rerunStage,
      priorExtractedData: body.priorExtractedData as any,
    });

    const compiled = {
      pet_profile: {
        pet_id: petId,
        owner_id: userId,
        detected_breed: detectedBreed,
        extracted: result.extracted.structured,
      },
      predictions: result.predictions,
      timeline: result.timeline,
      flags: result.flags,
      validation: result.validation,
    };

    const metadata = {
      upload_timestamp: new Date().toISOString(),
      ocr_confidence_score: result.extracted.ocrConfidenceScore,
      validation_status: result.validation.status,
      source_file_name: uploadedFile?.originalname || body.sourceFileName || null,
      detected_breed: detectedBreed,
    };

    const saved = await petHealthRecordModel.create({
      petId,
      ownerId: userId,
      compiledRecord: compiled,
      rawExtractedJson: {
        extracted: result.extracted,
      },
      metadata,
      sourceFileName: metadata.source_file_name,
      validationStatus: result.validation.status,
      ocrConfidenceScore: result.extracted.ocrConfidenceScore,
    });

    return res.status(201).json({
      pet_id: petId,
      version: saved.version,
      compiled_record: saved.compiled_record,
      raw_extracted_json: saved.raw_extracted_json,
      metadata: saved.metadata,
      validation_status: saved.validation_status,
    });
  } catch (err: any) {
    console.error("processPetHealthRecord error:", err);
    return res.status(500).json({ error: err.message || "Failed to process pet health record" });
  }
};

/** GET /api/pets/:id/health-record — fetch latest compiled health record */
export const getLatestPetHealthRecord = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const petId = String(req.params.id || "").trim();
    const latest = await petHealthRecordModel.getLatestByPet(petId, userId);
    if (!latest) return res.status(404).json({ error: "No health record found for this pet" });

    return res.json({
      pet_id: latest.pet_id,
      version: latest.version,
      compiled_record: latest.compiled_record,
      raw_extracted_json: latest.raw_extracted_json,
      metadata: latest.metadata,
      created_at: latest.created_at,
    });
  } catch (err: any) {
    console.error("getLatestPetHealthRecord error:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch pet health record" });
  }
};

/** GET /api/pets/:id/health-record/download?format=pdf|json */
export const downloadLatestPetHealthRecord = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const petId = String(req.params.id || "").trim();
    const latest = await petHealthRecordModel.getLatestByPet(petId, userId);
    if (!latest) return res.status(404).json({ error: "No health record found for this pet" });

    const format = String(req.query.format || "json").toLowerCase();

    if (format === "json") {
      const baseName = `pet-${petId}-health-record-v${latest.version}`;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename=\"${baseName}.json\"`);
      return res.status(200).json({
        pet_id: latest.pet_id,
        owner_id: latest.owner_id,
        version: latest.version,
        compiled_record: latest.compiled_record,
        raw_extracted_json: latest.raw_extracted_json,
        metadata: latest.metadata,
        validation_status: latest.validation_status,
        ocr_confidence_score: latest.ocr_confidence_score,
        created_at: latest.created_at,
      });
    }

    if (format === "pdf") {
      const pet = await petHealthRecordModel.getPetByOwner(petId, userId);
      if (!pet) return res.status(404).json({ error: "Pet not found" });
      await writeDiagnosticPdf(res, { pet, record: latest });
      return;
    }

    return res.status(400).json({ error: "Invalid format. Use ?format=json or ?format=pdf" });
  } catch (err: any) {
    console.error("downloadLatestPetHealthRecord error:", err);
    return res.status(500).json({ error: err.message || "Failed to download pet health record" });
  }
};

const parseDataUrl = (value: string): { mimeType: string; buffer: Buffer } | null => {
  const input = String(value || "").trim();
  const match = input.match(/^data:([^;]+);base64,(.+)$/i);
  if (!match) return null;
  return {
    mimeType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], "base64"),
  };
};

const parseStoredUrls = (raw: unknown): string[] => {
  const text = String(raw || "").trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v || "").trim()).filter(Boolean);
      }
    } catch {
      // fall back to single value below
    }
  }
  return [text];
};

const getSourceFileNameFromUrl = (value: string, fallback: string): string => {
  try {
    const u = new URL(value);
    const last = u.pathname.split("/").filter(Boolean).pop();
    return String(last || fallback);
  } catch {
    return fallback;
  }
};

const collectServiceHistoryDocuments = async (petId: string, ownerId: string) => {
  const { data: bookingRows, error } = await supabaseAdmin
    .from("bookings")
    .select("id, checkin, vaccine_record_url, med_cert_url")
    .eq("pet_id", petId)
    .eq("user_id", ownerId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) throw error;

  const docs: Array<{ fileName: string; mimeType?: string; fileBuffer?: Buffer; base64?: string }> = [];
  const seen = new Set<string>();

  for (const row of bookingRows ?? []) {
    const candidates = [
      ...parseStoredUrls((row as any).vaccine_record_url),
      ...parseStoredUrls((row as any).med_cert_url),
    ];

    for (const candidate of candidates) {
      const url = String(candidate || "").trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);

      const fromDataUrl = parseDataUrl(url);
      if (fromDataUrl) {
        docs.push({
          fileName: `service-history-${(row as any).id || "record"}-inline`,
          mimeType: fromDataUrl.mimeType,
          fileBuffer: fromDataUrl.buffer,
        });
      } else if (/^https?:\/\//i.test(url)) {
        try {
          const response = await fetch(url);
          if (!response.ok) continue;
          const contentType = String(response.headers.get("content-type") || "application/octet-stream");
          const arr = await response.arrayBuffer();
          const buffer = Buffer.from(arr);
          if (!buffer.length) continue;
          docs.push({
            fileName: getSourceFileNameFromUrl(url, `service-history-${(row as any).id || "record"}`),
            mimeType: contentType,
            fileBuffer: buffer,
          });
        } catch {
          // skip unreadable document URLs
        }
      }

      if (docs.length >= 12) break;
    }

    if (docs.length >= 12) break;
  }

  return docs;
};

const runDiagnosticCore = async (pet: any, userId: string, petId: string, confirmedBreed?: string) => {
  const latest = await petHealthRecordModel.getLatestByPet(petId, userId);
  const priorExtracted = ((latest?.raw_extracted_json as any)?.extracted?.structured || undefined) as any;
  const serviceHistoryDocuments = await collectServiceHistoryDocuments(petId, userId);

  let detectedBreed = String(confirmedBreed || pet.breed || "Unknown").trim();
  let detectedBreedConfidence = 0;

  if (pet.photo_url) {
    try {
      let imageBuffer: Buffer | null = null;
      let mimeType = "image/jpeg";

      const fromDataUrl = parseDataUrl(pet.photo_url);
      if (fromDataUrl) {
        imageBuffer = fromDataUrl.buffer;
        mimeType = fromDataUrl.mimeType;
      } else {
        const photoRes = await fetch(pet.photo_url);
        if (photoRes.ok) {
          const arr = await photoRes.arrayBuffer();
          imageBuffer = Buffer.from(arr);
          mimeType = String(photoRes.headers.get("content-type") || "image/jpeg");
        }
      }

      if (imageBuffer?.length) {
        const healthCheck = await petHealthCheckService.analyzeImage(imageBuffer, mimeType, pet.species);
        const modelBreed = String(healthCheck?.breed_estimate?.primary || "").trim();
        const modelConfidence = Number(healthCheck?.breed_estimate?.confidence || 0);
        if (modelBreed && modelBreed.toLowerCase() !== "unknown") {
          detectedBreed = modelBreed;
          detectedBreedConfidence = Math.max(0, Math.min(100, Math.round(modelConfidence)));
        }
      }
    } catch {
      // Keep profile breed fallback
    }
  }

  const result = await petHealthRecordPipelineService.analyzePetHealthData({
    petId,
    ownerId: userId,
    detectedBreed,
    detectedBreedConfidence,
    petSnapshot: {
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      birthday: pet.birthday,
    },
    documents: serviceHistoryDocuments,
    rerunStage: "extract_medical_data",
    priorExtractedData: priorExtracted,
    sourceFileName: serviceHistoryDocuments[0]?.fileName || "diagnostic-from-profile",
  });

  const countExtractedFields = (() => {
    const s = result.extracted.structured;
    let count = 0;
    if (s.pet.name) count += 1;
    if (s.pet.species) count += 1;
    if (s.pet.breed) count += 1;
    if (s.pet.date_of_birth) count += 1;
    if (s.owner.name) count += 1;
    if (s.owner.contact) count += 1;
    if (s.vet.name) count += 1;
    if (s.vet.clinic) count += 1;
    count += s.vaccines.length;
    count += s.diagnosed_conditions.length;
    count += s.prescribed_medications.length;
    return count;
  })();

  const flaggedCount = result.flags.length;
  const profileRes = await supabaseAdmin
    .from("profiles")
    .select("address")
    .eq("id", userId)
    .maybeSingle();
  const savedAddress = String(profileRes.data?.address || "").trim();
  const locationQuery = savedAddress ? `&location=${encodeURIComponent(savedAddress)}` : "&geoPending=1";
  const recommendations = (Array.isArray(result.predictions?.wellness_milestones)
    ? result.predictions.wellness_milestones
    : []
  ).map((item: any) => {
    const title = String(item?.title || "Care action");
    const isGrooming = /groom/i.test(title);
    const date = String(item?.date || new Date().toISOString().slice(0, 10));
    const priority = String(item?.priority || "medium").toLowerCase();
    const rank = priority === "high" ? "Urgent" : priority === "medium" ? "Alert" : "Reminder";
    return {
      title,
      rationale: String(item?.rationale || "Based on diagnostic analysis."),
      priority: rank,
      date,
      deep_link: `${isGrooming ? "/grooming" : "/veterinary"}?date=${encodeURIComponent(date)}${locationQuery}`,
    };
  });

  const overallConfidence = Math.max(
    0,
    Math.min(100, Math.round((result.extracted.ocrConfidenceScore * 0.6) + (detectedBreedConfidence * 0.4))),
  );

  const runTimestamp = new Date().toISOString();
  const compiled = {
    pet_profile: {
      pet_id: petId,
      owner_id: userId,
      detected_breed: detectedBreed,
      extracted: result.extracted.structured,
    },
    predictions: result.predictions,
    timeline: result.timeline,
    flags: result.flags,
    validation: result.validation,
    diagnostic_summary: {
      run_timestamp: runTimestamp,
      extracted_fields: countExtractedFields,
      flagged_fields: flaggedCount,
      overall_confidence_score: overallConfidence,
        recommendation_count: recommendations.length,
    },
      recommendations,
  };

  const metadata = {
    upload_timestamp: runTimestamp,
    ocr_confidence_score: result.extracted.ocrConfidenceScore,
    validation_status: result.validation.status,
    source_file_name: "diagnostic-from-profile",
    detected_breed: detectedBreed,
    diagnostic: {
      run_timestamp: runTimestamp,
      extracted_fields: countExtractedFields,
      flagged_fields: flaggedCount,
      overall_confidence_score: overallConfidence,
      steps: [
        "breed_detection",
        "extract_medical_data",
        "validate_record_authenticity",
        "generate_pet_care_predictions",
        "compile_pet_health_timeline",
        "report_summary",
      ],
    },
  };

  return {
    pet,
    compiled,
    metadata,
    validationStatus: result.validation.status,
    overallConfidence,
    extracted: result.extracted,
    validation: result.validation,
    predictions: result.predictions,
    timeline: result.timeline,
    flags: result.flags,
    summary: {
      run_timestamp: runTimestamp,
      extracted_fields: countExtractedFields,
      flagged_fields: flaggedCount,
      overall_confidence_score: overallConfidence,
      flagged_items: result.flags,
      overall_status: result.validation.status === "suspicious" ? "Urgent" : (flaggedCount > 0 || result.validation.status === "incomplete" ? "Needs Attention" : "All Good"),
      recommendation_count: recommendations.length,
    },
    steps: {
      step1_breed_identity: {
        confirmed_breed: detectedBreed,
        confidence_score: detectedBreedConfidence,
        saved_breed: pet.breed,
        mismatch: detectedBreed && pet.breed && detectedBreed.toLowerCase() !== String(pet.breed).toLowerCase(),
      },
      step2_health_record_scan: result.extracted,
      step3_record_validation: result.validation,
      step4_care_gap_analysis: {
        care_gaps: result.timeline?.careGapFlags || [],
        validation_status: result.validation.status,
      },
      step5_recommendations: {
        items: recommendations,
      },
      step6_timeline_compilation: result.timeline,
      step7_report_summary: {
        summary: {
          run_timestamp: runTimestamp,
          extracted_fields: countExtractedFields,
          flagged_fields: flaggedCount,
          overall_confidence_score: overallConfidence,
        },
      },
    },
  };
};

/** GET /api/pets/:id/health-record/history */
export const getPetDiagnosticHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const petId = String(req.params.id || "").trim();
    const pet = await petHealthRecordModel.getPetByOwner(petId, userId);
    if (!pet) return res.status(404).json({ error: "Pet not found" });

    const records = await petHealthRecordModel.listByPet(petId, userId, 100);
    return res.json({
      pet_id: petId,
      history: records.map((r) => ({
        version: r.version,
        created_at: r.created_at,
        validation_status: r.validation_status,
        overall_status: toStatus(r),
        recommendation_count: Number((r.compiled_record as any)?.diagnostic_summary?.recommendation_count || 0),
        flagged_fields: Number((r.compiled_record as any)?.diagnostic_summary?.flagged_fields || 0),
      })),
    });
  } catch (err: any) {
    console.error("getPetDiagnosticHistory error:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch diagnostic history" });
  }
};

/** GET /api/pets/:id/health-record/:version */
export const getPetDiagnosticVersion = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const petId = String(req.params.id || "").trim();
    const version = Number(req.params.version);
    if (!Number.isFinite(version) || version <= 0) {
      return res.status(400).json({ error: "Invalid diagnostic version" });
    }

    const pet = await petHealthRecordModel.getPetByOwner(petId, userId);
    if (!pet) return res.status(404).json({ error: "Pet not found" });

    const record = await petHealthRecordModel.getByPetVersion(petId, userId, version);
    if (!record) return res.status(404).json({ error: "Diagnostic report not found" });

    return res.json({
      pet_id: petId,
      version: record.version,
      created_at: record.created_at,
      overall_status: toStatus(record),
      compiled_record: record.compiled_record,
      raw_extracted_json: record.raw_extracted_json,
      metadata: record.metadata,
      validation_status: record.validation_status,
      ocr_confidence_score: record.ocr_confidence_score,
    });
  } catch (err: any) {
    console.error("getPetDiagnosticVersion error:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch diagnostic report" });
  }
};

/** GET /api/pets/:id/health-record/:version/download?format=pdf|json */
export const downloadPetDiagnosticVersion = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const petId = String(req.params.id || "").trim();
    const version = Number(req.params.version);
    const format = String(req.query.format || "pdf").toLowerCase();

    const pet = await petHealthRecordModel.getPetByOwner(petId, userId);
    if (!pet) return res.status(404).json({ error: "Pet not found" });

    const record = await petHealthRecordModel.getByPetVersion(petId, userId, version);
    if (!record) return res.status(404).json({ error: "Diagnostic report not found" });

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename=\"pet-${petId}-diagnostic-v${version}.json\"`);
      return res.status(200).json(record);
    }

    if (format === "pdf") {
      await writeDiagnosticPdf(res, { pet, record });
      return;
    }

    return res.status(400).json({ error: "Invalid format. Use ?format=json or ?format=pdf" });
  } catch (err: any) {
    console.error("downloadPetDiagnosticVersion error:", err);
    return res.status(500).json({ error: err.message || "Failed to download diagnostic report" });
  }
};

/** POST /api/pets/:id/health-record/diagnostic/preview */
export const previewPetDiagnostic = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const petId = String(req.params.id || "").trim();
    if (!petId) return res.status(400).json({ error: "Pet ID is required" });

    const pet = await petHealthRecordModel.getPetByOwner(petId, userId);
    if (!pet) return res.status(404).json({ error: "Pet not found" });

    const confirmedBreed = String((req.body ?? {}).confirmedBreed || "").trim() || undefined;
    const run = await runDiagnosticCore(pet, userId, petId, confirmedBreed);
    return res.status(200).json({
      pet_id: petId,
      compiled_record: run.compiled,
      metadata: run.metadata,
      summary: run.summary,
      steps: run.steps,
      saved: false,
    });
  } catch (err: any) {
    console.error("previewPetDiagnostic error:", err);
    return res.status(500).json({ error: err.message || "Failed to preview pet diagnostic" });
  }
};

/** POST /api/pets/:id/health-record/diagnostic/save */
export const savePetDiagnostic = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const petId = String(req.params.id || "").trim();
    if (!petId) return res.status(400).json({ error: "Pet ID is required" });

    const pet = await petHealthRecordModel.getPetByOwner(petId, userId);
    if (!pet) return res.status(404).json({ error: "Pet not found" });

    const confirmedBreed = String((req.body ?? {}).confirmedBreed || "").trim() || undefined;
    const run = await runDiagnosticCore(pet, userId, petId, confirmedBreed);

    const saved = await petHealthRecordModel.create({
      petId,
      ownerId: userId,
      compiledRecord: run.compiled,
      rawExtractedJson: { extracted: run.extracted },
      metadata: run.metadata,
      sourceFileName: "diagnostic-from-profile",
      validationStatus: run.validationStatus,
      ocrConfidenceScore: run.overallConfidence,
    });

    await clearPetCareNotificationsForPet(petId, userId);
    await dispatchPetCareNotificationsForPet(petId, userId);

    return res.status(201).json({
      pet_id: petId,
      version: saved.version,
      validation_status: saved.validation_status,
      metadata: saved.metadata,
      compiled_record: saved.compiled_record,
      summary: run.summary,
      overall_status: toStatus(saved),
      saved: true,
    });
  } catch (err: any) {
    console.error("savePetDiagnostic error:", err);
    return res.status(500).json({ error: err.message || "Failed to save pet diagnostic" });
  }
};

/** POST /api/pets/:id/health-record/diagnostic — compatibility alias for save */
export const runPetDiagnostic = async (req: Request, res: Response) => savePetDiagnostic(req, res);

const CONDITION_TERMS = [
  "infection",
  "fever",
  "cough",
  "vomit",
  "diarrhea",
  "allergy",
  "wound",
  "injury",
  "dermatitis",
  "ear mites",
  "ticks",
  "fleas",
];

const MEDICATION_TERMS = [
  "medication",
  "medicine",
  "tablet",
  "capsule",
  "antibiotic",
  "syrup",
  "dose",
  "mg",
  "ml",
];

const VACCINE_REGEX = /(vaccine|vaccination|booster|rabies|parvo|dhpp|distemper)/gi;
const WEIGHT_REGEX = /(\d+(?:\.\d+)?)\s?kg/gi;

const parseServiceRecordDocument = async (value: string) => {
  const fromDataUrl = parseDataUrl(value);
  if (fromDataUrl) {
    return {
      mimeType: fromDataUrl.mimeType,
      buffer: fromDataUrl.buffer,
      source: "inline",
    };
  }

  if (!/^https?:\/\//i.test(value)) return null;

  try {
    const response = await fetch(value);
    if (!response.ok) return null;
    const contentType = String(response.headers.get("content-type") || "application/octet-stream");
    const arr = await response.arrayBuffer();
    const buffer = Buffer.from(arr);
    if (!buffer.length) return null;
    return {
      mimeType: contentType,
      buffer,
      source: "remote",
    };
  } catch {
    return null;
  }
};

/** GET /api/pets/:id/service-history/insights?limit=3..5 */
export const getPetServiceHistoryInsights = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const petId = String(req.params.id || "").trim();
    if (!petId) return res.status(400).json({ error: "Pet ID is required" });

    const pet = await petModel.getById(petId, userId);
    if (!pet) return res.status(404).json({ error: "Pet not found" });

    const ownerPets = await petModel.getByOwner(userId);
    const ownerPetNames = ownerPets
      .map((p) => String((p as any)?.name || "").trim())
      .filter(Boolean);

    const requestedLimit = Number(req.query.limit || 5);
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(3, Math.min(5, Math.floor(requestedLimit)))
      : 5;

    const { data: bookingRows, error } = await supabaseAdmin
      .from("bookings")
      .select("id, created_at, checkin, service_name, service_type, status, vaccine_record_url, med_cert_url")
      .eq("pet_id", petId)
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const rows = bookingRows ?? [];
    if (rows.length === 0) {
      return res.json({
        pet_id: petId,
        pet_name: pet.name,
        stats: {
          services_reviewed: 0,
          records_found: 0,
          records_scanned: 0,
          total_ocr_characters: 0,
          vaccine_mentions: 0,
          medication_mentions: 0,
          condition_mentions: 0,
        },
        notable_changes: ["No recent service history found for this pet."],
        progression: {
          trend: "stable",
          rationale: "No records available yet.",
        },
        feedback: ["Add vaccine cards or medical certificates to recent bookings for better analysis."],
        recommendations: [
          {
            title: "Upload complete records",
            reason: "Having records in recent service history enables better trend analysis.",
          },
        ],
        bookings: [],
      });
    }

    let totalRecordsFound = 0;
    let totalRecordsScanned = 0;
    let totalChars = 0;
    let vaccineMentions = 0;
    let medicationMentions = 0;
    let conditionMentions = 0;
    const allWeights: number[] = [];
    const bookingSummaries: Array<{
      booking_id: string;
      date: string;
      service_name: string;
      service_type: string;
      status: string;
      records_scanned: number;
      highlights: string[];
      condition_mentions: number;
      medication_mentions: number;
      vaccine_mentions: number;
    }> = [];
    const petNameMentions: Record<string, number> = {};
    ownerPetNames.forEach((name) => {
      petNameMentions[name] = 0;
    });

    let globalDocsProcessed = 0;
    const maxDocumentsOverall = 10;
    const maxDocsPerBooking = 2;

    for (const row of rows) {
      const urls = [
        ...parseStoredUrls((row as any).vaccine_record_url),
        ...parseStoredUrls((row as any).med_cert_url),
      ].filter(Boolean);

      totalRecordsFound += urls.length;

      let bookingRecordsScanned = 0;
      let bookingChars = 0;
      let bookingVaccineMentions = 0;
      let bookingMedicationMentions = 0;
      let bookingConditionMentions = 0;
      const bookingHighlights: string[] = [];

      for (const value of urls.slice(0, maxDocsPerBooking)) {
        if (globalDocsProcessed >= maxDocumentsOverall) break;

        const doc = await parseServiceRecordDocument(String(value || "").trim());
        if (!doc) continue;

        const ocr = await extractTextFromDocumentBuffer(doc.buffer, doc.mimeType, "eng").catch(() => null);
        const text = String(ocr?.text || "").trim();
        if (!text) continue;

        globalDocsProcessed += 1;
        bookingRecordsScanned += 1;
        totalRecordsScanned += 1;

        const lower = text.toLowerCase();
        const textLen = text.length;
        bookingChars += textLen;
        totalChars += textLen;

        const vaccineCount = (text.match(VACCINE_REGEX) || []).length;
        bookingVaccineMentions += vaccineCount;
        vaccineMentions += vaccineCount;

        const medicationCount = MEDICATION_TERMS.reduce((count, term) => {
          return count + (lower.includes(term) ? 1 : 0);
        }, 0);
        bookingMedicationMentions += medicationCount;
        medicationMentions += medicationCount;

        const conditionCount = CONDITION_TERMS.reduce((count, term) => {
          return count + (lower.includes(term) ? 1 : 0);
        }, 0);
        bookingConditionMentions += conditionCount;
        conditionMentions += conditionCount;

        const weights = Array.from(text.matchAll(WEIGHT_REGEX)).map((m) => Number(m[1])).filter((n) => Number.isFinite(n));
        if (weights.length) {
          allWeights.push(...weights);
        }

        if (vaccineCount > 0) bookingHighlights.push(`Vaccine entries mentioned (${vaccineCount})`);
        if (conditionCount > 0) bookingHighlights.push(`Possible condition keywords found (${conditionCount})`);
        if (medicationCount > 0) bookingHighlights.push(`Medication terms found (${medicationCount})`);

        ownerPetNames.forEach((name) => {
          const normalized = String(name || "").trim().toLowerCase();
          if (!normalized) return;
          const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(`\\b${escaped}\\b`, "gi");
          const count = (text.match(regex) || []).length;
          if (count > 0) {
            petNameMentions[name] = Number(petNameMentions[name] || 0) + count;
          }
        });
      }

      bookingSummaries.push({
        booking_id: String((row as any).id || ""),
        date: String((row as any).checkin || (row as any).created_at || "").slice(0, 10),
        service_name: String((row as any).service_name || "Service"),
        service_type: String((row as any).service_type || "other"),
        status: String((row as any).status || "unknown"),
        records_scanned: bookingRecordsScanned,
        highlights: bookingHighlights.slice(0, 3),
        condition_mentions: bookingConditionMentions,
        medication_mentions: bookingMedicationMentions,
        vaccine_mentions: bookingVaccineMentions,
      });
    }

    const chronological = [...bookingSummaries].reverse();
    const first = chronological[0];
    const last = chronological[chronological.length - 1];

    let trend: "progressing" | "stable" | "regressing" | "mixed" = "stable";
    let rationale = "No major movement detected in the scanned records.";

    const conditionDelta = Number(last?.condition_mentions || 0) - Number(first?.condition_mentions || 0);
    const medicationDelta = Number(last?.medication_mentions || 0) - Number(first?.medication_mentions || 0);

    if (conditionDelta < 0 && medicationDelta <= 0) {
      trend = "progressing";
      rationale = "Later records show fewer condition/medication mentions than earlier records.";
    } else if (conditionDelta > 0 || medicationDelta > 0) {
      trend = "regressing";
      rationale = "Later records contain more condition or medication mentions than earlier records.";
    } else if (conditionDelta === 0 && medicationDelta === 0 && bookingSummaries.length > 1) {
      trend = "stable";
      rationale = "Condition and medication mentions are broadly consistent across recent records.";
    }

    const notableChanges: string[] = [];
    notableChanges.push(`Scanned ${totalRecordsScanned} record(s) from the latest ${rows.length} service history item(s).`);
    if (vaccineMentions > 0) notableChanges.push(`Vaccine-related mentions were found ${vaccineMentions} time(s).`);
    if (conditionMentions > 0) notableChanges.push(`Condition-related keywords were found ${conditionMentions} time(s).`);
    if (medicationMentions > 0) notableChanges.push(`Medication-related keywords were found ${medicationMentions} time(s).`);

    if (allWeights.length >= 2) {
      const firstWeight = allWeights[0];
      const lastWeight = allWeights[allWeights.length - 1];
      const delta = Math.round((lastWeight - firstWeight) * 10) / 10;
      if (Math.abs(delta) >= 0.3) {
        notableChanges.push(`Weight changed by ${delta > 0 ? "+" : ""}${delta} kg across scanned records.`);
      }
    }

    const feedback: string[] = [];

    const selectedPetName = String(pet.name || "").trim();
    const selectedPetMentions = Number(petNameMentions[selectedPetName] || 0);
    const sortedMentions = Object.entries(petNameMentions)
      .sort((a, b) => b[1] - a[1]);
    const topMentioned = sortedMentions[0]?.[0] || selectedPetName;
    const topCount = Number(sortedMentions[0]?.[1] || 0);
    const identityMismatch = Boolean(
      topCount > 0 &&
      topMentioned &&
      topMentioned !== selectedPetName &&
      topCount > selectedPetMentions,
    );

    if (identityMismatch) {
      notableChanges.push(
        `Record identity warning: scanned documents mention '${topMentioned}' more often than '${selectedPetName}'.`,
      );
    }

    if (totalRecordsScanned === 0) {
      feedback.push("I found service history entries but couldn't OCR any attached record clearly.");
      feedback.push("Please upload clearer vaccine cards or medical certificates on upcoming bookings.");
    } else {
      feedback.push("The scan is based on OCR of attached service-history records, so unclear images can reduce reliability.");
      feedback.push("Use this as a trend guide, then confirm medical decisions with your vet.");
      if (identityMismatch) {
        feedback.push("Some uploaded records may belong to a different pet name than the selected profile.");
      }
    }

    const recommendations: Array<{ title: string; reason: string }> = [];
    if (trend === "regressing") {
      recommendations.push({
        title: "Schedule a follow-up vet check soon",
        reason: "Recent records show increasing condition/medication mentions.",
      });
    }
    if (vaccineMentions === 0) {
      recommendations.push({
        title: "Verify vaccine updates",
        reason: "No clear vaccine mentions were detected in the latest scanned records.",
      });
    }
    if (totalRecordsScanned < Math.min(rows.length, 3)) {
      recommendations.push({
        title: "Attach clearer health records",
        reason: "More readable records in service history improve the accuracy of change/progress tracking.",
      });
    }
    if (recommendations.length === 0) {
      recommendations.push({
        title: "Continue routine monitoring",
        reason: "Recent records do not indicate a strong negative trend.",
      });
    }

    if (identityMismatch) {
      recommendations.unshift({
        title: "Re-check uploaded document ownership",
        reason: `Scanned text most strongly matches '${topMentioned}', not '${selectedPetName}'.`,
      });
    }

    return res.json({
      pet_id: petId,
      pet_name: pet.name,
      stats: {
        services_reviewed: rows.length,
        records_found: totalRecordsFound,
        records_scanned: totalRecordsScanned,
        total_ocr_characters: totalChars,
        vaccine_mentions: vaccineMentions,
        medication_mentions: medicationMentions,
        condition_mentions: conditionMentions,
      },
      notable_changes: notableChanges,
      progression: {
        trend,
        rationale,
      },
      identity_check: {
        selected_pet_name: selectedPetName,
        selected_pet_mentions: selectedPetMentions,
        top_detected_pet_name: topMentioned,
        top_detected_mentions: topCount,
        mismatch: identityMismatch,
      },
      feedback,
      recommendations,
      bookings: bookingSummaries,
    });
  } catch (err: any) {
    console.error("getPetServiceHistoryInsights error:", err);
    return res.status(500).json({ error: err?.message || "Failed to analyze service history records" });
  }
};
