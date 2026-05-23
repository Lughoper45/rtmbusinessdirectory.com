export type GrantPackageId =
  | "maple-checklist"
  | "true-north-standard"
  | "provincial-bridge"
  | "northern-star";

export type GrantPackage = {
  id: GrantPackageId;
  name: string;
  listPrice: number;
  memberPrice: number;
  description: string;
  highlights: string[];
};

/** RTM grant advisor packages — list vs member pricing (CAD). */
export const GRANT_PACKAGES: GrantPackage[] = [
  {
    id: "maple-checklist",
    name: "Maple Checklist",
    listPrice: 299,
    memberPrice: 149,
    description: "Eligibility review and a prioritized checklist of programs that fit your profile.",
    highlights: ["Program shortlist", "Eligibility checklist", "Next-step guidance"],
  },
  {
    id: "true-north-standard",
    name: "True North Standard",
    listPrice: 2000,
    memberPrice: 1000,
    description: "Advisor-led application prep with document review for one primary program.",
    highlights: ["Profile alignment", "Document review", "Draft narrative support"],
  },
  {
    id: "provincial-bridge",
    name: "Provincial Bridge",
    listPrice: 3200,
    memberPrice: 1600,
    description: "Multi-program provincial strategy with compliance checks before submission.",
    highlights: ["Provincial program map", "Compliance review", "Submission checklist"],
  },
  {
    id: "northern-star",
    name: "Northern Star",
    listPrice: 6500,
    memberPrice: 3250,
    description: "Full-service grant pursuit with dedicated RTM advisor coordination.",
    highlights: ["Dedicated advisor", "End-to-end prep", "Follow-up support"],
  },
];

export function formatPackagePrice(amount: number): string {
  return `$${amount.toLocaleString("en-CA")}`;
}

export function getPackageRequestMailto(packageId: GrantPackageId, businessName?: string): string {
  const pkg = GRANT_PACKAGES.find((p) => p.id === packageId);
  const subject = encodeURIComponent(`RTM Grant Package Request: ${pkg?.name ?? packageId}`);
  const body = encodeURIComponent(
    [
      `Package: ${pkg?.name ?? packageId}`,
      businessName ? `Business: ${businessName}` : "",
      "",
      "Please contact me about this RTM grant advisor package.",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return `mailto:info@rtmbusinessdirectory.com?subject=${subject}&body=${body}`;
}
