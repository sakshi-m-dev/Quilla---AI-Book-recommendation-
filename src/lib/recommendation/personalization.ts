import { StructuredBook, StructuredQuery, UserPreferenceProfile, UserRatingItem } from "./types";

/**
 * Builds a structured user profile from rating items and TBR titles.
 */
export function buildUserProfile(
  ratings: UserRatingItem[],
  tbrTitles: string[] = []
): UserPreferenceProfile {
  const liked_genres = new Map<string, number>();
  const disliked_genres = new Map<string, number>();
  const liked_authors = new Set<string>();
  const disliked_titles = new Set<string>();
  const tbr_titles = new Set<string>(tbrTitles.map((t) => t.toLowerCase().trim()));

  for (const item of ratings) {
    const genre = (item.genre || "").trim().toLowerCase();
    const author = (item.author || "").trim().toLowerCase();
    const title = (item.title || "").trim().toLowerCase();
    const rating = item.rating;

    if (rating !== null && rating !== undefined) {
      if (rating >= 4) {
        if (genre) {
          liked_genres.set(genre, (liked_genres.get(genre) || 0) + (rating === 5 ? 2 : 1));
        }
        if (author) {
          liked_authors.add(author);
        }
      } else if (rating <= 2) {
        if (genre) {
          disliked_genres.set(genre, (disliked_genres.get(genre) || 0) + (rating === 1 ? 2 : 1));
        }
        if (title) {
          disliked_titles.add(title);
        }
      }
    }
  }

  return {
    liked_genres,
    disliked_genres,
    liked_authors,
    disliked_titles,
    tbr_titles
  };
}

/**
 * Computes the personalization score for a candidate book.
 * 
 * Rules:
 * 1. If query explicitly asked for "something completely different",
 *    invert user profile to penalize heavily-read genres and boost unread genres.
 * 2. If query has explicit genres, personalization acts ONLY as a secondary tie-breaker
 *    within the matching candidates, never overriding query constraints.
 * 3. Books already rated 1-2★ or disliked are heavily penalized.
 */
export function computePersonalizationScore(
  book: StructuredBook,
  profile: UserPreferenceProfile | null,
  query: StructuredQuery
): number {
  if (!profile) return 0.5; // neutral baseline

  const titleLower = book.title.toLowerCase().trim();
  const authorLower = book.author.toLowerCase().trim();

  // If user already rated this book poorly, heavily penalize
  if (profile.disliked_titles.has(titleLower)) {
    return 0.0;
  }

  const bookGenres = [
    ...book.primary_genres,
    ...book.secondary_genres
  ].map((g) => g.toLowerCase().trim());

  // Check if this is an "exploration / completely different" query
  if (query.is_exploration_different) {
    let familiarityPenalty = 0;
    for (const g of bookGenres) {
      if (profile.liked_genres.has(g)) {
        familiarityPenalty += profile.liked_genres.get(g)! * 0.3;
      }
    }
    if (profile.liked_authors.has(authorLower)) {
      familiarityPenalty += 0.5;
    }

    // Return high score for books from unfamiliar/different genres
    const diffScore = Math.max(0.1, 1.0 - familiarityPenalty);
    return diffScore;
  }

  // Standard personalization scoring:
  let score = 0.5; // baseline neutral

  // 1. Liked genres boost
  for (const g of bookGenres) {
    if (profile.liked_genres.has(g)) {
      const weight = profile.liked_genres.get(g)!;
      score += Math.min(0.25, weight * 0.08);
    }
    if (profile.disliked_genres.has(g)) {
      const weight = profile.disliked_genres.get(g)!;
      score -= Math.min(0.3, weight * 0.1);
    }
  }

  // 2. Liked author boost
  if (profile.liked_authors.has(authorLower)) {
    score += 0.15;
  }

  // 3. TBR interest boost
  if (profile.tbr_titles.has(titleLower)) {
    score += 0.1;
  }

  return Math.min(1.0, Math.max(0.0, score));
}
