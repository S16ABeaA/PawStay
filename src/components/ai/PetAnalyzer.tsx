import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { aiChatApi } from "@/services/aiChatApi";
import { resolveLocationForSearch } from "@/lib/aiAutofill";

const PET_TERMS = [
  "dog",
  "canine",
  "puppy",
  "cat",
  "feline",
  "kitten",
  "husky",
  "retriever",
  "poodle",
  "terrier",
  "beagle",
  "shepherd",
  "malamute",
  "siamese",
  "persian",
  "ragdoll",
  "maine coon",
  "pig",
  "piglet",
  "mini pig",
  "potbellied",
  "pot-bellied",
  "hog",
  "bunny",
  "rabbit",
];

const DOG_TERMS = ["dog", "canine", "hound", "terrier", "retriever", "bulldog", "poodle", "shepherd", "husky", "beagle", "rottweiler", "dachshund", "chihuahua", "boxer", "doberman", "mastiff", "shih", "spitz", "malamute", "samoyed", "akita", "labrador", "golden"];
const CAT_TERMS = ["cat", "feline", "persian", "siamese", "maine coon", "ragdoll", "sphynx", "bengal", "british shorthair"];
const PIG_TERMS = ["pig", "piglet", "mini pig", "potbellied", "pot-bellied", "hog"];
const SMALL_PET_TERMS = ["rabbit", "hamster", "guinea pig", "bird", "parrot", "axolotl"];
const BOOKING_ID_REGEX = /(Booking\s*ID[:\s]*)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

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
        style={{ color: "#4F46E5", textDecoration: "underline", fontWeight: 600 }}
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

  return parts.length ? <>{parts}</> : raw;
};

type SpeciesKind = "dog" | "cat" | "pig" | "animal";

type Priority = "high" | "medium" | "low";

type BreedInfo = {
  primary: string;
  confidence: number;
  alternatives: string[];
  description: string;
};

type CareItem = {
  category: string;
  icon: string;
  priority: Priority;
  summary: string;
  detail: string;
};

type NextAction = {
  label: string;
  intent: string;
};

type AnalyzerResult = {
  breed: BreedInfo;
  care: CareItem[];
  health_flags: string[];
  health_check?: {
    status: string;
    confidence: number;
    summary: string;
    estimated_age?: { range: string | null; confidence: number };
    estimated_weight?: { range: string | null; confidence: number };
    visible_signs: string[];
  };
  next_actions: NextAction[];
  low_confidence?: boolean;
  error?: string;
};

const ICONS: Record<string, JSX.Element> = {
  grooming: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.96-3 2.5 2.5 0 0 1 1.96-3 2.5 2.5 0 0 1 2.46-3.54"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.96-3 2.5 2.5 0 0 0-1.96-3 2.5 2.5 0 0 0-2.46-3.54"/></svg>,
  vet: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  diet: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  boarding: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  exercise: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  dental: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5.5c-1.5-2-4-2.5-5.5-1S4 8 5 10c.5 1 1 2 1 4 0 1.5.5 3 2 3s2-2 2-2h4s.5 2 2 2 2-1.5 2-3c0-2 .5-3 1-4 1-2 .5-4-1.5-5.5S13.5 3.5 12 5.5z"/></svg>,
};

const PRIORITY_META: Record<Priority, { bg: string; text: string; border: string }> = {
  high: { bg: "#FFF1F0", text: "#A32D2D", border: "#F09595" },
  medium: { bg: "#FFF7E6", text: "#854F0B", border: "#FAC775" },
  low: { bg: "#F6FFED", text: "#3B6D11", border: "#97C459" },
};

const ICON_COLORS = [
  { bg: "#EEF2FF", fg: "#4F46E5" },
  { bg: "#E6FFFB", fg: "#08979C" },
  { bg: "#FFF0F6", fg: "#C41D7F" },
  { bg: "#FFF7E6", fg: "#D46B08" },
  { bg: "#F0FFF4", fg: "#276749" },
];

