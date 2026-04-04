import { rtmBusinesses } from "./rtmBusinesses";
import { generateAllBusinesses } from "./businessGenerator";
import type { Business } from "@/types/directory";

export type DirectorySourceMode = "hybrid" | "database" | "local";
export type DirectoryDataSource = "database" | "local";

const rawMode = (import.meta.env.VITE_DIRECTORY_SOURCE_MODE || "hybrid").toLowerCase();

export const DIRECTORY_SOURCE_MODE: DirectorySourceMode =
  rawMode === "database" || rawMode === "local" ? rawMode : "hybrid";

export function normalizeValue(value?: string | null) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function getBusinessSignature(business: Business) {
  return [
    normalizeValue(business.name),
    normalizeValue(business.category),
    normalizeValue(business.address),
    normalizeValue(business.city),
    normalizeValue(business.province),
  ].join("|");
}

export function dedupeBusinesses(businesses: Business[]) {
  const seen = new Set<string>();

  return businesses.filter((business) => {
    const signature = getBusinessSignature(business);
    if (seen.has(signature)) {
      return false;
    }
    seen.add(signature);
    return true;
  });
}

export function dedupeBusinessesById(businesses: Business[]) {
  const seen = new Set<string>();

  return businesses.filter((business) => {
    if (seen.has(business.id)) {
      return false;
    }
    seen.add(business.id);
    return true;
  });
}

export function getBusinessSourcePriority(business: Pick<Business, "id">) {
  if (business.id.startsWith("rtm-")) return 0;
  if (business.id.startsWith("wp-")) return 1;
  if (business.id.startsWith("biz-")) return 2;
  return 1;
}

export function sortBusinessesForDirectory(businesses: Business[]) {
  return [...businesses].sort((a, b) => {
    const priorityDelta = getBusinessSourcePriority(a) - getBusinessSourcePriority(b);
    if (priorityDelta !== 0) return priorityDelta;

    const ratingDelta = (b.rating || 0) - (a.rating || 0);
    if (ratingDelta !== 0) return ratingDelta;

    const reviewDelta = (b.reviewCount || 0) - (a.reviewCount || 0);
    if (reviewDelta !== 0) return reviewDelta;

    return a.name.localeCompare(b.name);
  });
}

export const RTM_DATA = rtmBusinesses.filter((business) => business.name && business.name.length > 2);
export const GENERATED_DATA = generateAllBusinesses(10000, 42);
export const LOCAL_DATA: Business[] = sortBusinessesForDirectory(dedupeBusinessesById([...RTM_DATA, ...GENERATED_DATA]));

export const LOCAL_DATA_STATS = {
  total: LOCAL_DATA.length,
  rtmCount: RTM_DATA.length,
  generatedCount: GENERATED_DATA.length,
  duplicateCount: RTM_DATA.length + GENERATED_DATA.length - LOCAL_DATA.length,
};

export function shouldUseLocalFallback() {
  return DIRECTORY_SOURCE_MODE === "hybrid";
}

export function shouldUseLocalOnly() {
  return DIRECTORY_SOURCE_MODE === "local";
}

export function shouldUseDatabaseOnly() {
  return DIRECTORY_SOURCE_MODE === "database";
}
