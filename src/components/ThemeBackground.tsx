import React, { useState, useEffect, useMemo } from "react";
import { BgEventType } from "@/lib/bgEvents";
import { useTheme } from "@/context/ThemeContext";

interface LiteraryParticle {
  id: number;
  type: "dot" | "star" | "quote" | "sparkle";
  content?: string;
  left: string;
  top: string;
  size: string;
  duration: string;
  delay: string;
  maxOpacity: number;
  sway: string;
}

export const ThemeBackground: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Interaction responsive states
  const [sendPulseActive, setSendPulseActive] = useState(false);
  const [isGeneratingActive, setIsGeneratingActive] = useState(false);
  const [tbrRippleActive, setTbrRippleActive] = useState(false);

  // Parallax state (desktop only)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Listen for interaction events from ChatInput, Index, BookRecommendationCard
  useEffect(() => {
    const handleBgEffect = (e: Event) => {
      const detail = (e as CustomEvent<{ type: BgEventType }>).detail;
      if (!detail) return;

      if (detail.type === "send") {
        setSendPulseActive(true);
        setTimeout(() => setSendPulseActive(false), 800);
      } else if (detail.type === "tbr-add") {
        setTbrRippleActive(true);
        setTimeout(() => setTbrRippleActive(false), 850);
      } else if (detail.type === "generating-start") {
        setIsGeneratingActive(true);
      } else if (detail.type === "generating-end") {
        setIsGeneratingActive(false);
      }
    };

    window.addEventListener("quilla-bg-effect", handleBgEffect);
    return () => window.removeEventListener("quilla-bg-effect", handleBgEffect);
  }, []);

  // Screen size and reduced motion detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(motionQuery.matches);
    const motionListener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener("change", motionListener);

    return () => {
      window.removeEventListener("resize", checkMobile);
      motionQuery.removeEventListener("change", motionListener);
    };
  }, []);

  // Mouse Parallax (smooth, max 7px, desktop only)
  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Map cursor position to -7px to +7px range
      targetX = ((e.clientX / innerWidth) - 0.5) * 14;
      targetY = ((e.clientY / innerHeight) - 0.5) * 14;
    };

    const animate = () => {
      // Smooth interpolation (lerp)
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      setMouseOffset({
        x: Math.round(currentX * 100) / 100,
        y: Math.round(currentY * 100) / 100,
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isMobile, prefersReducedMotion]);

  // Generate stable literary particles
  const particles = useMemo(() => {
    const total = isMobile ? 8 : 22;
    const items: LiteraryParticle[] = [];

    for (let i = 0; i < total; i++) {
      const typeChoice = i % 5;
      let type: LiteraryParticle["type"] = "dot";
      let content: string | undefined;

      if (typeChoice === 1 || typeChoice === 4) {
        type = "star";
        content = i % 2 === 0 ? "✦" : "✧";
      } else if (typeChoice === 2) {
        type = "quote";
        content = i % 2 === 0 ? "“" : "”";
      } else if (typeChoice === 3) {
        type = "sparkle";
      }

      items.push({
        id: i,
        type,
        content,
        left: `${(i * 4.4 + 3.5) % 94}%`,
        top: `${(i * 8.9 + 7) % 88}%`,
        size: type === "dot" ? (i % 2 === 0 ? "3px" : "4px") : "11px",
        duration: `${9 + (i % 6) * 2.2}s`,
        delay: `${(i * 1.1) % 7}s`,
        maxOpacity: 0.12 + (i % 4) * 0.04,
        sway: i % 2 === 0 ? "12px" : "-12px",
      });
    }

    return items;
  }, [isMobile]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none"
    >
      {/* ── LAYER 1: BASE ATMOSPHERIC GRADIENT & VIGNETTE ── */}
      {/* Warm parchment base (Light) / Velvety midnight charcoal-plum (Dark) */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: isDark
            ? `radial-gradient(ellipse 85% 70% at 50% 36%, 
                hsl(250 14% 11%) 0%, 
                hsl(250 14% 9.5%) 50%, 
                hsl(260 16% 8%) 85%, 
                hsl(265 18% 7%) 100%)`
            : `radial-gradient(ellipse 85% 70% at 50% 36%, 
                hsl(40 32% 98.5%) 0%, 
                hsl(40 24% 97%) 50%, 
                hsl(350 20% 95%) 85%, 
                hsl(345 20% 93%) 100%)`,
        }}
      />

      {/* Central Reading Spotlight (illuminates central conversation area) */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? `radial-gradient(ellipse 65% 50% at 50% 35%, 
                hsl(345 50% 20% / 0.2) 0%, 
                hsl(350 30% 14% / 0.1) 60%, 
                transparent 100%)`
            : `radial-gradient(ellipse 65% 50% at 50% 35%, 
                hsl(350 50% 99% / 0.85) 0%, 
                hsl(40 30% 98% / 0.4) 60%, 
                transparent 100%)`,
        }}
      />

      {/* ── LAYER 2: WATERMARK MOTIFS & AMBIENT GRADIENT ORBS ── */}
      {/* Faint Architectural Open Book Outline Watermark (Top Right) */}
      <svg
        className="absolute -top-12 -right-16 w-[420px] sm:w-[540px] h-[420px] sm:h-[540px] opacity-[0.028] dark:opacity-[0.035] stroke-foreground fill-none transition-transform duration-700"
        viewBox="0 0 100 100"
        style={{
          transform: !prefersReducedMotion
            ? `translate3d(${mouseOffset.x * 0.6}px, ${mouseOffset.y * 0.6}px, 0)`
            : "none",
        }}
      >
        <path
          d="M 50,75 C 32,70 18,72 8,78 L 8,24 C 20,18 34,16 50,22 C 66,16 80,18 92,24 L 92,78 C 82,72 68,70 50,75 Z"
          strokeWidth="1.2"
        />
        <path d="M 50,22 L 50,75" strokeWidth="1.2" />
        <path d="M 12,32 C 24,27 36,26 46,30" strokeWidth="0.8" />
        <path d="M 12,40 C 24,35 36,34 46,38" strokeWidth="0.8" />
        <path d="M 12,48 C 24,43 36,42 46,46" strokeWidth="0.8" />
        <path d="M 88,32 C 76,27 64,26 54,30" strokeWidth="0.8" />
        <path d="M 88,40 C 76,35 64,34 54,38" strokeWidth="0.8" />
        <path d="M 88,48 C 76,43 64,42 54,46" strokeWidth="0.8" />
      </svg>

      {/* Faint Literary Quotation Watermark (Bottom Left) */}
      <div
        className="absolute bottom-12 -left-10 text-[180px] sm:text-[260px] font-serif font-black leading-none opacity-[0.022] dark:opacity-[0.032] text-primary select-none pointer-events-none"
        style={{
          transform: !prefersReducedMotion
            ? `translate3d(${mouseOffset.x * -0.4}px, ${mouseOffset.y * -0.4}px, 0)`
            : "none",
        }}
      >
        “
      </div>

      {/* Large Ambient Gradient Orbs with Mouse Parallax */}
      <div
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{
          transform: !prefersReducedMotion
            ? `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`
            : "none",
        }}
      >
        {/* Orb 1: Upper-left soft rose glow */}
        <div
          className={`absolute -top-36 -left-36 w-[560px] h-[560px] rounded-full bg-gradient-to-br from-rose-300/30 via-pink-200/18 to-transparent dark:from-rose-500/16 dark:via-pink-900/12 dark:to-transparent blur-[125px] animate-orb-1 transition-opacity duration-700 ${
            isGeneratingActive ? "opacity-95 scale-105" : "opacity-80"
          }`}
        />

        {/* Orb 2: Bottom-right warm amber/rose parchment glow */}
        <div
          className={`absolute top-1/3 -right-44 w-[640px] h-[640px] rounded-full bg-gradient-to-bl from-amber-200/30 via-rose-100/18 to-transparent dark:from-amber-600/10 dark:via-rose-950/15 dark:to-transparent blur-[135px] animate-orb-2 transition-opacity duration-700 ${
            isGeneratingActive ? "opacity-95" : "opacity-75"
          }`}
        />

        {/* Orb 3: Mid-left gentle blush/plum */}
        <div
          className="absolute top-1/2 -left-28 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-pink-200/25 via-rose-100/15 to-transparent dark:from-rose-800/15 dark:via-rose-950/18 dark:to-transparent blur-[115px] animate-orb-3 opacity-70"
        />

        {/* Orb 4: Top-right pale rose aura */}
        <div
          className="absolute -top-24 right-1/4 w-[460px] h-[460px] rounded-full bg-gradient-to-b from-rose-200/22 via-pink-100/12 to-transparent dark:from-pink-600/10 dark:via-rose-950/12 dark:to-transparent blur-[120px] animate-orb-2 opacity-65"
        />
      </div>

      {/* ── LAYER 3: FLOATING LITERARY PARTICLES ── */}
      <div className="absolute inset-0">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute select-none pointer-events-none animate-literary-drift"
            style={
              {
                left: p.left,
                top: p.top,
                "--duration": p.duration,
                "--delay": p.delay,
                "--max-opacity": p.maxOpacity,
                "--sway": p.sway,
                animationDuration: p.duration,
                animationDelay: p.delay,
              } as React.CSSProperties
            }
          >
            {p.type === "dot" && (
              <div
                className="rounded-full bg-primary/45 shadow-[0_0_6px_rgba(244,63,94,0.35)]"
                style={{ width: p.size, height: p.size }}
              />
            )}
            {p.type === "star" && (
              <span className="text-[11px] text-primary/45 font-serif leading-none drop-shadow-[0_0_4px_rgba(244,63,94,0.3)]">
                {p.content}
              </span>
            )}
            {p.type === "quote" && (
              <span className="text-[14px] text-foreground/25 font-serif font-bold leading-none">
                {p.content}
              </span>
            )}
            {p.type === "sparkle" && (
              <div className="w-1.5 h-1.5 bg-amber-400/45 rotate-45 rounded-[1px] shadow-[0_0_6px_rgba(251,191,36,0.3)]" />
            )}
          </div>
        ))}
      </div>

      {/* Extra floating stardust when Quilla is generating */}
      {isGeneratingActive && (
        <div className="absolute inset-x-1/4 top-1/3 bottom-1/3 flex justify-around pointer-events-none">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-ping shadow-[0_0_8px_rgba(244,63,94,0.5)]"
              style={{ animationDuration: `${1.8 + n * 0.4}s`, animationDelay: `${n * 0.3}s` }}
            />
          ))}
        </div>
      )}

      {/* ── LAYER 4: INTERACTION-RESPONSIVE PULSES ── */}
      {/* 1. Message Send Pulse (Soft radial burst from bottom composer area) */}
      {sendPulseActive && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-radial from-primary/20 via-rose-300/10 to-transparent dark:from-primary/25 dark:via-rose-900/15 blur-2xl animate-send-pulse pointer-events-none"
        />
      )}

      {/* 2. TBR Collection Ripple (Subtle ambient golden-rose shimmer across screen) */}
      {tbrRippleActive && (
        <div
          className="absolute inset-0 bg-radial from-amber-300/15 via-rose-300/15 to-transparent dark:from-amber-400/10 dark:via-rose-500/15 blur-3xl animate-tbr-ripple pointer-events-none"
        />
      )}

      {/* ── LAYER 5: TACTILE PAPER GRAIN TEXTURE ── */}
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none ${
          isDark ? "opacity-[0.035] mix-blend-overlay" : "opacity-[0.024] mix-blend-multiply"
        }`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="literary-parchment-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.72"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#literary-parchment-grain)" />
      </svg>
    </div>
  );
};

export default ThemeBackground;

