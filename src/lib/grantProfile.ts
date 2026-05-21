import type { GrantProfile } from "@/types/grant";

const STORAGE_KEY = "rtm_grant_profile_v1";

export function saveGrantProfile(profile: GrantProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function loadGrantProfile(): GrantProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GrantProfile;
  } catch {
    return null;
  }
}

export function provinceFromLocation(location?: string): string | undefined {
  if (!location) return undefined;
  const value = location.toLowerCase();
  if (value.includes("ontario") || value.includes("toronto")) return "Ontario";
  if (value.includes("british columbia") || value.includes("vancouver")) return "British Columbia";
  if (value.includes("alberta") || value.includes("calgary")) return "Alberta";
  if (value.includes("quebec") || value.includes("montreal")) return "Quebec";
  return undefined;
}
