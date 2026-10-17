import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, UserProfile } from "@/lib/apiClient";
import { BookOpen, Sparkles } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import { useBookChat } from "@/hooks/useBookChat";
import Navbar from "@/components/Navbar";
import { triggerBgEffect } from "@/lib/bgEvents";

// Prompt chips as requested: Fantasy, Mystery, Romance, Sci-Fi, Dark & atmospheric, Cozy, Emotional
const SUGGESTION_CHIPS = [
  { label: "Fantasy", query: "Recommend some captivating fantasy books" },
  { label: "Mystery", query: "Recommend engrossing mystery and thriller reads" },
  { label: "Romance", query: "Recommend deeply engaging romance novels" },
  { label: "Sci-Fi", query: "Recommend thought-provoking sci-fi books" },
  { label: "Dark & atmospheric", query: "Recommend dark and atmospheric books with rich immersion" },
  { label: "Cozy", query: "Recommend cozy, heartwarming books for a quiet evening" },
  { label: "Emotional", query: "Recommend emotional, moving books that leave a lasting mark" },
];

export const Index = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    messages,
    sendMessage,
    isLoading,
    newChat,
    loadConversation,
    deleteConversation,
    renameConversation,
    currentConversationId,
  } = useBookChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkAuth() {
      const user = await apiClient.getCurrentUser();
      if (!user) {
        navigate("/auth");
      } else {
        setCurrentUser(user);
      }
      setLoading(false);
    }
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    triggerBgEffect(isLoading ? "generating-start" : "generating-end");
  }, [isLoading]);

  const hasOnlyWelcome = messages.length <= 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3 animate-fade-up">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center animate-pulse">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="text-xs text-muted-foreground font-medium tracking-wide">
            Opening your library…
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-transparent flex flex-col selection:bg-primary/20">
      {/* Top Navigation with Dynamic Brand Presence */}
      <Navbar
        onNewChat={newChat}
        onSelectConversation={loadConversation}
        onDeleteConversation={deleteConversation}
        onRenameConversation={renameConversation}
        currentConversationId={currentConversationId}
        isGenerating={isLoading}
      />

      {/* Main Chat Stage */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 flex flex-col">
        {/* Welcome Literary Hero — shown on fresh chat */}
        {hasOnlyWelcome && (
          <div className="pt-12 pb-6 text-center animate-fade-up max-w-xl mx-auto">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3.5 shadow-sm animate-icon-idle">
              <BookOpen className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground leading-snug tracking-tight">
              What are you in the mood to read?
            </h1>
            <p className="text-sm text-muted-foreground/90 mt-2 leading-relaxed">
              Tell me a genre, an atmosphere, or a favorite author — I'll find your next cherished book.
            </p>
          </div>
        )}

        {/* Conversation Stream with Smooth Transitions */}
        <div className="flex-1 py-4 space-y-4">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
            />
          ))}

          {/* Dynamic Typing / Weaving Indicator */}
          {isLoading && (
            <div className="flex gap-3 sm:gap-4 items-center animate-fade-up py-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-100 to-pink-200 text-rose-600 dark:from-rose-950 dark:to-pink-900 dark:text-rose-300 dark:border-rose-800/40 flex items-center justify-center shrink-0 border border-rose-200/50 animate-icon-generating">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-card/60 backdrop-blur-sm rounded-full border border-border/40 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-primary animate-twinkle" />
                <span className="text-xs text-muted-foreground font-medium">Curating recommendations…</span>
                <div className="flex items-center gap-1 ml-1">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Area + Floating Chips — Seamless Canvas */}
        <div className="sticky bottom-0 pb-5 pt-2 mt-auto bg-transparent pointer-events-none">
          {/* Suggestion Chips — Floating directly over the living background */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 pt-1 no-scrollbar justify-start sm:justify-center flex-nowrap sm:flex-wrap pointer-events-auto">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                className="suggest-chip shrink-0"
                onClick={() => sendMessage(chip.query)}
                disabled={isLoading}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Composer with Centered Soft Radial Lavender Glow */}
          <div className="relative pointer-events-auto">
            {/* Subtle Radial Glow (Centered around composer, smoothly fading outward) */}
            <div
              className="absolute -inset-x-10 -inset-y-6 pointer-events-none -z-10 rounded-full opacity-70 blur-2xl transition-opacity duration-500"
              style={{
                background:
                  "radial-gradient(ellipse 65% 55% at 50% 50%, hsl(var(--primary) / 0.16) 0%, hsl(260 55% 82% / 0.08) 50%, transparent 80%)",
              }}
            />
            <ChatInput onSend={sendMessage} disabled={isLoading} />
          </div>

          <p className="text-center text-[11px] text-muted-foreground/70 mt-2 font-normal pointer-events-auto">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
