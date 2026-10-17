import { StructuredBook, StructuredQuery } from "./types";
import { BOOK_CATALOG } from "./bookCatalog";

export interface SemanticMatchResult {
  similarity_score: number; // 0 to 1
  genre_score: number;      // 0 to 1
  mood_score: number;       // 0 to 1
  theme_score: number;      // 0 to 1
  matched_dimensions: string[];
}

// Well-known benchmark reference profiles for popular similarity queries
const REFERENCE_BOOK_PROFILES: Record<
  string,
  {
    primary_genres: string[];
    subgenres: string[];
    themes: string[];
    moods: string[];
    tone: string[];
    features: string[];
    key_dimensions: string[];
  }
> = {
  "Harry Potter": {
    primary_genres: ["Fantasy"],
    subgenres: ["Contemporary Fantasy", "Urban Fantasy"],
    themes: ["Magic School", "Found Family", "Coming of Age", "Good vs Evil", "Underdog"],
    moods: ["Atmospheric", "Whimsical", "Heartwarming", "Intense"],
    tone: ["Lighthearted", "Adventurous"],
    features: ["magic school", "boarding school", "wizards", "young adult", "chosen one", "spells", "mystery investigation", "trio friendship"],
    key_dimensions: ["Magic School & Academy Setting", "Deep Found-Family Camaraderie", "Escalating Stakes & Sense of Wonder"]
  },
  "Six of Crows": {
    primary_genres: ["Fantasy"],
    subgenres: ["Heist", "Dark Fantasy"],
    themes: ["Heist", "Found Family", "Underdogs", "Survival", "Revenge"],
    moods: ["Intense", "Gritty", "Atmospheric"],
    tone: ["Cynical", "Witty", "Edgy"],
    features: ["heist", "criminal underworld", "morally grey crew", "fast-paced", "high stakes", "complex scheming"],
    key_dimensions: ["Morally Grey Ensemble", "High-Stakes Impossible Heist", "Gritty Urban Underworld"]
  },
  "Babel": {
    primary_genres: ["Fantasy", "Historical Fiction"],
    subgenres: ["Dark Academia"],
    themes: ["Dark Academia", "Anti-Colonialism", "Language & Translation", "Revolution", "Imperialism"],
    moods: ["Atmospheric", "Thought-Provoking", "Dark"],
    tone: ["Scholarly", "Tragic", "Heavy"],
    features: ["translation magic", "oxford university", "academic rivalry", "student rebellion", "lingusitics", "historical fantasy"],
    key_dimensions: ["Intellectual Dark Academia", "Anti-Imperialist Tragedy", "Linguistic Magic System"]
  },
  "Atomic Habits": {
    primary_genres: ["Self-Help", "Non-Fiction"],
    subgenres: ["Productivity", "Personal Development"],
    themes: ["Habits & Routine", "Continuous Improvement", "Psychology", "Systems Thinking"],
    moods: ["Thought-Provoking", "Uplifting"],
    tone: ["Practical", "Actionable", "Analytical"],
    features: ["behavior change", "tiny habits", "incremental growth", "daily routines", "discipline", "productivity"],
    key_dimensions: ["Actionable Habit Systems", "Behavioral Psychology", "Continuous Self-Improvement"]
  },
  "The Love Hypothesis": {
    primary_genres: ["Romance"],
    subgenres: ["Romantic Comedy", "Contemporary Romance"],
    themes: ["Fake Dating", "Enemies to Lovers", "STEM / Academia", "Misunderstandings"],
    moods: ["Heartwarming", "Humorous", "Uplifting"],
    tone: ["Lighthearted", "Playful", "Sweet"],
    features: ["fake dating", "grumpy meets sunshine", "stem academia", "witty banter", "slow burn"],
    key_dimensions: ["Fake Dating Trope", "STEM / Academic Workplace", "Grumpy x Sunshine Dynamic"]
  },
  "The Silent Patient": {
    primary_genres: ["Mystery", "Thriller"],
    subgenres: ["Psychological Thriller"],
    themes: ["Psychological Trauma", "Obsession", "Secrets", "Guilt"],
    moods: ["Dark", "Intense", "Atmospheric"],
    tone: ["Chilling", "Suspenseful"],
    features: ["unreliable narrator", "psychotherapy", "shocking twist", "murder investigation", "silent suspect"],
    key_dimensions: ["Mind-Bending Plot Twist", "Psychological Unraveling", "Unreliable Perspective"]
  }
};

