import { StructuredBook, StructuredQuery, CandidateEvaluation, ValidationResult } from "./types";
import { checkHardConstraints } from "./hardConstraints";

export interface ValidatedSelection {
  finalBooks: StructuredBook[];
  validationLog: Array<{ title: string; valid: boolean; notes?: string }>;
}

/**
 * Validates selected books against query constraints and replaces any invalid picks
 * with the next best candidates that pass hard constraints.
 */
export function validateFinalRecommendations(
  selectedBooks: StructuredBook[],
  allPassedCandidates: CandidateEvaluation[],
  query: StructuredQuery,
  targetCount: number = 3
): ValidatedSelection {
  const finalBooks: StructuredBook[] = [];
  const validationLog: Array<{ title: string; valid: boolean; notes?: string }> = [];
  const seenIds = new Set<string>();

  // 1. Validate initial picks
  for (const book of selectedBooks) {
    const check = checkHardConstraints(book, query);
    if (check.passed && !seenIds.has(book.id)) {
      finalBooks.push(book);
      seenIds.add(book.id);
      validationLog.push({
        title: book.title,
        valid: true,
        notes: `Passed all hard constraints and genre checks.`
      });
    } else {
      validationLog.push({
        title: book.title,
        valid: false,
        notes: check.disqualification_reason || "Duplicate or failed constraint"
      });
    }
  }

  // 2. If any were disqualified or count is below target, backfill from allPassedCandidates
  if (finalBooks.length < targetCount) {
    for (const cand of allPassedCandidates) {
      if (finalBooks.length >= targetCount) break;
      if (!seenIds.has(cand.book.id)) {
        const check = checkHardConstraints(cand.book, query);
        if (check.passed) {
          finalBooks.push(cand.book);
          seenIds.add(cand.book.id);
          validationLog.push({
            title: cand.book.title,
            valid: true,
            notes: `Backfilled valid candidate with final_score ${cand.final_score.toFixed(2)}.`
          });
        }
      }
    }
  }

  return {
    finalBooks,
    validationLog
  };
}
