import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useBookChat } from "@/hooks/useBookChat";
import { BookOpen, ArrowLeft, ChevronLeft, ChevronRight, BookMarked, Sparkles } from "lucide-react";

export const Story = () => {
  const navigate = useNavigate();
  const {
    newChat,
    loadConversation,
    deleteConversation,
    renameConversation,
    currentConversationId,
  } = useBookChat();

  // Book opening and navigation states
  const [isOpen, setIsOpen] = useState(false);
  const [currentSpread, setCurrentSpread] = useState(0); // 0: p1-2, 1: p3-4, 2: p5-6, 3: p7-8
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev" | null>(null);

  // Trigger book opening shortly after entering
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard navigation support (ArrowLeft / ArrowRight / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNextPage();
      } else if (e.key === "ArrowLeft") {
        handlePrevPage();
      } else if (e.key === "Escape") {
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSpread, isFlipping, isOpen]);

  const handleNextPage = () => {
    if (!isOpen) {
      setIsOpen(true);
      return;
    }
    if (isFlipping || currentSpread >= 3) return;
    setIsFlipping(true);
    setFlipDirection("next");

    setTimeout(() => {
      setCurrentSpread((prev) => prev + 1);
      setIsFlipping(false);
      setFlipDirection(null);
    }, 850);
  };

  const handlePrevPage = () => {
    if (!isOpen) return;
    if (isFlipping) return;
    if (currentSpread <= 0) {
      setIsOpen(false);
      return;
    }
    setIsFlipping(true);
    setFlipDirection("prev");

    setTimeout(() => {
      setCurrentSpread((prev) => prev - 1);
      setIsFlipping(false);
      setFlipDirection(null);
    }, 850);
  };

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-primary/20 selection:text-foreground overflow-x-hidden bg-background">
      {/* ── ATMOSPHERIC LIBRARY READING ENVIRONMENT ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Warm overhead desk lamp glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-amber-400/[0.07] dark:bg-amber-400/[0.04] blur-[120px] rounded-full" />
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rose-500/[0.06] dark:bg-rose-500/[0.04] blur-[100px] rounded-full" />
        
        {/* Soft vignette at corners */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.45)_100%)]" />

        {/* Gentle floating dust and stardust particles */}
        {[
          { x: "18%", y: "30%", d: "14s", s: "✧" },
          { x: "82%", y: "22%", d: "18s", s: "•" },
          { x: "12%", y: "65%", d: "16s", s: "✦" },
          { x: "88%", y: "70%", d: "20s", s: "•" },
          { x: "32%", y: "15%", d: "15s", s: "•" },
          { x: "68%", y: "18%", d: "17s", s: "✦" },
          { x: "25%", y: "82%", d: "19s", s: "•" },
          { x: "75%", y: "80%", d: "16s", s: "✧" },
        ].map((pt, i) => (
          <span
            key={i}
            className="absolute text-[11px] text-amber-200/25 dark:text-rose-200/20 select-none animate-literary-drift"
            style={{
              left: pt.x,
              top: pt.y,
              animationDuration: pt.d,
              animationDelay: `${i * 1.5}s`,
            }}
          >
            {pt.s}
          </span>
        ))}
      </div>

      {/* Top Navigation */}
      <div className="relative z-30">
        <Navbar
          onNewChat={() => {
            newChat();
            navigate("/");
          }}
          onSelectConversation={(id) => {
            loadConversation(id);
            navigate("/");
          }}
          onDeleteConversation={deleteConversation}
          onRenameConversation={renameConversation}
          currentConversationId={currentConversationId}
        />
      </div>

      {/* Main 3D Physical Book Desk Stage */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 relative z-10">
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center">

          {/* Perspective Viewport Stage */}
          <div className="book-desk-stage book-desk-ambience w-full flex items-center justify-center my-auto py-3">
            {!isOpen ? (
              /* ── 1. CLOSED BOOK COVER (Collector's Hardcover) ── */
              <div
                onClick={() => setIsOpen(true)}
                className="group relative cursor-pointer select-none transition-transform duration-500 hover:scale-[1.02] active:scale-[0.99]"
                style={{ width: "min(92vw, 420px)", height: "min(130vw, 560px)" }}
                role="button"
                tabIndex={0}
                aria-label="Open Quilla's story book"
              >
                {/* Book spine edge shadow */}
                <div className="absolute -left-3 top-2 bottom-2 w-5 rounded-l-md bg-stone-900/50 blur-sm pointer-events-none" />

                {/* Hardcover Outer */}
                <div className="book-hardcover-desk w-full h-full relative p-6 sm:p-8 flex flex-col items-center justify-between border border-amber-300/30 overflow-hidden">
                  {/* Embossed gold/rose corner brackets */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-amber-300/40 rounded-tl-sm pointer-events-none" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-amber-300/40 rounded-tr-sm pointer-events-none" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-amber-300/40 rounded-bl-sm pointer-events-none" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-amber-300/40 rounded-br-sm pointer-events-none" />

                  {/* Embossed inner border line */}
                  <div className="absolute inset-5 border border-amber-300/20 rounded-lg pointer-events-none" />

                  {/* Spine Leather Crease */}
                  <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-black/50 via-transparent to-white/10 pointer-events-none" />

                  {/* Header Ornament */}
                  <div className="pt-8 text-center">
                    <span className="text-[11px] tracking-[0.35em] text-amber-200/75 uppercase font-serif block">
                      A Collector&apos;s Edition
                    </span>
                    <div className="w-16 h-px bg-amber-300/30 mx-auto mt-2" />
                  </div>

                  {/* Center Brand Foil */}
                  <div className="flex flex-col items-center text-center space-y-4 my-auto">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-200/20 to-rose-400/20 border border-amber-200/30 flex items-center justify-center text-amber-200 shadow-inner group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="w-8 h-8" />
                    </div>

                    <h1 className="font-serif text-3xl sm:text-4xl text-amber-100 font-bold tracking-widest uppercase drop-shadow-md">
                      QUILLA
                    </h1>

                    <p className="font-serif italic text-sm text-amber-200/80 max-w-[220px]">
                      Your personal book companion
                    </p>
                  </div>

                  {/* Footer Open Cue */}
                  <div className="pb-6 flex items-center gap-2 text-xs font-serif tracking-wider text-amber-200/80 group-hover:text-amber-100 transition-colors">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
                    <span>Click to open book</span>
                    <span className="text-amber-300 font-bold">→</span>
                  </div>
                </div>
              </div>
            ) : (
              /* ── 2. REALISTIC PHYSICAL OPEN BOOK ── */
              <div
                className="relative w-full select-none animate-in fade-in zoom-in-95 duration-700"
                style={{ maxWidth: "980px" }}
              >
                {/* Thick Antique Hardcover Casing resting on the desk */}
                <div className="book-hardcover-desk relative w-full">
                  {/* Embossed gold corner brackets on open cover */}
                  <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-300/30 rounded-tl-sm pointer-events-none" />
                  <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-300/30 rounded-tr-sm pointer-events-none" />
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-300/30 rounded-bl-sm pointer-events-none" />
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-300/30 rounded-br-sm pointer-events-none" />

                  {/* Silk Bookmark Ribbon emerging from top spine down past the bottom */}
                  <div className="silk-ribbon-bookmark hidden sm:block" />

                  {/* Thick Page Block with visible stacked deckle micro-edges */}
                  <div className="book-page-block relative w-full">
                    {/* Two-Page Seamless Spread Container */}
                    <div className="book-open-spread relative w-full flex flex-col md:flex-row">

                      {/* ── LEFT PAGE WING ── */}
                      <div className="book-page-wing book-page-left">
                        {/* Interactive Corner Peel (Previous Spread) */}
                        {currentSpread > 0 && (
                          <div
                            onClick={handlePrevPage}
                            className="page-corner-peel-left"
                            title="Turn to previous page"
                            role="button"
                            tabIndex={0}
                            aria-label="Previous page"
                          />
                        )}

                        {/* Literary Running Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-stone-300/40 dark:border-stone-700/40 text-muted-foreground">
                          <span className="text-[10px] tracking-[0.25em] font-serif uppercase">
                            QUILLA • CHAPTER {currentSpread + 1}
                          </span>
                          <BookOpen className="w-3.5 h-3.5 text-primary/70" />
                        </div>

                        {/* Page Content per Spread */}
                        <div className="py-6 flex-1 flex flex-col justify-center">
                          {currentSpread === 0 && (
                            <div className="space-y-5 animate-in fade-in duration-300">
                              <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 font-semibold tracking-tight">
                                Why Quilla exists
                              </h2>
                              <p className="font-serif text-base sm:text-[17px] text-stone-800 dark:text-stone-200 leading-[1.85]">
                                <span className="book-drop-cap">F</span>inding a book should be more than searching through an endless algorithmic shelf.
                              </p>
                              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 leading-relaxed font-serif">
                                In an age of endless ratings, algorithms often recommend what was popular, not what will move you.
                              </p>
                            </div>
                          )}

                          {currentSpread === 1 && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                              <span className="text-[11px] uppercase tracking-[0.25em] text-primary font-semibold block font-serif">
                                The Mood of Reading
                              </span>
                              <div className="space-y-3 font-serif italic text-base sm:text-lg text-stone-800 dark:text-stone-200 leading-relaxed pl-4 py-1 border-l-2 border-primary/40">
                                <p>A little magic.</p>
                                <p>A mystery that keeps you awake.</p>
                                <p>A love story that hurts a little.</p>
                                <p>A world you don&apos;t want to leave.</p>
                              </div>
                              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-serif pt-2">
                                Every reading mood is a doorway to a new world.
                              </p>
                            </div>
                          )}

                          {currentSpread === 2 && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                              <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 font-semibold tracking-tight">
                                For the readers
                              </h2>
                              <div className="space-y-2.5 text-stone-750 dark:text-stone-300 font-serif text-sm sm:text-base leading-relaxed">
                                <p>To the readers who still get lost in books.</p>
                                <p>To those who underline sentences they never want to forget.</p>
                                <p>To those who say &lsquo;just one more chapter&rsquo; at 2 AM.</p>
                                <p>To those who abandon a book halfway through without guilt.</p>
                                <p>To those who reread the same story because, somehow, it feels different every time.</p>
                              </div>
                              <p className="font-serif italic text-lg sm:text-xl text-primary font-medium pt-2">
                                Quilla is for you.
                              </p>
                            </div>
                          )}

                          {currentSpread === 3 && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                              <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 font-semibold tracking-tight">
                                The intention was simple.
                              </h2>
                              <p className="font-serif text-base sm:text-lg text-stone-800 dark:text-stone-200 italic leading-relaxed">
                                Books have a strange kind of magic.
                              </p>
                              <div className="space-y-2 font-serif text-sm text-stone-600 dark:text-stone-400 leading-relaxed pl-3.5 border-l border-primary/30">
                                <p>They can make unfamiliar places feel like home.</p>
                                <p>They can put words to feelings you couldn&apos;t explain.</p>
                                <p>They can introduce you to people who never existed and somehow make you miss them.</p>
                              </div>
                              <p className="font-serif text-sm sm:text-base text-primary font-medium italic pt-2">
                                Quilla isn&apos;t here to replace that experience. It&apos;s here to help you reach it.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Page Footer & Pagination */}
                        <div className="flex items-center justify-between pt-3 border-t border-stone-300/40 dark:border-stone-700/40 text-xs font-serif text-muted-foreground/80">
                          <span>Page {currentSpread * 2 + 1}</span>
                          {currentSpread > 0 && (
                            <button
                              onClick={handlePrevPage}
                              className="flex items-center gap-1 hover:text-primary transition-colors text-[11px] cursor-pointer"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              <span>Previous</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ── REALISTIC CENTER GUTTER (NO PINK LINE) ── */}
                      <div className="book-gutter-valley hidden md:block" />

                      {/* ── RIGHT PAGE WING ── */}
                      <div className="book-page-wing book-page-right">
                        {/* Interactive Corner Peel (Next Spread) */}
                        {currentSpread < 3 && (
                          <div
                            onClick={handleNextPage}
                            className="page-corner-peel-right"
                            title="Turn to next page"
                            role="button"
                            tabIndex={0}
                            aria-label="Next page"
                          />
                        )}

                        {/* Literary Running Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-stone-300/40 dark:border-stone-700/40 text-muted-foreground">
                          <span className="text-[10px] tracking-[0.25em] font-serif uppercase">
                            A QUIET COMPANION
                          </span>
                          <span className="text-xs font-serif italic text-primary">✦</span>
                        </div>

                        {/* Page Content per Spread */}
                        <div className="py-6 flex-1 flex flex-col justify-center">
                          {currentSpread === 0 && (
                            <div className="space-y-5 animate-in fade-in duration-300">
                              <div className="space-y-3 font-serif text-base sm:text-lg text-stone-800 dark:text-stone-200 leading-relaxed sm:leading-loose">
                                <p>
                                  Sometimes you know exactly what you want.
                                </p>
                                <p className="text-muted-foreground italic">
                                  Sometimes you only know how you want to feel.
                                </p>
                              </div>
                              <div className="py-3 px-4 border-l-2 border-primary/40 bg-stone-200/20 dark:bg-stone-900/30 font-serif text-sm sm:text-base text-stone-800 dark:text-stone-200 leading-relaxed italic">
                                Finding a book is intimate. It is an act of listening, remembering, and discovering.
                              </div>
                            </div>
                          )}

                          {currentSpread === 1 && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                              <h3 className="font-serif text-xl sm:text-2xl text-stone-900 dark:text-stone-100 font-medium">
                                Making the search human
                              </h3>
                              <p className="font-serif text-sm sm:text-base text-stone-750 dark:text-stone-300 leading-relaxed">
                                Quilla was created to make that search feel more human.
                              </p>
                              <p className="font-serif text-sm sm:text-base text-stone-600 dark:text-stone-400 leading-relaxed">
                                Tell Quilla what you&apos;re looking for, what you&apos;ve loved before, or simply what kind of mood you&apos;re in.
                              </p>
                              <p className="font-serif italic text-sm sm:text-base text-primary font-semibold pt-1">
                                Then let it help you discover the story waiting for you.
                              </p>
                            </div>
                          )}

                          {currentSpread === 2 && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                              <span className="text-[11px] uppercase tracking-[0.25em] text-primary font-semibold block font-serif">
                                What Quilla Believes
                              </span>
                              {/* Clean Literary Typography (No Dashboard Cards) */}
                              <div className="space-y-3.5 pt-1">
                                <div className="border-b border-stone-300/40 dark:border-stone-700/40 pb-2.5">
                                  <span className="text-[11px] uppercase tracking-[0.2em] font-serif text-primary block font-semibold">
                                    I. Discover
                                  </span>
                                  <p className="text-sm font-serif text-stone-750 dark:text-stone-300 mt-1">
                                    Find stories beyond the obvious recommendations.
                                  </p>
                                </div>
                                <div className="border-b border-stone-300/40 dark:border-stone-700/40 pb-2.5">
                                  <span className="text-[11px] uppercase tracking-[0.2em] font-serif text-primary block font-semibold">
                                    II. Connect
                                  </span>
                                  <p className="text-sm font-serif text-stone-750 dark:text-stone-300 mt-1">
                                    Quilla learns from your tastes, ratings, and the books that stay with you.
                                  </p>
                                </div>
                                <div className="pt-0.5">
                                  <span className="text-[11px] uppercase tracking-[0.2em] font-serif text-primary block font-semibold">
                                    III. Read
                                  </span>
                                  <p className="text-sm font-serif text-stone-800 dark:text-stone-200 mt-1 font-medium">
                                    The goal isn&apos;t to recommend more books. <span className="italic font-semibold text-primary">It&apos;s to help you find the right one.</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {currentSpread === 3 && (
                            <div className="space-y-5 animate-in fade-in duration-300 text-center sm:text-left">
                              <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 font-semibold tracking-tight">
                                Keep getting lost.
                              </h2>
                              <div className="space-y-2 text-xs sm:text-sm text-stone-750 dark:text-stone-300 leading-relaxed font-serif">
                                <p>Keep searching for stories that surprise you.</p>
                                <p>Keep returning to the ones that feel like home.</p>
                                <p>Keep reading books that make you forget to check the time.</p>
                                <p className="pt-2 text-muted-foreground italic">And when you don&apos;t know what to read next...</p>
                                <p className="text-stone-900 dark:text-stone-100 font-medium">Quilla will be here.</p>
                              </div>
                              <div className="font-serif italic text-xl text-primary font-semibold">
                                — Quilla
                              </div>

                              {/* Return to Library Ribbon Action */}
                              <div className="pt-3">
                                <button
                                  onClick={() => navigate("/")}
                                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-serif font-medium text-stone-900 dark:text-stone-100 bg-primary/15 hover:bg-primary/25 border border-primary/35 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5 text-primary" />
                                  <span>Back to your library</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Page Footer & Pagination */}
                        <div className="flex items-center justify-between pt-3 border-t border-stone-300/40 dark:border-stone-700/40 text-xs font-serif text-muted-foreground/80">
                          {currentSpread < 3 ? (
                            <button
                              onClick={handleNextPage}
                              className="flex items-center gap-1 hover:text-primary transition-colors text-[11px] ml-auto cursor-pointer"
                            >
                              <span>Next Page</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[11px] italic text-primary/80 ml-auto font-serif">The End</span>
                          )}
                          <span className="ml-3">Page {currentSpread * 2 + 2}</span>
                        </div>
                      </div>

                      {/* ── 3D PHYSICAL TURNING LEAF OVERLAY ── */}
                      {isFlipping && flipDirection === "next" && (
                        <div className="leaf-turn-next">
                          <div className="w-full h-full bg-stone-100/95 dark:bg-stone-900/95 border-l border-black/20 shadow-2xl p-8 flex flex-col justify-between" />
                        </div>
                      )}

                      {isFlipping && flipDirection === "prev" && (
                        <div className="leaf-turn-prev">
                          <div className="w-full h-full bg-stone-100/95 dark:bg-stone-900/95 border-r border-black/20 shadow-2xl p-8 flex flex-col justify-between" />
                        </div>
                      )}

                    </div>
                  </div>
                </div>

                {/* ── TACTILE BOOK CONTROLS BAR ── */}
                <div className="mt-7 flex items-center justify-between px-3 text-xs text-muted-foreground">
                  {/* Left: Previous Spread */}
                  <button
                    onClick={handlePrevPage}
                    disabled={currentSpread === 0}
                    className={`nav-nudge-left flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border/80 bg-card/75 backdrop-blur-xs font-serif transition-all ${
                      currentSpread === 0
                        ? "opacity-35 cursor-not-allowed"
                        : "hover:border-primary/50 hover:text-foreground hover:shadow-xs cursor-pointer"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 text-primary" />
                    <span className="hidden sm:inline">Previous Spread</span>
                  </button>

                  {/* Center: Spread Indicator & Close Book */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2, 3].map((idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (isFlipping) return;
                            setCurrentSpread(idx);
                          }}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            currentSpread === idx
                              ? "w-6 bg-primary"
                              : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                          }`}
                          title={`Go to spread ${idx + 1}`}
                          aria-label={`Spread ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <span className="text-muted-foreground font-serif tracking-wide">
                      Spread {currentSpread + 1} of 4
                    </span>

                    <button
                      onClick={() => setIsOpen(false)}
                      className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors ml-2 font-serif cursor-pointer"
                      title="Close the physical book"
                    >
                      <BookMarked className="w-3.5 h-3.5" />
                      <span>Close</span>
                    </button>
                  </div>

                  {/* Right: Next Spread */}
                  <button
                    onClick={handleNextPage}
                    disabled={currentSpread === 3}
                    className={`nav-nudge-right flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border/80 bg-card/75 backdrop-blur-xs font-serif transition-all ${
                      currentSpread === 3
                        ? "opacity-35 cursor-not-allowed"
                        : "hover:border-primary/50 hover:text-foreground hover:shadow-xs cursor-pointer"
                    }`}
                  >
                    <span className="hidden sm:inline">Next Spread</span>
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Story;
