import { sendJson, sendError } from "./lib/httpHelper";
import { requireAuth } from "./lib/auth";
import { query, getPool, initDatabase } from "./lib/db";

// In-memory fallback for local dev
const devMessages = new Map<string, Array<{ id: string; conversation_id: string; user_id: string; role: string; content: string; created_at: string }>>();

export function addDevMessage(convId: string, userId: string, role: string, content: string) {
  const list = devMessages.get(convId) || [];
  const id = "msg_" + Math.random().toString(36).substring(2, 11);
  const msg = { id, conversation_id: convId, user_id: userId, role, content, created_at: new Date().toISOString() };
  list.push(msg);
  devMessages.set(convId, list);
  return msg;
}

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
  const conversationId = req.query?.conversationId || url.searchParams.get("conversationId");

  if (!conversationId) {
    return sendError(res, 400, "conversationId query parameter is required");
  }

  const pool = getPool();

  try {
    if (req.method === "GET") {
      if (pool) {
        await initDatabase();
        // Verify conversation belongs to user
        const convCheck = await query(
          "SELECT id FROM conversations WHERE id = $1 AND user_id = $2 LIMIT 1",
          [conversationId, authUser.id]
        );

        if (convCheck.rows.length === 0) {
          return sendError(res, 404, "Conversation not found or access denied");
        }

        const messages = await query(
          "SELECT id, role, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
          [conversationId]
        );

        return sendJson(res, 200, messages.rows);
      }

      // Dev fallback
      const list = devMessages.get(conversationId) || [];
      return sendJson(res, 200, list.map((m) => ({ id: m.id, role: m.role, content: m.content, created_at: m.created_at })));
    }

    return sendError(res, 405, "Method not allowed");
  } catch (err: any) {
    console.error("[Quilla Messages API Error]", err.message);
    return sendError(res, 500, "Unable to fetch messages");
  }
}
