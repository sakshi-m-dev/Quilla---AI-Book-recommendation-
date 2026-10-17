import { useState } from "react";
import { BookOpen, BookmarkPlus, Check, Star, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { localAuth, tbrDb } from "@/lib/localBackend";
import { toast } from "sonner";
import { triggerBgEffect } from "@/lib/bgEvents";

export interface BookRecommendation {
  number?: number;
  title: string;
  author: string;
  year?: string;
  genre?: string;
  tags?: string[];
  description: string;
}

interface BookRecommendationCardProps {
  book: BookRecommendation;
  index?: number;
  fallbackGenre?: string;
  isSavedInitially?: boolean;
  onSaveChange?: (isSaved: boolean) => void;
}

// Sophisticated aesthetic palettes for book cover placeholders
const COVER_THEMES = [
  {
    gradient: "from-rose-800 via-pink-900 to-slate-950",
    border: "border-rose-500/30",
    accent: "text-rose-200",
  },
  {
    gradient: "from-amber-700 via-stone-800 to-stone-950",
    border: "border-amber-500/30",
    accent: "text-amber-200",
  },
  {
    gradient: "from-emerald-800 via-teal-900 to-slate-950",
    border: "border-emerald-500/30",
    accent: "text-emerald-200",
  },
  {
    gradient: "from-pink-700 via-rose-800 to-stone-950",
    border: "border-pink-500/30",
    accent: "text-pink-200",
  },
  {
    gradient: "from-sky-700 via-indigo-800 to-slate-950",
    border: "border-sky-500/30",
    accent: "text-sky-200",
  },
  {
    gradient: "from-indigo-700 via-blue-800 to-slate-950",
    border: "border-indigo-500/30",
    accent: "text-indigo-200",
  },
];

interface Particle {
  id: number;
  tx: number;
  ty: number;
}

export const BookRecommendationCard = ({
  book,
  index = 0,
  fallbackGenre = "General",
  isSavedInitially = false,
  onSaveChange,
}: BookRecommendationCardProps) => {
  const [isSaved, setIsSaved] = useState(isSavedInitially);
  const [isSaving, setIsSaving] = useState(false);
  const [tbrId, setTbrId] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [activeStarBounce, setActiveStarBounce] = useState<number | null>(null);
  const [showFiveStarTwinkle, setShowFiveStarTwinkle] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Derive stable theme from book title
  const themeIndex = Math.abs(
    book.title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % COVER_THEMES.length;
  const coverTheme = COVER_THEMES[themeIndex];

  // Derive initials
  const initials = book.title
    .replace(/^the\s+/i, "")
    .slice(0, 2)
    .toUpperCase();

  // Trigger floating collection particles
  const triggerTBRParticles = () => {
    const newParticles: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      tx: 10 + (Math.random() * 24 - 12),
      ty: -18 - Math.random() * 22,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 850);
  };

  const handleSaveToTBR = async () => {
    if (isSaved || isSaving) return;
    setIsSaving(true);
    triggerTBRParticles();
    triggerBgEffect("tbr-add");

    try {
      const added = await apiClient.addTBRBook({
        title: book.title,
        author: book.author,
        genre: book.genre || fallbackGenre,
        year: book.year,
        description: book.description,
      });
      setIsSaved(true);
      if (added?.id) setTbrId(added.id);
      onSaveChange?.(true);
      toast.success(`"${book.title}" added to your TBR! 📌`);
    } catch {
      // Local fallback
      const session = localAuth.getCurrentSession();
      const userId = session?.user.id || "guest";
      const local = tbrDb.addBook(userId, {
        title: book.title,
        author: book.author,
        genre: book.genre || fallbackGenre,
      });
      setIsSaved(true);
      if (local?.id) setTbrId(local.id);
      onSaveChange?.(true);
      toast.success(`"${book.title}" added to your TBR! 📌`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRate = async (star: number) => {
    setRating(star);
    setActiveStarBounce(star);
    setTimeout(() => setActiveStarBounce(null), 450);

    if (star === 5) {
      setShowFiveStarTwinkle(true);
      setTimeout(() => setShowFiveStarTwinkle(false), 1400);
    }

    try {
      let targetId = tbrId;
      if (!targetId) {
        try {
          const added = await apiClient.addTBRBook({
            title: book.title,
            author: book.author,
            genre: book.genre || fallbackGenre,
            year: book.year,
            description: book.description,
          });
          targetId = added?.id;
          setIsSaved(true);
          if (targetId) setTbrId(targetId);
          onSaveChange?.(true);
        } catch {
          const session = localAuth.getCurrentSession();
          const userId = session?.user.id || "guest";
          const local = tbrDb.addBook(userId, {
            title: book.title,
            author: book.author,
            genre: book.genre || fallbackGenre,
          });
          targetId = local?.id;
          setIsSaved(true);
          if (targetId) setTbrId(targetId);
          onSaveChange?.(true);
        }
      }

      if (targetId) {
        await apiClient.rateTBRBook(targetId, star);
      }
      toast.success(`Rated "${book.title}" ${star} star${star > 1 ? "s" : ""} ✨`);
    } catch {
      const session = localAuth.getCurrentSession();
      const userId = session?.user.id || "guest";
      const local = tbrDb.addBook(userId, {
        title: book.title,
        author: book.author,
        genre: book.genre || fallbackGenre,
      });
      if (local?.id) {
        tbrDb.rateBook(local.id, star);
        setTbrId(local.id);
        setIsSaved(true);
        onSaveChange?.(true);
        toast.success(`Rated "${book.title}" ${star} star${star > 1 ? "s" : ""} ✨`);
      } else {
        toast.error("Could not save rating");
      }
    }
  };

  const displayRating = hoverRating ?? rating ?? 0;

  return (
    <div
      className="book-rec-card animate-book-reveal p-4 sm:p-5 flex flex-col gap-3.5 my-3 relative overflow-hidden"
      style={{ animationDelay: `${index * 130}ms` }}
    >
      {/* Top row: Distinctive Book Cover + Editorial Hierarchy */}
      <div className="flex gap-4 items-start">
        {/* Physical Book Cover Placeholder */}
        <div
          className={`book-cover-placeholder w-14 sm:w-16 h-20 sm:h-24 shrink-0 rounded-lg bg-gradient-to-br ${coverTheme.gradient} p-2 flex flex-col justify-between text-white shadow-md relative overflow-hidden select-none border ${coverTheme.border}`}
        >
          {/* Subtle paper spine edge highlight */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/25" />
          <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-black/30" />

          {/* Spine Header */}
          <div className={`relative z-10 text-[8.5px] font-bold tracking-widest uppercase opacity-80 truncate ${coverTheme.accent}`}>
            {book.genre || fallbackGenre}
          </div>

          {/* Book Monogram */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto">
            <span className="font-serif font-bold text-base sm:text-lg tracking-wider opacity-95 drop-shadow-sm">
              {initials}
            </span>
          </div>

          {/* Footer Metadata */}
          <div className="relative z-10 flex items-center justify-between opacity-75">
            <BookOpen className="w-2.5 h-2.5" />
            {book.year && <span className="text-[8px] font-mono tracking-tight">{book.year}</span>}
          </div>
        </div>

        {/* Book Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              {book.number && (
                <span className="inline-block text-[11px] font-semibold text-primary/80 mb-0.5 tracking-tight">
                  #{book.number}
                </span>
              )}
              <h3 className="font-serif font-bold text-foreground text-base sm:text-lg leading-snug tracking-tight">
                {book.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-normal">
                {book.author}
                {book.year && (
                  <span className="text-muted-foreground/60"> · {book.year}</span>
                )}
              </p>
            </div>
          </div>

          {/* Tags / Mood Chips */}
          {book.tags && book.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {book.tags.map((tag, idx) => (
                <span key={idx} className="tag-chip">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* "Why you'll like it" narrative */}
      {book.description && (
        <div className="pt-1 text-xs sm:text-sm text-foreground/85 leading-relaxed bg-muted/25 p-3 rounded-xl border border-border/40 transition-colors">
          <p className="text-[11px] font-semibold text-primary/90 uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>Why you'll love it</span>
          </p>
          <p className="font-normal text-foreground/90">
            {book.description}
          </p>
        </div>
      )}

      {/* Bottom Action Row: Animated TBR Action + Subtle Star Rating */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-border/60 relative">
        {/* Individual TBR Button with Particles */}
        <div className="relative">
          <button
            onClick={handleSaveToTBR}
            disabled={isSaved || isSaving}
            className={`tbr-action-btn ${isSaved ? "saved" : ""}`}
            aria-label={isSaved ? `"${book.title}" is in your TBR` : `Add "${book.title}" to TBR`}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                <span>In TBR</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5 text-primary" />
                <span>{isSaving ? "Saving…" : "Add to TBR"}</span>
              </>
            )}
          </button>

          {/* Upward Floating Particles upon Collection */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="tbr-sparkle-dot"
              style={
                {
                  top: "40%",
                  left: "60%",
                  "--tx": `${p.tx}px`,
                  "--ty": `${p.ty}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {/* Star Rating Control with Micro-Bounce & 5-Star Celebration */}
        <div className="flex items-center gap-1.5 relative">
          {showFiveStarTwinkle && (
            <span className="absolute -top-4 right-0 text-[10px] font-medium text-amber-500 flex items-center gap-0.5 animate-twinkle">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              Favorite!
            </span>
          )}

          <span className="text-[11px] text-muted-foreground/70 hidden sm:inline font-medium">
            Rate:
          </span>
          <div className="flex items-center gap-0.5" role="group" aria-label="Rate book">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`subtle-star-btn ${activeStarBounce === star ? "star-bounce-anim" : ""}`}
                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => handleRate(star)}
              >
                <Star
                  className={`w-3.5 h-3.5 transition-colors ${
                    star <= displayRating
                      ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.4)]"
                      : "text-muted-foreground/30 hover:text-amber-300"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating !== null && (
            <span className="text-[11px] text-amber-500 font-semibold ml-0.5">
              {rating}/5
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookRecommendationCard;
