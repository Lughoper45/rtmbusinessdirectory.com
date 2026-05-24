import { getGrantsWorkspaceUrl } from "@/lib/platformAuthHandoff";

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
  /** Minimum rules-based readiness score (0–100) before advisor queue. */
  minReadinessScore: number;
  /** Minimum grant_profiles.completion_pct for package CTAs. */
  minProfileCompletion: number;
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
    minReadinessScore: 30,
    minProfileCompletion: 40,
  },
  {
    id: "true-north-standard",
    name: "True North Standard",
    listPrice: 2000,
    memberPrice: 1000,
    description: "Advisor-led application prep with document review for one primary program.",
    highlights: ["Profile alignment", "Document review", "Draft narrative support"],
    minReadinessScore: 60,
    minProfileCompletion: 60,
  },
  {
    id: "provincial-bridge",
    name: "Provincial Bridge",
    listPrice: 3200,
    memberPrice: 1600,
    description: "Multi-program provincial strategy with compliance checks before submission.",
    highlights: ["Provincial program map", "Compliance review", "Submission checklist"],
    minReadinessScore: 75,
    minProfileCompletion: 70,
  },
  {
    id: "northern-star",
    name: "Northern Star",
    listPrice: 6500,
    memberPrice: 3250,
    description: "Full-service grant pursuit with dedicated RTM advisor coordination.",
    highlights: ["Dedicated advisor", "End-to-end prep", "Follow-up support"],
    minReadinessScore: 85,
    minProfileCompletion: 80,
  },
];

export function formatPackagePrice(amount: number): string {
  return `$${amount.toLocaleString("en-CA")}`;
}

export function getPackageById(packageId: GrantPackageId): GrantPackage | undefined {
  return GRANT_PACKAGES.find((p) => p.id === packageId);
}

export function getPackageMinReadiness(packageId: GrantPackageId | string | null | undefined): number {
  if (!packageId) return 0;
  return getPackageById(packageId as GrantPackageId)?.minReadinessScore ?? 0;
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

/** Primary marketing CTA — hands off to grants workspace packages page with optional auth. */
export function getPackageCheckoutUrl(
  packageId: GrantPackageId,
  session?: { access_token: string; refresh_token: string } | null,
): string {
  return getGrantsWorkspaceUrl(session ?? null, `/grants/packages?package=${packageId}`);
}
