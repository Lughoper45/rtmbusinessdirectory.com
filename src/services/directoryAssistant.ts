import { supabase } from "@/integrations/supabase/client";
import {
  getEdgeFunctionErrorMessage,
  isRateLimitError,
  RATE_LIMIT_USER_MESSAGE,
} from "@/lib/edgeFunctionErrors";
import type { LaunchBotAction, LaunchBotWorkflow } from "@/types/launchBot";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export { RATE_LIMIT_USER_MESSAGE };

function parseActions(raw: unknown): LaunchBotAction[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item) =>
        item && typeof item === "object" && typeof (item as LaunchBotAction).id === "string",
    )
    .map((item) => item as LaunchBotAction);
}

function parseWorkflow(raw: unknown): LaunchBotWorkflow | null {
  if (!raw || typeof raw !== "object") return null;
  const w = raw as LaunchBotWorkflow;
  if (!w.id || !Array.isArray(w.steps)) return null;
  return w;
}

export async function sendDirectoryAssistantMessage(
  messages: ChatTurn[],
): Promise<{ reply?: string; error?: string; isRateLimited?: boolean }> {
  const { data, error } = await supabase.functions.invoke("directory-assistant", {
    body: { messages },
  });

  if (error) {
    const message = await getEdgeFunctionErrorMessage(error, data);
    return {
      error: message,
      isRateLimited: isRateLimitError(message, data),
    };
  }

  if (data?.error) {
    return {
      error: String(data.error),
      isRateLimited: data?.code === "rate_limit_exceeded",
    };
  }

  const reply = typeof data?.reply === "string" ? data.reply : "";
  if (!reply) return { error: "No response from assistant." };
  return { reply };
}

export async function sendLaunchBotMessage(
  messages: ChatTurn[],
): Promise<{
  reply?: string;
  actions?: LaunchBotAction[];
  workflow?: LaunchBotWorkflow | null;
  error?: string;
  isRateLimited?: boolean;
}> {
  const { data, error } = await supabase.functions.invoke("directory-assistant", {
    body: { messages, source: "launchbot" },
  });

  if (error) {
    const message = await getEdgeFunctionErrorMessage(error, data);
    return {
      error: message,
      isRateLimited: isRateLimitError(message, data),
    };
  }

  if (data?.error) {
    return {
      error: String(data.error),
      isRateLimited: data?.code === "rate_limit_exceeded",
    };
  }

  const reply = typeof data?.reply === "string" ? data.reply : "";
  if (!reply) return { error: "No response from LaunchBot." };

  return {
    reply,
    actions: parseActions(data?.actions),
    workflow: parseWorkflow(data?.workflow),
  };
}
