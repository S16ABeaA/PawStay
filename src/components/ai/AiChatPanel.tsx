import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { aiChatApi } from "@/services/aiChatApi";
import type { PetHealthCheckResponse } from "@/services/aiChatApi";
import { petApi } from "@/services/petApi";
import { Send, Bot, User, ExternalLink, ImagePlus, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  estimateWeightKgFromRange,
  estimateYearsFromRange,
  resolveLocationForSearch,
  savePetAutofillPayload,
} from "@/lib/aiAutofill";

type CtaIntent = "find_vet" | "find_groomer" | "save_pet" | "view_details";
type ImageActionIntent = "analyze" | "scan_records" | "ask_question" | "cancel";

type ImageQuickReply = {
  id: ImageActionIntent;
  label: string;
};

type PetRecommendation = {
  source_image_data_url?: string;
  breed_detected: {
    primary: string;
    confidence: number;
    other_likely: string[];
  };
  watch_for: string[];
  care_recommendations: string[];
  health_assessment?: PetHealthCheckResponse;
  low_confidence: boolean;
  next_actions: Array<{ label: string; intent: CtaIntent }>;
};

type ChatRow = {
  id: string;
  role: "user" | "assistant" | "tool-activity";
  content: string;
  image?: string;
  recommendation?: PetRecommendation;
  quickReplies?: ImageQuickReply[];
};

type VisionPrediction = {
  className: string;
  probability: number;
};

type PendingImageContext = {
  file: File;
  previewUrl?: string;
  fileName: string;
  isImage: boolean;
  ocrText?: string;
};

const DOG_TERMS = [
  "dog",
  "canine",
  "hound",
  "terrier",
  "retriever",
  "bulldog",
  "poodle",
  "shepherd",
  "husky",
  "beagle",
  "rottweiler",
  "dachshund",
  "chihuahua",
  "boxer",
  "doberman",
  "mastiff",
  "shih",
  "spitz",
  "malamute",
  "samoyed",
  "akita",
  "labrador",
  "golden",
];

const CAT_TERMS = [
  "cat",
  "feline",
  "persian",
  "siamese",
  "maine coon",
  "ragdoll",
  "sphynx",
  "british shorthair",
  "bengal",
];

const PIG_TERMS = ["pig", "piglet", "mini pig", "potbellied", "pot-bellied", "hog"];
const SMALL_PET_TERMS = ["rabbit", "hamster", "guinea pig", "bird", "parrot", "axolotl"];
const OTHER_ANIMAL_TERMS = [...PIG_TERMS, ...SMALL_PET_TERMS];
type SpeciesKind = "dog" | "cat" | "pig" | "animal";
const BOOKING_ID_REGEX = /(Booking\s*ID[:\s]*)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
const NEARBY_LOCATION_HINT_REGEX =
  /\b(near me|nearby|around me|around here|my area|current location|closest|nearest|near us|nearby vet|nearby groomer)\b/i;

const normalizePipeTableMarkdown = (input: string): string => {
  const text = String(input || "");
  const lines = text.split("\n");
  const output: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const next = lines[i + 1] || "";

    const isHeader = /^\s*\|.+\|\s*$/.test(line);
    const isSeparator = /^\s*\|?\s*[:-]-{2,}.*\|\s*$/.test(next);

    if (!isHeader || !isSeparator) {
      output.push(line);
      i += 1;
      continue;
    }

    const headers = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);

    i += 2;
    while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) {
      const cols = lines[i]
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);

      const pairs = headers.map((h, idx) => `${h}: ${cols[idx] || "-"}`);
      output.push(`- ${pairs.join(" | ")}`);
      i += 1;
    }
  }

  return output.join("\n");
};

const linkifyBookingIdsInMarkdown = (text: string): string => {
  return String(text || "").replace(
    BOOKING_ID_REGEX,
    (_match, id: string) => `[Booking ID: ${id}](/my-bookings?bookingId=${id})`,
  );
};

const renderBookingLinkedText = (text: string): ReactNode => {
  const raw = String(text || "");
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let idx = 0;
  const regex = new RegExp(BOOKING_ID_REGEX.source, "gi");
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      parts.push(raw.slice(lastIndex, match.index));
    }

    const bookingId = String(match[1] || "");
    parts.push(
      <a
        key={`booking-link-${bookingId}-${idx}`}
        href={`/my-bookings?bookingId=${encodeURIComponent(bookingId)}`}
        className="font-semibold underline underline-offset-2 text-rose-700 hover:text-rose-800"
      >
        Booking ID: {bookingId}
      </a>,
    );

    idx += 1;
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    parts.push(raw.slice(lastIndex));
  }

  if (parts.length === 0) return raw;
  return <>{parts}</>;
};

interface AiChatPanelProps {
  /** Extra Tailwind classes on the root wrapper */
  className?: string;
  /** floating: compact popover; page: stretches in container */
  variant?: "floating" | "page";
}

