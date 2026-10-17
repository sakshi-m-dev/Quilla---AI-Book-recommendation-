import dotenv from "dotenv";

dotenv.config();

export interface ChatMessageInput {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onError?: (error: Error) => void;
  onSuccess?: (fullText: string, modelUsed: string) => void;
}

const FRIENDLY_UNAVAILABLE_MESSAGE =
  "Quilla is temporarily having trouble reaching its recommendation engine. Please try again in a moment.";

/**
 * Get configured list of Gemini models in priority order
 */
export function getModelCascade(): string[] {
  const models: string[] = [];

  const primary = process.env.PRIMARY_MODEL || "gemini-2.0-flash";
  const fb1 = process.env.FALLBACK_MODEL_1 || "gemini-1.5-flash";
  const fb2 = process.env.FALLBACK_MODEL_2 || "gemini-2.0-flash-lite";
  const fb3 = process.env.FALLBACK_MODEL_3 || "gemini-1.5-pro";

  [primary, fb1, fb2, fb3].forEach((m) => {
    const trimmed = m?.trim();
    if (trimmed && !models.includes(trimmed)) {
      models.push(trimmed);
    }
  });

  if (models.length === 0) {
    models.push("gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro");
  }

  return models;
}

/**
 * Convert application chat history to Gemini v1beta API contents payload
 */
function buildGeminiPayload(messages: ChatMessageInput[]) {
  let systemInstruction: { parts: { text: string }[] } | undefined;
  const contents: Array<{ role: "user" | "model"; parts: { text: string }[] }> = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction = {
        parts: [{ text: msg.content }],
      };
    } else {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }

  // Ensure there is at least one content item
  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: "Hello" }] });
  }

  return {
    system_instruction: systemInstruction,
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };
}

/**
 * Check if an HTTP status code is retryable / trigger for fallback
 */
function isRetryableStatus(status: number): boolean {
  return (
    status === 429 || // Rate limit / quota
    status === 500 || // Internal server error
    status === 502 || // Bad gateway
    status === 503 || // Service unavailable
    status === 504 || // Gateway timeout
    status === 404    // Model not found or deprecated in this region
  );
}

/**
 * Sleep helper for backoff
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Attempt to stream from a specific Gemini model
 */
async function attemptStreamWithModel(
  model: string,
  apiKey: string,
  payload: any,
  signal: AbortSignal,
  onChunk: (text: string) => void
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`MODEL_HTTP_ERROR: status=${res.status} body=${errorText.substring(0, 300)}`);
  }

  if (!res.body) {
    throw new Error("MODEL_EMPTY_BODY");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let fullAccumulatedText = "";

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
        const jsonStr = trimmed.slice(6).trim();
        if (jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunkText) {
            fullAccumulatedText += chunkText;
            onChunk(chunkText);
          }
        } catch {
          // Ignore partial or unparseable SSE line
        }
      }
    }
  }

  return fullAccumulatedText;
}

/**
 * Main Gemini Multi-Model Router
 * Cascades across models on 429, 5xx, or network timeouts
 */
export async function streamWithModelRouter(
  messages: ChatMessageInput[],
  callbacks: StreamCallbacks
): Promise<{ text: string; modelUsed: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("[Gemini Router] GEMINI_API_KEY is not set in environment. Throwing to trigger universal engine.");
    throw new Error("NO_GEMINI_API_KEY");
  }

  const models = getModelCascade();
  const payload = buildGeminiPayload(messages);

  let lastError: Error | null = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    console.log(`[Gemini Router] Attempting generation with model [${i + 1}/${models.length}]: ${model}`);

    // Create controller with 3.5-second timeout per model
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      let accumulated = "";
      let hasReceivedFirstChunk = false;

      accumulated = await attemptStreamWithModel(
        model,
        apiKey,
        payload,
        controller.signal,
        (chunk) => {
          hasReceivedFirstChunk = true;
          callbacks.onChunk(chunk);
        }
      );

      clearTimeout(timeoutId);

      if (accumulated.trim().length > 0) {
        console.log(`[Gemini Router] Successfully completed streaming with model: ${model}`);
        callbacks.onSuccess?.(accumulated, model);
        return { text: accumulated, modelUsed: model };
      }

      throw new Error("Model completed with empty output");
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      const isAborted = controller.signal.aborted;
      const isRetryable =
        isAborted ||
        err.message.includes("MODEL_HTTP_ERROR: status=429") ||
        err.message.includes("MODEL_HTTP_ERROR: status=500") ||
        err.message.includes("MODEL_HTTP_ERROR: status=502") ||
        err.message.includes("MODEL_HTTP_ERROR: status=503") ||
        err.message.includes("MODEL_HTTP_ERROR: status=504") ||
        err.message.includes("MODEL_HTTP_ERROR: status=404") ||
        err.name === "AbortError" ||
        err.message.includes("fetch failed");

      console.warn(
        `[Gemini Router] Model ${model} failed (reason: ${isAborted ? "timeout" : err.message.slice(0, 100)}). Retryable: ${isRetryable}`
      );

      if (i < models.length - 1 && isRetryable) {
        console.log(`[Gemini Router] Switching to next fallback model in 600ms...`);
        await sleep(600);
        continue;
      }
    }
  }

  // If all models failed, throw to trigger universal recommendation engine
  console.warn("[Gemini Router] All configured Gemini models failed or timed out. Triggering universal engine.");
  throw new Error("ALL_GEMINI_MODELS_FAILED");
}