function ConfidenceBadge({ value }: { value: number }) {
  const low = value < 50;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      background: low ? "#FFF7E6" : "linear-gradient(135deg,#EEF2FF,#FFF0F6)",
      borderRadius: 12, padding: "6px 14px", minWidth: 58,
      border: low ? "1px solid #FAC775" : "none",
    }}>
      <span style={{ fontSize: 20, fontWeight: 800, color: low ? "#D46B08" : "#4F46E5", fontFamily: "'DM Mono',monospace" }}>
        {value}<span style={{ fontSize: 11 }}>%</span>
      </span>
      <span style={{ fontSize: 10, fontWeight: 600, color: low ? "#D46B08" : "#A89FCC", letterSpacing: "0.06em" }}>
        {low ? "UNSURE" : "MATCH"}
      </span>
    </div>
  );
}

function LowConfidenceNotice({ visible }: { visible: boolean | undefined }) {
  if (!visible) return null;
  return (
    <div style={{
      background: "#FFF7E6", border: "1px solid #FAC775", borderRadius: 12,
      padding: "10px 14px", marginBottom: 10, display: "flex", gap: 10, alignItems: "flex-start",
      opacity: 1, transition: "opacity 0.4s",
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D46B08" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <div>
        <p style={{ margin: "0 0 2px", fontSize: 12.5, fontWeight: 600, color: "#854F0B" }}>Low confidence detection</p>
        <p style={{ margin: 0, fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>
          The image was unclear or the breed is mixed. Recommendations are based on the closest match — a vet can confirm the breed.
        </p>
      </div>
    </div>
  );
}

function BreedCard({ breed, visible }: { breed: BreedInfo; visible: boolean }) {
  return (
    <div style={{
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "all 0.45s cubic-bezier(0.22,1,0.36,1)",
      background: "#fff", borderRadius: 16, border: "1px solid #F0EEF9",
      padding: "18px 20px", marginBottom: 10,
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#A89FCC", textTransform: "uppercase" }}>Breed detected</p>
          <h2 style={{ margin: "0 0 5px", fontSize: 21, fontWeight: 700, color: "#1A1035", fontFamily: "'Fraunces',serif", letterSpacing: "-0.4px" }}>{breed.primary}</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#6B6080", lineHeight: 1.55 }}>{breed.description}</p>
        </div>
        <ConfidenceBadge value={breed.confidence} />
      </div>
      {breed.alternatives?.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#A89FCC", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Also possible:</span>
          {breed.alternatives.map((alt) => (
            <span key={alt} style={{ fontSize: 12, background: "#F5F3FF", color: "#6D5FC7", padding: "3px 10px", borderRadius: 20, fontWeight: 500 }}>{alt}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function HealthFlags({ flags, visible }: { flags: string[]; visible: boolean }) {
  if (!flags?.length) return null;
  return (
    <div style={{
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)",
      transition: "all 0.4s cubic-bezier(0.22,1,0.36,1) 0.1s",
      background: "#FFF9F0", border: "1px solid #FFE0B2", borderRadius: 12,
      padding: "12px 16px", marginBottom: 10,
    }}>
      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#E65100", letterSpacing: "0.08em", textTransform: "uppercase" }}>Watch for</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {flags.map((flag) => (
          <span key={flag} style={{ fontSize: 12, background: "#FFF3E0", color: "#BF360C", padding: "3px 10px", borderRadius: 20, fontWeight: 500, border: "1px solid #FFCC80" }}>{flag}</span>
        ))}
      </div>
    </div>
  );
}

function HealthCheckCard({ healthCheck, visible }: { healthCheck: AnalyzerResult["health_check"] | undefined; visible: boolean }) {
  if (!healthCheck) return null;
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(10px)",
      transition: "all 0.4s cubic-bezier(0.22,1,0.36,1) 0.05s",
      background: "#fff", borderRadius: 16,
      border: "1px solid #F0EEF9", padding: "16px 20px", marginBottom: 10,
      fontFamily: "'DM Sans',system-ui,sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#A89FCC", textTransform: "uppercase", fontFamily: "'DM Sans',system-ui,sans-serif" }}>
          Health check
        </p>
        <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "#F6FFED", color: "#3B6D11", border: "1px solid #97C459", fontFamily: "'DM Sans',system-ui,sans-serif" }}>
          {healthCheck.status} · {healthCheck.confidence}%
        </span>
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6B6080", lineHeight: 1.55, fontWeight: 500 }}>{renderBookingLinkedText(healthCheck.summary)}</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {healthCheck.estimated_age && (
          <div style={{ background: "#F5F3FF", borderRadius: 10, padding: "8px 14px" }}>
            <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "#A89FCC", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'DM Sans',system-ui,sans-serif" }}>Est. age</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#4F46E5", fontFamily: "'DM Sans',system-ui,sans-serif" }}>
              {healthCheck.estimated_age.range || "unknown"}
              <span style={{ fontSize: 11, fontWeight: 500, color: "#A89FCC", marginLeft: 8 }}>{healthCheck.estimated_age.confidence}% sure</span>
            </p>
          </div>
        )}
        {healthCheck.estimated_weight && (
          <div style={{ background: "#F5F3FF", borderRadius: 10, padding: "8px 14px" }}>
            <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "#A89FCC", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'DM Sans',system-ui,sans-serif" }}>Est. weight</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#4F46E5", fontFamily: "'DM Sans',system-ui,sans-serif" }}>
              {healthCheck.estimated_weight.range || "unknown"}
              <span style={{ fontSize: 11, fontWeight: 500, color: "#A89FCC", marginLeft: 8 }}>{healthCheck.estimated_weight.confidence}% sure</span>
            </p>
          </div>
        )}
      </div>

      {healthCheck.visible_signs?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {healthCheck.visible_signs.map((s, i) => (
            <span key={`${s}-${i}`} style={{ fontSize: 12, background: "#F6FFED", color: "#3B6D11", padding: "6px 12px", borderRadius: 20, border: "1px solid #97C459", fontWeight: 600 }}>{s}</span>
          ))}
        </div>
      )}

      <p style={{ margin: 0, fontSize: 12, color: "#A89FCC", lineHeight: 1.5, borderTop: "1px solid #F5F3FF", paddingTop: 10 }}>
        This is not a diagnosis. Consult a veterinarian if you have any concerns.
      </p>
    </div>
  );
}

