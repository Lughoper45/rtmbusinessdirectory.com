export const SITE_CONTACT = {
  officeLabel: "RTM Office Address",
  officeAddress: "640 Sentinel Road, by York University, North York, Ontario, Canada, M3J 0B2",
  officeAddressCompact: "640 Sentinel Road, North York, ON M3J 0B2",
  phoneDisplay: "+1 416 900 8728",
  phoneHref: "tel:+14169008728",
  email: "info@rtmbusinessdirectory.com",
};

export const MEMBERSHIP_APP_URL =
  import.meta.env.VITE_MEMBERSHIP_APP_URL || "https://membership.rtmbusinessdirectory.com";

export const DIRECTORY_APP_URL =
  import.meta.env.VITE_SITE_URL ||
  import.meta.env.VITE_DIRECTORY_APP_URL ||
  "https://rtmbusinessdirectory.com";

export const GRANTS_APP_URL =
  import.meta.env.VITE_GRANTS_APP_URL || "https://grants.rtmbusinessdirectory.com";

export const GROW_APP_URL =
  import.meta.env.VITE_GROW_APP_URL || "https://grow.rtmbusinessdirectory.com";

export const WORLDCUP_APP_URL =
  import.meta.env.VITE_WORLDCUP_APP_URL || "https://worldcup.rtmbusinessdirectory.com";

/** Public World Cup portal — subdomain root (not /worldcup path). */
export const getWorldCupPortalUrl = () => WORLDCUP_APP_URL.replace(/\/$/, "");

/** Grant workspace on grants subdomain (marketing links, no auth handoff). */
export const getGrantsPortalUrl = (path = "/grants") => {
  const base = GRANTS_APP_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
};

/** RTM Growth Services on grow subdomain. */
export const getGrowPortalUrl = (path = "/") => {
  const base = GROW_APP_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
};

export const openGrowPortal = (path = "/") => {
  window.location.href = getGrowPortalUrl(path);
};

export const getMembershipJoinUrl = (options?: {
  referralCode?: string | null;
  returnUrl?: string | null;
}) => {
  const url = new URL("/signup", MEMBERSHIP_APP_URL);
  if (options?.referralCode) url.searchParams.set("ref", options.referralCode);
  if (options?.returnUrl) url.searchParams.set("returnUrl", options.returnUrl);
  return url.toString();
};

export const openMembershipJoin = (options?: {
  referralCode?: string | null;
  returnUrl?: string | null;
}) => {
  const returnUrl = options?.returnUrl ?? (typeof window !== "undefined" ? window.location.href : null);
  window.location.href = getMembershipJoinUrl({ referralCode: options?.referralCode, returnUrl });
};

export const openExternalApp = (baseUrl: string, path = "/") => {
  const url = new URL(path, baseUrl.replace(/\/$/, ""));
  window.location.href = url.toString();
};

export { getGrantsWorkspaceUrl } from "@/lib/platformAuthHandoff";
