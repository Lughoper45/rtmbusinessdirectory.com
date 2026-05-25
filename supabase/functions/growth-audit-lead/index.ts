import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.1.0";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const FROM = "RTM Growth Services <noreply@rtmbusinessdirectory.com>";
const NOTIFY = "info@rtmbusinessdirectory.com";

function template(title: string, body: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title></head>
<body style="margin:0;font-family:sans-serif;background:#f8fafc;">
<table width="100%" style="max-width:600px;margin:0 auto;background:#fff;">
<tr><td style="background:linear-gradient(135deg,#061f3a,#0a2d52);padding:24px;text-align:center;">
<h1 style="color:#fff;margin:0;">RTM Growth Services</h1></td></tr>
<tr><td style="padding:28px;">${body}</td></tr>
</table></body></html>`;
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
    if (!email || !EMAIL_RE.test(email)) {
      return jsonResponse(req, { error: "A valid email is required." }, 400);
    }

    const answers = {
      business_name: body.business_name ? String(body.business_name).slice(0, 200) : null,
      business_type: body.business_type ? String(body.business_type).slice(0, 100) : null,
      years_operating: body.years_operating ? String(body.years_operating).slice(0, 50) : null,
      online_presence: Array.isArray(body.online_presence) ? body.online_presence : [],
      biggest_challenge: body.biggest_challenge ? String(body.biggest_challenge).slice(0, 200) : null,
      interested_package: body.interested_package ? String(body.interested_package).slice(0, 80) : null,
      city: body.city ? String(body.city).slice(0, 100) : null,
    };

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: lead, error } = await admin
      .from("growth_audit_leads")
      .insert({
        email,
        name: body.name ? String(body.name).slice(0, 200) : null,
        business_name: answers.business_name,
        phone: body.phone ? String(body.phone).slice(0, 40) : null,
        city: answers.city,
        business_type: answers.business_type,
        years_operating: answers.years_operating,
        online_presence: answers.online_presence,
        biggest_challenge: answers.biggest_challenge,
        interested_package: answers.interested_package,
        answers,
        source: body.source ? String(body.source).slice(0, 80) : "grow_page",
        status: "new",
      })
      .select("id")
      .single();

    if (error) throw error;

    const site = (Deno.env.get("GROW_APP_URL") ?? Deno.env.get("SITE_URL") ?? "https://grow.rtmbusinessdirectory.com").replace(/\/$/, "");
    const growUrl = site;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    let emailsSent = false;

    if (resendKey) {
      const resend = new Resend(resendKey);
      const greeting = body.name ? `Hi ${body.name},` : "Hello,";

      const [confirmResult, notifyResult] = await Promise.all([
        resend.emails.send({
          from: FROM,
          to: email,
          subject: "Your free RTM Digital Growth Audit request",
          html: template(
            "Growth Audit",
            `<h2 style="color:#061f3a;">Thanks — we'll review your digital presence</h2>
<p style="color:#475569;line-height:1.7;">${greeting}</p>
<p style="color:#475569;line-height:1.7;">An RTM growth advisor will follow up within <strong>two business days</strong> with audit findings and recommended next steps.</p>
<p><a href="${growUrl}" style="color:#2563eb;">Explore RTM Growth packages →</a></p>
<p style="font-size:12px;color:#64748b;">RTM is a private advisory service — not a government agency.</p>`,
          ),
        }),
        resend.emails.send({
          from: FROM,
          to: Deno.env.get("GROWTH_NOTIFY_EMAIL") ?? NOTIFY,
          subject: `Growth audit lead: ${email}`,
          html: template(
            "New lead",
            `<p><strong>Email:</strong> ${email}</p>
<p><strong>Business:</strong> ${answers.business_name ?? "—"}</p>
<p><strong>Type:</strong> ${answers.business_type ?? "—"}</p>
<p><strong>Challenge:</strong> ${answers.biggest_challenge ?? "—"}</p>
<p><a href="https://rtmbusinessdirectory.com/admin/growth">Open admin →</a></p>`,
          ),
        }),
      ]);

      if (confirmResult.error) {
        console.error("growth-audit-lead: confirm email failed:", JSON.stringify(confirmResult.error));
      }
      if (notifyResult.error) {
        console.error("growth-audit-lead: notify email failed:", JSON.stringify(notifyResult.error));
      }
      emailsSent = !confirmResult.error;
    } else {
      console.warn("growth-audit-lead: RESEND_API_KEY not set — email skipped");
    }

    return jsonResponse(req, { success: true, leadId: lead.id, emailsSent });
  } catch (e) {
    console.error("growth-audit-lead:", e);
    return jsonResponse(
      req,
      { error: e instanceof Error ? e.message : "Request failed" },
      500,
    );
  }
});
