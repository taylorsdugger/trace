// OpenRouter wrapper. OpenAI-compatible REST API.
// Models are configured per-feature so they can be swapped without touching call sites.

export const MODELS = {
  chat: "google/gemini-2.5-flash",          // Socratic + themes
  embed: "google/text-embedding-004",       // 768-dim
} as const;

const BASE_URL = "https://openrouter.ai/api/v1";

function apiKey(): string {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k) throw new Error("Missing OPENROUTER_API_KEY");
  return k;
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey()}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
    "X-Title": "Trace",
  };
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chat(messages: ChatMessage[], opts: { model?: string; temperature?: number } = {}): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: opts.model ?? MODELS.chat,
      temperature: opts.temperature ?? 0.7,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter chat ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function chatStream(messages: ChatMessage[], opts: { model?: string; temperature?: number } = {}): Promise<Response> {
  return fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: opts.model ?? MODELS.chat,
      temperature: opts.temperature ?? 0.7,
      stream: true,
      messages,
    }),
  });
}

export async function embed(texts: string[]): Promise<number[][]> {
  const res = await fetch(`${BASE_URL}/embeddings`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ model: MODELS.embed, input: texts }),
  });
  if (!res.ok) throw new Error(`OpenRouter embed ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}
