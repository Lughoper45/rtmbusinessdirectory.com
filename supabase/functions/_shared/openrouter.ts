/**
 * OpenRouter chat completions for Application Assistant (grant intake drafts).
 * Default model validated via scripts/test-openrouter-model.mjs — override with OPENROUTER_MODEL secret.
 */

/** Validated free tier default; run scripts/test-openrouter-model.mjs before changing. */
export const DEFAULT_OPENROUTER_MODEL = "openai/gpt-oss-120b:free";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export function getOpenRouterModel(): string {
  return Deno.env.get("OPENROUTER_MODEL")?.trim() || DEFAULT_OPENROUTER_MODEL;
}

export async function openRouterChat(params: {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<{ text: string; model: string; usage?: Record<string, unknown> }> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    throw new Error("Application Assistant is not configured (missing OPENROUTER_API_KEY).");
  }

  const model = getOpenRouterModel();
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://grants.rtmbusinessdirectory.com",
      "X-Title": "RTM Application Assistant",
    },
    body: JSON.stringify({
      model,
      messages: params.messages,
      max_tokens: params.maxTokens ?? 800,
      temperature: params.temperature ?? 0.35,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (body as { error?: { message?: string } })?.error?.message ||
      `OpenRouter request failed (${res.status})`;
    throw new Error(msg);
  }

  const text = (body as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content?.trim();

  if (!text) throw new Error("Application Assistant returned an empty response.");

  return {
    text,
    model,
    usage: (body as { usage?: Record<string, unknown> }).usage,
  };
}
