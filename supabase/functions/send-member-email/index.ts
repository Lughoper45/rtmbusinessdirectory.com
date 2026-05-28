import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.1.0";
import { corsHeadersForRequest, handleCorsPreflight } from "../_shared/cors.ts";

const FROM = "RTM Membership <noreply@rtmbusinessdirectory.com>";
const MEMBERSHIP_URL = "https://membership.rtmbusinessdirectory.com";
const SITE_URL = "https://rtmbusinessdirectory.com";

type Template = "payment_reminder" | "final_notice" | "activation_welcome" | "signup_welcome" | "custom";

function buildEmail(template: Template, name: string, extra?: Record<string, string>) {
  const displayName = name || "there";
  const dashboardUrl = `${MEMBERSHIP_URL}/dashboard`;

  switch (template) {
    case "signup_welcome":
      return {
        subject: "Your RTM account is ready — complete your membership",
        html: `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>RTM Membership</title></head>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#b91c1c;color:#fff;padding:28px 32px;">
  <h1 style="margin:0;font-size:26px;">RTM Membership</h1>
  <p style="margin:8px 0 0;color:#fee2e2;">You're two steps away from being active</p>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 8px;">Hi ${displayName},</h2>
  <p style="margin:0 0 20px;line-height:1.6;color:#475569;">Thank you for signing up! Your account is created. Here's how to activate it:</p>
  <div style="background:#f1f5f9;border-radius:10px;padding:20px;margin:0 0 24px;">
    <p style="margin:0 0 12px;font-weight:700;">Step 1 — Confirm your email</p>
    <p style="margin:0 0 16px;color:#475569;font-size:14px;">Click the confirmation button in our previous email.</p>
    <p style="margin:0 0 12px;font-weight:700;">Step 2 — Complete your $100 membership payment</p>
    <p style="margin:0;color:#475569;font-size:14px;">Sign in to your dashboard and complete the payment to go active.</p>
  </div>
  <p style="text-align:center;margin:0 0 28px;">
    <a href="${dashboardUrl}" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;">Complete my membership →</a>
  </p>
  <p style="margin:0 0 12px;font-weight:700;font-size:15px;">As an RTM member you unlock:</p>
  <ul style="margin:0 0 24px;padding:0 0 0 20px;color:#475569;font-size:14px;line-height:2;">
    <li>Digital RTM Member Card — use same day</li>
    <li>5%–50% savings at participating businesses</li>
    <li>50% off all grant advisor packages</li>
    <li><strong style="color:#059669;">FREE Education Grant access on govgranteducation.ca</strong> ($49 value)</li>
    <li>Community fund eligibility after 90 days</li>
  </ul>
  <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">Questions? Reply to this email or call +1 416 900 8728.</p>
</td></tr>
</table></td></tr></table></body></html>`,
      };

    case "payment_reminder":
      return {
        subject: "Your RTM membership is waiting for activation",
        html: `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>RTM Membership</title></head>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#b91c1c;color:#fff;padding:28px 32px;">
  <h1 style="margin:0;font-size:26px;">RTM Membership</h1>
  <p style="margin:8px 0 0;color:#fee2e2;">Your account is ready to activate</p>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 8px;">Hi ${displayName},</h2>
  <p style="margin:0 0 20px;line-height:1.6;color:#475569;">We noticed you haven't completed your RTM membership activation. Your account is still waiting — just one step away.</p>
  <p style="text-align:center;margin:0 0 28px;">
    <a href="${dashboardUrl}" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;">Activate my membership →</a>
  </p>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:0 0 24px;">
    <p style="margin:0 0 8px;font-weight:700;color:#166534;">New member benefit — Education Grant</p>
    <p style="margin:0;font-size:14px;color:#166534;">Your RTM membership now includes <strong>free access to govgranteducation.ca</strong> ($49/year value). Education grants have a higher approval rate than most business grants — activated automatically when you join.</p>
  </div>
  <p style="margin:0;font-size:13px;color:#94a3b8;">Questions? Reply to this email or call +1 416 900 8728.</p>
</td></tr>
</table></td></tr></table></body></html>`,
      };

    case "final_notice":
      return {
        subject: "Final reminder — your RTM membership spot",
        html: `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>RTM Membership</title></head>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#7f1d1d;color:#fff;padding:28px 32px;">
  <h1 style="margin:0;font-size:26px;">RTM Membership</h1>
  <p style="margin:8px 0 0;color:#fecaca;">This is our final follow-up</p>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 8px;">Hi ${displayName},</h2>
  <p style="margin:0 0 20px;line-height:1.6;color:#475569;">This is our last message about your pending RTM membership. Your spot is still reserved, but won't be held indefinitely.</p>
  <p style="text-align:center;margin:0 0 28px;">
    <a href="${dashboardUrl}" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;">Activate now →</a>
  </p>
  <p style="margin:0 0 16px;font-size:14px;color:#475569;">If you have any questions or concerns, please reply to this email directly or call us at <strong>+1 416 900 8728</strong>. We're happy to help.</p>
  <p style="margin:0;font-size:13px;color:#94a3b8;">If you no longer wish to receive these emails, simply ignore this message — we will not contact you again.</p>
</td></tr>
</table></td></tr></table></body></html>`,
      };

    case "activation_welcome": {
      const referralCode = extra?.referralCode ?? "";
      const referralLink = referralCode
        ? `${MEMBERSHIP_URL}/signup?ref=${referralCode}`
        : `${MEMBERSHIP_URL}/signup`;
      return {
        subject: "Welcome to RTM — you're activated!",
        html: `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>RTM Membership</title></head>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#15803d;color:#fff;padding:28px 32px;">
  <h1 style="margin:0;font-size:26px;">You're in — welcome to RTM!</h1>
  <p style="margin:8px 0 0;color:#bbf7d0;">Your membership is active</p>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 8px;">Hi ${displayName} 🎉</h2>
  <p style="margin:0 0 24px;line-height:1.6;color:#475569;">Your RTM membership is now active. Here's everything you have access to:</p>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
    <tr><td style="padding:12px 16px;background:#f0fdf4;border-radius:8px;margin-bottom:8px;display:block;">
      <strong>→ Member dashboard</strong><br/>
      <a href="${dashboardUrl}" style="color:#15803d;">${dashboardUrl}</a>
    </td></tr>
    <tr><td style="padding:8px 0;"></td></tr>
    <tr><td style="padding:12px 16px;background:#f0fdf4;border-radius:8px;margin-bottom:8px;display:block;">
      <strong>→ Grants workspace</strong> — 50% off all advisor packages<br/>
      <a href="${SITE_URL}/grants" style="color:#15803d;">${SITE_URL}/grants</a>
    </td></tr>
    <tr><td style="padding:8px 0;"></td></tr>
    <tr><td style="padding:12px 16px;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;margin-bottom:8px;display:block;">
      <strong style="color:#065f46;">→ Education Grant (free — $49 value)</strong><br/>
      <span style="font-size:14px;color:#047857;">Your access to govgranteducation.ca is being activated automatically. Visit the site with your membership email to sign in.</span><br/>
      <a href="https://www.govgranteducation.ca" style="color:#15803d;">www.govgranteducation.ca</a>
    </td></tr>
    ${referralCode ? `<tr><td style="padding:8px 0;"></td></tr>
    <tr><td style="padding:12px 16px;background:#f8fafc;border-radius:8px;display:block;">
      <strong>→ Your referral link — earn 30% per member</strong><br/>
      <a href="${referralLink}" style="color:#b91c1c;font-family:monospace;">${referralLink}</a>
    </td></tr>` : ""}
  </table>
  <p style="margin:0;font-size:13px;color:#94a3b8;">Community fund eligibility begins 90 days from today. Questions? Call +1 416 900 8728.</p>
</td></tr>
</table></td></tr></table></body></html>`,
      };
    }

    default:
      return { subject: "", html: "" };
  }
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  const cors = corsHeadersForRequest(req);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY");

  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500, headers: cors });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/, "");
  let sentBy = "system";

  if (token !== serviceKey) {
    // Verify caller is admin via their JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }
    const { data: isAdmin } = await admin.rpc("is_admin", { check_user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden — admins only" }), { status: 403, headers: cors });
    }
    sentBy = user.id;
  }

  try {
    const body = await req.json();
    const { profileId, profileEmail, displayName, template, customSubject, customHtml } = body;

    if (!template) {
      return new Response(JSON.stringify({ error: "template required" }), { status: 400, headers: cors });
    }

    // Resolve profile — by ID (admin/system calls) or by email (signup_welcome before profile exists)
    let recipientEmail: string;
    let recipientName: string;
    let resolvedProfileId: string | null = profileId ?? null;
    let referralCode = "";

    if (profileId) {
      const { data: profile, error: profileErr } = await admin
        .from("profiles")
        .select("id, email, display_name, referral_code")
        .eq("id", profileId)
        .maybeSingle();

      if (profileErr || !profile?.email) {
        return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404, headers: cors });
      }
      recipientEmail = profile.email;
      recipientName = profile.display_name ?? profile.email;
      referralCode = profile.referral_code ?? "";
    } else if (profileEmail) {
      // Signup welcome — profile may not exist yet, send directly
      recipientEmail = profileEmail;
      recipientName = displayName || profileEmail.split("@")[0];
      // Try to look up profile by email for logging (may be null if trigger hasn't run)
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .ilike("email", profileEmail)
        .maybeSingle();
      resolvedProfileId = existing?.id ?? null;
    } else {
      return new Response(JSON.stringify({ error: "profileId or profileEmail required" }), { status: 400, headers: cors });
    }

    let subject: string;
    let html: string;

    if (template === "custom") {
      subject = customSubject ?? "Message from RTM";
      html = customHtml ?? "";
    } else {
      const built = buildEmail(template as Template, recipientName, { referralCode });
      subject = built.subject;
      html = built.html;
    }

    const resend = new Resend(resendKey);
    const { data: msg, error: sendErr } = await resend.emails.send({
      from: FROM,
      to: recipientEmail,
      subject,
      html,
    });

    if (sendErr) {
      console.error("send-member-email: Resend error:", JSON.stringify(sendErr));
      return new Response(JSON.stringify({ error: sendErr.message }), { status: 500, headers: cors });
    }

    if (resolvedProfileId) {
      await admin.from("member_email_log").insert({
        profile_id: resolvedProfileId,
        email: recipientEmail,
        template,
        subject,
        resend_message_id: msg?.id ?? null,
        sent_by: sentBy,
      });
    }

    return new Response(JSON.stringify({ ok: true, messageId: msg?.id }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-member-email:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
