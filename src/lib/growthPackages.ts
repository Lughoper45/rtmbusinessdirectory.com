/** RTM Growth Services — packages & catalog (from docs/business-growth.md) */

import { getGrowWorkspaceUrl } from "@/lib/platformAuthHandoff";

export type GrowthPackageId =
  | "visibility-starter"
  | "sales-engine"
  | "growth-os"
  | "digital-transformation";

export type GrowthPackage = {
  id: GrowthPackageId;
  name: string;
  tagline: string;
  /** List (non-member) monthly CAD */
  monthlyPrice: number | null;
  /** RTM member monthly CAD (~30% off) */
  monthlyPriceMember: number | null;
  /** @deprecated use monthlyPrice */
  monthlyPriceNonMember?: number | null;
  priceNote?: string;
  description: string;
  highlights: string[];
  popular?: boolean;
  /** Self-serve Stripe subscription */
  subscription?: boolean;
};

export const GROWTH_PACKAGES: GrowthPackage[] = [
  {
    id: "visibility-starter",
    name: "Visibility Starter",
    tagline: "Get found online",
    monthlyPrice: 499,
    monthlyPriceMember: 349,
    subscription: true,
    description:
      "For businesses invisible online — home care, food, trades, retail, and local services.",
    highlights: [
      "Featured RTM directory listing",
      "Google Business Profile setup & optimization",
      "Professional email (yourname@yourbusiness.com)",
      "1-page website or landing page",
      "Google review generation strategy",
      "Monthly performance summary",
    ],
    popular: true,
  },
  {
    id: "sales-engine",
    name: "Sales Engine",
    tagline: "Convert leads into clients",
    monthlyPrice: 999,
    monthlyPriceMember: 699,
    subscription: true,
    description: "Visible but not converting — add CRM, WhatsApp, and local demand gen.",
    highlights: [
      "Everything in Visibility Starter",
      "WhatsApp Business CRM (auto-replies + client management)",
      "5-page website with contact form & booking",
      "Instagram + Facebook setup, 8 posts/month",
      "Local SEO for your city & category",
      "Monthly strategy call with RTM advisor",
    ],
  },
  {
    id: "growth-os",
    name: "Growth OS",
    tagline: "Automate and scale",
    monthlyPrice: 1799,
    monthlyPriceMember: 1249,
    subscription: true,
    description: "Established SMEs ready for AI, ads, and full CRM automation.",
    highlights: [
      "Everything in Sales Engine",
      "AI chatbot (FAQ, qualify leads, book appointments)",
      "Meta + Google ads management (ad spend separate)",
      "HubSpot/Zoho CRM with automated follow-ups",
      "Monthly digital strategy + quarterly roadmap",
      "Grant tie-in: programs that may fund digital spend",
    ],
  },
  {
    id: "digital-transformation",
    name: "Digital Transformation",
    tagline: "Government-grade advisory",
    monthlyPrice: null,
    monthlyPriceMember: null,
    priceNote: "From $6,000 — custom 6+ month engagement",
    subscription: false,
    description: "CDAP-format Digital Adoption Plan and enterprise-grade delivery.",
    highlights: [
      "Full Digital Adoption Plan (advisor-authored)",
      "Technology stack assessment",
      "App development scoping & delivery",
      "Enterprise CRM & workflow automation",
      "Prepared for ISED digital advisor registration",
    ],
  },
];

export type GrowthServiceTier = "flagship" | "core" | "specialist";

export type GrowthService = {
  id: string;
  tier: GrowthServiceTier;
  icon: string;
  name: string;
  summary: string;
  audience: string;
  pricing: string;
};

