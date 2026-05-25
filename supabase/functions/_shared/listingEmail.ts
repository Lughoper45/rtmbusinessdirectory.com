const RTM_ADDRESS = "640 Sentinel Road, North York, ON M3J 0B2";
const RTM_PHONE = "+1 416 900 8728";
const RTM_EMAIL = "info@rtmbusinessdirectory.com";

export const LISTING_FROM = "RTM Directory <noreply@rtmbusinessdirectory.com>";

export function siteUrl(): string {
  return (Deno.env.get("SITE_URL") || "https://www.rtmbusinessdirectory.com").replace(/\/$/, "");
}

function baseTemplate(title: string, body: string, unsubscribeUrl?: string) {
  const unsub = unsubscribeUrl
    ? `<p style="color:#94a3b8;font-size:11px;margin-top:24px;">
        <a href="${unsubscribeUrl}" style="color:#64748b;">Not your business? Opt out</a>
        · RTM Business Directory · ${RTM_ADDRESS}
      </p>`
    : `<p style="color:#94a3b8;font-size:11px;margin-top:24px;">RTM Business Directory · ${RTM_ADDRESS}</p>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#fff;">
<tr><td style="background:linear-gradient(135deg,#061f3a,#0a2d52);padding:24px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:22px;">RTM Business Directory</h1>
</td></tr>
<tr><td style="padding:28px;">${body}</td></tr>
<tr><td style="background:#f1f5f9;padding:16px 28px;text-align:center;">
<p style="color:#64748b;font-size:12px;margin:0;">© ${new Date().getFullYear()} RTM · ${RTM_PHONE} · <a href="mailto:${RTM_EMAIL}">${RTM_EMAIL}</a></p>
${unsub}
</td></tr></table></body></html>`;
}

export function claimInviteHtml(opts: {
  businessName: string;
  city: string;
  claimUrl: string;
  profileUrl: string;
  unsubscribeUrl: string;
  step: number;
}) {
  const isReminder = opts.step > 0;
  const title = isReminder
    ? `Reminder: claim ${opts.businessName} on RTM`
    : `Your business is listed on RTM — claim your profile`;

  const intro = isReminder
    ? `<p style="color:#475569;line-height:1.7;">This is a friendly reminder that <strong>${opts.businessName}</strong> in ${opts.city} has a profile on RTM Business Directory.</p>`
    : `<p style="color:#475569;line-height:1.7;">We listed <strong>${opts.businessName}</strong> in ${opts.city} on Canada's RTM Business Directory. Claim your free profile to update hours, photos, and respond to customers.</p>`;

  const body = `
<h2 style="color:#061f3a;margin:0 0 12px;">${title}</h2>
${intro}
<div style="text-align:center;margin:24px 0;">
<a href="${opts.claimUrl}" style="display:inline-block;background:#cc0000;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;">Claim your listing →</a>
</div>
<p style="color:#475569;font-size:14px;">View your public profile: <a href="${opts.profileUrl}">${opts.profileUrl}</a></p>
<p style="color:#64748b;font-size:13px;">Claiming is free. RTM is a private business directory — not a government agency.</p>`;

  return { subject: title, html: baseTemplate(title, body, opts.unsubscribeUrl) };
}

export function postClaimNurtureHtml(opts: {
  businessName: string;
  step: "profile" | "photos" | "grants";
  dashboardUrl: string;
}) {
  const subjects: Record<string, string> = {
    profile: `Complete your RTM profile for ${opts.businessName}`,
    photos: `Add photos to ${opts.businessName} on RTM`,
    grants: `Canadian grants that may fit ${opts.businessName}`,
  };
  const bodies: Record<string, string> = {
    profile: `<p>Your claim on <strong>${opts.businessName}</strong> is approved. Add your hours, description, and contact info so customers find you.</p>`,
    photos: `<p>Businesses with photos get more views. Upload your logo and gallery from your dashboard.</p>`,
    grants: `<p>Explore grant programs and RTM advisory packages. RTM is a private advisor — we do not guarantee approval.</p>`,
  };
  const subject = subjects[opts.step];
  const body = `${bodies[opts.step]}
<div style="text-align:center;margin:20px 0;">
<a href="${opts.dashboardUrl}" style="display:inline-block;background:#061f3a;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;">Open dashboard →</a>
</div>`;
  return { subject, html: baseTemplate(subject, body) };
}

export function socialPostText(opts: {
  name: string;
  city: string;
  category: string;
  profileUrl: string;
  channel: string;
}): string {
  const tags = "#SmallBusiness #Canada #RTMDirectory";
  if (opts.channel === "linkedin") {
    return `Now on RTM Business Directory: ${opts.name} — ${opts.category} in ${opts.city}.\n\nView hours, contact info, and deals → ${opts.profileUrl}\n\n${tags}`;
  }
  if (opts.channel === "x") {
    return `🍁 ${opts.name} in ${opts.city} is on @RTM Directory → ${opts.profileUrl} ${tags}`;
  }
  return `🍁 Now on RTM: **${opts.name}** in ${opts.city} — ${opts.category}. See profile → ${opts.profileUrl} ${tags}`;
}
