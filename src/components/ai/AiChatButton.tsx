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
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Expanded chat panel */}
      {open && (
        <div className="w-[360px] sm:w-[400px] h-[520px] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <AiChatPanel className="h-full" />
        </div>
      )}

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
