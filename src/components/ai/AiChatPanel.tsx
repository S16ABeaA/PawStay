import { useEffect, useMemo, useRef, useState } from "react";
import { aiChatApi } from "@/services/aiChatApi";
import { Send, Bot, User } from "lucide-react";

type ChatRow = {
  role: "user" | "assistant" | "tool-activity";
  content: string;
};

interface AiChatPanelProps {
  /** Extra Tailwind classes on the root wrapper */
  className?: string;
}

export const AiChatPanel = ({ className }: AiChatPanelProps) => {
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sessionId = useMemo(() => `ui-${Date.now()}`, []);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rows, loading]);

  const TOOL_LABELS: Record<string, string> = {
    search_services: "🔍 Searching services...",
    create_booking: "📝 Creating booking...",
    get_user_bookings: "📋 Fetching your bookings...",
    cancel_booking: "❌ Cancelling booking...",
    get_provider_revenue: "💰 Fetching revenue data...",
  };

  const onSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setRows((prev) => [...prev, { role: "user", content: userMessage }]);
    setMessage("");

    try {
      setLoading(true);
      const response = await aiChatApi.chat({ message: userMessage, sessionId });

      // Show tool activity bubbles if the agent called any tools
      if (response.toolActivity && response.toolActivity.length > 0) {
        const activityRows: ChatRow[] = response.toolActivity.map((a) => ({
          role: "tool-activity" as const,
          content: TOOL_LABELS[a.tool] ?? `⚙️ Running ${a.tool}...`,
        }));
        setRows((prev) => [...prev, ...activityRows]);
      }

      setRows((prev) => [...prev, { role: "assistant", content: response.message }]);
    } catch (error: any) {
      setRows((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, something went wrong: ${error?.message ?? "Unknown error."}` },
      ]);
    } finally {
      setLoading(false);
    }
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
        {rows.map((row, i) => (
          <div key={i} className={`flex gap-2 ${row.role === "user" ? "justify-end" : "justify-start"}`}>
            {/* Tool activity bubble */}
            {row.role === "tool-activity" && (
              <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-700">
                <span className="animate-pulse">●</span>
                {row.content}
              </div>
            )}
            {/* Assistant bubble */}
            {row.role === "assistant" && (
              <>
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <Bot size={14} />
                </div>
                <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 bg-gray-100 text-gray-800 rounded-bl-sm">
                  {row.content}
                </div>
              </>
            )}
            {/* User bubble */}
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
          placeholder="Ask about services or bookings..."
          disabled={loading}
          className="flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-50"
        />
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