export const AiChatPanel = ({ className, variant = "floating" }: AiChatPanelProps) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [commandPets, setCommandPets] = useState<Array<{ id: string; name: string }>>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [pendingImage, setPendingImage] = useState<PendingImageContext | null>(null);
  const [imageQuestionMode, setImageQuestionMode] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageModelRef = useRef<any>(null);
  const rowCounterRef = useRef(0);
  const previewUrlsRef = useRef<string[]>([]);
  const hasAutoCollapsedQuickActionsRef = useRef(false);

  const sessionId = useMemo(() => `ui-${Date.now()}`, []);

  const makeRow = (row: Omit<ChatRow, "id">): ChatRow => {
    rowCounterRef.current += 1;
    return { id: `row-${rowCounterRef.current}`, ...row };
  };

  // Auto-scroll to latest message
  // Auto-scroll only when the latest row is a user message.
  // This prevents the view from jumping to the end while the AI is streaming
  // responses; the user stays at their current scroll position while content
  // is appended below.
  useEffect(() => {
    if (!rows || rows.length === 0) return;
    const last = rows[rows.length - 1];
    if (last && last.role === "user") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [rows]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    // Auto-collapse once after the first message, but allow manual toggling afterwards.
    if (!hasAutoCollapsedQuickActionsRef.current && rows.length > 0) {
      setShowQuickActions(false);
      hasAutoCollapsedQuickActionsRef.current = true;
    }
  }, [rows.length]);

  useEffect(() => {
    let cancelled = false;

    const loadPetsForCommands = async () => {
      try {
        const res = await petApi.list();
        const pets = Array.isArray((res as any)?.pets) ? (res as any).pets : [];
        if (cancelled) return;
        setCommandPets(
          pets
            .map((p: any) => ({ id: String(p?.id || ""), name: String(p?.name || "").trim() }))
            .filter((p: { id: string; name: string }) => Boolean(p.id && p.name))
            .slice(0, 4),
        );
      } catch {
        if (!cancelled) setCommandPets([]);
      }
    };

    loadPetsForCommands();
    return () => {
      cancelled = true;
    };
  }, []);

  const BOOKING_SHORTCUTS: Array<{ label: string; command: string }> = [
    { label: "My bookings", command: "Show my bookings and reservation statuses." },
    { label: "Upcoming reservations", command: "Show my upcoming reservations." },
    { label: "Pending reservations", command: "Show my pending bookings." },
  ];

  const TOOL_LABELS: Record<string, string> = {
    search_services: "🔍 Searching services...",
    get_pets: "🐾 Fetching your pet profiles...",
    get_pet_profile: "🐶 Fetching pet profile...",
    get_pet_service_history: "📖 Fetching pet service history...",
    read_image_text: "🖼️ Reading image text...",
    create_booking: "📝 Creating booking...",
    get_user_bookings: "📋 Fetching your bookings...",
    cancel_booking: "❌ Cancelling booking...",
    get_provider_revenue: "💰 Fetching revenue data...",
  };

  const IMAGE_ACTION_OPTIONS: ImageQuickReply[] = [
    { id: "analyze", label: "🔍 Analyze breed & health" },
    { id: "scan_records", label: "📋 Scan health records" },
    { id: "ask_question", label: "💬 Ask a question about it" },
    { id: "cancel", label: "❌ Cancel" },
  ];

  const DOCUMENT_ACTION_OPTIONS: ImageQuickReply[] = [
    { id: "scan_records", label: "📋 Scan medical record" },
    { id: "ask_question", label: "💬 Ask a question about it" },
    { id: "cancel", label: "❌ Cancel" },
  ];

  const clearQuickReplies = (rowId: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, quickReplies: [] } : row)),
    );
  };

  const runBreedAndHealthAnalysis = async (file: File) => {
    setRows((prev) => [
      ...prev,
      makeRow({ role: "tool-activity", content: "🖼️ Analyzing image (breed + health)..." }),
    ]);

    const [ocrResult, imagePredictions] = await Promise.allSettled([
      aiChatApi.readImageText(file),
      classifyImage(file),
    ]);

    const extracted =
      ocrResult.status === "fulfilled" ? String(ocrResult.value?.text || "").trim() : "";
    const predictions = imagePredictions.status === "fulfilled" ? imagePredictions.value : [];
    const { detectedSpecies, likelyBreeds, calibratedConfidence } = getAnimalDetections(predictions);

    const looksLikePet =
      (Array.isArray(predictions) && predictions.length > 0 && detectedSpecies) ||
      (likelyBreeds && likelyBreeds.length > 0);

    if (!looksLikePet) {
      const msg =
        "Hmm, I don't see a pet in this photo! Try uploading a clear picture of your dog or cat and I'll analyze their breed, health, and recommend the best PawStay services for them. 🐾\n\nIf you have a question instead, just type it below!";
      setRows((prev) => [...prev, makeRow({ role: "assistant", content: msg })]);
      return;
    }

    const primaryBreed = likelyBreeds[0] || "Unknown";
    const otherLikelyBreeds = likelyBreeds.slice(1, 3);
    const topMatch = calibratedConfidence;

    setRows((prev) => [
      ...prev,
      makeRow({ role: "tool-activity", content: "🐾 Generating image-based recommendations..." }),
    ]);

    const healthResponse = await aiChatApi
      .checkPetHealth(file, detectedSpecies || undefined)
      .catch(() => undefined);

    const geminiPrimaryBreed = String(healthResponse?.breed_estimate?.primary || "").trim();
    const geminiBreedConfidence = Number(healthResponse?.breed_estimate?.confidence ?? 0);
    const geminiAlternatives = Array.isArray(healthResponse?.breed_estimate?.alternatives)
      ? healthResponse.breed_estimate.alternatives
          .map((item) => String(item || "").trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];

    const shouldUseGeminiBreed =
      !!geminiPrimaryBreed &&
      geminiPrimaryBreed.toLowerCase() !== "unknown" &&
      geminiBreedConfidence >= Math.max(55, topMatch - 10);

    const finalPrimaryBreed = shouldUseGeminiBreed ? geminiPrimaryBreed : primaryBreed;
    const finalTopMatch = shouldUseGeminiBreed
      ? Math.max(0, Math.min(99, Math.round(geminiBreedConfidence)))
      : topMatch;
    const finalAlternatives = shouldUseGeminiBreed
      ? Array.from(new Set([...geminiAlternatives, ...otherLikelyBreeds])).slice(0, 3)
      : otherLikelyBreeds;

    const recommendationResponse = await aiChatApi.analyzePet({
      sessionId,
      detectedSpecies: detectedSpecies || "unknown",
      primaryPrediction: finalPrimaryBreed,
      primaryConfidence: finalTopMatch / 100,
      alternatives: finalAlternatives,
      ocrText: extracted,
      descriptionHint: `${finalPrimaryBreed} detected from visual traits.`,
      healthCheck: healthResponse
        ? {
            status: healthResponse.status,
            injured: healthResponse.injured,
            confidence: healthResponse.confidence > 1 ? healthResponse.confidence / 100 : healthResponse.confidence,
            summary: healthResponse.summary,
            visible_signs: healthResponse.visible_signs,
            recommended_actions: healthResponse.recommended_actions,
            age_estimate: healthResponse.age_estimate,
            weight_estimate: healthResponse.weight_estimate,
          }
        : undefined,
    });

    const healthAssessment = healthResponse;
    const sourceImageDataUrl = await fileToDataUrl(file);
    const intents: CtaIntent[] = ["find_vet", "find_groomer", "save_pet", "view_details"];

    const structured: PetRecommendation = {
      source_image_data_url: sourceImageDataUrl || undefined,
      breed_detected: {
        primary: String(recommendationResponse.breed?.primary || finalPrimaryBreed),
        confidence:
          typeof recommendationResponse.breed?.confidence === "number"
            ? Math.max(0, Math.min(100, Math.round(recommendationResponse.breed.confidence)))
            : finalTopMatch,
        other_likely: Array.isArray(recommendationResponse.breed?.alternatives)
          ? recommendationResponse.breed.alternatives
              .map((item: unknown) => String(item || "").trim())
              .filter(Boolean)
              .slice(0, 3)
          : finalAlternatives,
      },
      watch_for: Array.isArray(recommendationResponse.health_flags)
        ? recommendationResponse.health_flags
            .map((item: unknown) => String(item || "").trim())
            .filter(Boolean)
            .slice(0, 6)
        : [],
      care_recommendations: Array.isArray(recommendationResponse.care)
        ? recommendationResponse.care
            .map((item: any) => {
              const category = String(item?.category || "").trim();
              const summary = String(item?.summary || "").trim();
              const detail = String(item?.detail || "").trim();
              const normalizedSummary = summary.toLowerCase();
              const normalizedDetail = detail.toLowerCase();
              const detailWithoutRepeatedSummary = normalizedDetail.startsWith(normalizedSummary)
                ? detail.slice(summary.length).replace(/^[\s:,.\-–—]+/, "").trim()
                : detail;
              const merged = [
                category ? `${category}:` : "",
                summary,
                detailWithoutRepeatedSummary &&
                detailWithoutRepeatedSummary.toLowerCase() !== normalizedSummary
                  ? `— ${detailWithoutRepeatedSummary}`
                  : "",
              ]
                .filter(Boolean)
                .join(" ")
                .trim();
              return merged || summary;
            })
            .filter(Boolean)
            .slice(0, 6)
        : [],
      low_confidence: Boolean(recommendationResponse.low_confidence) || finalTopMatch < 50,
      health_assessment: healthAssessment,
      next_actions: Array.isArray(recommendationResponse.next_actions)
        ? recommendationResponse.next_actions
            .map((action: any) => ({
              label: String(action?.label || "").trim(),
              intent: String(action?.intent || "").trim() as CtaIntent,
            }))
            .filter((action: { label: string; intent: CtaIntent }) => intents.includes(action.intent))
        : [],
    };

    if (!structured.next_actions.some((action) => action.intent === "find_vet")) {
      structured.next_actions.push({ label: "Find a vet nearby", intent: "find_vet" });
    }
    if (!structured.next_actions.some((action) => action.intent === "find_groomer")) {
      structured.next_actions.push({ label: "Find a groomer nearby", intent: "find_groomer" });
    }
    if (!structured.next_actions.some((action) => action.intent === "save_pet")) {
      structured.next_actions.push({ label: "Save to My Pets", intent: "save_pet" });
    }

    setRows((prev) => [
      ...prev,
      makeRow({
        role: "assistant",
        content: "Here is your pet analysis summary.",
        recommendation: structured,
      }),
    ]);
  };

  const onImageActionSelect = async (rowId: string, action: ImageActionIntent) => {
    clearQuickReplies(rowId);
    if (!pendingImage) return;
    if (action === "analyze" && !pendingImage.isImage) {
      setRows((prev) => [
        ...prev,
        makeRow({
          role: "assistant",
          content: "Breed and visual health analysis works with image files only. For PDFs/documents, use Scan medical record.",
        }),
      ]);
      return;
    }


    if (action === "cancel") {
      setPendingImage(null);
      setImageQuestionMode(false);
      setMessage("");
      setRows((prev) => [
        ...prev,
        makeRow({ role: "assistant", content: "Image dismissed. You can upload another photo anytime." }),
      ]);
      return;
    }

    if (action === "ask_question") {
      setImageQuestionMode(true);
      setRows((prev) => [
        ...prev,
        makeRow({ role: "assistant", content: "Got it — ask your question about this photo and I’ll use it as context." }),
      ]);
      return;
    }

    try {
      setLoading(true);
      if (action === "scan_records") {
        const ocr = await aiChatApi.readImageText(pendingImage.file);
        const extractedText = String(ocr?.text || "").trim();

        setPendingImage((prev) => (prev ? { ...prev, ocrText: extractedText } : prev));

        if (!extractedText) {
          setRows((prev) => [
            ...prev,
            makeRow({
              role: "assistant",
              content:
                "I couldn't find readable health record text in this photo. Try a clearer, closer image of the document with better lighting.",
            }),
          ]);
          return;
        }

        const summary = await aiChatApi.chat({
          sessionId,
          message: [
            "You are reviewing OCR text from a pet health record.",
            "Provide a concise, practical report for the pet owner.",
            "Return plain markdown with these sections:",
            "1) Current Record Snapshot",
            "2) Health Status (Healthy / Needs Attention / Unclear) with short reason",
            "3) Unusual or Risky Data To Discuss With Vet",
            "4) Personalized Recommendations (next steps with timeline)",
            "Rules:",
            "- Base conclusions only on OCR text.",
            "- If details are missing, explicitly say 'Not visible'.",
            "- Flag inconsistent dates (example: vaccine before birth date) and overdue vaccines/checkups.",
            "- Mention urgent warnings if any red-flag terms appear.",
            "- Keep language clear and reassuring, but honest about uncertainty.",
            "OCR text:",
            extractedText,
          ].join("\n"),
        });

        setRows((prev) => [
          ...prev,
          makeRow({
            role: "assistant",
            content:
              summary.message ||
              "I reviewed the visible health record and highlighted status, unusual findings, and personalized next steps.",
          }),
        ]);
        return;
      }

      await runBreedAndHealthAnalysis(pendingImage.file);
      setPendingImage(null);
      setImageQuestionMode(false);
    } catch (error: any) {
      setRows((prev) => [
        ...prev,
        makeRow({
          role: "assistant",
          content: `Sorry, I couldn't process that image action: ${error?.message ?? "Unknown error."}`,
        }),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const enrichMessageWithAutoLocation = async (messageText: string): Promise<string> => {
    const message = String(messageText || "").trim();
    if (!message || !NEARBY_LOCATION_HINT_REGEX.test(message)) {
      return message;
    }

    try {
      const resolved = await resolveLocationForSearch();
      const location = String(resolved.location || "").trim();
      if (!location) return message;

      return [
        message,
        "",
        `User location context: ${location} (source: ${resolved.source}).`,
        "Use this location for nearby recommendations unless the user specifies another place.",
      ].join("\n");
    } catch {
      return message;
    }
  };

  const sendMessage = async (rawMessage: string) => {
    const userMessage = String(rawMessage || "").trim();
    if (!userMessage || loading) return;

    setRows((prev) => [...prev, makeRow({ role: "user", content: userMessage })]);

    const shouldUseImageContext = Boolean(pendingImage) && (imageQuestionMode || userMessage.length > 0);
    if (shouldUseImageContext && !imageQuestionMode) {
      setImageQuestionMode(true);
    }

    try {
      setLoading(true);
      const messageForAssistant = await enrichMessageWithAutoLocation(userMessage);

      const normalizedMessage = userMessage.toLowerCase();
      const wantsServiceHistoryScan = /(scan|analy[sz]e|review).*(service history|health record|medical record|vaccine)/i.test(normalizedMessage)
        || /(vaccine|medical).*(scan|analy[sz]e|review)/i.test(normalizedMessage);

      if (wantsServiceHistoryScan) {
        if (pendingImage) {
          // Explicit service-history scan command should not be hijacked by pending image Q&A mode.
          setPendingImage(null);
          setImageQuestionMode(false);
        }

        setRows((prev) => [...prev, makeRow({ role: "tool-activity", content: "📄 Scanning service-history health records..." })]);

        const petsRes = await petApi.list();
        const pets = Array.isArray((petsRes as any)?.pets) ? (petsRes as any).pets : [];

        if (pets.length === 0) {
          setRows((prev) => [
            ...prev,
            makeRow({ role: "assistant", content: "I couldn't find any pets on your account yet. Add a pet first, then I can scan their service-history records." }),
          ]);
          return;
        }

        const explicitPet = pets.find((p: any) => normalizedMessage.includes(String(p?.name || "").toLowerCase()));
        if (!explicitPet && pets.length > 1) {
          setRows((prev) => [
            ...prev,
            makeRow({
              role: "assistant",
              content: `I can scan service-history records, but I need which pet to scan. Reply with one name: ${pets.map((p: any) => p.name).join(", ")}.`,
            }),
          ]);
          return;
        }

        const selectedPet = explicitPet || pets[0];
        const insights = await petApi.getServiceHistoryInsights(selectedPet.id, 5);
        const stats = (insights as any)?.stats || {};
        const progression = (insights as any)?.progression || {};
        const identity = (insights as any)?.identity_check || {};
        const notableChanges = Array.isArray((insights as any)?.notable_changes)
          ? (insights as any).notable_changes
          : [];
        const feedback = Array.isArray((insights as any)?.feedback)
          ? (insights as any).feedback
          : [];
        const recommendations = Array.isArray((insights as any)?.recommendations)
          ? (insights as any).recommendations
          : [];

        const responseLines = [
          `I scanned ${selectedPet.name}'s latest service-history records (up to 5) and analyzed attached vaccine/medical files via OCR.`,
          "",
          "Common statistics:",
          `- Services reviewed: ${Number(stats?.services_reviewed || 0)}`,
          `- Records found: ${Number(stats?.records_found || 0)}`,
          `- Records scanned: ${Number(stats?.records_scanned || 0)}`,
          `- Vaccine mentions: ${Number(stats?.vaccine_mentions || 0)}`,
          `- Condition mentions: ${Number(stats?.condition_mentions || 0)}`,
          `- Medication mentions: ${Number(stats?.medication_mentions || 0)}`,
          "",
          "Notable changes:",
          ...(notableChanges.length
            ? notableChanges.map((item: string) => `- ${item}`)
            : ["- No strong notable changes detected."]),
          "",
          "Progression / Degression:",
          `- Trend: ${String(progression?.trend || "stable")}`,
          `- Why: ${String(progression?.rationale || "No major movement detected.")}`,
          "",
          "Record-to-Pet Identity Check:",
          `- Selected pet: ${String(identity?.selected_pet_name || selectedPet.name)}`,
          `- OCR top detected pet name: ${String(identity?.top_detected_pet_name || "N/A")}`,
          `- Mismatch: ${Boolean(identity?.mismatch) ? "Yes" : "No"}`,
          "",
          "Feedback:",
          ...(feedback.length
            ? feedback.map((item: string) => `- ${item}`)
            : ["- OCR quality and record completeness can affect accuracy."]),
          "",
          "Recommendations:",
          ...(recommendations.length
            ? recommendations.map((item: any) => `- ${String(item?.title || "Recommendation")}: ${String(item?.reason || "")}`)
            : ["- Continue routine monitoring and keep service records updated."]),
        ];

        setRows((prev) => [...prev, makeRow({ role: "assistant", content: responseLines.join("\n") })]);
        return;
      }

      if (pendingImage && shouldUseImageContext) {
        let extractedText = pendingImage.ocrText || "";
        if (!extractedText) {
          const ocr = await aiChatApi.readImageText(pendingImage.file).catch(() => undefined);
          extractedText = String(ocr?.text || "").trim();
          if (extractedText) {
            setPendingImage((prev) => (prev ? { ...prev, ocrText: extractedText } : prev));
          }
        }

        const predictions = await classifyImage(pendingImage.file).catch(() => [] as VisionPrediction[]);
        const detections = getAnimalDetections(predictions);

        const contextualMessage = [
          "The user is asking about an uploaded image.",
          `Question: ${messageForAssistant}`,
          `Detected species: ${detections.detectedSpecies || "unknown"}`,
          `Likely breeds: ${(detections.likelyBreeds || []).join(", ") || "unknown"}`,
          `OCR text: ${extractedText || "none"}`,
          "Answer the user question directly and mention uncertainty when details are not visible.",
        ].join("\n");

        const response = await aiChatApi.chat({ message: contextualMessage, sessionId });
        setRows((prev) => [...prev, makeRow({ role: "assistant", content: response.message })]);
        return;
      }

      const response = await aiChatApi.chat({ message: messageForAssistant, sessionId });

      // Show tool activity bubbles if the agent called any tools
      if (response.toolActivity && response.toolActivity.length > 0) {
        const activityRows: ChatRow[] = response.toolActivity.map((a) =>
          makeRow({
            role: "tool-activity",
            content: TOOL_LABELS[a.tool] ?? `⚙️ Running ${a.tool}...`,
          }),
        );
        setRows((prev) => [...prev, ...activityRows]);
      }

      setRows((prev) => [...prev, makeRow({ role: "assistant", content: response.message })]);
    } catch (error: any) {
      setRows((prev) => [
        ...prev,
        makeRow({
          role: "assistant",
          content: `Sorry, something went wrong: ${error?.message ?? "Unknown error."}`,
        }),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onSend = async () => {
    if (!message.trim() || loading) return;
    const outgoing = message.trim();
    setMessage("");
    await sendMessage(outgoing);
  };

  const onQuickCommand = async (command: string) => {
    if (loading) return;
    setMessage("");
    await sendMessage(command);
  };

  const onOpenImagePicker = () => {
    if (loading) return;
    fileInputRef.current?.click();
  };

  const loadImageClassifier = async () => {
    if (imageModelRef.current) return imageModelRef.current;

    const tf = await import("@tensorflow/tfjs");
    await tf.ready();

    const mobilenet = await import("@tensorflow-models/mobilenet");
    imageModelRef.current = await mobilenet.load();
    return imageModelRef.current;
  };

  const classifyImage = async (file: File): Promise<VisionPrediction[]> => {
    const model = await loadImageClassifier();
    const imageUrl = URL.createObjectURL(file);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load selected image"));
      });

      const results = await model.classify(img, 5);
      return Array.isArray(results)
        ? results.map((item: any) => ({
            className: String(item?.className ?? "").trim(),
            probability: Number(item?.probability ?? 0),
          }))
        : [];
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  };

  const fileToDataUrl = async (file: File): Promise<string | null> => {
    try {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file);
      });
    } catch {
      return null;
    }
  };

  const hasAnyTerm = (text: string, terms: string[]) => {
    const value = text.toLowerCase();
    return terms.some((term) => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      return regex.test(value);
    });
  };

  const getAnimalDetections = (predictions: VisionPrediction[]) => {
    const speciesByLabel = (label: string): SpeciesKind | null => {
      if (hasAnyTerm(label, DOG_TERMS)) return "dog";
      if (hasAnyTerm(label, CAT_TERMS)) return "cat";
      if (hasAnyTerm(label, PIG_TERMS)) return "pig";
      if (hasAnyTerm(label, SMALL_PET_TERMS)) return "animal";
      return null;
    };

    const tagged = predictions
      .map((prediction) => ({
        ...prediction,
        species: speciesByLabel(prediction.className),
      }))
      .filter((prediction) => Boolean(prediction.species));

    const scoreBySpecies: Record<SpeciesKind, number> = {
      dog: 0,
      cat: 0,
      pig: 0,
      animal: 0,
    };

    tagged.forEach((prediction) => {
      const species = prediction.species as SpeciesKind;
      scoreBySpecies[species] += Math.max(0, Number(prediction.probability || 0));
    });

    const topSpeciesEntry = (Object.entries(scoreBySpecies) as Array<[SpeciesKind, number]>)
      .sort((a, b) => b[1] - a[1])[0];

    const detectedSpecies = topSpeciesEntry && topSpeciesEntry[1] > 0 ? topSpeciesEntry[0] : null;

    const speciesPredictions = tagged
      .filter((prediction) => prediction.species === detectedSpecies)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 3);

    const top = speciesPredictions[0]?.probability ?? 0;
    const second = speciesPredictions[1]?.probability ?? 0;
    const margin = Math.max(0, top - second);
    const calibratedConfidence = Math.max(
      0,
      Math.min(99, Math.round((top * 100 * 0.75) + (margin * 100 * 1.25))),
    );

    return {
      detectedSpecies,
      likelyBreeds: speciesPredictions.map((prediction) => prediction.className),
      animalPredictions: speciesPredictions,
      calibratedConfidence,
    };
  };

  const onImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;

    const mime = String(file.type || "").toLowerCase();
    const isImage = mime.startsWith("image/");
    const lowerName = file.name.toLowerCase();
    const isPdf = mime === "application/pdf" || lowerName.endsWith(".pdf");
    const isTxt = mime === "text/plain" || lowerName.endsWith(".txt");
    const isDocx = mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || lowerName.endsWith(".docx");
    const isDocument = isPdf || isTxt || isDocx;

    if (!isImage && !isDocument) {
      setRows((prev) => [
        ...prev,
        makeRow({
          role: "assistant",
          content: "Unsupported file type. Please upload an image, PDF, TXT, or DOCX file for record scanning.",
        }),
      ]);
      return;
    }

    let previewUrl: string | undefined;
    if (isImage) {
      previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(previewUrl);
    }

    setPendingImage({ file, previewUrl, fileName: file.name, isImage });
    setImageQuestionMode(false);

    const quickReplies = isImage ? IMAGE_ACTION_OPTIONS : DOCUMENT_ACTION_OPTIONS;
    const uploadLabel = isImage ? "photo" : "document";

    setRows((prev) => [
      ...prev,
      makeRow({ role: "user", content: file.name, image: previewUrl }),
      makeRow({
        role: "assistant",
        content: `What would you like to do with this ${uploadLabel}?`,
        quickReplies,
      }),
    ]);
  };

  const intentToPath: Record<CtaIntent, string> = {
    find_vet: "/veterinary",
    find_groomer: "/grooming",
    save_pet: "/my-pets",
    view_details: "/my-pets",
  };

  const intentToLabel: Record<CtaIntent, string> = {
    find_vet: "Find a vet nearby",
    find_groomer: "Find a groomer nearby",
    save_pet: "Save to My Pets",
    view_details: "View details",
  };

  const onActionClick = async (intent: CtaIntent, recommendation?: PetRecommendation) => {
    if (intent === "find_vet" || intent === "find_groomer") {
      const today = new Date().toISOString().split("T")[0];
      let resolved: { location: string; source: "geolocation" | "profile" | "none"; geoPending: boolean } = {
        location: "",
        source: "none",
        geoPending: true,
      };

      try {
        resolved = await resolveLocationForSearch();
      } catch {
        // Continue with geoPending fallback instead of blocking navigation
      }

      const params = new URLSearchParams();

      if (resolved.location) params.set("location", resolved.location);
      params.set("date", today);
      if (resolved.geoPending) params.set("geoPending", "1");
      // Ensure same-route clicks still trigger destination page search handlers.
      params.set("src", "ai-chat");
      params.set("t", String(Date.now()));

      navigate(`${intentToPath[intent]}?${params.toString()}`);
      return;
    }

    if (intent === "save_pet") {
      const breed = String(recommendation?.breed_detected?.primary || "").trim();
      const breedConfidence = Number(recommendation?.breed_detected?.confidence ?? 0) / 100;

      const ageRange = recommendation?.health_assessment?.age_estimate?.range || null;
      const ageConfidence = Number(recommendation?.health_assessment?.age_estimate?.confidence ?? 0) / 100;
      const weightRange = recommendation?.health_assessment?.weight_estimate?.range || null;
      const weightConfidence = Number(recommendation?.health_assessment?.weight_estimate?.confidence ?? 0) / 100;

      const ageYears = estimateYearsFromRange(ageRange);
      const weightKg = estimateWeightKgFromRange(weightRange);

      savePetAutofillPayload({
        createdAt: new Date().toISOString(),
        imageDataUrl: recommendation?.source_image_data_url,
        breed: breed ? { value: breed, confidence: breedConfidence, source: "chat_breed_detection" } : undefined,
        ageYears: ageYears !== null ? { value: String(ageYears), confidence: ageConfidence, source: "chat_health_estimate" } : undefined,
        weightKg: weightKg !== null ? { value: String(weightKg), confidence: weightConfidence, source: "chat_health_estimate" } : undefined,
        notes: {
          breed: !breed ? "Breed could not be confidently detected from this session." : "",
          age: ageYears === null ? "Age could not be confidently detected from this session." : "",
          weight: weightKg === null ? "Weight could not be confidently detected from this session." : "",
        },
      });

      navigate(intentToPath[intent]);
      return;
    }

    navigate(intentToPath[intent]);
  };

  const RecommendationCard = ({ recommendation }: { recommendation: PetRecommendation }) => {
    const healthLabel: Record<NonNullable<PetRecommendation["health_assessment"]>["status"], string> = {
      healthy: "Healthy-looking",
      minor_issue: "Minor issue",
      injured: "Possible injury",
      urgent: "Urgent concern",
      unclear: "Unclear assessment",
    };

    return (
      <div className="max-w-[84%] overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b bg-rose-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-rose-700">
          Pet Analysis
        </div>
        <div className="px-3 py-2 text-gray-800">
          <p className="mb-2 text-sm font-semibold">
            {recommendation.breed_detected.primary} ({recommendation.breed_detected.confidence}%)
          </p>
          {recommendation.low_confidence && (
            <div className="mb-2 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-800">
              Low confidence detection: image quality or mixed-breed traits may affect accuracy.
            </div>
          )}
          {recommendation.breed_detected.other_likely.length > 0 && (
            <p className="mb-2 text-xs text-gray-600">
              Other likely breeds: {recommendation.breed_detected.other_likely.join(", ")}
            </p>
          )}
          {recommendation.health_assessment && (
            <div className="mb-2 rounded-md border border-violet-200 bg-violet-50 px-2 py-1.5 text-xs text-violet-900">
              <p className="mb-1 font-semibold">
                Health check: {healthLabel[recommendation.health_assessment.status]} ({recommendation.health_assessment.confidence}%)
              </p>
              <p className="mb-1">{recommendation.health_assessment.summary}</p>
              <p className="mb-1 text-violet-800">
                Estimated age range: {recommendation.health_assessment.age_estimate?.range || "unknown"} ({recommendation.health_assessment.age_estimate?.confidence ?? 0}%)
                {" · "}
                Estimated weight range: {recommendation.health_assessment.weight_estimate?.range || "unknown"} ({recommendation.health_assessment.weight_estimate?.confidence ?? 0}%)
              </p>
              {recommendation.health_assessment.visible_signs?.length > 0 && (
                <p className="mb-0.5 text-violet-800">
                  Visible signs: {renderBookingLinkedText(recommendation.health_assessment.visible_signs.join(", "))}
                </p>
              )}
              <p className="text-[11px] text-violet-700">{recommendation.health_assessment.disclaimer}</p>
            </div>
          )}
          {recommendation.watch_for.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-rose-700">Watch for</p>
              <ul className="list-disc pl-5 text-xs text-gray-700">
                {recommendation.watch_for.map((item, index) => (
                  <li key={`${item}-${index}`}>{renderBookingLinkedText(item)}</li>
                ))}
              </ul>
            </div>
          )}
          {recommendation.care_recommendations.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-rose-700">Care recommendations</p>
              <ul className="list-disc pl-5 text-xs text-gray-700">
                {recommendation.care_recommendations.map((item, index) => (
                  <li key={`${item}-${index}`}>{renderBookingLinkedText(item)}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {recommendation.next_actions.map((action, index) => (
              <button
                key={`${action.intent}-${index}`}
                type="button"
                className="rounded-full border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                onClick={() => onActionClick(action.intent, recommendation)}
                aria-label={action.label || intentToLabel[action.intent]}
              >
                {action.label || intentToLabel[action.intent]}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const smallSize = { w: 340, h: 480 };

  const panelStyle: React.CSSProperties = {
    width:
      variant === "page"
        ? "100%"
        : isExpanded
          ? "min(540px, 90vw)"
          : `${smallSize.w}px`,
    height:
      variant === "page"
        ? "100%"
        : isExpanded
          ? "min(600px, 80vh)"
          : `${smallSize.h}px`,
    maxWidth:
      variant === "page"
        ? "100%"
        : isExpanded
          ? "min(540px, 90vw)"
          : `${smallSize.w}px`,
    maxHeight:
      variant === "page"
        ? "100%"
        : isExpanded
          ? "min(600px, 80vh)"
          : `${smallSize.h}px`,
    display: "flex",
    flexDirection: "column",
    borderRadius: 16,
    border: "1px solid var(--border, #eee)",
    background: "#fff",
    boxShadow: "0 10px 30px rgba(16,24,40,0.12)",
    zIndex: 60,
    overflow: "hidden",
    transition:
      "width 0.3s cubic-bezier(0.4,0,0.2,1), height 0.3s cubic-bezier(0.4,0,0.2,1), max-width 0.3s cubic-bezier(0.4,0,0.2,1), max-height 0.3s cubic-bezier(0.4,0,0.2,1)",
    willChange: "width, height, max-width, max-height",
  };

  

  return (
    <div style={panelStyle} className={`${className ?? ""}`}> 
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <Bot size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">PawStay AI</p>
            <p className="text-[11px] text-muted-foreground">Ask about services, bookings & more</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {variant === "floating" && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-700 transition hover:bg-rose-50"
              aria-label={isExpanded ? "Collapse chat" : "Expand chat"}
              title={isExpanded ? "Collapse chat" : "Expand chat"}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>{isExpanded ? "↙" : "↗"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        className="overflow-y-auto px-4 py-3 space-y-3 text-sm"
        style={{
          flex: 1,
          minHeight: 0,
        }}
      >
        {rows.length === 0 && (
          <p className="text-muted-foreground text-center mt-12">
            👋 Hi! Try &quot;Find dog grooming near me&quot;
          </p>
        )}
        {rows.map((row) => (
          <div key={row.id} className={`flex gap-2 ${row.role === "user" ? "justify-end" : "justify-start"}`}>
            {row.image && row.role === "user" && (
              <>
                <div className="max-w-[60%] overflow-hidden rounded-2xl border bg-white p-1">
                  <img
                    src={row.image}
                    alt={row.content ? `Uploaded image: ${row.content}` : "Uploaded image"}
                    className="w-full object-cover cursor-zoom-in"
                    onClick={() => setExpandedImage(row.image || null)}
                  />
                </div>
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                  <User size={14} />
                </div>
              </>
            )}
            {row.image && row.role === "assistant" && (
              <>
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <Bot size={14} />
                </div>
                <div className="max-w-[60%] overflow-hidden rounded-2xl border bg-white p-1">
                  <img
                    src={row.image}
                    alt={row.content ? `Assistant image: ${row.content}` : "Assistant image"}
                    className="w-full object-cover cursor-zoom-in"
                    onClick={() => setExpandedImage(row.image || null)}
                  />
                </div>
              </>
            )}
            {!row.image && (
              <>
            {row.role === "tool-activity" && (
              <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-700">
                <span className="animate-pulse">●</span>
                {row.content}
              </div>
            )}
            {row.role === "assistant" && (
              <>
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <Bot size={14} />
                </div>
                {row.recommendation ? (
                  <RecommendationCard recommendation={row.recommendation} />
                ) : (
                  <div className="max-w-[84%] overflow-hidden rounded-2xl border bg-white shadow-sm">
                    <div className="border-b bg-rose-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                      AI Recommendation
                    </div>
                    <div className="whitespace-pre-wrap px-3 py-2 text-gray-800">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children, ...props }) => {
                            const rawHref = href || "";
                            const safeHref = rawHref.startsWith("https://localhost")
                              ? rawHref.replace("https://localhost", "http://localhost")
                              : rawHref;

                            const isInternal = safeHref && safeHref.startsWith("/");

                            if (isInternal) {
                              return (
                                <a
                                  {...props}
                                  href={safeHref}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    try {
                                      navigate(safeHref);
                                    } catch {
                                      // fallback to default navigation
                                      window.location.href = safeHref;
                                    }
                                  }}
                                  className="font-semibold underline underline-offset-2 text-rose-700 hover:text-rose-800 inline-flex items-center gap-1"
                                >
                                  <span>{children}</span>
                                </a>
                              );
                            }

                            return (
                              <a
                                {...props}
                                href={safeHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold underline underline-offset-2 text-rose-700 hover:text-rose-800 inline-flex items-center gap-1"
                              >
                                <span>{children}</span>
                                <ExternalLink size={12} className="opacity-80" />
                              </a>
                            );
                          },
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>,
                          li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
                        }}
                      >
                        {linkifyBookingIdsInMarkdown(normalizePipeTableMarkdown(row.content))}
                      </ReactMarkdown>

                      {Array.isArray(row.quickReplies) && row.quickReplies.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {row.quickReplies.map((option) => (
                            <button
                              key={`${row.id}-${option.id}`}
                              type="button"
                              onClick={() => onImageActionSelect(row.id, option.id)}
                              className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            {row.role === "user" && (
              <>
                <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 bg-rose-600 text-white rounded-br-sm">
                  {row.content}
                </div>
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                  <User size={14} />
                </div>
              </>
            )}
              </>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2 items-center">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <Bot size={14} />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-2xl px-3 py-2">
              <span className="animate-bounce [animation-delay:0ms] h-1.5 w-1.5 rounded-full bg-gray-400" />
              <span className="animate-bounce [animation-delay:150ms] h-1.5 w-1.5 rounded-full bg-gray-400" />
              <span className="animate-bounce [animation-delay:300ms] h-1.5 w-1.5 rounded-full bg-gray-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick commands */}
      <div className="border-t bg-muted/20 px-3 py-2">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Quick Actions
          </p>
          <button
            type="button"
            onClick={() => setShowQuickActions((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 hover:text-rose-800"
            aria-expanded={showQuickActions}
          >
            {showQuickActions ? "Hide" : "Show"}
            {showQuickActions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showQuickActions && (
          <div className="space-y-2">
            <div>
              <p className="mb-1 text-[10px] font-medium text-rose-700">Scan Records</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {commandPets.length > 0 ? (
                  commandPets.map((pet) => (
                    <button
                      key={`scan-${pet.id}`}
                      type="button"
                      disabled={loading}
                      onClick={() => onQuickCommand(`Scan service-history records for ${pet.name}.`) }
                      className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      For {pet.name}
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    disabled
                    className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500"
                  >
                    No pets found
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-medium text-gray-700">Bookings</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {BOOKING_SHORTCUTS.map((shortcut) => (
                  <button
                    key={shortcut.label}
                    type="button"
                    disabled={loading}
                    onClick={() => onQuickCommand(shortcut.command)}
                    className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {shortcut.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask a question or drop a photo of your pet..."
          disabled={loading}
          className="flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-50"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.txt,.docx"
          onChange={onImageSelected}
          className="hidden"
        />
        <button
          type="button"
          onClick={onOpenImagePicker}
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 text-rose-700 transition hover:bg-rose-50 disabled:opacity-40"
          aria-label="Upload image or document"
          title="Upload image, PDF, TXT, or DOCX for OCR; images also support breed detection"
        >
          <ImagePlus size={16} />
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={loading || !message.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white transition hover:bg-rose-700 disabled:opacity-40"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>

      <Dialog open={Boolean(expandedImage)} onOpenChange={(open) => !open && setExpandedImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          {expandedImage && (
            <img
              src={expandedImage}
              alt="Expanded upload preview"
              className="w-full max-h-[80vh] object-contain rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
