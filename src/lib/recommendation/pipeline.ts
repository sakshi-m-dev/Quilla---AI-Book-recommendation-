import {
  StructuredQuery,
  StructuredBook,
  UserRatingItem,
  PipelineDebugLog,
  RecommendationPipelineResult
} from "./types";
import { BOOK_CATALOG } from "./bookCatalog";
import { parseUserQuery } from "./queryParser";
import { buildUserProfile } from "./personalization";
import { evaluateAndRankCandidates } from "./rankingEngine";
import { validateFinalRecommendations } from "./validator";
import {
  generateDeterministicFallbackExplanation,
  buildGeminiExplanationPrompt
} from "./geminiExplainer";

export interface PipelineOptions {
  limit?: number;
  recentRecommendations?: string[];
  ratings?: UserRatingItem[];
  tbrTitles?: string[];
}

/**
 * Master recommendation pipeline orchestrator.
 * Fully transparent, deterministic, and auditable.
 */
export function runRecommendationPipeline(
  rawQuery: string,
  options: PipelineOptions = {}
): RecommendationPipelineResult {
  const limit = options.limit || 3;
  const ratings = options.ratings || [];
  const tbrTitles = options.tbrTitles || [];
  const recentRecs = options.recentRecommendations || [];

  // 1. Query Understanding
  const parsedQuery: StructuredQuery = parseUserQuery(rawQuery);

  // 2. Personalization Profile
  const profile = buildUserProfile(ratings, tbrTitles);

  // 3 & 4. Hard Constraints Filtering + Scoring & Ranking
  const { allEvaluations, passedEvaluations, topSelected } = evaluateAndRankCandidates(
    BOOK_CATALOG,
    parsedQuery,
    profile,
    {
      limit,
      recentRecommendations: recentRecs
    }
  );

  // 5. Pre-Response Validation & Replacement
  const { finalBooks, validationLog } = validateFinalRecommendations(
    topSelected,
    passedEvaluations,
    parsedQuery,
    limit
  );

  // 6. Build Debug Log for full auditability
  const disqualified = allEvaluations
    .filter((e) => !e.passed_hard_constraints)
    .slice(0, 8)
    .map((e) => ({
      title: e.book.title,
      reason: e.disqualification_reason || "Failed hard constraints"
    }));

  const topScored = passedEvaluations.slice(0, 5).map((e) => ({
    title: e.book.title,
    final_score: Number(e.final_score.toFixed(3)),
    genre_score: Number(e.genre_score.toFixed(3)),
    semantic_sim: Number(e.semantic_similarity.toFixed(3)),
    mood_score: Number(e.mood_score.toFixed(3)),
    personalization: Number(e.personalization_score.toFixed(3))
  }));

  const debug_log: PipelineDebugLog = {
    user_query: rawQuery,
    parsed_query: parsedQuery,
    total_candidates: BOOK_CATALOG.length,
    candidates_after_hard_filters: passedEvaluations.length,
    disqualified_samples: disqualified,
    top_candidates_scored: topScored,
    final_selected_books: finalBooks.map((b) => b.title),
    validation_results: validationLog
  };

  // 7. Explanation generation
  const { intro, outro, formatted_response } = generateDeterministicFallbackExplanation(
    finalBooks,
    parsedQuery,
    passedEvaluations
  );

  return {
    books: finalBooks,
    intro,
    outro,
    formatted_response,
    debug_log
  };
}

export { buildGeminiExplanationPrompt };
