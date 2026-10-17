/**
 * Recommendation Engine Architecture Types
 * Strictly separates query understanding, candidate filtering, ranking,
 * and explanation generation.
 */

export type QueryIntent =
  | "recommendation"
  | "similarity"
  | "author_similarity"
  | "explore_different"
  | "vague";

export interface StructuredQuery {
  raw_query: string;
  intent: QueryIntent;
  explicit_genres: string[];
  moods: string[];
  themes: string[];
  atmosphere: string[];
  reference_book: string | null;
  reference_author: string | null;
  desired_features: string[];
  negative_constraints: string[];
  is_exploration_different: boolean;
  is_followup_more: boolean;
}

export type AudienceType = "Adult" | "Young Adult" | "Middle Grade" | "General";

export interface StructuredBook {
  id: string;
  title: string;
  author: string;
  publication_year: number | string;
  primary_genres: string[];    // e.g. ["Romance"], ["Fantasy"], ["Self-Help"], ["Mystery"]
  secondary_genres: string[];  // e.g. ["Contemporary", "Comedy"]
  subgenres: string[];         // e.g. ["Romantic Comedy", "Enemies to Lovers"]
  themes: string[];            // e.g. ["Grief", "Identity", "Ambition", "Sisterhood"]
  moods: string[];             // e.g. ["Cozy", "Heartwarming", "Uplifting", "Dark", "Atmospheric"]
  tone: string[];              // e.g. ["Lighthearted", "Whimsical", "Tragic", "Cynical", "Bleak"]
  audience: AudienceType;
  description: string;
  keywords: string[];
  feature_vector: string[];    // Normalized tags for semantic comparison
}

export interface CandidateEvaluation {
  book: StructuredBook;
  passed_hard_constraints: boolean;
  disqualification_reason?: string;
  genre_score: number;
  semantic_similarity: number;
  mood_score: number;
  theme_score: number;
  personalization_score: number;
  duplicate_penalty: number;
  final_score: number;
  matched_dimensions: string[];
}

export interface UserRatingItem {
  title: string;
  author: string;
  genre: string;
  rating: number | null; // 1 to 5
}

export interface UserPreferenceProfile {
  liked_genres: Map<string, number>;    // weight from 4-5★
  disliked_genres: Map<string, number>; // weight from 1-2★
  liked_authors: Set<string>;
  disliked_titles: Set<string>;
  tbr_titles: Set<string>;
}

export interface ValidationResult {
  passed: boolean;
  violations: string[];
}

export interface PipelineDebugLog {
  user_query: string;
  parsed_query: StructuredQuery;
  total_candidates: number;
  candidates_after_hard_filters: number;
  disqualified_samples: Array<{ title: string; reason: string }>;
  top_candidates_scored: Array<{
    title: string;
    final_score: number;
    genre_score: number;
    semantic_sim: number;
    mood_score: number;
    personalization: number;
  }>;
  final_selected_books: string[];
  validation_results: Array<{ title: string; valid: boolean; notes?: string }>;
}

export interface RecommendationPipelineResult {
  books: StructuredBook[];
  intro: string;
  outro: string;
  formatted_response: string;
  debug_log: PipelineDebugLog;
}
