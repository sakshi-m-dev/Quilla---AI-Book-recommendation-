# 📖 Quilla — AI-Powered Book Recommendation Engine & Chatbot

<p align="center">
  <img src="src/assets/hero%20img.jpg" alt="Quilla Banner" width="100%" style="border-radius: 12px; max-height: 380px; object-fit: cover;" />
</p>

<p align="center">
  <b>A hyper-personalized, multi-dimensional conversational book recommendation assistant built with React, TypeScript, Google Gemini, and PostgreSQL.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Google_Gemini-Multi--Model_Cascade-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/PostgreSQL-Ready-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="Postgres" />
</p>

---

## ✨ Overview

**Quilla** transforms how readers discover their next favorite book. Rather than relying on simple keyword lookups or popularity contests, Quilla uses a **multi-stage recommendation pipeline** combining deep natural-language intent parsing, multi-dimensional semantic scoring, anti-hallucination validation, and Google Gemini conversational explanations.

Whether you're looking for *"a cozy fantasy with found-family vibes and no high-stakes battles"*, *"a psychological thriller like Gillian Flynn with an unreliable narrator"*, or *"hard sci-fi exploring Fermi's paradox"*, Quilla understands your nuanced taste and explains exactly **why** each book matches your mood.

---

## 🚀 Key Features

### 🧠 Intelligent Recommendation Pipeline
- **Intent Extraction Engine**: Parses complex conversational queries into structured parameters: genres, mood, tone, pacing, character dynamics, themes, tropes, and reference authors/books.
- **Hard-Constraint Filtering**: Honors strict exclusions, format requirements, publication eras, and reading levels.
- **Semantic & Vector Matching**: Scores candidate books across 8 orthogonal dimensions (tone, complexity, pace, tropes, themes, style, setting, and subgenre).
- **Anti-Hallucination & Catalog Verification**: Prevents AI from inventing fictional titles by validating candidates against verified metadata catalogs.
- **Gemini Multi-Model Fallback Cascade**: Server-side router that gracefully cascades through `gemini-2.0-flash` ➔ `gemini-1.5-flash` ➔ `gemini-2.0-flash-lite` ➔ `gemini-1.5-pro`, with deterministic fallback ensuring 100% uptime.

### 🎨 Delightful, Immersive UI/UX
- **Dynamic Theming**: Easily switch between themed reading ambiances:
  - ☀️ **Daylight Modern**: Crisp, clean, minimalist
  - 📚 **Grand Library**: Classic wood tones and warm scholarly atmosphere
  - 🕯️ **Warm Sunset**: Cozy, amber-lit reading nook
  - 🌙 **Midnight Charcoal**: Sleek, distraction-free OLED dark mode
- **Interactive Book Recommendation Cards**: Displays book covers, authors, publication years, genre tags, personalized *"Why you'll love it"* rationale, and instant **"Add to TBR"** actions.
- **Batch Actions**: One-click **"Save All to TBR"** saves an entire recommendation batch to your reading list.
- **Fluid Micro-Animations**: Smooth glassmorphic transitions, typing indicators, and responsive mobile-first layouts.

### 🔐 Dual-Backend Architecture
- **Offline / Local Mode**: Works immediately in-browser with zero configuration using local storage and client-side pipeline fallback.
- **Full-Stack Serverless Mode**: Connects to Vercel Serverless Functions (`/api/*`) with PostgreSQL persistence for user accounts, conversation history, and synced TBR (To-Be-Read) shelves.
- **Authentication**: Supports both email/password with JWT tokens and Google OAuth 2.0.

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[User Query] --> B[Intent Extractor]
    B --> C[Candidate Retrieval & Hard Constraints]
    C --> D[Multi-Dimensional Semantic Matcher]
    D --> E[User Profile & Taste Personalization]
    E --> F[Book Catalog Validator]
    F --> G[Gemini Explanation Router]
    G -->|Model Fallback Cascade| H[Gemini 2.0 / 1.5]
    G -->|Deterministic Fallback| I[Rule-Based Explainer]
    H --> J[Structured Output Parser]
    I --> J
    J --> K[Interactive Book Cards & Chat Stream]
