import { rtmBusinesses } from "./rtmBusinesses";
import { generateAllBusinesses } from "./businessGenerator";
import type { Business } from "@/types/directory";

export type DirectorySourceMode = "hybrid" | "database" | "local";
export type DirectoryDataSource = "database" | "local";

const rawMode = (import.meta.env.VITE_DIRECTORY_SOURCE_MODE || "hybrid").toLowerCase();

export const DIRECTORY_SOURCE_MODE: DirectorySourceMode =
  rawMode === "database" || rawMode === "local" ? rawMode : "hybrid";

export const RTM_DATA = rtmBusinesses.filter((business) => business.name && business.name.length > 2);
export const GENERATED_DATA = generateAllBusinesses(10000, 42);
export const LOCAL_DATA: Business[] = [...RTM_DATA, ...GENERATED_DATA];

export const LOCAL_DATA_STATS = {
  total: LOCAL_DATA.length,
  rtmCount: RTM_DATA.length,
  generatedCount: GENERATED_DATA.length,
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
