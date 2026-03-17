import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { aiChatApi } from "@/services/aiChatApi";
import type { PetHealthCheckResponse } from "@/services/aiChatApi";
import { Send, Bot, User, ExternalLink, ImagePlus, Maximize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

type CtaIntent = "find_vet" | "find_groomer" | "save_pet" | "view_details";
type ImageActionIntent = "analyze" | "scan_records" | "ask_question" | "cancel";

type ImageQuickReply = {
  id: ImageActionIntent;
  label: string;
};

type PetRecommendation = {
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
  previewUrl: string;
  fileName: string;
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

interface AiChatPanelProps {
  /** Extra Tailwind classes on the root wrapper */
  className?: string;
}

export const AiChatPanel = ({ className }: AiChatPanelProps) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImageContext | null>(null);
  const [imageQuestionMode, setImageQuestionMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageModelRef = useRef<any>(null);
  const rowCounterRef = useRef(0);
  const previewUrlsRef = useRef<string[]>([]);

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
      primaryConfidence: finalTopMatch,
      alternatives: finalAlternatives,
      ocrText: extracted,
      descriptionHint: `${finalPrimaryBreed} detected from visual traits.`,
      healthCheck: healthResponse
        ? {
            status: healthResponse.status,
            injured: healthResponse.injured,
            confidence: healthResponse.confidence,
            summary: healthResponse.summary,
            visible_signs: healthResponse.visible_signs,
            recommended_actions: healthResponse.recommended_actions,
            age_estimate: healthResponse.age_estimate,
            weight_estimate: healthResponse.weight_estimate,
          }
        : undefined,
    });

    const healthAssessment = healthResponse;
    const intents: CtaIntent[] = ["find_vet", "find_groomer", "save_pet", "view_details"];

    const structured: PetRecommendation = {
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
          message:
            `Summarize the following OCR text from a pet health record image. ` +
            `Return concise bullet points for: pet identity, dates, vaccinations, medications, diagnoses/findings, and follow-up recommendations. ` +
            `If a field is missing, say \"Not visible\". OCR text:\n${extractedText}`,
        });

        setRows((prev) => [
          ...prev,
          makeRow({ role: "assistant", content: summary.message || "I summarized the visible health record details." }),
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

  const onSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setRows((prev) => [...prev, makeRow({ role: "user", content: userMessage })]);
    setMessage("");

    if (pendingImage && !imageQuestionMode) {
      setRows((prev) => [
        ...prev,
        makeRow({
          role: "assistant",
          content: "Please choose what you'd like to do with the uploaded photo first.",
        }),
      ]);
      return;
    }

    try {
      setLoading(true);
      if (pendingImage && imageQuestionMode) {
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
          `Question: ${userMessage}`,
          `Detected species: ${detections.detectedSpecies || "unknown"}`,
          `Likely breeds: ${(detections.likelyBreeds || []).join(", ") || "unknown"}`,
          `OCR text: ${extractedText || "none"}`,
          "Answer the user question directly and mention uncertainty when details are not visible.",
        ].join("\n");

        const response = await aiChatApi.chat({ message: contextualMessage, sessionId });
        setRows((prev) => [...prev, makeRow({ role: "assistant", content: response.message })]);
        return;
      }

      const response = await aiChatApi.chat({ message: userMessage, sessionId });

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

    const previewUrl = URL.createObjectURL(file);
    previewUrlsRef.current.push(previewUrl);

    setPendingImage({ file, previewUrl, fileName: file.name });
    setImageQuestionMode(false);

    setRows((prev) => [
      ...prev,
      makeRow({ role: "user", content: file.name, image: previewUrl }),
      makeRow({
        role: "assistant",
        content: "What would you like to do with this photo?",
        quickReplies: IMAGE_ACTION_OPTIONS,
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

  const onActionClick = (intent: CtaIntent) => {
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
                  Visible signs: {recommendation.health_assessment.visible_signs.join(", ")}
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
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {recommendation.care_recommendations.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-rose-700">Care recommendations</p>
              <ul className="list-disc pl-5 text-xs text-gray-700">
                {recommendation.care_recommendations.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
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
                onClick={() => onActionClick(action.intent)}
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
    width: isExpanded ? "min(540px, 90vw)" : `${smallSize.w}px`,
    height: isExpanded ? "min(600px, 80vh)" : `${smallSize.h}px`,
    maxWidth: isExpanded ? "min(540px, 90vw)" : `${smallSize.w}px`,
    maxHeight: isExpanded ? "min(600px, 80vh)" : `${smallSize.h}px`,
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
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-700 transition hover:bg-rose-50"
            aria-label={isExpanded ? "Collapse chat" : "Expand chat"}
            title={isExpanded ? "Collapse chat" : "Expand chat"}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>{isExpanded ? "↙" : "↗"}</span>
          </button>
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
                    className="w-full object-cover"
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
                    className="w-full object-cover"
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

                            return (
                              <a
                                {...props}
                                href={safeHref}
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
                        {row.content}
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

      {/* Input */}
      <div className="flex items-center gap-2 border-t px-3 py-2">
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
          accept="image/*"
          onChange={onImageSelected}
          className="hidden"
        />
        <button
          type="button"
          onClick={onOpenImagePicker}
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 text-rose-700 transition hover:bg-rose-50 disabled:opacity-40"
          aria-label="Upload image"
          title="Upload image for OCR and breed detection"
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
    </div>
  );
};
