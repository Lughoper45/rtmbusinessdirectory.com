import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const HOUR_MS = 60 * 60 * 1000;

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds?: number;
};

function hourWindowStart(now = Date.now()): string {
  const start = Math.floor(now / HOUR_MS) * HOUR_MS;
  return new Date(start).toISOString();
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function enforceHourlyRateLimit(
  admin: SupabaseClient,
  bucketKey: string,
  limit: number,
): Promise<RateLimitResult> {
  const windowStart = hourWindowStart();
  const bucket = `${bucketKey}:${windowStart.slice(0, 13)}`;

  const { data: existing, error: readError } = await admin
    .from("ai_rate_limits")
    .select("request_count, window_start")
    .eq("bucket_key", bucket)
    .maybeSingle();

  if (readError) throw readError;

  const currentCount = existing?.request_count ?? 0;

  if (currentCount >= limit) {
    const windowStartMs = new Date(windowStart).getTime();
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((windowStartMs + HOUR_MS - Date.now()) / 1000),
    );
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  const nextCount = currentCount + 1;
  const { error: upsertError } = await admin.from("ai_rate_limits").upsert(
    {
      bucket_key: bucket,
      window_start: windowStart,
      request_count: nextCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "bucket_key" },
  );

  if (upsertError) throw upsertError;

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - nextCount),
  };
}

export function createServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Server configuration incomplete.");
  return createClient(url, key);
}
