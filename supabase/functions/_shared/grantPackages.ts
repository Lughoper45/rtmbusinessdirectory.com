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
};

/** RTM grant advisor packages — list vs member pricing (CAD). */
export const GRANT_PACKAGES: GrantPackage[] = [
  { id: "maple-checklist", name: "Maple Checklist", listPrice: 299, memberPrice: 149 },
  { id: "true-north-standard", name: "True North Standard", listPrice: 2000, memberPrice: 1000 },
  { id: "provincial-bridge", name: "Provincial Bridge", listPrice: 3200, memberPrice: 1600 },
  { id: "northern-star", name: "Northern Star", listPrice: 6500, memberPrice: 3250 },
];

const PACKAGE_IDS = new Set(GRANT_PACKAGES.map((p) => p.id));

export function isGrantPackageId(value: string): value is GrantPackageId {
  return PACKAGE_IDS.has(value as GrantPackageId);
}

export function getGrantPackage(packageId: string): GrantPackage | undefined {
  return GRANT_PACKAGES.find((p) => p.id === packageId);
}

export function resolvePackageAmountCents(
  packageId: GrantPackageId,
  memberActive: boolean,
): { amountCents: number; label: string } {
  const pkg = getGrantPackage(packageId);
  if (!pkg) throw new Error("Unknown package");
  const dollars = memberActive ? pkg.memberPrice : pkg.listPrice;
  const tier = memberActive ? "member" : "list";
  return {
    amountCents: Math.round(dollars * 100),
    label: `${pkg.name} (${tier})`,
  };
}
