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

export const getMembershipJoinUrl = (referralCode?: string | null) => {
  const url = new URL("/signup", MEMBERSHIP_APP_URL);
  if (referralCode) url.searchParams.set("ref", referralCode);
  return url.toString();
};

export const openMembershipJoin = (referralCode?: string | null) => {
  window.location.href = getMembershipJoinUrl(referralCode);
};
