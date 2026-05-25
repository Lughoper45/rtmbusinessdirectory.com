import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.1.0";
import {
  handleCorsPreflight,
  jsonResponse,
} from "../_shared/cors.ts";

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const RTM_NOTIFY_EMAIL = "info@rtmbusinessdirectory.com";
const FROM_ADDRESS = "RTM Grants <noreply@rtmbusinessdirectory.com>";

function baseTemplate(content: string, title: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#fff;">
<tr><td style="background:linear-gradient(135deg,#061f3a,#0a2d52);padding:28px 24px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:24px;">RTM Grant Checklist</h1>
<p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Canadian business grant guidance</p>
</td></tr>
<tr><td style="padding:32px 28px;">${content}</td></tr>
<tr><td style="background:#f1f5f9;padding:20px 28px;text-align:center;">
<p style="color:#64748b;font-size:12px;margin:0;">RTM Business Directory · © ${new Date().getFullYear()}</p>
</td></tr>
</table></body></html>`;
}

function autoReplyHtml(opts: {
  name?: string | null;
  grantsUrl: string;
  membershipUrl: string;
  checklistPdfUrl: string;
  fundingWorkspaceUrl: string;
  contactEmail: string;
  contactPhone: string;
}) {
  const greeting = opts.name?.trim()
    ? `Hi ${opts.name.trim()},`
    : "Hello,";
  return baseTemplate(
    `<h2 style="color:#061f3a;margin:0 0 12px;font-size:22px;">Thanks for requesting the Free Grant Checklist</h2>
<p style="color:#475569;line-height:1.7;margin:0 0 16px;">${greeting}</p>
<p style="color:#475569;line-height:1.7;margin:0 0 16px;">
We received your request. Download your <strong>general preparation checklist</strong> below. An RTM grant advisor will follow up within <strong>two business days</strong> with next steps for Canadian programs that may fit your business.
</p>
<div style="text-align:center;margin:24px 0;">
<a href="${opts.checklistPdfUrl}" style="display:inline-block;background:#cc0000;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;">Download checklist (PDF) →</a>
</div>
<p style="color:#475569;line-height:1.7;margin:0 0 16px;font-size:14px;">
This PDF covers document prep and application steps used across many programs. A <strong>personalized program shortlist</strong> comes with the Maple Checklist advisor package or your member Funding Workspace after you build your RTM Grant Profile.
</p>
<p style="color:#475569;line-height:1.7;margin:0 0 24px;">Explore grant packages and featured programs on our grants hub:</p>
<div style="text-align:center;margin:20px 0;">
<a href="${opts.grantsUrl}" style="display:inline-block;border:2px solid #061f3a;color:#061f3a;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:600;">View grants hub →</a>
</div>
<p style="color:#475569;line-height:1.7;margin:0 0 12px;">
<strong>RTM membership ($100/year)</strong> unlocks member package pricing (50% off list — Maple Checklist from $149) and the Funding Workspace for profile-matched programs and application tracking:
<a href="${opts.fundingWorkspaceUrl}" style="color:#2563eb;">${opts.fundingWorkspaceUrl}</a>
</p>
<p style="text-align:center;margin:20px 0;">
<a href="${opts.membershipUrl}" style="color:#061f3a;font-weight:600;">Join RTM membership →</a>
</p>
<p style="color:#64748b;font-size:14px;margin:24px 0 0;">
Questions? Reply to this email or contact us at
<a href="mailto:${opts.contactEmail}" style="color:#2563eb;">${opts.contactEmail}</a>
or ${opts.contactPhone}.
</p>`,
    "Your Grant Checklist request — RTM",
  );
}

function teamNotifyHtml(opts: {
  email: string;
  name?: string | null;
  source: string;
  leadId: string;
  adminUrl: string;
}) {
  return baseTemplate(
    `<h2 style="color:#061f3a;margin:0 0 12px;">New Free Grant Checklist lead</h2>
<table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;">
<tr><td style="padding:8px 0;font-weight:600;width:120px;">Email</td><td><a href="mailto:${opts.email}">${opts.email}</a></td></tr>
${opts.name ? `<tr><td style="padding:8px 0;font-weight:600;">Name</td><td>${opts.name}</td></tr>` : ""}
<tr><td style="padding:8px 0;font-weight:600;">Source</td><td>${opts.source}</td></tr>
<tr><td style="padding:8px 0;font-weight:600;">Lead ID</td><td style="font-family:monospace;font-size:12px;">${opts.leadId}</td></tr>
</table>
<p style="margin:24px 0 0;">
<a href="${opts.adminUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">Open in admin →</a>
</p>`,
    "New Grant Checklist lead",
  );
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const name = body?.name ? String(body.name).trim().slice(0, 200) : null;
    const source = body?.source ? String(body.source).trim().slice(0, 80) : "grants_page";

    if (!email || !EMAIL_RE.test(email)) {
      return jsonResponse(req, { error: "A valid email address is required." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseService) {
      return jsonResponse(req, { error: "Server configuration incomplete." }, 500);
    }

    const admin = createClient(supabaseUrl, supabaseService);

    const { data: lead, error: insertError } = await admin
      .from("grant_checklist_leads")
      .insert({ email, name, source, status: "new" })
      .select("id, email, created_at")
      .single();

    if (insertError) throw insertError;

    const siteUrl = Deno.env.get("SITE_URL") ?? "https://www.rtmbusinessdirectory.com";
    const siteBase = siteUrl.replace(/\/$/, "");
    const grantsUrl = Deno.env.get("GRANTS_PAGE_URL") ?? `${siteBase}/grants`;
    const checklistPdfUrl = Deno.env.get("GRANT_CHECKLIST_PDF_URL") ??
      `${siteBase}/downloads/RTM_Grant_Checklist.pdf`;
    const fundingWorkspaceUrl = Deno.env.get("GRANTS_APP_URL") ??
      "https://grants.rtmbusinessdirectory.com";
    const membershipUrl = Deno.env.get("MEMBERSHIP_APP_URL") ??
      "https://membership.rtmbusinessdirectory.com/signup";
    const notifyTo = Deno.env.get("GRANT_CHECKLIST_NOTIFY_EMAIL") ?? RTM_NOTIFY_EMAIL;
    const contactEmail = Deno.env.get("SITE_CONTACT_EMAIL") ?? RTM_NOTIFY_EMAIL;
    const contactPhone = Deno.env.get("SITE_CONTACT_PHONE") ?? "+1 416 900 8728";
    const adminUrl = `${siteUrl.replace(/\/$/, "")}/admin/grants`;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    let emailsSent = false;

    if (resendKey) {
      const resend = new Resend(resendKey);
      await Promise.all([
        resend.emails.send({
          from: FROM_ADDRESS,
          to: email,
          subject: "We received your Free Grant Checklist request — RTM",
          html: autoReplyHtml({
            name,
            grantsUrl,
            membershipUrl,
            checklistPdfUrl,
            fundingWorkspaceUrl,
            contactEmail,
            contactPhone,
          }),
        }),
        resend.emails.send({
          from: FROM_ADDRESS,
          to: notifyTo,
          subject: `Grant Checklist lead: ${email}`,
          html: teamNotifyHtml({
            email,
            name,
            source,
            leadId: lead.id,
            adminUrl,
          }),
        }),
      ]);
      emailsSent = true;
    } else {
      console.warn("RESEND_API_KEY not set — lead saved without email");
    }

    return jsonResponse(req, {
      success: true,
      leadId: lead.id,
      emailsSent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    console.error("grant-checklist-lead:", error);
    return jsonResponse(req, { error: message }, 500);
  }
});
