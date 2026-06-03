import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";

/**
 * Resend webhook: email.delivered | email.opened | email.clicked | email.bounced | email.complained
 * Configure in Resend dashboard → Webhooks → URL: .../functions/v1/resend-webhook
 * Set RESEND_WEBHOOK_SECRET and send as ?secret= or svix headers if you add verification later.
 */
Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  if (webhookSecret) {
    const q = new URL(req.url).searchParams.get("secret");
    if (q !== webhookSecret) {
      return jsonResponse(req, { error: "Forbidden" }, 403);
    }
  }

  try {
    const payload = await req.json();
    const type = String(payload?.type ?? "");
    const data = payload?.data ?? {};
    const messageId = data?.email_id ?? data?.id ?? null;

    if (!messageId) {
      return jsonResponse(req, { ok: true, skipped: "no message id" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: sendRow, error: findErr } = await admin
      .from("marketing_sends")
      .select("id, enrollment_id, prospect_id, open_count, click_count, status")
      .eq("resend_message_id", messageId)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!sendRow) {
      return jsonResponse(req, { ok: true, skipped: "send not found" });
    }

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { last_event_at: now };

    if (type === "email.delivered") {
      patch.status = "delivered";
      patch.delivered_at = now;
    } else if (type === "email.opened") {
      patch.status = "opened";
      patch.opened_at = sendRow.opened_at ?? now;
      patch.open_count = (sendRow.open_count ?? 0) + 1;
    } else if (type === "email.clicked") {
      patch.status = "clicked";
      patch.clicked_at = sendRow.clicked_at ?? now;
      patch.click_count = (sendRow.click_count ?? 0) + 1;
      if (!sendRow.open_count) {
        patch.opened_at = sendRow.opened_at ?? now;
        patch.open_count = 1;
      }
    } else if (type === "email.bounced" || type === "email.complained") {
      patch.status = "bounced";
      patch.bounced_at = now;
      await admin
        .from("marketing_prospects")
        .update({ status: "bounced", email_status: "invalid_syntax" })
        .eq("id", sendRow.prospect_id);
      if (type === "email.complained") {
        const { data: prospect } = await admin
          .from("marketing_prospects")
          .select("email")
          .eq("id", sendRow.prospect_id)
          .maybeSingle();
        if (prospect?.email) {
          await admin.from("listing_suppressions").insert({
            email: prospect.email.toLowerCase(),
            reason: "complaint",
          });
        }
      }
    } else {
      return jsonResponse(req, { ok: true, ignored: type });
    }

    await admin.from("marketing_sends").update(patch).eq("id", sendRow.id);

    if (type === "email.opened" || type === "email.clicked") {
      await admin.from("crm_activities").insert({
        kind: type === "email.opened" ? "email_opened" : "email_clicked",
        payload: { send_id: sendRow.id, resend_message_id: messageId },
        created_by: "resend_webhook",
      });
    }

    return jsonResponse(req, { ok: true, type, send_id: sendRow.id });
  } catch (e) {
    return jsonResponse(
      req,
      { error: e instanceof Error ? e.message : "Webhook failed" },
      500,
    );
  }
});
