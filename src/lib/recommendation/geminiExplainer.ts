import { StructuredBook, StructuredQuery, CandidateEvaluation } from "./types";

/**
 * Builds the strict explanation prompt for Gemini.
 * Forces Gemini to describe ONLY the pipeline-selected books without hallucinating alternatives.
 */
export function buildGeminiExplanationPrompt(
  books: StructuredBook[],
  query: StructuredQuery,
  evaluations?: CandidateEvaluation[]
): {
  systemInstruction: string;
  userPrompt: string;
} {
  const booksSummary = books.map((b, idx) => {
    const evalData = evaluations?.find((e) => e.book.id === b.id);
    const matchedDims = evalData?.matched_dimensions.join(", ") || b.themes.slice(0, 2).join(", ");
    return `${idx + 1}. "${b.title}" by ${b.author} (${b.publication_year})
   - Primary Genre: ${b.primary_genres.join(", ")}
   - Tone & Mood: ${b.moods.join(", ")} (${b.tone.join(", ")})
   - Key Dimensions Matching Query: ${matchedDims}
   - Description: ${b.description}`;
  }).join("\n\n");

  const systemInstruction = `You are Quilla, a perceptive, warm, and exceptionally literary AI book curator.
The recommendation engine has ALREADY selected the following canonical books that strictly match the user's criteria.

CRITICAL RULES:
1. You MUST describe ONLY the exact books listed below. Do NOT substitute or add different books.
2. Maintain 100% fidelity to the provided genres and tones. Do NOT mischaracterize a non-romance book as romance, or a dark tragedy as cozy.
3. Write an engaging, personalized conversational explanation for why each book fits the reader's request.
4. Structure your response with a friendly intro, a distinct section for each book, and a warm closing invite.`;

  const userPrompt = `Reader's Query: "${query.raw_query}"

Selected Books:
${booksSummary}

Explain why each of these books fits the reader's request based on their themes, tone, and pacing.`;

  return { systemInstruction, userPrompt };
}

/**
 * High-quality deterministic fallback explainer.
 * Generates natural, conversational book recommendation text when Gemini is offline or in local fallback mode.
 */
export function generateDeterministicFallbackExplanation(
  books: StructuredBook[],
  query: StructuredQuery,
  evaluations?: CandidateEvaluation[]
): { intro: string; outro: string; formatted_response: string } {
  let intro = "";
  if (query.intent === "similarity" && query.reference_book) {
    intro = `If you loved **${query.reference_book}**, here are handpicked books that capture its signature atmosphere, compelling storytelling, and memorable character bonds:`;
  } else if (query.intent === "author_similarity" && query.reference_author) {
    intro = `Here are books that match **${query.reference_author}**'s distinctive pacing, sharp dialogue, and gripping narrative style:`;
  } else if (query.is_exploration_different) {
    intro = `Ready to venture outside your usual reading habits? Here are fresh, standout books from captivating genres you haven't explored yet:`;
  } else if (query.explicit_genres.length > 0) {
    const genresStr = query.explicit_genres.join(" and ");
    intro = `Here are compelling **${genresStr}** recommendations that match what you're looking for:`;
  } else if (query.moods.length > 0) {
    intro = `For a **${query.moods.join(" & ").toLowerCase()}** reading experience, these books deliver the exact mood you asked for:`;
  } else {
    intro = `Here are standout recommendations carefully selected to fit your reading preferences:`;
  }

  const sections = books.map((book) => {
    const evalData = evaluations?.find((e) => e.book.id === book.id);
    const matched = evalData?.matched_dimensions && evalData.matched_dimensions.length > 0
      ? evalData.matched_dimensions.join(" • ")
      : `${book.primary_genres.join(", ")} • ${book.moods.slice(0, 2).join(", ")}`;

    return `### **${book.title}** by ${book.author}
*${matched}*

${book.description}

**Why you'll love it:** Captures the ${book.moods.join(" and ").toLowerCase()} vibe with themes of ${book.themes.slice(0, 2).join(" and ").toLowerCase()}.`;
  });

  const outro = `Would you like more details on any of these, or should we explore a different reading vibe next?`;

  const formatted_response = `${intro}\n\n${sections.join("\n\n")}\n\n${outro}`;

  return {
    intro,
    outro,
    formatted_response
  };
}
