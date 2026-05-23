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
