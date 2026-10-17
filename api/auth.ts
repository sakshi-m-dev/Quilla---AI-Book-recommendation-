import { sendJson, sendError, parseBody } from "./lib/httpHelper";
import {
  createUserWithEmail,
  findUserByEmail,
  findOrCreateGoogleUser,
  comparePassword,
  hashPassword,
  generateToken,
  requireAuth,
  verifyGoogleToken,
  findUserById,
} from "./lib/auth";

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  const url = req.url || "";
  const parsedUrl = new URL(url, "http://localhost");
  const action = req.query?.action || parsedUrl.searchParams.get("action") || parsedUrl.pathname.split("/").pop();

  try {
    // 1. REGISTER
    if (req.method === "POST" && (action === "register" || action === "signup")) {
      const body = await parseBody(req);
      const { email, password, name } = body;

      if (!email || !email.includes("@")) {
        return sendError(res, 400, "A valid email address is required.");
      }
      if (!password || password.length < 6) {
        return sendError(res, 400, "Password must be at least 6 characters long.");
      }

      const existing = await findUserByEmail(email);
      if (existing) {
        return sendError(res, 409, "An account with this email already exists. Please login instead.");
      }

      const passHash = await hashPassword(password);
      const newUser = await createUserWithEmail(email, passHash, name);
      const token = generateToken({ id: newUser.id, email: newUser.email, name: newUser.name });

      return sendJson(res, 201, {
        user: { id: newUser.id, email: newUser.email, name: newUser.name },
        token,
      });
    }

    // 2. LOGIN
    if (req.method === "POST" && (action === "login" || action === "signin")) {
      const body = await parseBody(req);
      const { email, password } = body;

      if (!email || !password) {
        return sendError(res, 400, "Email and password are required.");
      }

      const user = await findUserByEmail(email);
      if (!user) {
        return sendError(res, 401, "Invalid email or password.");
      }

      if (!user.password_hash) {
        return sendError(res, 401, "This account uses Google sign-in. Please use 'Continue with Google'.");
      }

      const valid = await comparePassword(password, user.password_hash);
      if (!valid) {
        return sendError(res, 401, "Invalid email or password.");
      }

      const token = generateToken({ id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url });

      return sendJson(res, 200, {
        user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url },
        token,
      });
    }

    // 3. GOOGLE OAUTH
    if (req.method === "POST" && action === "google") {
      const body = await parseBody(req);
      const { credential, idToken, email, name, picture, googleId } = body;

      const tokenToVerify = credential || idToken;
      let verifiedUser: { googleId: string; email: string; name?: string; picture?: string } | null = null;

      if (tokenToVerify && !tokenToVerify.startsWith("google_oauth_")) {
        verifiedUser = await verifyGoogleToken(tokenToVerify);
        if (!verifiedUser) {
          // Check if tokenToVerify is a Google OAuth access token
          try {
            const uRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${tokenToVerify}` },
            });
            if (uRes.ok) {
              const uData = await uRes.json();
              if (uData.sub && uData.email) {
                verifiedUser = {
                  googleId: uData.sub,
                  email: uData.email,
                  name: uData.name,
                  picture: uData.picture,
                };
              }
            }
          } catch {}
        }
      } else if (email && (googleId || body.sub)) {
        verifiedUser = { googleId: googleId || body.sub, email, name, picture };
      }

      if (!verifiedUser || !verifiedUser.email) {
        return sendError(res, 400, "Google authentication verification failed. Please try again.");
      }

      const user = await findOrCreateGoogleUser(
        verifiedUser.googleId,
        verifiedUser.email,
        verifiedUser.name,
        verifiedUser.picture
      );

      const token = generateToken({ id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url });

      return sendJson(res, 200, {
        user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url },
        token,
      });
    }

    // 4. GET CURRENT USER (ME)
    if (req.method === "GET" && (action === "me" || action === "auth")) {
      const authUser = await requireAuth(req);
      const user = await findUserById(authUser.id);
      if (!user) {
        return sendError(res, 404, "User profile not found.");
      }
      return sendJson(res, 200, {
        user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url },
      });
    }

    // 5. LOGOUT
    if (req.method === "POST" && action === "logout") {
      return sendJson(res, 200, { message: "Signed out successfully." });
    }

    return sendError(res, 404, "Unknown auth action");
  } catch (err: any) {
    if (err.message.startsWith("UNAUTHORIZED")) {
      return sendError(res, 401, "Please sign in to continue.");
    }
    console.error("[Quilla Auth API Error]", err.message);
    return sendError(res, 500, "An error occurred during authentication.");
  }
}