```

---

## 📁 Project Structure

```
├── api/                           # Serverless Backend Endpoints (Vercel)
│   ├── auth.ts                    # User login, registration & Google OAuth
│   ├── chat.ts                    # Chat handling & streaming orchestrator
│   ├── conversations.ts           # Conversation history CRUD
│   ├── messages.ts                # Message persistence
│   ├── tbr.ts                     # TBR (To-Be-Read) list management
│   └── lib/                       # Backend utilities (DB pool, JWT, Gemini cascade)
├── src/
│   ├── assets/                    # Background textures & imagery
│   ├── components/                # UI components
│   │   ├── BookRecommendationCard.tsx  # Rich recommendation card with TBR actions
│   │   ├── ChatInput.tsx          # Suggestion prompts & input bar
│   │   ├── ChatMessage.tsx        # Message renderer & multi-format parser
│   │   ├── Navbar.tsx             # Navigation header & theme switcher
│   │   ├── ThemeBackground.tsx    # Dynamic atmospheric backgrounds
│   │   └── ui/                    # shadcn / Radix UI primitives
│   ├── context/                   # Global state (ThemeContext, etc.)
│   ├── hooks/                     # Custom React hooks (useBookChat, useToast)
│   ├── lib/
│   │   ├── apiClient.ts           # Unified API client (switches local vs remote)
│   │   ├── localBackend.ts        # Client-side offline storage & auth mock
│   │   └── recommendation/        # Core Recommendation Engine
│   │       ├── bookCatalog.ts     # Verified book repository
│   │       ├── geminiExplainer.ts # Prompt engineering & fallback generation
│   │       ├── hardConstraints.ts # Strict filter evaluation
│   │       ├── personalization.ts # Reader taste profile adjustments
│   │       ├── pipeline.ts        # Main orchestration pipeline
│   │       ├── queryParser.ts     # Natural language query decomposition
│   │       ├── rankingEngine.ts   # Dimension-weighted candidate ranking
│   │       └── semanticMatcher.ts # Vector & lexical affinity scoring
│   ├── pages/                     # Application routes
│   │   ├── Auth.tsx               # Sign in / Sign up page
│   │   ├── Index.tsx              # Main chat & discovery view
│   │   ├── Profile.tsx            # Reading history & TBR list page
│   │   └── Story.tsx              # About Quilla & algorithm story
│   ├── App.tsx                    # Route definitions & providers
│   └── index.css                  # Custom design tokens, glassmorphism, card styles
├── .env.example                   # Template environment variables
├── package.json                   # Project scripts and dependencies
├── tailwind.config.ts             # Tailwind CSS configuration
└── vite.config.ts                 # Vite bundler configuration
```

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- `npm`, `pnpm`, or `bun`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sakshi-m-dev/Quilla---AI-Book-recommendation-.git
   cd Quilla---AI-Book-recommendation-
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:
   ```env
   # PostgreSQL Connection (Optional for local-only testing)
   DATABASE_URL="postgresql://user:password@localhost:5432/quilla_db"

   # JWT Secret for Session Management
   AUTH_SECRET="your-super-secure-random-secret-key"

   # Google Gemini API Key (Required for server-side AI explanations)
   GEMINI_API_KEY="AIzaSy..."

   # Google OAuth Credentials (Optional)
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   VITE_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:8080](http://localhost:8080) (or the port displayed in your terminal) in your browser.

---

## 🧪 Testing the Recommendation Engine

Try queries like these in the chat to see the multi-dimensional engine in action:

- **Specific Mood & Tropes**: *"I want an enemies-to-lovers fantasy romance with slow burn and banter, like The Cruel Prince."*
- **Atmospheric / Vibe**: *"Give me dark academia with rainy autumn vibes, secret societies, and philosophical mystery."*
- **Niche Tropes**: *"Cozy sci-fi where people just travel on a spaceship, cook food, and form a found family."*
- **Constraint-Heavy**: *"Fast-paced dystopian sci-fi under 350 pages published after 2015 without romance."*

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)
1. Fork or push this repository to your GitHub account.
2. Import the project into [Vercel](https://vercel.com/).
3. Add the environment variables specified in `.env.example` under **Project Settings > Environment Variables**.
4. Deploy! Vercel automatically routes `/api/*` endpoints to the serverless backend.

---

## 🛡️ License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Crafted with ❤️ for book lovers everywhere by <a href="https://github.com/sakshi-m-dev">Sakshi</a>
</p>
