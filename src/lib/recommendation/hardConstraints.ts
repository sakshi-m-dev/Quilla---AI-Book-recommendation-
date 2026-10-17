import { StructuredBook, StructuredQuery } from "./types";

export interface HardConstraintCheckResult {
  passed: boolean;
  disqualification_reason?: string;
}

// Incompatible tones for specific moods
const MOOD_TONE_INCOMPATIBILITIES: Record<string, string[]> = {
  Cozy: ["Tragic", "Grimdark", "Bleak", "Heavy", "Depressing", "Gory"],
  Heartwarming: ["Tragic", "Grimdark", "Bleak", "Heavy", "Cynical", "Depressing"],
  Humorous: ["Bleak", "Tragic", "Depressing", "Grimdark"]
};

/**
 * Checks whether a book strictly passes all hard constraints extracted from the user's query.
 * Candidates that fail hard constraints are disqualified before any scoring/ranking takes place.
 */
export function checkHardConstraints(
  book: StructuredBook,
  query: StructuredQuery
): HardConstraintCheckResult {
  // 1. Never recommend the exact reference book back to the user
  if (query.reference_book) {
    const refLower = query.reference_book.toLowerCase();
    const bookTitleLower = book.title.toLowerCase();
    if (
      bookTitleLower === refLower ||
      bookTitleLower.includes(refLower) ||
      refLower.includes(bookTitleLower)
    ) {
      return {
        passed: false,
        disqualification_reason: `Cannot recommend the requested reference book "${book.title}" itself.`
      };
    }
  }

  // 2. Explicit Genre Filtering
  // If the user explicitly asks for a genre (e.g., "romance", "self-help"),
  // the candidate MUST match that genre.
  if (query.explicit_genres && query.explicit_genres.length > 0) {
    for (const reqGenre of query.explicit_genres) {
      const reqLower = reqGenre.toLowerCase();
      const allGenres = [
        ...book.primary_genres,
        ...book.secondary_genres,
        ...book.subgenres
      ].map((g) => g.toLowerCase());

      const matchesGenre = allGenres.some(
        (g) => g === reqLower || g.includes(reqLower) || reqLower.includes(g)
      );

      // Special handling for Romance:
      // Six of Crows, Babel, etc. should NEVER be returned for pure romance requests.
      if (reqLower === "romance") {
        const hasPrimaryRomance = book.primary_genres.some(
          (g) => g.toLowerCase() === "romance"
        );
        const hasRomanceSubgenre = book.subgenres.some(
          (g) => g.toLowerCase().includes("romance") || g.toLowerCase().includes("romantic")
        );
        if (!hasPrimaryRomance && !hasRomanceSubgenre) {
          return {
            passed: false,
            disqualification_reason: `Book "${book.title}" is primarily [${book.primary_genres.join(", ")}] and lacks required Romance core focus.`
          };
        }
      }

      // Special handling for Self-Help:
      // Fantasy, YA mystery, etc. should NEVER be returned for self-help requests.
      if (reqLower === "self-help") {
        const hasSelfHelp =
          book.primary_genres.some(
            (g) =>
              g.toLowerCase() === "self-help" ||
              g.toLowerCase() === "non-fiction" ||
              g.toLowerCase() === "personal growth"
          ) ||
          book.secondary_genres.some((g) => g.toLowerCase() === "productivity");

        if (!hasSelfHelp) {
          return {
            passed: false,
            disqualification_reason: `Book "${book.title}" is [${book.primary_genres.join(", ")}] and is not a Self-Help / Non-Fiction guide.`
          };
        }
      }

      // Special handling for Fantasy:
      if (reqLower === "fantasy") {
        const hasFantasy = book.primary_genres.some(
          (g) => g.toLowerCase() === "fantasy"
        ) || book.secondary_genres.some(
          (g) => g.toLowerCase() === "fantasy"
        );
        if (!hasFantasy) {
          return {
            passed: false,
            disqualification_reason: `Book "${book.title}" does not contain Fantasy in primary/secondary genres.`
          };
        }
      }

      // Special handling for Mystery:
      if (reqLower === "mystery") {
        const hasMystery =
          book.primary_genres.some((g) => g.toLowerCase() === "mystery" || g.toLowerCase() === "thriller") ||
          book.secondary_genres.some((g) => g.toLowerCase() === "mystery" || g.toLowerCase() === "thriller");
        if (!hasMystery) {
          return {
            passed: false,
            disqualification_reason: `Book "${book.title}" is not a Mystery or Thriller.`
          };
        }
      }

      // General fallback check for other explicit genres
      if (!matchesGenre) {
        return {
          passed: false,
          disqualification_reason: `Book "${book.title}" does not match explicitly requested genre "${reqGenre}".`
        };
      }
    }
  }

  // 3. Mood and Tone Incompatibility Filtering
  // e.g. "Cozy" or "Heartwarming" should NEVER return dark/tragic/grim books like Babel
  if (query.moods && query.moods.length > 0) {
    for (const mood of query.moods) {
      const incompatibleTones = MOOD_TONE_INCOMPATIBILITIES[mood];
      if (incompatibleTones && incompatibleTones.length > 0) {
        const bookTones = book.tone.map((t) => t.toLowerCase());
        const hasIncompatibleTone = incompatibleTones.some((it) =>
          bookTones.includes(it.toLowerCase())
        );

        if (hasIncompatibleTone) {
          return {
            passed: false,
            disqualification_reason: `Tone conflict: Book "${book.title}" has tone [${book.tone.join(", ")}] which conflicts with requested mood "${mood}".`
          };
        }
      }
    }
  }

  // 4. Negative Constraints Filtering (e.g. "no romance", "without magic")
  if (query.negative_constraints && query.negative_constraints.length > 0) {
    const allTags = [
      ...book.primary_genres,
      ...book.secondary_genres,
      ...book.subgenres,
      ...book.themes,
      ...book.tone
    ].map((t) => t.toLowerCase());

    for (const neg of query.negative_constraints) {
      const negLower = neg.toLowerCase();
      if (allTags.some((t) => t.includes(negLower) || negLower.includes(t))) {
        return {
          passed: false,
          disqualification_reason: `Book "${book.title}" violates negative constraint "${neg}".`
        };
      }
    }
  }

  return { passed: true };
}
