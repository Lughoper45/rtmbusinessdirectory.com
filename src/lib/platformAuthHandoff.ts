import { GRANTS_APP_URL, GROW_APP_URL, WORLDCUP_APP_URL } from "@/lib/site";

export const PLATFORM_AUTH_STORAGE_KEY = "rtm-platform-auth";

export type HandoffTokens = {
  access_token: string;
  refresh_token: string;
};

const PLATFORM_APP_BASES = [GRANTS_APP_URL, GROW_APP_URL, WORLDCUP_APP_URL];

function hostsMatch(baseUrl: string, destinationHost: string): boolean {
  try {
    return new URL(baseUrl).host === destinationHost;
  } catch {
    return false;
  }
}

export function isPlatformAppHost(targetUrl: string): boolean {
  try {
    const host = new URL(targetUrl).host;
    return PLATFORM_APP_BASES.some((base) => hostsMatch(base, host));
  } catch {
    return false;
  }
}

/** @deprecated use isPlatformAppHost */
export function isGrantsOrWorldcupHost(targetUrl: string): boolean {
  return isPlatformAppHost(targetUrl);
}

export function buildPlatformAuthHandoffUrl(
  tokens: HandoffTokens,
  returnUrl: string,
): string {
  const destination = new URL(returnUrl);
  const appBase = PLATFORM_APP_BASES.find((base) => hostsMatch(base, destination.host));

  if (!appBase) {
    return returnUrl;
  }

  const returnPath =
    `${destination.pathname}${destination.search}${destination.hash}` || "/";
  const url = new URL("/auth", appBase.replace(/\/$/, ""));
  url.searchParams.set("returnUrl", returnPath.startsWith("/") ? returnPath : `/${returnPath}`);
  const hash = new URLSearchParams({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: "bearer",
  });
  url.hash = hash.toString();
  return url.toString();
}

/** @deprecated use buildPlatformAuthHandoffUrl */
export function buildGrantsAuthHandoffUrl(tokens: HandoffTokens, returnUrl: string): string {
  return buildPlatformAuthHandoffUrl(tokens, returnUrl);
}

function getWorkspaceUrl(
  appBase: string,
  session: { access_token: string; refresh_token: string } | null,
  returnPath: string,
): string {
  const base = appBase.replace(/\/$/, "");
  const fullReturn = `${base}${returnPath.startsWith("/") ? returnPath : `/${returnPath}`}`;
  if (!session?.access_token || !session.refresh_token) {
    const url = new URL("/auth", base);
    url.searchParams.set("returnUrl", returnPath.startsWith("/") ? returnPath : `/${returnPath}`);
    return url.toString();
  }
  return buildPlatformAuthHandoffUrl(session, fullReturn);
}

export function getGrantsWorkspaceUrl(
  session: { access_token: string; refresh_token: string } | null,
  returnPath = "/grants",
): string {
  return getWorkspaceUrl(GRANTS_APP_URL, session, returnPath);
}

export function getGrowWorkspaceUrl(
  session: { access_token: string; refresh_token: string } | null,
  returnPath = "/workspace",
): string {
  return getWorkspaceUrl(GROW_APP_URL, session, returnPath);
}
