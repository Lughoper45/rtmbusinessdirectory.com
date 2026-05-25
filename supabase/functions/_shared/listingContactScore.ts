const FREE_WEBMAIL = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com", "icloud.com"];

export function domainFromUrl(website: string | null | undefined): string | null {
  if (!website?.trim()) return null;
  try {
    const host = new URL(
      website.startsWith("http") ? website : `https://${website}`,
    ).hostname.toLowerCase();
    return host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function scoreContact(opts: {
  email: string;
  websiteDomain: string | null;
  foundOnContactPage?: boolean;
  foundInFooter?: boolean;
  isMailto?: boolean;
}): { confidence: number; casl_basis: string | null } {
  const emailDomain = opts.email.split("@")[1]?.toLowerCase() ?? "";
  let score = 0;

  if (opts.websiteDomain && emailDomain === opts.websiteDomain) score += 40;
  if (opts.foundOnContactPage) score += 25;
  if (opts.foundInFooter) score += 15;
  if (opts.isMailto) score += 20;
  if (/^(info|contact|hello|office|admin|sales)@/.test(opts.email)) score += 10;
  if (FREE_WEBMAIL.includes(emailDomain)) score -= 20;

  const confidence = Math.max(0, Math.min(100, score));
  let casl_basis: string | null = null;
  if (confidence >= 70 && opts.websiteDomain && emailDomain === opts.websiteDomain) {
    casl_basis = "website_public";
  } else if (confidence >= 50) {
    casl_basis = "website_public";
  }

  return { confidence, casl_basis };
}

export function extractEmailsFromHtml(html: string, websiteDomain: string | null): {
  email: string;
  foundOnContactPage: boolean;
  foundInFooter: boolean;
  isMailto: boolean;
}[] {
  const results: Map<string, {
    email: string;
    foundOnContactPage: boolean;
    foundInFooter: boolean;
    isMailto: boolean;
  }> = new Map();

  const mailtoRe = /mailto:([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;
  let m: RegExpExecArray | null;
  while ((m = mailtoRe.exec(html)) !== null) {
    const email = m[1].toLowerCase();
    const cur = results.get(email) ?? { email, foundOnContactPage: false, foundInFooter: false, isMailto: false };
    cur.isMailto = true;
    results.set(email, cur);
  }

  const emailRe = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;
  while ((m = emailRe.exec(html)) !== null) {
    const email = m[1].toLowerCase();
    if (email.endsWith(".png") || email.endsWith(".jpg")) continue;
    const cur = results.get(email) ?? { email, foundOnContactPage: false, foundInFooter: false, isMailto: false };
    results.set(email, cur);
  }

  const lower = html.toLowerCase();
  const isContactPage = /contact|about|reach-us|get-in-touch/.test(lower.slice(0, 500));
  const hasFooter = /<footer|class="footer|id="footer/.test(lower);

  for (const cur of results.values()) {
    const domain = cur.email.split("@")[1];
    if (websiteDomain && domain !== websiteDomain && !FREE_WEBMAIL.includes(domain)) {
      continue;
    }
    if (isContactPage) cur.foundOnContactPage = true;
    if (hasFooter) cur.foundInFooter = true;
    results.set(cur.email, cur);
  }

  return [...results.values()];
}
