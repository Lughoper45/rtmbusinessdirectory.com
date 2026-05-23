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

const grantsHubUrl = `${DIRECTORY_APP_URL.replace(/\/$/, "")}/grants`;

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
RTM members receive 50% off grant advisor packages (Maple Checklist from $149) and access to the GrantPilot workspace for matched programs and application tracking:
${MEMBERSHIP_APP_URL}/signup

Grant workspace (members): ${GRANTS_APP_URL}
`
    : "";

  return `${greeting}

Thank you for requesting the Free Grant Checklist from RTM Business Directory.

An RTM grant advisor will follow up within two business days with your eligibility checklist and a shortlist of Canadian programs that may fit your business profile.

In the meantime, you can review grant packages and featured programs here:
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

Following up on your Free Grant Checklist request — please let us know if you received our eligibility notes and if you'd like to book a quick call to discuss Maple Checklist or full application support.

Grants hub: ${grantsHubUrl}
Membership (member pricing): ${MEMBERSHIP_APP_URL}/signup

${SITE_CONTACT.email} · ${SITE_CONTACT.phoneDisplay}
`;
}
