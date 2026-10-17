import { sendJson, sendError, parseBody } from "./lib/httpHelper";
import { requireAuth } from "./lib/auth";
import { query, getPool, initDatabase } from "./lib/db";

// In-memory fallback for local dev
const devTbr = new Map<string, { id: string; user_id: string; title: string; author: string; genre: string; year?: string; description?: string; rating: number | null; created_at: string; updated_at: string }>();

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
  const bookId = req.query?.id || url.searchParams.get("id");
  const pool = getPool();

  try {
    // 1. GET USER TBR LIST
    if (req.method === "GET") {
      if (pool) {
        await initDatabase();
        const result = await query(
          "SELECT id, title, author, genre, year, description, rating, created_at FROM tbr_books WHERE user_id = $1 ORDER BY created_at DESC",
          [authUser.id]
        );
        return sendJson(res, 200, result.rows);
      }

      const list = Array.from(devTbr.values())
        .filter((b) => b.user_id === authUser.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return sendJson(res, 200, list);
    }

    // 2. ADD BOOK TO TBR
    if (req.method === "POST") {
      const body = await parseBody(req);
      const { title, author, genre, year, description } = body;

      if (!title || !author) {
        return sendError(res, 400, "Title and Author are required.");
      }

      const cleanTitle = title.trim().substring(0, 255);
      const cleanAuthor = author.trim().substring(0, 255);
      const cleanGenre = (genre || "General").trim().substring(0, 100);

      if (pool) {
        await initDatabase();
        // Check for duplicates
        const existing = await query(
          "SELECT id, title, author, genre, year, description, rating FROM tbr_books WHERE user_id = $1 AND LOWER(title) = LOWER($2) AND LOWER(author) = LOWER($3) LIMIT 1",
          [authUser.id, cleanTitle, cleanAuthor]
        );

        if (existing.rows.length > 0) {
          return sendJson(res, 200, existing.rows[0]);
        }

        const id = "tbr_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        const result = await query(
          `INSERT INTO tbr_books (id, user_id, title, author, genre, year, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, title, author, genre, year, description, rating, created_at`,
          [id, authUser.id, cleanTitle, cleanAuthor, cleanGenre, year || null, description || null]
        );
        return sendJson(res, 201, result.rows[0]);
      }

      // Dev fallback
      for (const b of devTbr.values()) {
        if (b.user_id === authUser.id && b.title.toLowerCase() === cleanTitle.toLowerCase() && b.author.toLowerCase() === cleanAuthor.toLowerCase()) {
          return sendJson(res, 200, b);
        }
      }

      const id = "tbr_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      const now = new Date().toISOString();
      const newBook = {
        id,
        user_id: authUser.id,
        title: cleanTitle,
        author: cleanAuthor,
        genre: cleanGenre,
        year,
        description,
        rating: null,
        created_at: now,
        updated_at: now,
      };
      devTbr.set(id, newBook);
      return sendJson(res, 201, newBook);
    }

    // 3. UPDATE RATING (1-5 STARS)
    if (req.method === "PATCH") {
      if (!bookId) return sendError(res, 400, "Book ID is required");
      const body = await parseBody(req);
      const rating = Number(body.rating);

      if (isNaN(rating) || rating < 1 || rating > 5) {
        return sendError(res, 400, "Rating must be an integer between 1 and 5");
      }

      if (pool) {
        await initDatabase();
        const result = await query(
          `UPDATE tbr_books SET rating = $1, updated_at = NOW()
           WHERE id = $2 AND user_id = $3
           RETURNING id, title, rating`,
          [rating, bookId, authUser.id]
        );
        if (result.rowCount === 0) return sendError(res, 404, "Book not found or unauthorized");
        return sendJson(res, 200, result.rows[0]);
      }

      const book = devTbr.get(bookId);
      if (!book || book.user_id !== authUser.id) return sendError(res, 404, "Book not found");
      book.rating = rating;
      book.updated_at = new Date().toISOString();
      return sendJson(res, 200, book);
    }

    // 4. DELETE BOOK FROM TBR
    if (req.method === "DELETE") {
      if (!bookId) return sendError(res, 400, "Book ID is required");

      if (pool) {
        await initDatabase();
        const result = await query(
          "DELETE FROM tbr_books WHERE id = $1 AND user_id = $2",
          [bookId, authUser.id]
        );
        if (result.rowCount === 0) return sendError(res, 404, "Book not found or unauthorized");
        return sendJson(res, 200, { success: true });
      }

      const book = devTbr.get(bookId);
      if (!book || book.user_id !== authUser.id) return sendError(res, 404, "Book not found");
      devTbr.delete(bookId);
      return sendJson(res, 200, { success: true });
    }

    return sendError(res, 405, "Method not allowed");
  } catch (err: any) {
    console.error("[Quilla TBR API Error]", err.message);
    return sendError(res, 500, "Unable to process TBR request");
  }
}
