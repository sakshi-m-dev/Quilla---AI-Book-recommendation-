import { useState, useMemo } from "react";
import { BookOpen, BookmarkCheck, BookmarkPlus } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { localAuth, tbrDb } from "@/lib/localBackend";
import { toast } from "sonner";
import { triggerBgEffect } from "@/lib/bgEvents";
import BookRecommendationCard, { BookRecommendation } from "./BookRecommendationCard";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

// Detect genre/context
function detectGenre(content: string): string {
  const c = content.toLowerCase();
  if (c.includes("sci-fi") || c.includes("science fiction") || c.includes("space")) return "Sci-Fi";
  if (c.includes("dark fantasy") || c.includes("grimdark")) return "Dark Fantasy";
  if (c.includes("fantasy") || c.includes("magic") || c.includes("dragon")) return "Fantasy";
  if (c.includes("thriller") || c.includes("mystery") || c.includes("crime") || c.includes("detective")) return "Mystery";
  if (c.includes("romance") || c.includes("love story") || c.includes("enemies to lovers")) return "Romance";
  if (c.includes("horror") || c.includes("spooky") || c.includes("gothic")) return "Horror";
  if (c.includes("non-fiction") || c.includes("history") || c.includes("biography") || c.includes("memoir")) return "Non-Fiction";
  if (c.includes("classic") || c.includes("literature")) return "Classics";
  if (c.includes("cozy")) return "Cozy";
  return "General";
}

// Extract Tags from Description or Context
function extractTags(text: string, genre: string): string[] {
  const tags: string[] = [];
  const themeMatch = text.match(/\*(?:Themes?|Mood|Tags?|Keywords?):\*\s*([^\n]+)/i);
  if (themeMatch) {
    const rawTags = themeMatch[1].split(/[,;*|]/).map((t) => t.trim().replace(/^\*|\*$/g, "")).filter(Boolean);
    tags.push(...rawTags);
  }

  if (tags.length === 0) {
    if (genre && genre !== "General") tags.push(genre);
    const lower = text.toLowerCase();
    const candidates = [
      "Atmospheric", "Dark", "Cozy", "Emotional", "Fast-paced", "Lyrical",
      "Worldbuilding", "Character-driven", "Mind-bending", "Epic", "Romantic",
      "Whimsical", "Heartbreaking", "Philosophical", "Twisty"
    ];
    for (const cand of candidates) {
      if (lower.includes(cand.toLowerCase())) {
        if (!tags.includes(cand)) tags.push(cand);
      }
    }
  }

  return tags.slice(0, 4);
}

interface ParsedMessage {
  intro: string;
  books: BookRecommendation[];
  outro: string;
}

