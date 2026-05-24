import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionErrorMessage, isRateLimitError } from "@/lib/edgeFunctionErrors";

export type ChatTurn = { role: "user" | "assistant"; content: string };

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
