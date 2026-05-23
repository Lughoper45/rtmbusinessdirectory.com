import { GRANTS_APP_URL, WORLDCUP_APP_URL } from "@/lib/site";

export const PLATFORM_AUTH_STORAGE_KEY = "rtm-platform-auth";

export type HandoffTokens = {
  access_token: string;
  refresh_token: string;
};

export function isGrantsOrWorldcupHost(targetUrl: string): boolean {
  try {
    const host = new URL(targetUrl).host;
    return [GRANTS_APP_URL, WORLDCUP_APP_URL].some((base) => {
      try {
        return new URL(base).host === host;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

export function buildGrantsAuthHandoffUrl(
  tokens: HandoffTokens,
  returnUrl: string,
): string {
  const destination = new URL(returnUrl);
  const grantsBase = [GRANTS_APP_URL, WORLDCUP_APP_URL].find((base) => {
    try {
      return new URL(base).host === destination.host;
    } catch {
      return false;
    }
  });

  if (!grantsBase) {
    return returnUrl;
  }

  const returnPath = `${destination.pathname}${destination.search}${destination.hash}` || "/grants";
  const url = new URL("/auth", grantsBase.replace(/\/$/, ""));
  url.searchParams.set("returnUrl", returnPath.startsWith("/") ? returnPath : `/${returnPath}`);
  const hash = new URLSearchParams({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: "bearer",
  });
  url.hash = hash.toString();
  return url.toString();
}

export function getGrantsWorkspaceUrl(
  session: { access_token: string; refresh_token: string } | null,
  returnPath = "/grants",
): string {
  const grantsBase = GRANTS_APP_URL.replace(/\/$/, "");
  const fullReturn = `${grantsBase}${returnPath.startsWith("/") ? returnPath : `/${returnPath}`}`;
  if (!session?.access_token || !session.refresh_token) {
    const url = new URL("/auth", grantsBase);
    url.searchParams.set("returnUrl", returnPath.startsWith("/") ? returnPath : `/${returnPath}`);
    return url.toString();
  }
  return buildGrantsAuthHandoffUrl(session, fullReturn);
}
