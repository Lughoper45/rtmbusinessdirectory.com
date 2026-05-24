import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import {
  DIRECTORY_SYSTEM_PROMPT,
  validateChatMessages,
} from "../_shared/directoryAssistantPrompt.ts";
import { buildLiveContextBlock } from "../_shared/directoryContext.ts";
import { AssistantError, openRouterChat } from "../_shared/openrouter.ts";
import {
  clientIp,
  createServiceClient,
  enforceHourlyRateLimit,
} from "../_shared/rateLimit.ts";

const ANON_LIMIT = 20;
const AUTH_LIMIT = 50;

async function resolveUserId(
  req: Request,
  supabaseUrl: string,
  supabaseAnon: string,
): Promise<string | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) return null;

  const authClient = createClient(supabaseUrl, supabaseAnon);
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnon) {
      return jsonResponse(req, { error: "Server configuration incomplete." }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const turns = validateChatMessages(body?.messages);
    const userId = await resolveUserId(req, supabaseUrl, supabaseAnon);
    const admin = createServiceClient();

    const bucketKey = userId ? `user:${userId}` : `ip:${clientIp(req)}`;
    const limit = userId ? AUTH_LIMIT : ANON_LIMIT;
    const rate = await enforceHourlyRateLimit(admin, bucketKey, limit);

    if (!rate.allowed) {
      return jsonResponse(
        req,
        {
          error: "You've reached the message limit for now. Try again in an hour.",
          code: "rate_limit_exceeded",
          retryAfter: rate.retryAfterSeconds,
        },
        429,
      );
    }

    const lastUserMessage = turns.filter((t) => t.role === "user").at(-1)?.content ?? "";
    const liveContext = await buildLiveContextBlock(admin, lastUserMessage);

    let memberContext = "";
    if (userId) {
      const { data: profileRow } = await admin
        .from("grant_profiles")
        .select("profile")
        .eq("user_id", userId)
        .maybeSingle();
      if (profileRow?.profile && typeof profileRow.profile === "object") {
        const p = profileRow.profile as Record<string, unknown>;
        memberContext =
          `\n\nSigned-in member profile (use for grant guidance only; do not claim eligibility):\n` +
          JSON.stringify(p, null, 0);
      }
    }

    const systemContent = `${DIRECTORY_SYSTEM_PROMPT}${liveContext}${memberContext}`;
    const messages = [
      { role: "system" as const, content: systemContent },
      ...turns.map((t) => ({ role: t.role, content: t.content })),
    ];

    const { text, model } = await openRouterChat({
      messages,
      maxTokens: 600,
      temperature: 0.45,
      httpReferer: "https://rtmbusinessdirectory.com",
      xTitle: "RTM Directory Assistant",
    });

    return jsonResponse(req, {
      reply: text,
      model,
      remaining: rate.remaining,
    });
  } catch (error) {
    if (error instanceof AssistantError) {
      const status =
        error.code === "OPENROUTER_NOT_CONFIGURED"
          ? 503
          : error.code === "OPENROUTER_UPSTREAM"
            ? 502
            : 500;
      return jsonResponse(req, { error: error.message, code: error.code }, status);
    }

    const message = error instanceof Error ? error.message : "Directory assistant failed";
    const status = message.includes("message") ? 400 : 500;
    return jsonResponse(req, { error: message }, status);
  }
});