function parseAssistantMessage(content: string): ParsedMessage {
  const lines = content.split("\n");
  const books: BookRecommendation[] = [];
  const introLines: string[] = [];
  const outroLines: string[] = [];

  let currentBook: Partial<BookRecommendation> | null = null;
  let bookDescriptions: string[] = [];
  let foundFirstBook = false;
  let finishedBooks = false;

  const flushBook = () => {
    if (!currentBook?.title) return;
    const raw = bookDescriptions.join(" ").trim();
    const desc = raw
      .replace(/\*\*Why you.ll (?:love|like) it\*\*:?\s*/i, "")
      .replace(/\*Why you.ll (?:love|like) it\*:?\s*/i, "")
      .replace(/Why you.ll (?:love|like) it:?\s*/i, "")
      .replace(/\*(?:Themes?|Mood|Tags?):\*\s*[^\n]+/i, "")
      .replace(/^\*(.+)\*$/, "$1")
      .trim();

    books.push({
      number: currentBook.number ?? (books.length + 1),
      title: currentBook.title,
      author: currentBook.author || "Unknown",
      year: currentBook.year,
      genre: currentBook.genre,
      tags: extractTags(raw, currentBook.genre || "General"),
      description: desc,
    });
    bookDescriptions = [];
    currentBook = null;
  };

  for (const line of lines) {
    const t = line.trim();

    // Pattern 1: ### **Title** by Author (2020)  — Gemini pipeline primary output
    const h = t.match(/^#{1,4}\s+(?:\*\*(.+?)\*\*|"(.+?)"|(.+?))\s+by\s+([^(\n]+?)(?:\s*\((\d{4}[^)]*)\))?/i);
    // Pattern 2: 1. **Title** by Author (2020)  — numbered list
    const n = !h ? t.match(/^(\d+)[.)]\s+(?:\*\*(.+?)\*\*|"(.+?)"|([^*"(\n]+?))\s+by\s+([^(\n]+?)(?:\s*\((\d{4}[^)]*)\))?/i) : null;
    // Pattern 3: **Title** by Author  — bare bold (fallback)
    const b = !h && !n ? t.match(/^\*\*([^*\n]+?)\*\*\s+by\s+([^(\n]+?)(?:\s*\((\d{4}[^)]*)\))?$/i) : null;

    if (h || n || b) {
      flushBook();
      foundFirstBook = true;
      let title = "", author = "", year = "", num = books.length + 1;
      if (h) {
        title = (h[1] || h[2] || h[3] || "").trim();
        author = (h[4] || "").trim().replace(/[,.]$/, "");
        year = (h[5] || "").trim();
      } else if (n) {
        num = parseInt(n[1]) || num;
        title = (n[2] || n[3] || n[4] || "").trim();
        author = (n[5] || "").trim().replace(/[,.]$/, "");
        year = (n[6] || "").trim();
      } else if (b) {
        title = (b[1] || "").trim();
        author = (b[2] || "").trim().replace(/[,.]$/, "");
        year = (b[3] || "").trim();
      }
      currentBook = { number: num, title, author, year: year || undefined, genre: detectGenre(content) };
      continue;
    }

    // Capture "Why you'll love it:" inline lines
    if (currentBook && /Why you.ll (?:love|like) it/i.test(t)) {
      const desc = t.replace(/\*?\*?Why you.ll (?:love|like) it\*?\*?:?\s*/i, "").replace(/\*+$/, "").trim();
      if (desc) bookDescriptions.push(desc);
      continue;
    }

    if (!foundFirstBook) {
      introLines.push(line);
    } else if (!finishedBooks) {
      const isOutro = /^(?:Let me know|Would you like|Have you read|Which one|Feel free|If any of these|I hope you enjoy|Happy reading|Do any of these|Want me to|Should I)/i.test(t);
      if (isOutro) {
        flushBook();
        finishedBooks = true;
        outroLines.push(line);
      } else {
        // Skip short italic metadata lines like *Cozy • Heartwarming*
        const isShortMeta = /^\*[^*]/.test(t) && !/^\*\*/.test(t) && t.length < 100;
        if (!isShortMeta) bookDescriptions.push(t);
      }
    } else {
      outroLines.push(line);
    }
  }

  flushBook();

  return {
    intro: introLines.join("\n").trim(),
    books,
    outro: outroLines.join("\n").trim(),
  };
}

// Inline Formatter
function renderFormattedInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let idx = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+?)\*(?!\*)/);

    let chosen: RegExpMatchArray | null = null;
    if (boldMatch && italicMatch) {
      chosen = boldMatch.index! <= italicMatch.index! ? boldMatch : italicMatch;
    } else {
      chosen = boldMatch || italicMatch;
    }

    if (!chosen || chosen.index === undefined) {
      parts.push(<span key={idx++}>{remaining}</span>);
      break;
    }

    if (chosen.index > 0) {
      parts.push(<span key={idx++}>{remaining.slice(0, chosen.index)}</span>);
    }

    if (chosen[0].startsWith("**")) {
      parts.push(<strong key={idx++} className="font-semibold text-foreground">{chosen[1]}</strong>);
    } else {
      parts.push(<em key={idx++} className="italic text-foreground/90">{chosen[1]}</em>);
    }

    remaining = remaining.slice(chosen.index + chosen[0].length);
  }

  return parts;
}

function renderTextBlocks(text: string) {
  if (!text) return null;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
  return (
    <div className="space-y-2.5 text-[0.9375rem] leading-relaxed text-foreground/90 font-normal">
      {paragraphs.map((para, i) => (
        <p key={i} className="whitespace-pre-line">{renderFormattedInline(para)}</p>
      ))}
    </div>
  );
}

