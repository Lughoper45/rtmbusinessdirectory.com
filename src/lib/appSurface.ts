/** Detect which RTM product surface this build is serving. */

export type AppSurface = "directory" | "grow" | "grants" | "membership";

const HOST_SURFACE: Record<string, AppSurface> = {
  grow: "grow",
  grants: "grants",
  membership: "membership",
};

export function detectAppSurface(): AppSurface {
  const forced = import.meta.env.VITE_APP_SURFACE?.trim().toLowerCase();
  if (forced === "grow" || forced === "grants" || forced === "membership" || forced === "directory") {
    return forced;
  }

  if (typeof window === "undefined") return "directory";

  const host = window.location.hostname.toLowerCase();
  const prefix = host.split(".")[0];
  if (prefix && HOST_SURFACE[prefix]) {
    return HOST_SURFACE[prefix];
  }

  return "directory";
}

export function isGrowSurface(): boolean {
  return detectAppSurface() === "grow";
}