// Signature author profiles for author similarity queries
const AUTHOR_STYLE_PROFILES: Record<
  string,
  {
    primary_genres: string[];
    subgenres: string[];
    themes: string[];
    moods: string[];
    features: string[];
    key_dimensions: string[];
  }
> = {
  "Holly Jackson": {
    primary_genres: ["Mystery", "Thriller"],
    subgenres: ["YA Mystery", "Whodunit"],
    themes: ["High School Secrets", "Amateur Sleuth", "Small Town Murder", "Corruption"],
    moods: ["Intense", "Fast-Paced", "Atmospheric"],
    features: ["podcast journalism", "teenage detective", "multiple twists", "evidence boards", "red herrings"],
    key_dimensions: ["Tenacious Teen Investigator", "Fast-Paced Whodunit Twists", "Multimedia / Investigative Format"]
  },
  "Emily Henry": {
    primary_genres: ["Romance"],
    subgenres: ["Contemporary Romance", "Romantic Comedy"],
    themes: ["Second Chances", "Creative Careers", "Summer Vibes", "Emotional Vulnerability"],
    moods: ["Heartwarming", "Humorous", "Emotional"],
    features: ["sharp witty banter", "writers / artists", "vacation setting", "slow burn tension", "depth of character"],
    key_dimensions: ["Sharp Witty Banter", "Emotional Depth Beyond Romance", "Atmospheric Escapist Setting"]
  },
  "James Clear": {
    primary_genres: ["Self-Help", "Non-Fiction"],
    subgenres: ["Productivity", "Personal Development"],
    themes: ["Habits & Routine", "Systems", "Discipline"],
    moods: ["Thought-Provoking"],
    features: ["clear frameworks", "scientific backing", "daily actionable steps", "focus"],
    key_dimensions: ["Practical Frameworks", "Evidence-Based Habit Forming", "Long-Term Consistency"]
  },
  "Fredrik Backman": {
    primary_genres: ["Literary Fiction", "Contemporary"],
    subgenres: ["Humorous Drama"],
    themes: ["Found Family", "Community", "Grief & Healing", "Unlikely Friendships"],
    moods: ["Heartwarming", "Emotional", "Humorous"],
    features: ["grumpy old soul", "eccentric neighbors", "tearjerker moments", "deep humanity"],
    key_dimensions: ["Grumpy Protagonist with Golden Heart", "Community Found Family", "Bittersweet Humor"]
  }
};

/**
 * Calculates multi-dimensional match scores between a book and the user query.
 */
