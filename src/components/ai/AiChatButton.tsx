import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { AiChatPanel } from "./AiChatPanel";
import { useLocation } from "react-router-dom";

/**
 * Floating chat icon (lower-right) that expands into an inline chat popover.
 * Hidden on the dedicated /ai-chat page to avoid duplication.
 */
export const AiChatButton = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Don't render the floating button on the full chat page
  if (location.pathname === "/ai-chat") return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-end">
      {/* Expanded chat panel */}
      <div
        className={`absolute bottom-[72px] right-0 transition-all duration-200 ${
          open
            ? "pointer-events-auto opacity-100 translate-y-0 animate-in fade-in slide-in-from-bottom-4"
            : "pointer-events-none opacity-0 translate-y-2"
        }`}
        aria-hidden={!open}
      >
        <AiChatPanel />
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-xl transition hover:bg-rose-700 hover:scale-105 active:scale-95"
        aria-label={open ? "Close chat" : "Open AI chat"}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};
