export type MarketingTemplateVars = Record<string, string>;

export function renderMarketingTemplate(
  template: string,
  vars: MarketingTemplateVars,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function buildProspectVars(
  prospect: {
    email: string;
    contact_name?: string | null;
    business_name?: string | null;
    city?: string | null;
    province?: string | null;
  },
  siteBase: string,
): MarketingTemplateVars {
  const base = siteBase.replace(/\/$/, "");
  const name = prospect.contact_name?.trim() ?? "";
  const contact_name_greeting = name ? ` ${name}` : "";
  const business = prospect.business_name?.trim() || "your business";
  const city = prospect.city?.trim() || "your area";
  const province = prospect.province?.trim() || "Canada";
  const emailEnc = encodeURIComponent(prospect.email.toLowerCase());

  return {
    contact_name: name,
    contact_name_greeting,
    business_name: business,
    city,
    province,
    email: prospect.email.toLowerCase(),
    claim_url: `${base}/directory`,
    partner_url: `${base}/deals`,
    deals_url: `${base}/deals`,
    grants_url: `${base}/grants`,
    membership_url: Deno.env.get("MEMBERSHIP_APP_URL") ??
      "https://membership.rtmbusinessdirectory.com/signup",
    unsubscribe_url: `${base}/listing-opt-out?email=${emailEnc}`,
  };
}