export function calculateSemanticMatch(
  book: StructuredBook,
  query: StructuredQuery
): SemanticMatchResult {
  let genre_score = 0;
  let mood_score = 0;
  let theme_score = 0;
  let similarity_score = 0;
  const matched_dimensions: string[] = [];

  const bookTags = [
    ...book.primary_genres,
    ...book.secondary_genres,
    ...book.subgenres,
    ...book.themes,
    ...book.moods,
    ...book.tone,
    ...book.feature_vector,
    ...book.keywords
  ].map((t) => t.toLowerCase());

  // 1. Explicit Genre Matching Score
  if (query.explicit_genres && query.explicit_genres.length > 0) {
    let matchedGenres = 0;
    for (const g of query.explicit_genres) {
      const gLower = g.toLowerCase();
      if (book.primary_genres.some((pg) => pg.toLowerCase() === gLower)) {
        matchedGenres += 1.0;
        matched_dimensions.push(`Primary Genre: ${g}`);
      } else if (
        book.secondary_genres.some((sg) => sg.toLowerCase() === gLower) ||
        book.subgenres.some((sub) => sub.toLowerCase().includes(gLower))
      ) {
        matchedGenres += 0.7;
        matched_dimensions.push(`Subgenre/Secondary: ${g}`);
      }
    }
    genre_score = Math.min(1, matchedGenres / query.explicit_genres.length);
  } else {
    // If no explicit genre was requested, default genre score is neutral
    genre_score = 0.5;
  }

  // 2. Mood Matching Score
  if (query.moods && query.moods.length > 0) {
    let matchedMoods = 0;
    for (const m of query.moods) {
      const mLower = m.toLowerCase();
      if (book.moods.some((bm) => bm.toLowerCase() === mLower)) {
        matchedMoods += 1.0;
        matched_dimensions.push(`Mood: ${m}`);
      } else if (book.tone.some((bt) => bt.toLowerCase() === mLower)) {
        matchedMoods += 0.8;
        matched_dimensions.push(`Tone: ${m}`);
      } else if (bookTags.some((bt) => bt.includes(mLower))) {
        matchedMoods += 0.5;
      }
    }
    mood_score = Math.min(1, matchedMoods / query.moods.length);
  } else {
    mood_score = 0.5;
  }

  // 3. Theme & Atmosphere Matching Score
  const targetThemes = [...query.themes, ...query.atmosphere];
  if (targetThemes.length > 0) {
    let matchedThemes = 0;
    for (const t of targetThemes) {
      const tLower = t.toLowerCase();
      if (book.themes.some((bt) => bt.toLowerCase() === tLower)) {
        matchedThemes += 1.0;
        matched_dimensions.push(`Theme: ${t}`);
      } else if (bookTags.some((bt) => bt.includes(tLower) || tLower.includes(bt))) {
        matchedThemes += 0.6;
        matched_dimensions.push(`Atmosphere: ${t}`);
      }
    }
    theme_score = Math.min(1, matchedThemes / targetThemes.length);
  } else {
    theme_score = 0.5;
  }

  // 4. Reference Book Semantic Similarity Score
  if (query.reference_book) {
    let refProfile = REFERENCE_BOOK_PROFILES[query.reference_book];

    // If not in static dictionary, find in catalog
    if (!refProfile) {
      const catalogBook = BOOK_CATALOG.find(
        (b) => b.title.toLowerCase() === query.reference_book!.toLowerCase()
      );
      if (catalogBook) {
        refProfile = {
          primary_genres: catalogBook.primary_genres,
          subgenres: catalogBook.subgenres,
          themes: catalogBook.themes,
          moods: catalogBook.moods,
          tone: catalogBook.tone,
          features: catalogBook.feature_vector,
          key_dimensions: catalogBook.themes.slice(0, 3)
        };
      }
    }

    if (refProfile) {
      let overlapCount = 0;
      let totalFeatures = refProfile.features.length + refProfile.themes.length + 2;

      // Genre overlap
      const sharedGenres = book.primary_genres.filter((pg) =>
        refProfile!.primary_genres.includes(pg)
      );
      overlapCount += sharedGenres.length * 2.0;

      // Theme overlap
      for (const th of refProfile.themes) {
        if (book.themes.some((bt) => bt.toLowerCase() === th.toLowerCase())) {
          overlapCount += 1.5;
          matched_dimensions.push(`Shared Theme: ${th}`);
        }
      }

      // Feature vector overlap
      for (const f of refProfile.features) {
        if (bookTags.some((bt) => bt.includes(f.toLowerCase()))) {
          overlapCount += 1.0;
        }
      }

      // Mood / Tone overlap
      for (const m of refProfile.moods) {
        if (book.moods.some((bm) => bm.toLowerCase() === m.toLowerCase())) {
          overlapCount += 0.8;
        }
      }

      similarity_score = Math.min(1, Math.max(0, overlapCount / totalFeatures));
    }
  }

  // 5. Author Similarity Score
  if (query.reference_author) {
    const authorProfile = AUTHOR_STYLE_PROFILES[query.reference_author];
    if (authorProfile) {
      let authorOverlap = 0;
      // Genre match
      if (
        book.primary_genres.some((pg) =>
          authorProfile.primary_genres.includes(pg)
        )
      ) {
        authorOverlap += 2.0;
      }
      // Subgenre match
      for (const sub of authorProfile.subgenres) {
        if (book.subgenres.includes(sub)) {
          authorOverlap += 1.5;
          matched_dimensions.push(`Author Style: ${sub}`);
        }
      }
      // Features match
      for (const f of authorProfile.features) {
        if (bookTags.some((bt) => bt.includes(f.toLowerCase()))) {
          authorOverlap += 1.0;
        }
      }

      similarity_score = Math.max(similarity_score, Math.min(1, authorOverlap / 5.0));
    }
  }

  return {
    similarity_score,
    genre_score,
    mood_score,
    theme_score,
    matched_dimensions: Array.from(new Set(matched_dimensions))
  };
}
