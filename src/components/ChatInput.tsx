import { useState, useRef, useEffect } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { triggerBgEffect } from "@/lib/bgEvents";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea seamlessly
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (input.trim() && !disabled) {
      triggerBgEffect("send");
      onSend(input.trim());
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = input.trim().length > 0 && !disabled;

  return (
    <form onSubmit={handleSubmit} className="w-full relative">
      <div className="composer-box flex items-end gap-2.5 px-4 py-2.5 relative transition-all">
        {/* Ambient glow container behind composer on focus */}
        <div className="composer-focus-glow absolute -inset-0.5 rounded-[1.6rem] bg-gradient-to-r from-rose-400/20 via-primary/25 to-pink-400/20 opacity-0 -z-10 blur-sm pointer-events-none transition-opacity duration-300" />

        <textarea
          ref={textareaRef}
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Quilla is weaving recommendations…" : "Ask Quilla anything about books..."}
          disabled={disabled}
          rows={1}
          className="composer-textarea flex-1 min-h-[40px] max-h-[150px] py-2 px-1 text-sm leading-relaxed"
          style={{ minHeight: "40px" }}
        />

        {/* Dynamic State Indicator or Send Button */}
        {disabled ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 mb-1 bg-primary/10 rounded-full text-primary text-xs font-medium animate-pulse select-none">
            <Sparkles className="w-3 h-3 animate-twinkle" />
            <span className="hidden sm:inline">Weaving…</span>
            <div className="flex items-center gap-0.5 ml-0.5">
              <span className="w-1 h-1 rounded-full bg-primary animate-ping" />
              <span className="w-1 h-1 rounded-full bg-primary" />
            </div>
          </div>
        ) : (
          <button
            type="submit"
            id="send-button"
            disabled={!canSend}
            aria-label="Send message"
            title="Send message"
            className="composer-send-btn mb-1"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>
    </form>
  );
};

export default ChatInput;
