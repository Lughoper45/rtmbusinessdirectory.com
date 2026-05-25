export type GrowthPackageId =
  | "visibility-starter"
  | "sales-engine"
  | "growth-os"
  | "digital-transformation";

export type GrowthPackage = {
  id: GrowthPackageId;
  name: string;
  listMonthly: number;
  memberMonthly: number;
  /** Stripe subscription packages only — custom advisory is quote-only */
  subscription: boolean;
};

export const GROWTH_PACKAGES: GrowthPackage[] = [
  {
    id: "visibility-starter",
    name: "Visibility Starter",
    listMonthly: 499,
    memberMonthly: 349,
    subscription: true,
  },
  {
    id: "sales-engine",
    name: "Sales Engine",
    listMonthly: 999,
    memberMonthly: 699,
    subscription: true,
  },
  {
    id: "growth-os",
    name: "Growth OS",
    listMonthly: 1799,
    memberMonthly: 1249,
    subscription: true,
  },
  {
    id: "digital-transformation",
    name: "Digital Transformation",
    listMonthly: 0,
    memberMonthly: 0,
    subscription: false,
  },
];

const PACKAGE_IDS = new Set(GROWTH_PACKAGES.map((p) => p.id));

export function isGrowthPackageId(value: string): value is GrowthPackageId {
  return PACKAGE_IDS.has(value as GrowthPackageId);
}

export function getGrowthPackage(packageId: string): GrowthPackage | undefined {
  return GROWTH_PACKAGES.find((p) => p.id === packageId);
}

export function resolveGrowthPackageAmountCents(
  packageId: GrowthPackageId,
  memberActive: boolean,
): { amountCents: number; label: string; monthlyDollars: number } {
  const pkg = getGrowthPackage(packageId);
  if (!pkg?.subscription) {
    throw new Error("Package is not available for self-serve checkout.");
  }
  const dollars = memberActive ? pkg.memberMonthly : pkg.listMonthly;
  const tier = memberActive ? "member" : "list";
  return {
    amountCents: Math.round(dollars * 100),
    label: `${pkg.name} (${tier})`,
    monthlyDollars: dollars,
  };
}
