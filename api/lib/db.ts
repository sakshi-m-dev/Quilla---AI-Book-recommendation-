import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

let pool: pg.Pool | null = null;
let isInitialized = false;

export function getPool(): pg.Pool | null {
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    const isLocalhost = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    pool = new Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client:", err.message);
    });
  }

  return pool;
}

export async function query(text: string, params?: any[]) {
  const p = getPool();
  if (!p) {
    throw new Error("DATABASE_URL is not configured. Please set your PostgreSQL connection string in .env");
  }
  return p.query(text, params);
}

export async function initDatabase(): Promise<boolean> {
  if (isInitialized) return true;
  const p = getPool();
  if (!p) {
    console.warn("[Quilla DB] DATABASE_URL not set. Running in development mode.");
    return false;
  }

  try {
    const client = await p.connect();
    try {
      await client.query("BEGIN");

      // Acquire advisory lock so simultaneous serverless cold starts do not race on DDL
      await client.query("SELECT pg_advisory_xact_lock(7429381);");

      // 1. Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          name VARCHAR(255),
          avatar_url TEXT,
          google_id VARCHAR(255) UNIQUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 2. Conversations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
        CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
      `);

      // 3. Messages table
      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id VARCHAR(64) PRIMARY KEY,
          conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(32) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at ASC);
      `);

      // 4. TBR Books table
      await client.query(`
        CREATE TABLE IF NOT EXISTS tbr_books (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          author VARCHAR(255) NOT NULL,
          genre VARCHAR(100) NOT NULL,
          year VARCHAR(30),
          description TEXT,
          rating INT CHECK (rating >= 1 AND rating <= 5),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_tbr_books_user_id ON tbr_books(user_id);
      `);

      await client.query("COMMIT");
      isInitialized = true;
      console.log("[Quilla DB] PostgreSQL tables initialized successfully.");
      return true;
    } catch (err: any) {
      await client.query("ROLLBACK");
      console.error("[Quilla DB] Failed to run database migrations:", err.message);
      return false;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("[Quilla DB] Could not connect to PostgreSQL:", err.message);
    return false;
  }
}