export const ChatMessage = ({ role, content }: ChatMessageProps) => {
  const isUser = role === "user";
  const [allSaved, setAllSaved] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savedTitles, setSavedTitles] = useState<Set<string>>(new Set());

  const parsed = useMemo(() => {
    if (isUser) return { intro: content, books: [], outro: "" };
    return parseAssistantMessage(content);
  }, [isUser, content]);

  const fallbackGenre = useMemo(() => detectGenre(content), [content]);

  const handleSaveAll = async () => {
    if (parsed.books.length === 0 || allSaved || isSavingAll) return;
    setIsSavingAll(true);
    triggerBgEffect("tbr-add");
    try {
      const unsaved = parsed.books.filter((b) => !savedTitles.has(b.title));
      await Promise.all(unsaved.map(async (book) => {
        try {
          await apiClient.addTBRBook({ title: book.title, author: book.author, genre: book.genre || fallbackGenre, year: book.year, description: book.description });
        } catch {
          const session = localAuth.getCurrentSession();
          tbrDb.addBook(session?.user.id || "guest", { title: book.title, author: book.author, genre: book.genre || fallbackGenre });
        }
      }));
      const next = new Set(savedTitles);
      parsed.books.forEach((b) => next.add(b.title));
      setSavedTitles(next);
      setAllSaved(true);
      toast.success("All curated books saved to your TBR! 📚");
    } catch {
      toast.error("Could not save all books");
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleCardSaveChange = (title: string, saved: boolean) => {
    setSavedTitles((prev) => {
      const next = new Set(prev);
      if (saved) next.add(title); else next.delete(title);
      if (parsed.books.length > 0 && parsed.books.every((b) => next.has(b.title))) setAllSaved(true);
      return next;
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end py-1">
        <div className="bubble-user px-4 py-2.5 max-w-[85%] sm:max-w-[75%] text-sm leading-relaxed whitespace-pre-wrap font-medium">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 sm:gap-4 items-start py-2.5">
      <div
        className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-100 to-pink-200 text-rose-700 dark:from-rose-950 dark:to-pink-900 dark:text-rose-300 dark:border-rose-800/40 flex items-center justify-center shrink-0 mt-0.5 shadow-sm select-none border border-rose-200/50"
        title="Quilla Book Companion"
      >
        <BookOpen className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 pt-0.5 space-y-3.5">
        {parsed.intro && renderTextBlocks(parsed.intro)}

        {parsed.books.length > 0 && (
          <div className="space-y-2.5 my-2">
            <div className="flex items-center justify-between pb-1.5 pt-1 border-b border-border/50">
              <div className="flex items-center gap-1.5">
                <span className="text-primary text-sm animate-twinkle">✦</span>
                <span className="text-xs font-semibold text-foreground/85 tracking-wide">
                  {parsed.books.length} book{parsed.books.length !== 1 ? "s" : ""} curated for you
                </span>
              </div>
              {parsed.books.length > 1 && (
                <button
                  onClick={handleSaveAll}
                  disabled={allSaved || isSavingAll}
                  className={`tbr-save-all-btn ${allSaved ? "all-saved" : ""}`}
                  aria-label="Save all books to TBR"
                >
                  {allSaved ? (
                    <><BookmarkCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" /><span>All saved to TBR</span></>
                  ) : (
                    <><BookmarkPlus className="w-3.5 h-3.5 text-primary" /><span>{isSavingAll ? "Saving all…" : "Save all to TBR"}</span></>
                  )}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1">
              {parsed.books.map((book, idx) => (
                <BookRecommendationCard
                  key={book.title}
                  book={book}
                  index={idx}
                  fallbackGenre={fallbackGenre}
                  isSavedInitially={savedTitles.has(book.title)}
                  onSaveChange={(saved) => handleCardSaveChange(book.title, saved)}
                />
              ))}
            </div>
          </div>
        )}

        {parsed.outro && renderTextBlocks(parsed.outro)}

        {/* Fallback: raw text if nothing parsed as cards */}
        {parsed.books.length === 0 && !parsed.intro && !parsed.outro && renderTextBlocks(content)}
      </div>
    </div>
  );
};

export default ChatMessage;
