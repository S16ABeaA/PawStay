import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { aiChatApi } from "@/services/aiChatApi";
import type { PetHealthCheckResponse } from "@/services/aiChatApi";
import { Send, Bot, User, ExternalLink, ImagePlus } from "lucide-react";
import ReactMarkdown from "react-markdown";

type CtaIntent = "find_vet" | "find_groomer" | "save_pet" | "view_details";

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
};

type VisionPrediction = {
  className: string;
  probability: number;
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

const OTHER_ANIMAL_TERMS = ["rabbit", "hamster", "guinea pig", "bird", "parrot", "axolotl"];

interface AiChatPanelProps {
  /** Extra Tailwind classes on the root wrapper */
  className?: string;
}

export const AiChatPanel = ({ className }: AiChatPanelProps) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
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
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rows, loading]);

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

  const onSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setRows((prev) => [...prev, makeRow({ role: "user", content: userMessage })]);
    setMessage("");

    try {
      setLoading(true);
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
    const animalPredictions = predictions
      .filter(
        (prediction) =>
          hasAnyTerm(prediction.className, DOG_TERMS) ||
          hasAnyTerm(prediction.className, CAT_TERMS) ||
          hasAnyTerm(prediction.className, OTHER_ANIMAL_TERMS),
      )
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 3);

    const dogPredictions = animalPredictions.filter((prediction) =>
      hasAnyTerm(prediction.className, DOG_TERMS),
    );

    const catPredictions = animalPredictions.filter((prediction) =>
      hasAnyTerm(prediction.className, CAT_TERMS),
    );

    const detectedSpecies =
      dogPredictions.length > 0
        ? "dog"
        : catPredictions.length > 0
          ? "cat"
          : animalPredictions.length > 0
            ? "animal"
            : null;

    return {
      detectedSpecies,
      likelyBreeds: (dogPredictions.length > 0 ? dogPredictions : animalPredictions)
        .map((prediction) => prediction.className)
        .slice(0, 3),
      animalPredictions,
    };
  };

  const onImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    previewUrlsRef.current.push(previewUrl);

    setRows((prev) => [
      ...prev,
      makeRow({ role: "user", content: file.name, image: previewUrl }),
      makeRow({ role: "tool-activity", content: "🖼️ Analyzing image (text + breed detection)..." }),
    ]);

    try {
      setLoading(true);
      const [ocrResult, imagePredictions] = await Promise.allSettled([
        aiChatApi.readImageText(file),
        classifyImage(file),
      ]);

      const extracted =
        ocrResult.status === "fulfilled" ? String(ocrResult.value?.text || "").trim() : "";
      const predictions = imagePredictions.status === "fulfilled" ? imagePredictions.value : [];
      const { detectedSpecies, likelyBreeds, animalPredictions } = getAnimalDetections(predictions);

      const primaryBreed = likelyBreeds[0] || "Unknown";
      const otherLikelyBreeds = likelyBreeds.slice(1, 3);
      const topMatch = animalPredictions[0] ? Math.round(animalPredictions[0].probability * 100) : 0;

      setRows((prev) => [
        ...prev,
        makeRow({ role: "tool-activity", content: "🐾 Generating image-based recommendations..." }),
      ]);

      const [analysisResponse, healthResponse] = await Promise.allSettled([
        aiChatApi.analyzePet({
          sessionId,
          detectedSpecies: detectedSpecies || "unknown",
          primaryPrediction: primaryBreed,
          primaryConfidence: topMatch,
          alternatives: otherLikelyBreeds,
          ocrText: extracted,
          descriptionHint: `${primaryBreed} detected from visual traits.`,
        }),
        aiChatApi.checkPetHealth(file, detectedSpecies || undefined),
      ]);

      if (analysisResponse.status !== "fulfilled") {
        throw analysisResponse.reason;
      }

      const recommendationResponse = analysisResponse.value;
      const healthAssessment = healthResponse.status === "fulfilled" ? healthResponse.value : undefined;

      const intents: CtaIntent[] = ["find_vet", "find_groomer", "save_pet", "view_details"];
      const structured: PetRecommendation = {
        breed_detected: {
          primary: String(recommendationResponse.breed?.primary || primaryBreed),
          confidence:
            typeof recommendationResponse.breed?.confidence === "number"
              ? Math.max(0, Math.min(100, Math.round(recommendationResponse.breed.confidence)))
              : topMatch,
          other_likely: Array.isArray(recommendationResponse.breed?.alternatives)
            ? recommendationResponse.breed.alternatives
                .map((item: unknown) => String(item || "").trim())
                .filter(Boolean)
                .slice(0, 3)
            : otherLikelyBreeds,
        },
        watch_for: Array.isArray(recommendationResponse.health_flags)
          ? recommendationResponse.health_flags.map((item: unknown) => String(item || "").trim()).filter(Boolean).slice(0, 6)
          : [],
        care_recommendations: Array.isArray(recommendationResponse.care)
          ? recommendationResponse.care
              .map((item: any) => {
                const category = String(item?.category || "").trim();
                const summary = String(item?.summary || "").trim();
                const detail = String(item?.detail || "").trim();
                const merged = [
                  category ? `${category}:` : "",
                  summary,
                  detail && detail !== summary ? `— ${detail}` : "",
                ]
                  .filter(Boolean)
                  .join(" ")
                  .trim();
                return merged || summary;
              })
              .filter(Boolean)
              .slice(0, 6)
          : [],
        low_confidence: Boolean(recommendationResponse.low_confidence) || topMatch < 50,
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
    } catch (error: any) {
      setRows((prev) => [
        ...prev,
        makeRow({
          role: "assistant",
          content: `Sorry, I couldn't read that image: ${error?.message ?? "Unknown error."}`,
        }),
      ]);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className={`flex flex-col rounded-2xl border bg-white shadow-lg ${className ?? ""}`}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <Bot size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">PawStay AI</p>
          <p className="text-[11px] text-muted-foreground">Ask about services, bookings & more</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm min-h-[260px] max-h-[420px]">
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
          placeholder="Ask about services, or upload an image to extract text..."
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
