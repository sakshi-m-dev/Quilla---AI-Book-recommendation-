import {
  StructuredBook,
  StructuredQuery,
  CandidateEvaluation,
  UserPreferenceProfile
} from "./types";
import { checkHardConstraints } from "./hardConstraints";
import { calculateSemanticMatch } from "./semanticMatcher";
import { computePersonalizationScore } from "./personalization";

export interface RankingOptions {
  limit?: number;
  recentRecommendations?: string[]; // IDs or titles to penalize for repetition control
}

/**
 * Evaluates all candidates through the deterministic scoring pipeline.
 */
export function evaluateAndRankCandidates(
  catalog: StructuredBook[],
  query: StructuredQuery,
  profile: UserPreferenceProfile | null,
  options: RankingOptions = {}
): {
  allEvaluations: CandidateEvaluation[];
  passedEvaluations: CandidateEvaluation[];
  topSelected: StructuredBook[];
} {
  const limit = options.limit || 3;
  const recentRecs = new Set(
    (options.recentRecommendations || []).map((t) => t.toLowerCase().trim())
  );

  const allEvaluations: CandidateEvaluation[] = [];
  const passedEvaluations: CandidateEvaluation[] = [];

  for (const book of catalog) {
    // 1. Hard constraints filtering
    const hardCheck = checkHardConstraints(book, query);

    if (!hardCheck.passed) {
      allEvaluations.push({
        book,
        passed_hard_constraints: false,
        disqualification_reason: hardCheck.disqualification_reason,
        genre_score: 0,
        semantic_similarity: 0,
        mood_score: 0,
        theme_score: 0,
        personalization_score: 0,
        duplicate_penalty: 0,
        final_score: 0,
        matched_dimensions: []
      });
      continue;
    }

    // 2. Semantic & Multidimensional Match
    const match = calculateSemanticMatch(book, query);

    // 3. Personalization Score
    const personalization_score = computePersonalizationScore(book, profile, query);

    // 4. Duplicate / Recency Penalty
    let duplicate_penalty = 0;
    const titleLower = book.title.toLowerCase().trim();
    if (recentRecs.has(titleLower)) {
      duplicate_penalty = 0.35; // heavily discourage repeating in consecutive turns
    }

    // 5. Compute Final Score based on intent
    let final_score = 0;

    if (query.intent === "similarity" || query.intent === "author_similarity") {
      final_score =
        0.40 * match.similarity_score +
        0.25 * match.genre_score +
        0.15 * match.mood_score +
        0.10 * match.theme_score +
        0.10 * personalization_score;
    } else if (query.intent === "explore_different") {
      final_score =
        0.50 * personalization_score +
        0.25 * match.mood_score +
        0.25 * match.theme_score;
    } else if (query.explicit_genres.length > 0) {
      final_score =
        0.45 * match.genre_score +
        0.25 * match.mood_score +
        0.15 * match.theme_score +
        0.15 * personalization_score;
    } else {
      // General mood or theme query
      final_score =
        0.35 * match.mood_score +
        0.35 * match.theme_score +
        0.15 * match.genre_score +
        0.15 * personalization_score;
    }

    final_score = Math.max(0, final_score - duplicate_penalty);

    const evaluation: CandidateEvaluation = {
      book,
      passed_hard_constraints: true,
      genre_score: match.genre_score,
      semantic_similarity: match.similarity_score,
      mood_score: match.mood_score,
      theme_score: match.theme_score,
      personalization_score,
      duplicate_penalty,
      final_score,
      matched_dimensions: match.matched_dimensions
    };

    allEvaluations.push(evaluation);
    passedEvaluations.push(evaluation);
  }

  // Sort candidates that passed hard constraints by final_score descending
  passedEvaluations.sort((a, b) => b.final_score - a.final_score);

  // 6. Diversity and Author Deduplication in Top Selection
  const topSelected: StructuredBook[] = [];
  const selectedAuthors = new Map<string, number>();

  for (const evalItem of passedEvaluations) {
    if (topSelected.length >= limit) break;

    const author = evalItem.book.author.toLowerCase();
    const count = selectedAuthors.get(author) || 0;

    // Maximum 1 book per author in the top recommendations to ensure variety
    if (count < 1) {
      topSelected.push(evalItem.book);
      selectedAuthors.set(author, count + 1);
    }
  }

  // If we still need more candidates and have valid options from same author, allow 2nd book
  if (topSelected.length < limit) {
    for (const evalItem of passedEvaluations) {
      if (topSelected.length >= limit) break;
      if (!topSelected.some((b) => b.id === evalItem.book.id)) {
        topSelected.push(evalItem.book);
      }
    }
  }

  return {
    allEvaluations,
    passedEvaluations,
    topSelected
  };
}
