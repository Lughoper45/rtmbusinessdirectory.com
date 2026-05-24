export const GRANT_CHECKLIST_EMAIL_SUBJECT =
  "Your RTM Free Grant Checklist + next steps";

export const GRANT_CHECKLIST_FROM = "RTM Grants <noreply@rtmbusinessdirectory.com>";

export type GrantChecklistEmailUrls = {
  siteBase: string;
  grantsHubUrl: string;
  checklistPdfUrl: string;
  membershipSignupUrl: string;
  grantsWorkspaceUrl: string;
  contactEmail: string;
  contactPhone: string;
  contactPhoneHref: string;
  officeAddress: string;
};

export function resolveGrantChecklistEmailUrls(): GrantChecklistEmailUrls {
  const siteUrl = Deno.env.get("SITE_URL") ?? "https://rtmbusinessdirectory.com";
  const siteBase = siteUrl.replace(/\/$/, "");
  const membershipBase = (Deno.env.get("MEMBERSHIP_APP_URL") ??
    "https://membership.rtmbusinessdirectory.com").replace(/\/$/, "");
  const grantsBase = (Deno.env.get("GRANTS_APP_URL") ??
    "https://grants.rtmbusinessdirectory.com").replace(/\/$/, "");

  return {
    siteBase,
    grantsHubUrl: Deno.env.get("GRANTS_PAGE_URL") ?? `${siteBase}/grants`,
    checklistPdfUrl: Deno.env.get("GRANT_CHECKLIST_PDF_URL") ??
      `${siteBase}/downloads/RTM_Grant_Checklist.pdf`,
    membershipSignupUrl: `${membershipBase}/signup`,
    grantsWorkspaceUrl: `${grantsBase}/grants`,
    contactEmail: Deno.env.get("SITE_CONTACT_EMAIL") ?? "info@rtmbusinessdirectory.com",
    contactPhone: Deno.env.get("SITE_CONTACT_PHONE") ?? "+1 416 900 8728",
    contactPhoneHref: "tel:+14169008728",
    officeAddress: "640 Sentinel Road, North York, ON M3J 0B2",
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildGrantChecklistDeliveryHtml(
  urls: GrantChecklistEmailUrls,
  options?: { recipientName?: string | null; includeMembershipCta?: boolean },
): string {
  const greeting = options?.recipientName?.trim()
    ? `Hi ${escapeHtml(options.recipientName.trim())},`
    : "Hello,";

  const membershipSection = options?.includeMembershipCta !== false
    ? `
          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em;">
                      Member advantage
                    </p>
                    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.65; color: #475569;">
                      RTM membership ($100/year) unlocks <strong style="color: #0f172a;">50% off</strong> grant advisor packages
                      (Maple Checklist from $149) and access to your profile-matched Funding Workspace.
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-right: 10px;">
                          <a href="${urls.membershipSignupUrl}" style="display: inline-block; background-color: #ffffff; color: #0f172a; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #cbd5e1;">
                            Join RTM Membership
                          </a>
                        </td>
                        <td>
                          <a href="${urls.grantsWorkspaceUrl}" style="display: inline-block; background-color: #ffffff; color: #0f172a; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #cbd5e1;">
                            Open Funding Workspace
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your RTM Free Grant Checklist</title>
</head>
<body style="margin: 0; padding: 0; background-color: #eef2f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #eef2f7; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 32px 28px; border-bottom: 4px solid #dc2626;">
              <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.72); font-weight: 600;">
                RTM Grant Advisory
              </p>
              <h1 style="margin: 0; font-size: 28px; line-height: 1.2; color: #ffffff; font-weight: 700;">
                Your Free Grant Checklist
              </h1>
              <p style="margin: 10px 0 0; font-size: 15px; line-height: 1.5; color: rgba(255,255,255,0.88);">
                Practical steps for Canadian grant preparation
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 8px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7; color: #0f172a; font-weight: 600;">${greeting}</p>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #475569;">
                Thank you for requesting the <strong style="color: #0f172a;">Free Grant Checklist</strong> from RTM Business Directory.
                Your checklist is ready — it covers document preparation and the core steps used across many Canadian federal, provincial, and regional programs.
              </p>
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #475569;">
                An RTM grant advisor will follow up within <strong style="color: #0f172a;">two business days</strong> with next steps for programs that may fit your business.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 8px; text-align: center;">
              <a href="${urls.checklistPdfUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 6px 18px rgba(220, 38, 38, 0.28);">
                Download Grant Checklist (PDF)
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 32px 24px; text-align: center;">
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                Or copy this link:<br>
                <a href="${urls.checklistPdfUrl}" style="color: #dc2626; word-break: break-all;">${urls.checklistPdfUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fff7ed; border-radius: 12px; border-left: 4px solid #f97316;">
                <tr>
                  <td style="padding: 20px 22px;">
                    <p style="margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #9a3412;">What happens next</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr><td width="28" valign="top" style="padding-bottom: 10px; color: #ea580c; font-weight: 700;">1.</td><td style="padding-bottom: 10px; font-size: 14px; line-height: 1.6; color: #7c2d12;">Review the checklist and gather your core business documents.</td></tr>
                      <tr><td width="28" valign="top" style="padding-bottom: 10px; color: #ea580c; font-weight: 700;">2.</td><td style="padding-bottom: 10px; font-size: 14px; line-height: 1.6; color: #7c2d12;">Browse featured programs and advisor packages on the RTM Grants hub.</td></tr>
                      <tr><td width="28" valign="top" style="color: #ea580c; font-weight: 700;">3.</td><td style="font-size: 14px; line-height: 1.6; color: #7c2d12;">Reply to this email if you want a personalized program shortlist (Maple Checklist) or full application support.</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 28px; text-align: center;">
              <a href="${urls.grantsHubUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Explore Grants &amp; Packages →
              </a>
            </td>
          </tr>
          ${membershipSection}
          <tr>
            <td style="padding: 0 32px 32px;">
              <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.7; color: #475569;">
                Questions? Reply to this email, call
                <a href="${urls.contactPhoneHref}" style="color: #dc2626; text-decoration: none; font-weight: 600;">${urls.contactPhone}</a>,
                or write to
                <a href="mailto:${urls.contactEmail}" style="color: #dc2626; text-decoration: none; font-weight: 600;">${urls.contactEmail}</a>.
              </p>
              <p style="margin: 16px 0 0; font-size: 14px; line-height: 1.7; color: #64748b;">
                Warm regards,<br>
                <strong style="color: #0f172a;">RTM Grant Advisory Team</strong><br>
                ${urls.officeAddress}
              </p>
              <p style="margin: 16px 0 0; font-size: 11px; line-height: 1.5; color: #94a3b8;">
                Grant information is guidance only. Eligibility, deadlines, and funding decisions are controlled by each program provider.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px; font-size: 13px; color: #64748b; font-weight: 600;">RTM Business Directory</p>
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #94a3b8;">
                <a href="${urls.siteBase}" style="color: #64748b; text-decoration: none;">rtmbusinessdirectory.com</a>
                &nbsp;·&nbsp;
                <a href="${urls.grantsHubUrl}" style="color: #64748b; text-decoration: none;">Grants</a>
                &nbsp;·&nbsp;
                <a href="${urls.membershipSignupUrl}" style="color: #64748b; text-decoration: none;">Membership</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Known May 2026 inbox imports — used when lead.name is empty. */
const KNOWN_RECIPIENT_NAMES: Record<string, string> = {
  "marciamorrison049@gmail.com": "Marcia",
  "okunlolatokunbo@gmail.com": "Tokunbo",
  "nonsoa2014@gmail.com": "Nonso",
  "orders@southsouthpot.com": "South South Pot team",
};

export function resolveGrantChecklistRecipientName(
  email: string,
  storedName?: string | null,
): string | null {
  if (storedName?.trim()) return storedName.trim();
  return KNOWN_RECIPIENT_NAMES[email.trim().toLowerCase()] ?? null;
}
