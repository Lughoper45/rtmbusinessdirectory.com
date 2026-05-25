import { DIRECTORY_APP_URL, GRANTS_APP_URL, MEMBERSHIP_APP_URL, SITE_CONTACT } from "@/lib/site";

export type GrantChecklistLeadStatus = "new" | "contacted" | "replied" | "closed";

export type GrantChecklistLead = {
  id: string;
  email: string;
  name: string | null;
  source: string;
  status: GrantChecklistLeadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const GRANT_CHECKLIST_LEAD_STATUSES: GrantChecklistLeadStatus[] = [
  "new",
  "contacted",
  "replied",
  "closed",
];

const siteBase = DIRECTORY_APP_URL.replace(/\/$/, "");
const grantsHubUrl = `${siteBase}/grants`;
export const GRANT_CHECKLIST_PDF_URL = `${siteBase}/downloads/RTM_Grant_Checklist.pdf`;

export const GRANT_CHECKLIST_EMAIL_SUBJECT =
  "Your RTM Free Grant Checklist + next steps";

/** May 2026 inbox batch — personalized HTML files in docs/emails/may-2026/ */
export const MAY_2026_CHECKLIST_RECIPIENTS = [
  { email: "marciamorrison049@gmail.com", name: "Marcia", requested: "2026-05-21" },
  { email: "okunlolatokunbo@gmail.com", name: "Tokunbo", requested: "2026-05-20" },
  { email: "nonsoa2014@gmail.com", name: "Nonso", requested: "2026-05-20" },
  { email: "orders@southsouthpot.com", name: "South South Pot team", requested: "2026-05-20" },
] as const;

export function resolveGrantChecklistRecipientName(
  email: string,
  storedName?: string | null,
): string | null {
  if (storedName?.trim()) return storedName.trim();
  const known = MAY_2026_CHECKLIST_RECIPIENTS.find(
    (r) => r.email.toLowerCase() === email.trim().toLowerCase(),
  );
  return known?.name ?? null;
}

/** Plain-text reply for manual send (admin copy or personal follow-up). */
export function buildGrantChecklistReplyText(options?: {
  recipientName?: string | null;
  includeMembershipCta?: boolean;
}): string {
  const greeting = options?.recipientName?.trim()
    ? `Hi ${options.recipientName.trim()},`
    : "Hello,";

  const membershipBlock = options?.includeMembershipCta !== false
    ? `
RTM membership ($100/year) unlocks member package pricing (50% off list — Maple Checklist from $149) and the Funding Workspace for profile-matched programs:
${MEMBERSHIP_APP_URL}/signup

Funding Workspace (members): ${GRANTS_APP_URL}
`
    : "";

  return `${greeting}

Thank you for requesting the Free Grant Checklist from RTM Business Directory.

Download your general preparation checklist (PDF):
${GRANT_CHECKLIST_PDF_URL}

This covers document prep and steps used across many Canadian programs. A personalized program shortlist comes with the Maple Checklist advisor package or your member Funding Workspace after you build your RTM Grant Profile.

An RTM grant advisor will follow up within two business days with next steps for programs that may fit your business.

Grants hub (packages and featured programs):
${grantsHubUrl}
${membershipBlock}
If you have questions, reply to this email or reach us at ${SITE_CONTACT.email} or ${SITE_CONTACT.phoneDisplay}.

Warm regards,
RTM Grant Advisory Team
${SITE_CONTACT.officeAddressCompact}
`;
}

/** Shorter template after you've already sent checklist details. */
export function buildGrantChecklistFollowUpText(recipientName?: string | null): string {
  const greeting = recipientName?.trim() ? `Hi ${recipientName.trim()},` : "Hello,";
  return `${greeting}

Following up on your Free Grant Checklist request — please let us know if you received the checklist PDF and if you'd like to book a quick call to discuss Maple Checklist or full application support.

Checklist PDF: ${GRANT_CHECKLIST_PDF_URL}
Grants hub: ${grantsHubUrl}
Membership ($100/year, member pricing): ${MEMBERSHIP_APP_URL}/signup

${SITE_CONTACT.email} · ${SITE_CONTACT.phoneDisplay}
`;
}

const membershipSignupUrl = `${MEMBERSHIP_APP_URL.replace(/\/$/, "")}/signup`;
const grantsWorkspaceUrl = `${GRANTS_APP_URL.replace(/\/$/, "")}/grants`;

/** Branded HTML delivery email — attach or link the checklist PDF. */
export function buildGrantChecklistReplyHtml(options?: {
  recipientName?: string | null;
  includeMembershipCta?: boolean;
}): string {
  const greeting = options?.recipientName?.trim()
    ? `Hi ${escapeHtml(options.recipientName.trim())},`
    : "Hello,";

  const membershipSection =
    options?.includeMembershipCta !== false
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
                        <a href="${membershipSignupUrl}" style="display: inline-block; background-color: #ffffff; color: #0f172a; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #cbd5e1;">
                          Join RTM Membership
                        </a>
                      </td>
                      <td>
                        <a href="${grantsWorkspaceUrl}" style="display: inline-block; background-color: #ffffff; color: #0f172a; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #cbd5e1;">
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
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7; color: #0f172a; font-weight: 600;">
                ${greeting}
              </p>
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
              <a href="${GRANT_CHECKLIST_PDF_URL}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 6px 18px rgba(220, 38, 38, 0.28);">
                Download Grant Checklist (PDF)
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding: 8px 32px 24px; text-align: center;">
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                Or copy this link:<br>
                <a href="${GRANT_CHECKLIST_PDF_URL}" style="color: #dc2626; word-break: break-all;">${GRANT_CHECKLIST_PDF_URL}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fff7ed; border-radius: 12px; border-left: 4px solid #f97316;">
                <tr>
                  <td style="padding: 20px 22px;">
                    <p style="margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #9a3412;">
                      What happens next
                    </p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="28" valign="top" style="padding-bottom: 10px; color: #ea580c; font-weight: 700;">1.</td>
                        <td style="padding-bottom: 10px; font-size: 14px; line-height: 1.6; color: #7c2d12;">
                          Review the checklist and gather your core business documents.
                        </td>
                      </tr>
                      <tr>
                        <td width="28" valign="top" style="padding-bottom: 10px; color: #ea580c; font-weight: 700;">2.</td>
                        <td style="padding-bottom: 10px; font-size: 14px; line-height: 1.6; color: #7c2d12;">
                          Browse featured programs and advisor packages on the RTM Grants hub.
                        </td>
                      </tr>
                      <tr>
                        <td width="28" valign="top" style="color: #ea580c; font-weight: 700;">3.</td>
                        <td style="font-size: 14px; line-height: 1.6; color: #7c2d12;">
                          Reply to this email if you want a personalized program shortlist (Maple Checklist) or full application support.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 32px 28px; text-align: center;">
              <a href="${grantsHubUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Explore Grants &amp; Packages →
              </a>
            </td>
          </tr>

          ${membershipSection}

          <tr>
            <td style="padding: 0 32px 32px;">
              <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.7; color: #475569;">
                Questions? Reply to this email, call
                <a href="${SITE_CONTACT.phoneHref}" style="color: #dc2626; text-decoration: none; font-weight: 600;">${SITE_CONTACT.phoneDisplay}</a>,
                or write to
                <a href="mailto:${SITE_CONTACT.email}" style="color: #dc2626; text-decoration: none; font-weight: 600;">${SITE_CONTACT.email}</a>.
              </p>
              <p style="margin: 16px 0 0; font-size: 14px; line-height: 1.7; color: #64748b;">
                Warm regards,<br>
                <strong style="color: #0f172a;">RTM Grant Advisory Team</strong><br>
                ${SITE_CONTACT.officeAddressCompact}
              </p>
              <p style="margin: 16px 0 0; font-size: 11px; line-height: 1.5; color: #94a3b8;">
                Grant information is guidance only. Eligibility, deadlines, and funding decisions are controlled by each program provider.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px; font-size: 13px; color: #64748b; font-weight: 600;">
                RTM Business Directory
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #94a3b8;">
                <a href="${siteBase}" style="color: #64748b; text-decoration: none;">rtmbusinessdirectory.com</a>
                &nbsp;·&nbsp;
                <a href="${grantsHubUrl}" style="color: #64748b; text-decoration: none;">Grants</a>
                &nbsp;·&nbsp;
                <a href="${membershipSignupUrl}" style="color: #64748b; text-decoration: none;">Membership</a>
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
