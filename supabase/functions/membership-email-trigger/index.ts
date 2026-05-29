/**
 * membership-email-trigger
 *
 * Called by a Supabase Database Webhook on INSERT/UPDATE to public.profiles.
 * Sends a value-first email when membership_status changes.
 *
 * To register the webhook in Supabase dashboard:
 *   Database → Webhooks → Create new webhook
 *   Table: public.profiles
 *   Events: INSERT, UPDATE
 *   URL: https://kajwpmyloxaqeciyndwf.supabase.co/functions/v1/membership-email-trigger
 *   Headers: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.1.0";

const FROM = "RTM Grants <noreply@rtmbusinessdirectory.com>";
const GRANTS_URL = "https://grants.rtmbusinessdirectory.com";
const GOVGRANT_URL = "https://govgranteducation.ca";

// ─── Webhook payload ──────────────────────────────────────────────────────────

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: ProfileRow;
  old_record?: Partial<ProfileRow>;
};

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  membership_status: string | null;
  profile_completion_pct?: number | null;
};

// ─── Email templates ──────────────────────────────────────────────────────────

type EmailTemplate = {
  subject: string;
  html: string;
};

function profileIncompleteEmail(name: string): EmailTemplate {
  const n = name || "there";
  return {
    subject: "Complete your profile to see which Canadian grants you qualify for",
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"/></head>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#b91c1c;color:#fff;padding:28px 32px;">
  <h1 style="margin:0;font-size:24px;">RTM Grants</h1>
  <p style="margin:6px 0 0;color:#fee2e2;">Your free grant profile is waiting</p>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 12px;">Hi ${n},</h2>
  <p style="line-height:1.7;color:#475569;">Welcome to RTM. You're one step away from seeing which Canadian grant programs your business may qualify for.</p>
  <p style="line-height:1.7;color:#475569;margin-top:12px;">Answer <strong>6 quick questions</strong> — it takes under 3 minutes. When you're done, we'll show you your personalised grant matches with RTM compatibility scores.</p>
  <p style="text-align:center;margin:28px 0;">
    <a href="${GRANTS_URL}/grants" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;">Start my free grant profile →</a>
  </p>
  <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin-top:12px;">
    <p style="margin:0;font-size:13px;color:#64748b;text-align:center;font-style:italic;">Free to start. No credit card required. Activate your membership when you're ready to submit applications.</p>
  </div>
  <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">Questions? Call +1 416 900 8728 or reply to this email.</p>
</td></tr>
</table></td></tr></table></body></html>`,
  };
}

function grantMatchesEmail(name: string): EmailTemplate {
  const n = name || "there";
  return {
    subject: "Your grant matches are ready — here's what we found",
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"/></head>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#b91c1c;color:#fff;padding:28px 32px;">
  <h1 style="margin:0;font-size:24px;">Your Grant Matches</h1>
  <p style="margin:6px 0 0;color:#fee2e2;">Based on your RTM grant profile</p>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 12px;">Hi ${n},</h2>
  <p style="line-height:1.7;color:#475569;">Your grant profile is now active. We've matched it against our catalog of Canadian federal and provincial programs.</p>
  <p style="line-height:1.7;color:#475569;margin-top:12px;font-weight:600;">Your personalised matches are waiting in your grant workspace.</p>
  <p style="text-align:center;margin:28px 0;">
    <a href="${GRANTS_URL}/grants" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;">See my grant matches →</a>
  </p>
  <div style="background:#f1f5f9;border-radius:10px;padding:16px;">
    <p style="margin:0 0 8px;font-weight:700;font-size:14px;">What you can do now — for free:</p>
    <ul style="margin:0;padding:0 0 0 18px;color:#475569;font-size:14px;line-height:2;">
      <li>View all matched programs with compatibility scores</li>
      <li>Save your shortlist</li>
      <li>Start your intake questions for any program</li>
    </ul>
    <p style="margin:12px 0 0;font-size:13px;color:#64748b;font-style:italic;">Activate RTM membership ($100/yr) when you're ready to submit applications or contact an advisor. Not required to browse.</p>
  </div>
  <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">Questions? Call +1 416 900 8728 or reply to this email.</p>
</td></tr>
</table></td></tr></table></body></html>`,
  };
}

function membershipExpiredEmail(name: string): EmailTemplate {
  const n = name || "there";
  return {
    subject: "Your RTM membership has expired — your grant progress is saved",
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"/></head>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#475569;color:#fff;padding:28px 32px;">
  <h1 style="margin:0;font-size:24px;">RTM Membership</h1>
  <p style="margin:6px 0 0;color:#e2e8f0;">Your membership has expired</p>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 12px;">Hi ${n},</h2>
  <p style="line-height:1.7;color:#475569;">Your RTM membership has lapsed. Your grant profile and intake progress are saved and will be kept for 90 days.</p>
  <p style="line-height:1.7;color:#475569;margin-top:12px;">Renewing takes under a minute — you'll pick up exactly where you left off.</p>
  <p style="text-align:center;margin:28px 0;">
    <a href="${GRANTS_URL}/grants" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;">Renew my membership — $100/yr →</a>
  </p>
  <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">Questions? Call +1 416 900 8728 or reply to this email.</p>
</td></tr>
</table></td></tr></table></body></html>`,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      console.warn("[membership-email-trigger] RESEND_API_KEY not set — skipping");
      return new Response(JSON.stringify({ ok: true, skipped: "no_resend_key" }), { status: 200 });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const resend = new Resend(resendKey);

    const payload = await req.json() as WebhookPayload;
    const { type, record, old_record } = payload;

    if (!record?.id || !record?.email) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_email" }), { status: 200 });
    }

    const newStatus = record.membership_status;
    const oldStatus = old_record?.membership_status ?? null;
    const name = record.display_name ?? record.email.split("@")[0];
    const email = record.email;

    // Determine which template to send
    let template: string | null = null;
    let emailData: EmailTemplate | null = null;

    if (type === "INSERT" && newStatus === "profile_incomplete") {
      template = "welcome_profile_builder";
      emailData = profileIncompleteEmail(name);
    } else if (type === "UPDATE") {
      if (oldStatus !== "grant_intake_started" && newStatus === "grant_intake_started") {
        template = "grant_matches_found";
        emailData = grantMatchesEmail(name);
      } else if (oldStatus !== "expired" && newStatus === "expired") {
        template = "membership_expired";
        emailData = membershipExpiredEmail(name);
      }
      // active → handled by existing send-member-email (activation_welcome)
    }

    if (!template || !emailData) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_trigger" }), { status: 200 });
    }

    // Deduplicate — don't send same template to same profile twice
    const { data: existing } = await admin
      .from("member_email_log")
      .select("id")
      .eq("profile_id", record.id)
      .eq("template", template)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ ok: true, skipped: "already_sent" }), { status: 200 });
    }

    // Send via Resend
    const { data: sent, error: sendError } = await resend.emails.send({
      from: FROM,
      to: [email],
      subject: emailData.subject,
      html: emailData.html,
    });

    if (sendError) {
      console.error("[membership-email-trigger] Resend error:", sendError);
      return new Response(JSON.stringify({ ok: false, error: sendError.message }), { status: 500 });
    }

    // Log the send
    await admin.from("member_email_log").insert({
      profile_id: record.id,
      email,
      template,
      subject: emailData.subject,
      resend_message_id: sent?.id ?? null,
      sent_by: "membership-email-trigger",
    });

    console.log(`[membership-email-trigger] Sent ${template} to ${email}`);
    return new Response(JSON.stringify({ ok: true, template, resend_id: sent?.id }), { status: 200 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[membership-email-trigger] Error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 });
  }
});