function CareCard({ item, index, visible, itemId }: { item: CareItem; index: number; visible: boolean; itemId: string }) {
  const [open, setOpen] = useState(false);
  const colors = ICON_COLORS[index % ICON_COLORS.length];
  const priorityStyle = PRIORITY_META[item.priority] || PRIORITY_META.low;

  return (
    <div style={{
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)",
      transition: `all 0.4s cubic-bezier(0.22,1,0.36,1) ${0.07 * index}s`,
      background: "#fff", borderRadius: 12, border: "1px solid #F0EEF9",
      padding: "13px 15px", marginBottom: 8, userSelect: "none",
    }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={itemId}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        style={{
          display: "flex",
          width: "100%",
          gap: 12,
          alignItems: "center",
          textAlign: "left",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 9, background: colors.bg, color: colors.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {ICONS[item.icon] || ICONS.vet}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1035" }}>{item.category}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: priorityStyle.bg, color: priorityStyle.text, border: `1px solid ${priorityStyle.border}` }}>{item.priority.toUpperCase()}</span>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: "#6B6080", lineHeight: 1.5 }}>{renderBookingLinkedText(item.summary)}</p>
        </div>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C4B8E8" strokeWidth="2.5" style={{ flexShrink: 0, transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "none" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div id={itemId} style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #F5F3FF" }}>
          <p style={{ margin: 0, fontSize: 12.5, color: "#5A4F72", lineHeight: 1.65 }}>{renderBookingLinkedText(item.detail)}</p>
        </div>
      )}
    </div>
  );
}

