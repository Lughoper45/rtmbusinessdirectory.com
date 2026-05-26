/**
 * provision-edu-grant
 * Called internally (from stripe-webhook) after RTM membership activates.
 * 1. Upserts edu_grant_access row
 * 2. POSTs a HMAC-signed webhook to govgranteducation.ca
 *
 * Required Supabase secrets:
 *   EDUGRANT_WEBHOOK_URL    — govgranteducation.ca endpoint that receives the hook
 *   EDUGRANT_SHARED_SECRET  — shared HMAC secret (32+ random chars), same on both sides
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function hmacSign(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const webhookUrl = Deno.env.get("EDUGRANT_WEBHOOK_URL");
  const sharedSecret = Deno.env.get("EDUGRANT_SHARED_SECRET");

  const admin = createClient(supabaseUrl, supabaseKey);

  try {
    const { email, userId, memberName } = await req.json();
    if (!email) return new Response(JSON.stringify({ error: "email required" }), { status: 400 });

    const normalizedEmail = email.trim().toLowerCase();

    // Upsert access record
    const { data: row, error: upsertErr } = await admin
      .from("edu_grant_access")
      .upsert(
        { email: normalizedEmail, user_id: userId ?? null, status: "active", webhook_status: "pending" },
        { onConflict: "email", ignoreDuplicates: false }
      )
      .select("id")
      .single();

    if (upsertErr) {
      console.error("provision-edu-grant: upsert failed:", upsertErr.message);
      return new Response(JSON.stringify({ error: upsertErr.message }), { status: 500 });
    }

    const accessId = row.id;

    if (!webhookUrl || !sharedSecret) {
      console.warn("provision-edu-grant: EDUGRANT_WEBHOOK_URL or EDUGRANT_SHARED_SECRET not set — skipping webhook");
      return new Response(JSON.stringify({ ok: true, webhookSent: false, accessId }));
    }

    // Build signed payload
    const payload = JSON.stringify({
      event: "rtm.member.activated",
      email: normalizedEmail,
      name: memberName ?? null,
      rtm_access_id: accessId,
      timestamp: new Date().toISOString(),
    });

    const signature = await hmacSign(sharedSecret, payload);

    let webhookSent = false;
    let webhookResponse: unknown = null;

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RTM-Signature": signature,
          "X-RTM-Timestamp": new Date().toISOString(),
        },
        body: payload,
        signal: AbortSignal.timeout(10_000),
      });

      webhookResponse = { status: res.status, ok: res.ok };
      webhookSent = res.ok;

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`provision-edu-grant: webhook returned ${res.status}:`, text);
        webhookResponse = { status: res.status, ok: false, body: text.slice(0, 500) };
      }
    } catch (fetchErr) {
      console.error("provision-edu-grant: webhook fetch failed:", fetchErr);
      webhookResponse = { error: String(fetchErr) };
    }

    await admin
      .from("edu_grant_access")
      .update({ webhook_status: webhookSent ? "sent" : "failed", webhook_response: webhookResponse })
      .eq("id", accessId);

    return new Response(JSON.stringify({ ok: true, webhookSent, accessId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("provision-edu-grant:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
