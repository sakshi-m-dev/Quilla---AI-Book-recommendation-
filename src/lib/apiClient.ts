import { localAuth, localDb, tbrDb, generateBookRecommendation } from "./localBackend";

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface ConversationItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageItem {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export interface TBRItem {
  id: string;
  title: string;
  author: string;
  genre: string;
  year?: string;
  description?: string;
  rating: number | null;
  created_at: string;
}

const TOKEN_KEY = "quilla_auth_token";
const USER_KEY = "quilla_auth_user";

class ApiClient {
  private token: string | null = null;
  private user: UserProfile | null = null;

  constructor() {
    try {
      this.token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) this.user = JSON.parse(userStr);
    } catch {
      this.token = null;
      this.user = null;
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public getUser(): UserProfile | null {
    if (this.user) return this.user;
    // Fallback to local session
    const localSess = localAuth.getCurrentSession();
    if (localSess) {
      return { id: localSess.user.id, email: localSess.user.email, name: localSess.user.email.split("@")[0] };
    }
    return null;
  }

  public setSession(token: string, user: UserProfile) {
    this.token = token;
    this.user = user;
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}
  }

  public clearSession() {
    this.token = null;
    this.user = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localAuth.signOut();
    } catch {}
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // -------------------------------------------------------------
  // AUTH
  // -------------------------------------------------------------
  public async register(email: string, password: string, name?: string): Promise<{ user: UserProfile; token: string }> {
    try {
      const res = await fetch("/api/auth?action=register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register account");

      this.setSession(data.token, data.user);
      return data;
    } catch (err: any) {
      // Fallback local auth
      const localRes = await localAuth.signUp(email, password);
      if (localRes.error) throw localRes.error;
      const user: UserProfile = { id: localRes.user!.id, email: localRes.user!.email, name: email.split("@")[0] };
      const token = "local_token_" + user.id;
      this.setSession(token, user);
      return { user, token };
    }
  }

  public async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    try {
      const res = await fetch("/api/auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid email or password");

      this.setSession(data.token, data.user);
      return data;
    } catch (err: any) {
      // Fallback local auth
      const localRes = await localAuth.signIn(email, password);
      if (localRes.error || !localRes.session) {
        throw new Error(err.message || "Invalid credentials");
      }
      const user: UserProfile = { id: localRes.session.user.id, email: localRes.session.user.email, name: email.split("@")[0] };
      const token = "local_token_" + user.id;
      this.setSession(token, user);
      return { user, token };
    }
  }

  public async googleLogin(credential: string): Promise<{ user: UserProfile; token: string }> {
    try {
      const res = await fetch("/api/auth?action=google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google authentication failed");

      this.setSession(data.token, data.user);
      return data;
    } catch (err: any) {
      // Fallback demo sign in
      const demoEmail = "google_user@gmail.com";
      const localRes = await localAuth.signUp(demoEmail, "google_demo_pass");
      const user: UserProfile = { id: localRes.user?.id || "usr_google", email: demoEmail, name: "Google Reader" };
      const token = "local_token_" + user.id;
      this.setSession(token, user);
      return { user, token };
    }
  }

  public async getCurrentUser(): Promise<UserProfile | null> {
    if (!this.token) return this.getUser();
    try {
      const res = await fetch("/api/auth?action=me", {
        headers: this.getHeaders(),
      });
      if (!res.ok) {
        return this.getUser();
      }
      const data = await res.json();
      this.user = data.user;
      return data.user;
    } catch {
      return this.getUser();
    }
  }

  // -------------------------------------------------------------
  // CONVERSATIONS
  // -------------------------------------------------------------
  public async getConversations(): Promise<ConversationItem[]> {
    try {
      const res = await fetch("/api/conversations", {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return await res.json();
    } catch {
      const user = this.getUser();
      const localConvs = await localDb.getConversations(user?.id || "guest");
      return localConvs.map((c) => ({
        id: c.id,
        title: c.title,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));
    }
  }

  public async createConversation(title = "New Chat"): Promise<ConversationItem> {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return await res.json();
    } catch {
      const user = this.getUser();
      const c = await localDb.createConversation(user?.id || "guest", title);
      return { id: c.id, title: c.title, created_at: c.created_at, updated_at: c.updated_at };
    }
  }

  public async renameConversation(id: string, newTitle: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/conversations?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify({ title: newTitle }),
      });
      return res.ok;
    } catch {
      return await localDb.updateConversationTitle(id, newTitle);
    }
  }

  public async deleteConversation(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/conversations?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
      return res.ok;
    } catch {
      return await localDb.deleteConversation(id);
    }
  }

  // -------------------------------------------------------------
  // MESSAGES
  // -------------------------------------------------------------
  public async getMessages(conversationId: string): Promise<ChatMessageItem[]> {
    try {
      const res = await fetch(`/api/messages?conversationId=${encodeURIComponent(conversationId)}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return await res.json();
    } catch {
      const localMsgs = await localDb.getMessages(conversationId);
      return localMsgs.map((m) => ({ id: m.id, role: m.role, content: m.content, created_at: m.created_at }));
    }
  }

  // -------------------------------------------------------------
  // TBR & RATINGS
  // -------------------------------------------------------------
  public async getTBRBooks(): Promise<TBRItem[]> {
    try {
      const res = await fetch("/api/tbr", {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch TBR books");
      return await res.json();
    } catch {
      const user = this.getUser();
      const localBooks = tbrDb.getBooks(user?.id || "guest");
      return localBooks.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        genre: b.genre,
        rating: b.rating,
        created_at: b.addedAt,
      }));
    }
  }

  public async addTBRBook(book: { title: string; author: string; genre?: string; year?: string; description?: string }): Promise<TBRItem> {
    try {
      const res = await fetch("/api/tbr", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(book),
      });
      if (!res.ok) throw new Error("Failed to add book to TBR");
      return await res.json();
    } catch {
      const user = this.getUser();
      const local = tbrDb.addBook(user?.id || "guest", {
        title: book.title,
        author: book.author,
        genre: book.genre || "General",
      });
      return {
        id: local.id,
        title: local.title,
        author: local.author,
        genre: local.genre,
        rating: local.rating,
        created_at: local.addedAt,
      };
    }
  }

  public async rateTBRBook(id: string, rating: number): Promise<boolean> {
    try {
      const res = await fetch(`/api/tbr?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify({ rating }),
      });
      if (res.ok) return true;
      return tbrDb.rateBook(id, rating);
    } catch {
      return tbrDb.rateBook(id, rating);
    }
  }

  public async removeTBRBook(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/tbr?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
      if (res.ok) return true;
      return tbrDb.removeBook(id);
    } catch {
      return tbrDb.removeBook(id);
    }
  }

  // -------------------------------------------------------------
  // CHAT STREAMING
  // -------------------------------------------------------------
  public async streamChat(
    conversationId: string,
    messages: ChatMessageItem[],
    onChunk: (chunk: string) => void,
    onDone: (fullText: string) => void,
    onError: (err: Error) => void
  ) {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ conversationId, messages }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;

          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulated += parsed.text;
                onChunk(parsed.text);
              }
            } catch {
              // Ignore partial chunk
            }
          }
        }
      }

      if (accumulated.includes("trouble reaching its recommendation engine") || !accumulated.trim()) {
        throw new Error("SERVER_FALLBACK_TRIGGERED");
      }

      onDone(accumulated);
    } catch (err: any) {
      console.warn("[ApiClient] Streaming fetch encountered error, falling back to local engine:", err.message);

      // Offline / local AI recommendation fallback with history and personalization
      const lastUserMsg = messages[messages.length - 1]?.content || "";
      const currentUserId = this.getUser()?.id;
      const localResponse = generateBookRecommendation(lastUserMsg, messages, currentUserId);

      // Stream local response word-by-word with realistic delay
      const words = localResponse.split(" ");
      let current = "";
      for (let i = 0; i < words.length; i++) {
        current += (i === 0 ? "" : " ") + words[i];
        onChunk((i === 0 ? "" : " ") + words[i]);
        await new Promise((r) => setTimeout(r, 15));
      }

      onDone(localResponse);
    }
  }
}

export const apiClient = new ApiClient();
