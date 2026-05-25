/**
 * OpenRouter chat completions for Application Assistant (grant intake drafts).
 * Default model validated via scripts/test-openrouter-model.mjs — override with OPENROUTER_MODEL secret.
 */

/** Validated free tier default; run scripts/test-openrouter-model.mjs before changing. */
export const DEFAULT_OPENROUTER_MODEL = "openai/gpt-oss-120b:free";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const OPENROUTER_NOT_CONFIGURED_MESSAGE =
  "Application Assistant not configured. Set OPENROUTER_API_KEY on kajwp.";

export type AssistantErrorCode =
  | "OPENROUTER_NOT_CONFIGURED"
  | "OPENROUTER_UPSTREAM"
  | "OPENROUTER_EMPTY";

export class AssistantError extends Error {
  readonly code: AssistantErrorCode;

  constructor(message: string, code: AssistantErrorCode) {
    super(message);
    this.name = "AssistantError";
    this.code = code;
  }
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export function isOpenRouterConfigured(): boolean {
  return Boolean(Deno.env.get("OPENROUTER_API_KEY")?.trim());
}

export function getOpenRouterModel(): string {
  return Deno.env.get("OPENROUTER_MODEL")?.trim() || DEFAULT_OPENROUTER_MODEL;
}

export async function openRouterChat(params: {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  httpReferer?: string;
  xTitle?: string;
}): Promise<{ text: string; model: string; usage?: Record<string, unknown> }> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY")?.trim();
  if (!apiKey) {
    throw new AssistantError(
      OPENROUTER_NOT_CONFIGURED_MESSAGE,
      "OPENROUTER_NOT_CONFIGURED",
    );
  }

  const model = getOpenRouterModel();
  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": params.httpReferer ?? "https://grants.rtmbusinessdirectory.com",
        "X-Title": params.xTitle ?? "RTM Application Assistant",
      },
      body: JSON.stringify({
        model,
        messages: params.messages,
        max_tokens: params.maxTokens ?? 800,
        temperature: params.temperature ?? 0.35,
      }),
    });
  } catch (fetchError) {
    const detail = fetchError instanceof Error ? fetchError.message : "network error";
    throw new AssistantError(
      `Application Assistant could not reach OpenRouter (${detail}).`,
      "OPENROUTER_UPSTREAM",
    );
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (body as { error?: { message?: string } })?.error?.message ||
      `OpenRouter request failed (${res.status})`;
    throw new AssistantError(msg, "OPENROUTER_UPSTREAM");
  }

  const text = (body as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new AssistantError(
      "Application Assistant returned an empty response.",
      "OPENROUTER_EMPTY",
    );
  }

  return {
    text,
    model,
    usage: (body as { usage?: Record<string, unknown> }).usage,
  };
}
