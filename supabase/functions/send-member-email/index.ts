import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.1.0";
import { corsHeadersForRequest, handleCorsPreflight } from "../_shared/cors.ts";

const FROM = "RTM Membership <noreply@rtmbusinessdirectory.com>";
const MEMBERSHIP_URL = "https://membership.rtmbusinessdirectory.com";
const SITE_URL = "https://rtmbusinessdirectory.com";

type Template =
  | "payment_reminder"
  | "final_notice"
  | "activation_welcome"
  | "signup_welcome"
  | "passport_pitch"
  | "edu_crosssell"
  | "win_back"
  | "intake_encouragement"
  | "package_consideration"
  | "growth_crosssell"
  | "custom";

function buildEmail(template: Template, name: string, extra?: Record<string, string>) {
  const displayName = name || "there";
  const dashboardUrl = `${MEMBERSHIP_URL}/dashboard`;

  switch (template) {
    case "signup_welcome":
      // S0 — Verify & Welcome. No payment mention. Profile builder CTA.
      return {
        subject: "Your free grant profile is ready to build",
        html: `<!doctype html><html lang="en"><head><meta charset="utf-8"/></head>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#b91c1c;color:#fff;padding:28px 32px;">
  <h1 style="margin:0;font-size:26px;">RTM Grants</h1>
  <p style="margin:8px 0 0;color:#fee2e2;">Welcome — your free grant profile is waiting</p>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 12px;">Hi ${displayName},</h2>
  <p style="line-height:1.7;color:#475569;">Your RTM account is created. Answer <strong>6 quick questions</strong> and we'll show you which Canadian grant programs your business may qualify for. Takes 3 minutes. No payment required.</p>
  <p style="text-align:center;margin:28px 0;">
    <a href="https://grants.rtmbusinessdirectory.com/grants" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;">Start my free grant profile →</a>
  </p>
  <div style="background:#f1f5f9;border-radius:10px;padding:16px;">
    <p style="margin:0 0 8px;font-weight:700;font-size:14px;">Free to start — here's what that means:</p>
    <ul style="margin:0;padding:0 0 0 18px;color:#475569;font-size:14px;line-height:2;">
      <li>Browse 217+ Canadian grant programs — no login needed</li>
      <li>Build your grant profile and see your personalised matches</li>
      <li>Start your intake for any program — free</li>
      <li>Activate your RTM Submission Passport ($100/yr) only when you're ready to submit</li>
    </ul>
  </div>
  <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">Questions? Call +1 416 900 8728 or reply to this email.</p>
</td></tr>
</table></td></tr></table></body></html>`,
      };

    case "payment_reminder": {
      // S1 — profile nudge (24h inactive, profile <50%)
      const province = extra?.province?.trim();
      const subject = province
        ? `3 programs may match businesses in ${province}`
        : "Your grant matches are waiting — complete your profile";
      return {
        subject,
        html: `<!doctype html><html lang="en"><head><meta charset="utf-8"/></head>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#b91c1c;color:#fff;padding:28px 32px;">
  <h1 style="margin:0;font-size:26px;">RTM Grants</h1>
  <p style="margin:8px 0 0;color:#fee2e2;">Your grant matches are almost ready</p>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 12px;">Hi ${displayName},</h2>
  <p style="line-height:1.7;color:#475569;">You're partway through your grant profile. Complete the remaining questions and we'll show you your personalised matches — programs that match your sector, province, and business stage.</p>
  <p style="line-height:1.7;color:#475569;margin-top:12px;">Most people pause at the revenue question (Q5). It doesn't need to be exact — any range will improve your match accuracy.</p>
  <p style="text-align:center;margin:28px 0;">
    <a href="https://grants.rtmbusinessdirectory.com/grants" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;">Complete my profile →</a>
  </p>
  <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0;">Free to complete. No payment until you're ready to submit with RTM support.</p>
  <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;">Questions? Call +1 416 900 8728 or reply to this email.</p>
</td></tr>
</table></td></tr></table></body></html>`,
      };
    }

    case "intake_encouragement": {
      const grantName = extra?.grantName ?? "your grant application";
      return {
        subject: `Your ${grantName} application is in progress`,
        html: `<!doctype html><html lang="en"><head><meta charset="utf-8"/></head>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#b91c1c;color:#fff;padding:28px 32px;">
  <h1 style="margin:0;font-size:24px;">RTM Grants</h1>
  <p style="margin:8px 0 0;color:#fee2e2;">Your intake is saved — pick up where you left off</p>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 12px;">Hi ${displayName},</h2>
  <p style="line-height:1.7;color:#475569;">Your intake for <strong>${grantName}</strong> is in progress. Most self-submitted applications are rejected for missing documents or eligibility gaps — RTM advisors check these before you submit.</p>
  <p style="line-height:1.7;color:#475569;margin-top:12px;">Continue your answers in the grant workspace. When you're ready to submit with RTM support, activate your Submission Passport ($100/yr).</p>
  <p style="text-align:center;margin:28px 0;">
    <a href="https://grants.rtmbusinessdirectory.com/grants" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;">Continue my intake →</a>
  </p>
  <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0;">Free to continue. Passport only required at submit.</p>
  <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">Questions? Call +1 416 900 8728 or reply to this email.</p>
</td></tr>
</table></td></tr></table></body></html>`,
      };
    }

    case "final_notice":
      // S9-style win-back — replaces the old aggressive "final notice" payment demand
      return {
        subject: "Your saved grants are still open — here's what's available",
        html: `<!doctype html><html lang="en"><head><meta charset="utf-8"/></head>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#b91c1c;color:#fff;padding:28px 32px;">
  <h1 style="margin:0;font-size:26px;">RTM Grants</h1>
  <p style="margin:8px 0 0;color:#fee2e2;">Your profile and progress are saved</p>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 12px;">Hi ${displayName},</h2>
  <p style="line-height:1.7;color:#475569;">Your RTM grant profile is still here, exactly as you left it. Several Canadian programs that may match your business are still open for applications.</p>
  <p style="line-height:1.7;color:#475569;margin-top:12px;">When you're ready — whether that's today or next month — you can pick up right where you left off. No restarting required.</p>
  <p style="text-align:center;margin:28px 0;">
    <a href="https://grants.rtmbusinessdirectory.com/grants" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;">Continue where I left off →</a>
  </p>
  <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin-top:8px;">
    <p style="margin:0;font-size:13px;color:#64748b;text-align:center;">Browse and match for free. Activate your RTM Submission Passport ($100/yr) when you're ready to submit with advisor support.</p>
  </div>
  <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">If you have questions, reply to this email or call +1 416 900 8728. This is the last message we'll send about your grant profile unless you come back.</p>
</td></tr>
</table></td></tr></table></body></html>`,
      };

    case "growth_crosssell": {
      const grantName = extra?.grantName ?? "your grant application";
      const auditUrl = extra?.auditUrl ??
        "https://grow.rtmbusinessdirectory.com/?source=grant_s8";
      return {
        subject: "Get visible while your grant is in review",
        html: `<!doctype html><html lang="en"><head><meta charset="utf-8"/></head>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#061f3a;color:#fff;padding:28px 32px;">
  <h1 style="margin:0;font-size:22px;">RTM Growth Services</h1>
  <p style="margin:8px 0 0;color:#94a3b8;">Use the waiting period productively</p>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 12px;">Hi ${displayName},</h2>
  <p style="line-height:1.7;color:#475569;">Your application for <strong>${grantName}</strong> is underway. Most federal and provincial programs take <strong>8–16 weeks</strong> for review — successful businesses use that window to strengthen their digital presence before funding arrives.</p>
  <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin:20px 0;">
    <p style="margin:0 0 8px;font-weight:700;font-size:14px;">What RTM Growth can help with (30% off with your Passport):</p>
    <ul style="margin:0;padding:0 0 0 18px;color:#475569;font-size:14px;line-height:2;">
      <li>Google Business Profile and local SEO</li>
      <li>Website and social presence</li>
      <li>WhatsApp CRM and lead follow-up</li>
    </ul>
  </div>
  <p style="line-height:1.7;color:#475569;font-size:14px;">Several Canadian programs can fund digital marketing spend — we help you identify options during your free audit.</p>
  <p style="text-align:center;margin:28px 0;">
    <a href="${auditUrl}" style="display:inline-block;background:#061f3a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;">Get a free growth audit →</a>
  </p>
  <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0;">No obligation. Member pricing applies when you start a growth package.</p>
  <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">Questions? Call +1 416 900 8728 or reply to this email.</p>
</td></tr>
</table></td></tr></table></body></html>`,
      };
    }

    case "package_consideration": {
      const grantName = extra?.grantName ?? "a Canadian grant program";
      const sector = extra?.sector?.trim();
      const bookUrl = extra?.bookUrl ?? "https://grants.rtmbusinessdirectory.com/grants";
      return {
        subject: sector
          ? `How a ${sector} business accessed government funding with RTM`
          : "How Ontario businesses access $30,000+ in government funding",
        html: `<!doctype html><html lang="en"><head><meta charset="utf-8"/></head>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#061f3a;color:#fff;padding:28px 32px;">
  <h1 style="margin:0;font-size:22px;">RTM Grant Advisory</h1>
  <p style="margin:8px 0 0;color:#94a3b8;">Real outcomes — not guaranteed approvals</p>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 12px;">Hi ${displayName},</h2>
  <p style="line-height:1.7;color:#475569;">You spent time reviewing <strong>${grantName}</strong>. Many business owners in your position start with a short eligibility conversation before investing in a full application package.</p>
  <div style="background:#f8fafc;border-left:4px solid #b91c1c;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
    <p style="margin:0 0 8px;font-weight:700;color:#0f172a;">What RTM typically contributes:</p>
    <ul style="margin:0;padding:0 0 0 18px;color:#475569;font-size:14px;line-height:2;">
      <li>Eligibility screening before you invest weeks in paperwork</li>
      <li>Document checklist aligned to the funder's actual requirements</li>
      <li>Advisor review before submission — catching gaps that cause rejections</li>
    </ul>
  </div>
  <p style="line-height:1.7;color:#475569;">RTM is a private Canadian advisory platform — not a government agency. We do not guarantee approval. We help you submit stronger applications.</p>
  <p style="text-align:center;margin:28px 0;">
    <a href="${bookUrl}" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;">Book a free eligibility call →</a>
  </p>
  <p style="font-size:13px;color:#94a3b8;text-align:center;">Browse and match for free. Passport ($100/yr) unlocks member package pricing when you're ready to submit.</p>
  <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">Questions? Call +1 416 900 8728 or reply to this email.</p>
</td></tr>
</table></td></tr></table></body></html>`,
      };
    }

    case "passport_pitch": {
      // S4 — Passport pitch. Shows full value stack BEFORE the price.
      // Triggered: modal dismissed ×2, or 5 days since intake started.
      const grantName = extra?.grantName ?? "your matched grant";
      const membershipUrl = `${MEMBERSHIP_URL}/signup`;
      return {
        subject: `Submit your ${grantName} application with RTM support`,
        html: `<!doctype html><html lang="en"><head><meta charset="utf-8"/></head>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#b91c1c;color:#fff;padding:28px 32px;">
  <h1 style="margin:0;font-size:24px;">RTM Submission Passport</h1>
  <p style="margin:8px 0 0;color:#fee2e2;">Here's what $100/yr actually gives you</p>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 12px;">Hi ${displayName},</h2>
  <p style="line-height:1.7;color:#475569;">Your intake for <strong>${grantName}</strong> is ready to submit. Before you activate your Passport, here is the exact value it includes — so you can decide whether it's worth it.</p>

  <table width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;font-size:14px;">
    <tr style="background:#f8fafc;"><th style="text-align:left;padding:10px 16px;color:#64748b;font-weight:600;">What's included</th><th style="text-align:right;padding:10px 16px;color:#64748b;font-weight:600;">Value</th><th style="text-align:right;padding:10px 16px;color:#064e3b;font-weight:600;">Your price</th></tr>
    <tr style="border-top:1px solid #e2e8f0;"><td style="padding:10px 16px;">Submit with RTM advisor review</td><td style="text-align:right;padding:10px 16px;color:#64748b;">$299</td><td style="text-align:right;padding:10px 16px;color:#059669;font-weight:700;">Included</td></tr>
    <tr style="border-top:1px solid #e2e8f0;background:#f8fafc;"><td style="padding:10px 16px;">50% off all grant advisor packages</td><td style="text-align:right;padding:10px 16px;color:#64748b;">$150–$3,250 saved</td><td style="text-align:right;padding:10px 16px;color:#059669;font-weight:700;">Included</td></tr>
    <tr style="border-top:1px solid #e2e8f0;"><td style="padding:10px 16px;">Education grants at govgranteducation.ca</td><td style="text-align:right;padding:10px 16px;color:#64748b;">$49</td><td style="text-align:right;padding:10px 16px;color:#059669;font-weight:700;">Included</td></tr>
    <tr style="border-top:1px solid #e2e8f0;background:#f8fafc;"><td style="padding:10px 16px;">RTM Business Directory featured listing</td><td style="text-align:right;padding:10px 16px;color:#64748b;">$120/yr</td><td style="text-align:right;padding:10px 16px;color:#059669;font-weight:700;">Included</td></tr>
    <tr style="border-top:1px solid #e2e8f0;"><td style="padding:10px 16px;">30% off all Growth Services</td><td style="text-align:right;padding:10px 16px;color:#64748b;">$150–$540/mo saved</td><td style="text-align:right;padding:10px 16px;color:#059669;font-weight:700;">Included</td></tr>
    <tr style="border-top:2px solid #b91c1c;background:#fef2f2;"><td style="padding:12px 16px;font-weight:700;">Total value</td><td style="text-align:right;padding:12px 16px;font-weight:700;">$620+/yr</td><td style="text-align:right;padding:12px 16px;color:#b91c1c;font-weight:700;font-size:18px;">$100/yr</td></tr>
  </table>

  <p style="text-align:center;margin:0 0 8px;">
    <a href="${membershipUrl}" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;">Activate my Submission Passport — $100/yr →</a>
  </p>
  <p style="text-align:center;font-size:13px;color:#94a3b8;margin:0 0 24px;">Your intake progress is saved. You pick up exactly where you left off.</p>
  <p style="margin:0;font-size:13px;color:#94a3b8;">Questions? Call +1 416 900 8728 or reply to this email.</p>
</td></tr>
</table></td></tr></table></body></html>`,
      };
    }

    case "edu_crosssell": {
      // S7 — Education grant cross-sell. Sent Day 3 post-active membership.
      return {
        subject: "Business grants aren't the only path — have you checked education grants?",
        html: `<!doctype html><html lang="en"><head><meta charset="utf-8"/></head>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#065f46;color:#fff;padding:28px 32px;">
  <h1 style="margin:0;font-size:24px;">Education Grants</h1>
  <p style="margin:8px 0 0;color:#a7f3d0;">A different, often easier path to government funding</p>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 12px;">Hi ${displayName},</h2>
  <p style="line-height:1.7;color:#475569;">Your RTM Passport includes full access to <strong>govgranteducation.ca</strong> — our partner platform for education and training grants in Canada.</p>
  <div style="background:#f0fdf4;border:1px solid #6ee7b7;border-radius:10px;padding:20px;margin:20px 0;">
    <p style="margin:0 0 8px;font-weight:700;color:#065f46;">Why education grants are worth exploring:</p>
    <ul style="margin:0;padding:0 0 0 18px;color:#047857;font-size:14px;line-height:2;">
      <li>Typically higher approval rates than business development grants</li>
      <li>Fund training, certifications, skills development — different eligibility criteria</li>
      <li>A business owner in any sector may qualify for employee upskilling programs</li>
      <li>Can run in parallel with your active grant applications</li>
    </ul>
  </div>
  <p style="text-align:center;margin:24px 0;">
    <a href="https://www.govgranteducation.ca" style="display:inline-block;background:#065f46;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;">Explore education grants →</a>
  </p>
  <p style="font-size:13px;color:#94a3b8;text-align:center;">Sign in with your RTM email — your Passport access is already active.</p>
  <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">Questions? Call +1 416 900 8728 or reply to this email.</p>
</td></tr>
</table></td></tr></table></body></html>`,
      };
    }

    case "win_back":
      // Alias of final_notice — both use the value-first win-back copy
      return (() => {
        const grantName = extra?.grantName;
        const deadline = extra?.deadline;
        const subject = grantName && deadline
          ? `${grantName} closes ${deadline} — your application is still saved`
          : "Your saved grants are still open — here's what's available";
        return {
          subject,
          html: `<!doctype html><html lang="en"><head><meta charset="utf-8"/></head>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#b91c1c;color:#fff;padding:28px 32px;">
  <h1 style="margin:0;font-size:24px;">RTM Grants</h1>
  <p style="margin:8px 0 0;color:#fee2e2;">Your profile and progress are saved</p>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 12px;">Hi ${displayName},</h2>
  ${grantName ? `<p style="line-height:1.7;color:#475569;"><strong>${grantName}</strong>${deadline ? ` closes <strong>${deadline}</strong>` : ''} — your intake progress is saved and ready to submit whenever you are.</p>` : `<p style="line-height:1.7;color:#475569;">Several Canadian programs that may match your business are still open. Your profile and any intake progress are saved exactly as you left them.</p>`}
  <p style="text-align:center;margin:28px 0;">
    <a href="https://grants.rtmbusinessdirectory.com/grants" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;">Resume my application →</a>
  </p>
  <p style="font-size:13px;color:#94a3b8;text-align:center;">Activate your RTM Submission Passport ($100/yr) when you're ready to submit with advisor support.</p>
  <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">Questions? Call +1 416 900 8728 or reply to this email.</p>
</td></tr>
</table></td></tr></table></body></html>`,
        };
      })();

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
    const {
      profileId,
      profileEmail,
      displayName,
      template,
      customSubject,
      customHtml,
      grantName,
      deadline,
      province,
      sector,
      bookUrl,
      auditUrl,
    } = body;

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
      const built = buildEmail(template as Template, recipientName, {
        referralCode,
        grantName: typeof grantName === "string" ? grantName : undefined,
        deadline: typeof deadline === "string" ? deadline : undefined,
        province: typeof province === "string" ? province : undefined,
        sector: typeof sector === "string" ? sector : undefined,
        bookUrl: typeof bookUrl === "string" ? bookUrl : undefined,
        auditUrl: typeof auditUrl === "string" ? auditUrl : undefined,
      });
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