function CTAButtons({ actions, visible }: { actions: NextAction[]; visible: boolean }) {
  const navigate = useNavigate();
  if (!visible || !actions?.length) return null;

  const intentLabels: Record<string, string> = {
    find_vet: "Find a vet nearby",
    find_groomer: "Find a groomer nearby",
    find_boarding: "Find boarding nearby",
    view_details: "View details",
    save_pet: "Save to My Pets",
  };

  const onAction = async (intent: string) => {
    if (intent === "find_vet" || intent === "find_groomer") {
      let resolved: { location: string; source: "geolocation" | "profile" | "none"; geoPending: boolean } = {
        location: "",
        source: "none",
        geoPending: true,
      };

      try {
        resolved = await resolveLocationForSearch();
      } catch {
        // fallback to geoPending route params
      }

      const params = new URLSearchParams();
      params.set("date", new Date().toISOString().slice(0, 10));
      if (resolved.location) params.set("location", resolved.location);
      if (resolved.geoPending) params.set("geoPending", "1");
      params.set("src", "pet-analyzer");
      params.set("t", String(Date.now()));

      navigate(`${intent === "find_vet" ? "/veterinary" : "/grooming"}?${params.toString()}`);
      return;
    }

    if (intent === "find_boarding") navigate("/hotels");
    else if (intent === "view_details") navigate("/my-pets");
    else if (intent === "save_pet") navigate("/my-pets");
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4, opacity: visible ? 1 : 0, transition: "opacity 0.5s 0.4s" }}>
      {actions.map((action) => (
        <button
          key={`${action.intent}-${action.label}`}
          onClick={() => onAction(action.intent)}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          style={{
            flex: "1 1 140px", padding: "11px 14px", borderRadius: 12,
            border: "1px solid #D4C8F0", background: "#fff",
            color: "#4F46E5", fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          {intentLabels[action.intent] || action.label} ↗
        </button>
      ))}
    </div>
  );
}

function LoadingCard() {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, border: "1px solid #F0EEF9",
      padding: "24px 20px", display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        border: "2.5px solid #D4C8F0", borderTopColor: "#6D5FC7",
        flexShrink: 0,
      }} className="animate-spin"/>
      <div>
        <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: "#1A1035" }}>Analyzing your pet…</p>
        <p style={{ margin: 0, fontSize: 12, color: "#A89FCC" }}>Detecting breed and building care recommendations</p>
      </div>
    </div>
  );
}

const buildDescriptionFromClassifier = (primary: string): string => {
  if (!primary) return "Breed traits are estimated from image features.";
  return `${primary} detected from visual traits. Temperament and care needs can vary by lineage and environment.`;
};

const hasPetSignal = (predictions: Array<{ className: string; probability: number }>) => {
  return predictions.some((prediction) => {
    const label = prediction.className.toLowerCase();
    return PET_TERMS.some((term) => label.includes(term));
  });
};

const hasAnyTerm = (text: string, terms: string[]) => {
  const value = text.toLowerCase();
  return terms.some((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    return regex.test(value);
  });
};

const detectSpecies = (label: string): SpeciesKind | null => {
  if (hasAnyTerm(label, DOG_TERMS)) return "dog";
  if (hasAnyTerm(label, CAT_TERMS)) return "cat";
  if (hasAnyTerm(label, PIG_TERMS)) return "pig";
  if (hasAnyTerm(label, SMALL_PET_TERMS)) return "animal";
  return null;
};

