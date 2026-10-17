import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query, getPool, initDatabase } from "./db";
import dotenv from "dotenv";

dotenv.config();

const AUTH_SECRET = process.env.AUTH_SECRET || "quilla-default-dev-secret-change-in-production";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

// In-memory fallback for local dev when PostgreSQL is not yet connected
const devUsers = new Map<string, { id: string; email: string; password_hash?: string; name?: string; avatar_url?: string; google_id?: string }>();

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
    },
    AUTH_SECRET,
    { expiresIn: "30d" }
  );
}

export function verifyToken(token: string): AuthenticatedUser | null {
  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as any;
    if (!decoded || !decoded.sub || !decoded.email) return null;
    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      avatar_url: decoded.avatar_url,
    };
  } catch {
    return null;
  }
}

export function extractToken(req: any): string | null {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  // Check cookies
  const cookieHeader = req.headers?.cookie;
  if (cookieHeader && typeof cookieHeader === "string") {
    const match = cookieHeader.match(/quilla_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
}

export async function requireAuth(req: any): Promise<AuthenticatedUser> {
  const token = extractToken(req);
  if (!token) {
    throw new Error("UNAUTHORIZED: Missing authentication credentials");
  }

  const user = verifyToken(token);
  if (!user) {
    throw new Error("UNAUTHORIZED: Invalid or expired session token");
  }

  return user;
}

// Find user by email
export async function findUserByEmail(email: string) {
  const pool = getPool();
  if (pool) {
    await initDatabase();
    const res = await query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email.toLowerCase().trim()]);
    return res.rows[0] || null;
  }

  // In-memory dev fallback
  for (const u of devUsers.values()) {
    if (u.email.toLowerCase() === email.toLowerCase().trim()) return u;
  }
  return null;
}

// Find user by ID
export async function findUserById(id: string) {
  const pool = getPool();
  if (pool) {
    await initDatabase();
    const res = await query("SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1 LIMIT 1", [id]);
    return res.rows[0] || null;
  }

  return devUsers.get(id) || null;
}

// Create email user
export async function createUserWithEmail(email: string, passwordHash: string, name?: string) {
  const pool = getPool();
  const id = "usr_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  const normalizedEmail = email.toLowerCase().trim();

  if (pool) {
    await initDatabase();
    const res = await query(
      `INSERT INTO users (id, email, password_hash, name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, avatar_url, created_at`,
      [id, normalizedEmail, passwordHash, name || normalizedEmail.split("@")[0]]
    );
    return res.rows[0];
  }

  // In-memory dev fallback
  const newUser = {
    id,
    email: normalizedEmail,
    password_hash: passwordHash,
    name: name || normalizedEmail.split("@")[0],
    avatar_url: undefined,
  };
  devUsers.set(id, newUser);
  return newUser;
}

// Create or find Google OAuth user
export async function findOrCreateGoogleUser(googleId: string, email: string, name?: string, avatarUrl?: string) {
  const pool = getPool();
  const normalizedEmail = email.toLowerCase().trim();

  if (pool) {
    await initDatabase();
    // Check by google_id or email
    const existing = await query(
      "SELECT * FROM users WHERE google_id = $1 OR email = $2 LIMIT 1",
      [googleId, normalizedEmail]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      if (!user.google_id) {
        await query("UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3", [
          googleId,
          avatarUrl,
          user.id,
        ]);
      }
      return user;
    }

    const id = "usr_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    const res = await query(
      `INSERT INTO users (id, email, google_id, name, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, avatar_url, created_at`,
      [id, normalizedEmail, googleId, name || normalizedEmail.split("@")[0], avatarUrl]
    );
    return res.rows[0];
  }

  // In-memory dev fallback
  for (const u of devUsers.values()) {
    if (u.google_id === googleId || u.email.toLowerCase() === normalizedEmail) {
      return u;
    }
  }

  const id = "usr_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  const newUser = {
    id,
    email: normalizedEmail,
    google_id: googleId,
    name: name || normalizedEmail.split("@")[0],
    avatar_url: avatarUrl,
  };
  devUsers.set(id, newUser);
  return newUser;
}

// Verify Google ID token using Google TokenInfo endpoint
export async function verifyGoogleToken(idToken: string): Promise<{ googleId: string; email: string; name?: string; picture?: string } | null> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (!data.sub || !data.email) return null;

    // Optional Google Client ID validation if configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && data.aud !== clientId) {
      console.warn("[Quilla Auth] Google ID token audience mismatch:", data.aud, "expected:", clientId);
    }

    return {
      googleId: data.sub,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  } catch (err: any) {
    console.error("[Quilla Auth] Failed to verify Google token:", err.message);
    return null;
  }
}
