import { sendJson, sendError, parseBody } from "./lib/httpHelper";
import { requireAuth } from "./lib/auth";
import { query, getPool, initDatabase } from "./lib/db";

// In-memory fallback for local dev before PostgreSQL connection is configured
const devConversations = new Map<string, { id: string; user_id: string; title: string; created_at: string; updated_at: string }>();

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  let authUser;
  try {
    authUser = await requireAuth(req);
  } catch (err: any) {
    return sendError(res, 401, "Authentication required");
  }

  const url = new URL(req.url || "", "http://localhost");
  const convId = req.query?.id || url.searchParams.get("id");
  const pool = getPool();

  try {
    // 1. GET ALL CONVERSATIONS FOR USER
    if (req.method === "GET") {
      if (pool) {
        await initDatabase();
        const result = await query(
          "SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 50",
          [authUser.id]
        );
        return sendJson(res, 200, result.rows);
      }

      // Dev memory fallback
      const userConvs = Array.from(devConversations.values())
        .filter((c) => c.user_id === authUser.id)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      return sendJson(res, 200, userConvs);
    }

    // 2. CREATE CONVERSATION
    if (req.method === "POST") {
      const body = await parseBody(req);
      const title = (body.title || "New Chat").substring(0, 100);
      const id = "conv_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      const now = new Date().toISOString();

      if (pool) {
        await initDatabase();
        const result = await query(
          `INSERT INTO conversations (id, user_id, title)
           VALUES ($1, $2, $3)
           RETURNING id, title, created_at, updated_at`,
          [id, authUser.id, title]
        );
        return sendJson(res, 201, result.rows[0]);
      }

      const newConv = { id, user_id: authUser.id, title, created_at: now, updated_at: now };
      devConversations.set(id, newConv);
      return sendJson(res, 201, newConv);
    }

    // 3. RENAME CONVERSATION
    if (req.method === "PATCH") {
      if (!convId) return sendError(res, 400, "Conversation ID required");
      const body = await parseBody(req);
      const title = (body.title || "").trim().substring(0, 100);
      if (!title) return sendError(res, 400, "New title cannot be empty");

      if (pool) {
        await initDatabase();
        const result = await query(
          `UPDATE conversations SET title = $1, updated_at = NOW()
           WHERE id = $2 AND user_id = $3
           RETURNING id, title, updated_at`,
          [title, convId, authUser.id]
        );
        if (result.rowCount === 0) return sendError(res, 404, "Conversation not found or unauthorized");
        return sendJson(res, 200, result.rows[0]);
      }

      const conv = devConversations.get(convId);
      if (!conv || conv.user_id !== authUser.id) return sendError(res, 404, "Conversation not found");
      conv.title = title;
      conv.updated_at = new Date().toISOString();
      return sendJson(res, 200, conv);
    }

    // 4. DELETE CONVERSATION
    if (req.method === "DELETE") {
      if (!convId) return sendError(res, 400, "Conversation ID required");

      if (pool) {
        await initDatabase();
        const result = await query(
          "DELETE FROM conversations WHERE id = $1 AND user_id = $2",
          [convId, authUser.id]
        );
        if (result.rowCount === 0) return sendError(res, 404, "Conversation not found or unauthorized");
        return sendJson(res, 200, { success: true });
      }

      const conv = devConversations.get(convId);
      if (!conv || conv.user_id !== authUser.id) return sendError(res, 404, "Conversation not found");
      devConversations.delete(convId);
      return sendJson(res, 200, { success: true });
    }

    return sendError(res, 405, "Method not allowed");
  } catch (err: any) {
    console.error("[Quilla Conversations API Error]", err.message);
    return sendError(res, 500, "Unable to process conversation request");
  }
}