export default function PetAnalyzer() {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<any>(null);
  const sessionIdRef = useRef(`pet-analyzer-${Date.now()}`);
  const phaseTimeoutsRef = useRef<number[]>([]);

  const clearPhaseTimeouts = useCallback(() => {
    phaseTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    phaseTimeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearPhaseTimeouts();
      if (image) {
        URL.revokeObjectURL(image);
      }
    };
  }, [clearPhaseTimeouts, image]);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const syncTheme = () => {
      setIsDarkMode(root.classList.contains("dark") || mediaQuery.matches);
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    mediaQuery.addEventListener("change", syncTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", syncTheme);
    };
  }, []);

  const handleFile = useCallback((file: File | null | undefined) => {
    if (!file?.type.startsWith("image/")) return;

    if (image) {
      URL.revokeObjectURL(image);
    }

    setImage(URL.createObjectURL(file));
    setImageFile(file);
    setResult(null);
    setError(null);
    setPhase(0);
  }, [image]);

  const loadModel = async () => {
    if (modelRef.current) return modelRef.current;
    const tf = await import("@tensorflow/tfjs");
    await tf.ready();
    const mobilenet = await import("@tensorflow-models/mobilenet");
    modelRef.current = await mobilenet.load();
    return modelRef.current;
  };

  const classifyImage = async (file: File) => {
    const model = await loadModel();
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to process image"));
      });
      const results = await model.classify(img, 5);
      return (Array.isArray(results) ? results : []).map((row: any) => ({
        className: String(row?.className || ""),
        probability: Number(row?.probability || 0),
      }));
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const analyze = async () => {
    if (!imageFile) return;

    setLoading(true);
    setResult(null);
    setError(null);
    setPhase(0);
    clearPhaseTimeouts();

    try {
      const classifierPredictions = await classifyImage(imageFile);

      const taggedPredictions = classifierPredictions
        .map((prediction) => ({
          ...prediction,
          species: detectSpecies(prediction.className),
        }))
        .filter((prediction) => Boolean(prediction.species));

      const looksLikePet = hasPetSignal(classifierPredictions) || taggedPredictions.length > 0;
      if (!looksLikePet) {
        setError(
          "Hmm, I don't see a pet in this photo! Try uploading a clear picture of your dog or cat and I'll analyze their breed, health, and recommend the best PawStay services for them. 🐾\n\nIf you have a question instead, just type it below!",
        );
        setLoading(false);
        return;
      }

      const scoreBySpecies: Record<SpeciesKind, number> = {
        dog: 0,
        cat: 0,
        pig: 0,
        animal: 0,
      };

      taggedPredictions.forEach((prediction) => {
        const species = prediction.species as SpeciesKind;
        scoreBySpecies[species] += Math.max(0, Number(prediction.probability || 0));
      });

      const topSpeciesEntry = (Object.entries(scoreBySpecies) as Array<[SpeciesKind, number]>)
        .sort((a, b) => b[1] - a[1])[0];

      const detectedSpecies = topSpeciesEntry && topSpeciesEntry[1] > 0
        ? topSpeciesEntry[0]
        : "animal";

      const speciesPredictions = taggedPredictions
        .filter((prediction) => prediction.species === detectedSpecies)
        .sort((a, b) => b.probability - a.probability);

      const topPred = speciesPredictions[0] || classifierPredictions[0];
      const topBreed = topPred?.className || "Unknown";
      const secondProbability = speciesPredictions[1]?.probability ?? 0;
      const topProbability = Number(topPred?.probability || 0);
      const confidenceMargin = Math.max(0, topProbability - secondProbability);
      const topConfidence = Math.max(
        0,
        Math.min(99, Math.round((topProbability * 100 * 0.75) + (confidenceMargin * 100 * 1.25))),
      );
      const alternatives = speciesPredictions
        .slice(1, 4)
        .map((item) => item.className)
        .filter(Boolean);

      const healthAssessment = await aiChatApi
        .checkPetHealth(imageFile, detectedSpecies)
        .catch(() => undefined);

      const geminiPrimaryBreed = String(healthAssessment?.breed_estimate?.primary || "").trim();
      const geminiBreedConfidence = Number(healthAssessment?.breed_estimate?.confidence ?? 0);
      const geminiAlternatives = Array.isArray(healthAssessment?.breed_estimate?.alternatives)
        ? healthAssessment?.breed_estimate?.alternatives.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 3)
        : [];

      const shouldUseGeminiBreed =
        !!geminiPrimaryBreed &&
        geminiPrimaryBreed.toLowerCase() !== "unknown" &&
        geminiBreedConfidence >= Math.max(55, topConfidence - 10);

      const finalPrimaryBreed = shouldUseGeminiBreed ? geminiPrimaryBreed : topBreed;
      const finalPrimaryConfidence = shouldUseGeminiBreed
        ? Math.max(0, Math.min(99, Math.round(geminiBreedConfidence)))
        : topConfidence;
      const finalAlternatives = shouldUseGeminiBreed
        ? Array.from(new Set([...geminiAlternatives, ...alternatives])).slice(0, 3)
        : alternatives;

      const response = await aiChatApi.analyzePet({
        sessionId: sessionIdRef.current,
        detectedSpecies,
        primaryPrediction: finalPrimaryBreed,
        primaryConfidence: finalPrimaryConfidence,
        alternatives: finalAlternatives,
        descriptionHint: buildDescriptionFromClassifier(finalPrimaryBreed),
        healthCheck: healthAssessment
          ? {
              status: healthAssessment.status,
              injured: healthAssessment.injured,
              confidence: healthAssessment.confidence,
              summary: healthAssessment.summary,
              visible_signs: healthAssessment.visible_signs,
              recommended_actions: healthAssessment.recommended_actions,
              age_estimate: healthAssessment.age_estimate,
              weight_estimate: healthAssessment.weight_estimate,
            }
          : undefined,
      });

      if (response.error === "not_a_pet") {
        setError(
          "Hmm, I don't see a pet in this photo! Try uploading a clear picture of your dog or cat and I'll analyze their breed, health, and recommend the best PawStay services for them. 🐾\n\nIf you have a question instead, just type it below!",
        );
        setLoading(false);
        return;
      }

      const normalized: AnalyzerResult = {
        breed: {
          primary: response.breed?.primary || finalPrimaryBreed,
          confidence:
            typeof response.breed?.confidence === "number"
              ? Math.max(0, Math.min(100, Math.round(response.breed.confidence)))
              : finalPrimaryConfidence,
          alternatives: Array.isArray(response.breed?.alternatives)
            ? response.breed.alternatives.slice(0, 3)
            : finalAlternatives,
          description: response.breed?.description || buildDescriptionFromClassifier(finalPrimaryBreed),
        },
        care: Array.isArray(response.care) ? response.care.slice(0, 5) : [],
        health_flags: Array.isArray(response.health_flags) ? response.health_flags : [],
        health_check: response.health_check
          ? {
              status: String(response.health_check.status || "unclear"),
              confidence:
                typeof response.health_check.confidence === "number"
                  ? Math.max(0, Math.min(100, Math.round(response.health_check.confidence)))
                  : 0,
              summary: String(response.health_check.summary || "Health check is available with limited detail."),
              estimated_age: response.health_check.estimated_age
                ? {
                    range: String(response.health_check.estimated_age.value || healthAssessment?.age_estimate?.range || "unknown"),
                    confidence:
                      typeof response.health_check.estimated_age.confidence === "number"
                        ? Math.max(0, Math.min(100, Math.round(response.health_check.estimated_age.confidence)))
                        : 0,
                  }
                : undefined,
              estimated_weight: response.health_check.estimated_weight
                ? {
                    range: String(response.health_check.estimated_weight.value || healthAssessment?.weight_estimate?.range || "unknown"),
                    confidence:
                      typeof response.health_check.estimated_weight.confidence === "number"
                        ? Math.max(0, Math.min(100, Math.round(response.health_check.estimated_weight.confidence)))
                        : 0,
                  }
                : undefined,
              visible_signs: Array.isArray(response.health_check.visible_signs)
                ? response.health_check.visible_signs.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 8)
                : [],
            }
          : healthAssessment
            ? {
                status: healthAssessment.status,
                confidence: Math.max(0, Math.min(100, Math.round(healthAssessment.confidence))),
                summary: healthAssessment.summary,
                estimated_age: {
                  range: healthAssessment.age_estimate?.range || "unknown",
                  confidence: Math.max(0, Math.min(100, Math.round(healthAssessment.age_estimate?.confidence ?? 0))),
                },
                estimated_weight: {
                  range: healthAssessment.weight_estimate?.range || "unknown",
                  confidence: Math.max(0, Math.min(100, Math.round(healthAssessment.weight_estimate?.confidence ?? 0))),
                },
                visible_signs: Array.isArray(healthAssessment.visible_signs) ? healthAssessment.visible_signs : [],
              }
            : undefined,
        next_actions: Array.isArray(response.next_actions) ? response.next_actions : [],
        low_confidence: Boolean(response.low_confidence),
      };

      if (!normalized.next_actions.some((action) => action.intent === "find_vet")) {
        normalized.next_actions.push({ label: "Find a vet", intent: "find_vet" });
      }
      if (!normalized.next_actions.some((action) => action.intent === "find_groomer")) {
        normalized.next_actions.push({ label: "Find a groomer", intent: "find_groomer" });
      }
      if (!normalized.next_actions.some((action) => action.intent === "save_pet")) {
        normalized.next_actions.push({ label: "Save to My Pets", intent: "save_pet" });
      }

      setResult(normalized);
      phaseTimeoutsRef.current = [
        window.setTimeout(() => setPhase(1), 80),
        window.setTimeout(() => setPhase(2), 450),
        window.setTimeout(() => setPhase(3), 750),
      ];
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pageBackground = isDarkMode
    ? "linear-gradient(160deg,#1f1b2e,#231a2f 50%,#1b2430)"
    : "linear-gradient(160deg,#F5F3FF,#FFF0F9 50%,#F0F9FF)";

  return (
    <div style={{ minHeight: "100vh", background: pageBackground, fontFamily: "'DM Sans',system-ui,sans-serif", padding: "32px 16px", color: isDarkMode ? "#F3EEFF" : "inherit" }}>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ margin: "0 0 5px", fontSize: 27, fontWeight: 800, color: isDarkMode ? "#F3EEFF" : "#1A1035", fontFamily: "'Fraunces',serif", letterSpacing: "-0.7px" }}>Pet Analyzer</h1>
          <p style={{ margin: 0, fontSize: 14, color: isDarkMode ? "#BEB2D8" : "#8B7DB5" }}>Upload a photo — get breed info & care tips</p>
        </div>

        <div
          onDrop={(event) => { event.preventDefault(); handleFile(event.dataTransfer.files?.[0]); }}
          onDragOver={(event) => event.preventDefault()}
          onClick={() => !image && fileRef.current?.click()}
          onKeyDown={(event) => {
            if (!image && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              fileRef.current?.click();
            }
          }}
          className={!image ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2" : undefined}
          role={!image ? "button" : undefined}
          tabIndex={!image ? 0 : -1}
          aria-label={!image ? "Upload pet image" : undefined}
          style={{
            borderRadius: 20, overflow: "hidden", marginBottom: 12,
            border: image ? "none" : "2px dashed #C4B8E8",
            background: image ? "transparent" : "#FAFAFE",
            minHeight: image ? 0 : 150,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: image ? "default" : "pointer",
          }}
        >
          {image ? (
            <div style={{ position: "relative", width: "100%" }}>
              <img src={image} alt="Uploaded pet image preview" style={{ width: "100%", borderRadius: 20, display: "block", maxHeight: 270, objectFit: "cover" }}/>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  if (image) URL.revokeObjectURL(image);
                  setImage(null);
                  setImageFile(null);
                  setResult(null);
                  setError(null);
                  setPhase(0);
                }}
                aria-label="Remove selected image"
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 28, height: 28, color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 24 }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>🐾</div>
              <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: "#6D5FC7" }}>Drop a photo here</p>
              <p style={{ margin: 0, fontSize: 12, color: "#A89FCC" }}>or click to browse</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(event) => handleFile(event.target.files?.[0])}/>

        {image && !result && !loading && (
          <button onClick={analyze} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2" style={{
            width: "100%", padding: "13px", borderRadius: 14, border: "none",
            background: "linear-gradient(135deg,#6D5FC7,#C41D7F)",
            color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
            marginBottom: 18, fontFamily: "'DM Sans',sans-serif",
          }}>Analyze Pet →</button>
        )}

        {loading && <LoadingCard />}

        {error && <div style={{ background: "#FFF1F0", border: "1px solid #F09595", borderRadius: 12, padding: "12px 16px", color: "#A32D2D", fontSize: 13 }}>{error}</div>}

        {result && (
          <div>
            <LowConfidenceNotice visible={result.low_confidence && phase >= 1} />
            <BreedCard breed={result.breed} visible={phase >= 1} />
            <HealthCheckCard healthCheck={result.health_check} visible={phase >= 2} />
            <HealthFlags flags={result.health_flags} visible={phase >= 2} />
            {phase >= 2 && (
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: isDarkMode ? "#C5B8E6" : "#A89FCC", letterSpacing: "0.08em", textTransform: "uppercase" }}>Care recommendations</p>
            )}
            {result.care?.map((item, i) => (
              <CareCard
                key={`${item.category}-${item.icon}-${item.priority}-${i}`}
                item={item}
                itemId={`care-detail-${i}`}
                index={i}
                visible={phase >= 3}
              />
            ))}
            <CTAButtons actions={result.next_actions} visible={phase >= 3} />
          </div>
        )}
      </div>
    </div>
  );
}
