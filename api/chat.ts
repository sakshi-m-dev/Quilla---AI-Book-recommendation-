import { sendJson, sendError, parseBody } from "./lib/httpHelper";
import { requireAuth } from "./lib/auth";
import { query, getPool, initDatabase } from "./lib/db";
import { checkRateLimit } from "./lib/rateLimit";
import { streamWithModelRouter, ChatMessageInput } from "./lib/geminiRouter";
import { addDevMessage } from "./messages";
import { extractIntent } from "./lib/intentExtractor";
import { generateBookRecommendation } from "../src/lib/localBackend";
import { generateUniversalBookRecommendation } from "../src/lib/universalBookEngine";
import { runRecommendationPipeline, buildGeminiExplanationPrompt } from "../src/lib/recommendation/pipeline";

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed");
  }

  let authUser;
  try {
    authUser = await requireAuth(req);
  } catch (err: any) {
    // If not authenticated via server JWT, allow guest / local session
    const guestId = req.headers["x-user-id"] || "guest_" + (req.headers["x-forwarded-for"] || "local").toString().replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
    authUser = {
      id: guestId,
      email: "guest@quilla.local",
      name: "Guest Reader",
    };
  }

  // Rate limit: 60 requests per minute per user
  const limit = checkRateLimit(`user_${authUser.id}`, 60, 60000);
  if (!limit.allowed) {
    return sendError(
      res,
      429,
      `Rate limit exceeded. Please wait ${limit.resetInSec} seconds before sending another message.`
    );
  }

  const body = await parseBody(req);
  const { conversationId, messages: clientMessages } = body;

  if (!conversationId) {
    return sendError(res, 400, "conversationId is required");
  }

  if (!Array.isArray(clientMessages) || clientMessages.length === 0) {
    return sendError(res, 400, "messages array is required");
  }

  const pool = getPool();
  const lastUserMsg = clientMessages[clientMessages.length - 1];

  // 1. Extract Structured Intent & Signals from user message
  const userQueryText = String(lastUserMsg?.content || "").trim();
  const intent = extractIntent(userQueryText);

  // 2. Extract Previously Recommended Titles from History to PREVENT REPETITION
  const previouslyRecommendedTitles: string[] = [];
  for (const m of clientMessages) {
    if (m.role === "assistant" && typeof m.content === "string") {
      const matches = m.content.match(/\*\*([^*]+)\*\*\s+by/gi);
      if (matches) {
        for (const match of matches) {
          const title = match.replace(/^\*\*/, "").replace(/\*\*\s+by$/i, "").trim();
          if (!previouslyRecommendedTitles.some((t) => t.toLowerCase() === title.toLowerCase())) {
            previouslyRecommendedTitles.push(title);
          }
        }
      }
    }
  }

  // 3. Verify or create conversation ownership
  let conversationTitle = "New Chat";
  if (pool) {
    try {
      await initDatabase();
      const convCheck = await query(
        "SELECT id, title FROM conversations WHERE id = $1 AND user_id = $2 LIMIT 1",
        [conversationId, authUser.id]
      );

      if (convCheck.rows.length === 0) {
        // Create if it doesn't exist yet for this user
        const initialTitle = lastUserMsg?.content?.slice(0, 45) || "New Chat";
        await query(
          "INSERT INTO conversations (id, user_id, title) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
          [conversationId, authUser.id, initialTitle]
        );
        conversationTitle = initialTitle;
      } else {
        conversationTitle = convCheck.rows[0].title;
      }

      // Save user's incoming message
      const userMsgId = "msg_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      await query(
        "INSERT INTO messages (id, conversation_id, user_id, role, content) VALUES ($1, $2, $3, $4, $5)",
        [userMsgId, conversationId, authUser.id, "user", lastUserMsg.content]
      );

      // If conversation still titled "New Chat", rename based on first prompt
      if (conversationTitle === "New Chat" && clientMessages.length <= 2) {
        const newTitle = lastUserMsg.content.slice(0, 45) + (lastUserMsg.content.length > 45 ? "..." : "");
        await query("UPDATE conversations SET title = $1, updated_at = NOW() WHERE id = $2", [newTitle, conversationId]);
      }
    } catch (dbErr: any) {
      console.warn("[Quilla DB] Remote PostgreSQL unreachable, saving in local memory:", dbErr.message);
      addDevMessage(conversationId, authUser.id, "user", lastUserMsg.content);
    }
  } else {
    // Dev fallback message save
    addDevMessage(conversationId, authUser.id, "user", lastUserMsg.content);
  }


  // 4. Fetch User's TBR and Ratings for Contextual Personalization
  let userRatings: Array<{ title: string; author: string; genre: string; rating: number | null }> = [];
  let userTbrTitles: string[] = [];
  if (pool) {
    try {
      const ratedBooks = await query(
        "SELECT title, author, genre, rating FROM tbr_books WHERE user_id = $1",
        [authUser.id]
      );
      userRatings = ratedBooks.rows.map((b: any) => ({
        title: b.title,
        author: b.author,
        genre: b.genre || "",
        rating: b.rating !== null ? Number(b.rating) : null,
      }));
      userTbrTitles = ratedBooks.rows.map((b: any) => b.title);
    } catch {
      // Ignore rating retrieval errors
    }
  }

  // 5. Execute Multi-Stage Recommendation Pipeline (Deterministic, Constraint-Guarded)
  const pipelineResult = runRecommendationPipeline(userQueryText, {
    limit: 4,
    recentRecommendations: previouslyRecommendedTitles,
    ratings: userRatings,
    tbrTitles: userTbrTitles,
  });

  console.log("[Quilla Recommendation Pipeline Trace]:", JSON.stringify(pipelineResult.debug_log, null, 2));

  // 6. Construct Strict Grounded Prompt for Gemini
  const { systemInstruction: systemPrompt, userPrompt } = buildGeminiExplanationPrompt(
    pipelineResult.books,
    pipelineResult.debug_log.parsed_query
  );

  // Assemble full history for Gemini
  const sanitizedMessages: ChatMessageInput[] = [
    { role: "system", content: systemPrompt },
    ...clientMessages.slice(0, -1).map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: String(m.content || ""),
    })),
    { role: "user", content: userPrompt },
  ];

  // 5. Set Headers for Streaming SSE
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Access-Control-Allow-Origin", "*");

  let fullAssistantResponse = "";

  try {
    const result = await streamWithModelRouter(sanitizedMessages, {
      onChunk: (chunk: string) => {
        fullAssistantResponse += chunk;
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      },
    });

    if (!fullAssistantResponse.trim() || fullAssistantResponse.includes("trouble reaching its recommendation engine")) {
      throw new Error("EMPTY_OR_UNAVAILABLE_RESPONSE");
    }

    // Persist the Completed Response in Database
    if (pool && fullAssistantResponse.trim()) {
      try {
        const assistantMsgId = "msg_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        await query(
          "INSERT INTO messages (id, conversation_id, user_id, role, content) VALUES ($1, $2, $3, $4, $5)",
          [assistantMsgId, conversationId, authUser.id, "assistant", fullAssistantResponse]
        );
        await query("UPDATE conversations SET updated_at = NOW() WHERE id = $1", [conversationId]);
      } catch (err: any) {
        console.error("[Quilla Chat] Failed to save assistant message to PostgreSQL:", err.message);
      }
    } else if (fullAssistantResponse.trim()) {
      addDevMessage(conversationId, authUser.id, "assistant", fullAssistantResponse);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err: any) {
    console.warn("[Quilla Chat Streaming] External model router bypassed, streaming from deterministic pipeline:", err.message);

    const fallbackResponse = pipelineResult.formatted_response;
    fullAssistantResponse = fallbackResponse;

    // Stream word-by-word with realistic pacing
    const words = fallbackResponse.split(" ");
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? "" : " ") + words[i];
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      await new Promise((r) => setTimeout(r, 12));
    }

    // Persist to database
    if (pool && fullAssistantResponse.trim()) {
      try {
        const assistantMsgId = "msg_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        await query(
          "INSERT INTO messages (id, conversation_id, user_id, role, content) VALUES ($1, $2, $3, $4, $5)",
          [assistantMsgId, conversationId, authUser.id, "assistant", fullAssistantResponse]
        );
        await query("UPDATE conversations SET updated_at = NOW() WHERE id = $1", [conversationId]);
      } catch (dbErr: any) {
        console.warn("[Quilla Chat] Remote DB unreachable:", dbErr.message);
      }
    } else if (fullAssistantResponse.trim()) {
      addDevMessage(conversationId, authUser.id, "assistant", fullAssistantResponse);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  }
}