export const GROWTH_SERVICES: GrowthService[] = [
  {
    id: "digital-presence",
    tier: "flagship",
    icon: "🌐",
    name: "Digital Presence Package",
    summary: "Your business online, professional, and searchable in 7 days",
    audience: "SMEs with zero or weak online presence",
    pricing: "Members: $799 + $149/mo · Non-members: $1,200 + $249/mo",
  },
  {
    id: "social-media",
    tier: "flagship",
    icon: "📱",
    name: "Social Media Management",
    summary: "Consistent, branded content posted every week",
    audience: "Owners with no time for social",
    pricing: "Members: $499/mo · Non-members: $799/mo (3-mo min)",
  },
  {
    id: "whatsapp-crm",
    tier: "flagship",
    icon: "🤖",
    name: "WhatsApp Business CRM",
    summary: "Automated replies, follow-ups, and client management",
    audience: "High WhatsApp volume: care, cleaning, food, trades",
    pricing: "Members: $599 setup + $99/mo · Non-members: $899 + $149/mo",
  },
  {
    id: "ai-chatbot",
    tier: "flagship",
    icon: "💬",
    name: "AI Chatbot Development",
    summary: "24/7 website assistant — qualify leads and book appointments",
    audience: "Businesses with repetitive enquiries",
    pricing: "Members: $1,200 setup + $99/mo · Non-members: $1,800 + $149/mo",
  },
  {
    id: "paid-ads",
    tier: "flagship",
    icon: "💰",
    name: "Paid Ads (Meta + Google)",
    summary: "City-targeted ads managed by RTM advisors",
    audience: "Min. $300/mo ad budget",
    pricing: "Members: $699/mo + ad spend · Non-members: $999/mo + ad spend",
  },
  {
    id: "website",
    tier: "core",
    icon: "🌍",
    name: "Website Design & Development",
    summary: "Mobile-first site that converts visitors to clients",
    audience: "No website or outdated site",
    pricing: "Members: $1,500–$3,500 · Non-members: $2,500–$5,000",
  },
  {
    id: "ecommerce",
    tier: "core",
    icon: "🛒",
    name: "E-Commerce Setup",
    summary: "Shopify or WooCommerce with payments",
    audience: "Product & service businesses selling online",
    pricing: "Members: $1,800–$4,000 · Non-members: $2,500–$6,000",
  },
  {
    id: "local-seo",
    tier: "core",
    icon: "🔍",
    name: "Local SEO",
    summary: "Rank on Google for your city and service",
    audience: "Local trades, care, beauty, food",
    pricing: "Members: $299/mo · Non-members: $499/mo (3-mo min)",
  },
  {
    id: "email-marketing",
    tier: "core",
    icon: "📧",
    name: "Email Marketing Setup",
    summary: "Welcome sequences and campaigns via Mailchimp/Klaviyo",
    audience: "Retail, food, health, professional services",
    pricing: "Members: $399 setup + $149/mo · Non-members: $599 + $249/mo",
  },
  {
    id: "digital-audit",
    tier: "specialist",
    icon: "📊",
    name: "Digital Strategy & Tech Audit",
    summary: "Prioritized growth roadmap document",
    audience: "Entry point for digital adoption advisory",
    pricing: "Members: $599 · Non-members: $999",
  },
  {
    id: "pwa-app",
    tier: "specialist",
    icon: "📲",
    name: "App Development (PWA)",
    summary: "Mobile web app — booking, loyalty, portals",
    audience: "Services & community orgs",
    pricing: "Members: $3,500–$8,000 · Non-members: $5,000–$12,000",
  },
  {
    id: "sales-crm",
    tier: "specialist",
    icon: "🎯",
    name: "Sales System Build",
    summary: "CRM, pipeline, automated follow-ups, reporting",
    audience: "B2B, contractors, consultants",
    pricing: "Members: $1,200 setup + $149/mo · Non-members: $1,800 + $249/mo",
  },
];

export function getGrowthPackageById(id: GrowthPackageId): GrowthPackage | undefined {
  return GROWTH_PACKAGES.find((p) => p.id === id);
}

export function formatGrowthPrice(amount: number): string {
  return `$${amount.toLocaleString("en-CA")}`;
}

export function getGrowthMonthlyPrice(
  pkg: GrowthPackage,
  memberActive: boolean,
): number | null {
  if (pkg.monthlyPrice == null) return null;
  return memberActive && pkg.monthlyPriceMember != null
    ? pkg.monthlyPriceMember
    : pkg.monthlyPrice;
}

export function getGrowthCheckoutUrl(
  packageId: GrowthPackageId,
  session?: { access_token: string; refresh_token: string } | null,
): string {
  return getGrowWorkspaceUrl(session ?? null, `/packages?start=${packageId}`);
}

export function getGrowthPackageMailto(packageId: GrowthPackageId, businessName?: string): string {
  const pkg = getGrowthPackageById(packageId);
  const subject = encodeURIComponent(`RTM Growth Services — ${pkg?.name ?? packageId}`);
  const body = encodeURIComponent(
    `Hi RTM,\n\nI'm interested in the ${pkg?.name ?? packageId} package.\n\nBusiness: ${businessName ?? "[your business]"}\n\nPlease contact me to start.\n`,
  );
  return `mailto:info@rtmbusinessdirectory.com?subject=${subject}&body=${body}`;
}

export const GROWTH_DISCLAIMER =
  "RTM Growth Services is a private Canadian business advisory offering. We are not a government agency and do not guarantee revenue, rankings, or grant approval. Program administrators and ad platforms make final decisions.";
