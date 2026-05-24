import { Helmet } from "react-helmet-async";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { ArrowRight, Mail, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SITE_CONTACT } from "@/lib/site";

type PageConfig = {
  title: string;
  description: string;
  eyebrow: string;
  sections: Array<{
    title: string;
    body: string;
  }>;
  primaryCta?: {
    label: string;
    to: string;
  };
  secondaryCta?: {
    label: string;
    to: string;
  };
};

const contentPages: Record<string, PageConfig> = {
  "business-support": {
    title: "Business Support",
    description: "Guidance, tools, and partner support to help businesses grow through RTM.",
    eyebrow: "Product",
    sections: [
      {
        title: "Operational support",
        body: "RTM Business Support is where merchants, founders, and local operators can access guidance on visibility, listings, customer acquisition, and promotional readiness.",
      },
      {
        title: "Growth tools",
        body: "This section connects business owners with directory visibility, membership-driven demand, affiliate exposure, and RTM support workflows.",
      },
      {
        title: "Next phase",
        body: "Use this page to understand RTM support options and choose the next step for listing, grants guidance, or business growth.",
      },
    ],
    primaryCta: { label: "List Your Business", to: "/directory" },
    secondaryCta: { label: "Explore Grants", to: "/grants" },
  },
  "ai-search": {
    title: "AI Search",
    description: "Search RTM resources and business discovery experiences with AI-assisted guidance.",
    eyebrow: "Product",
    sections: [
      {
        title: "Smarter discovery",
        body: "AI Search is intended to help visitors move beyond static filters by surfacing businesses, offers, and support resources based on intent, not only category labels.",
      },
      {
        title: "User-friendly flow",
        body: "Instead of guessing exact keywords, users can describe what they need and let RTM guide them to relevant businesses, deals, and support paths.",
      },
      {
        title: "Search destination",
        body: "Use AI Search as a guided entry point into directory results, deals, grants guidance, and business support content.",
      },
    ],
    primaryCta: { label: "Browse Directory", to: "/directory" },
    secondaryCta: { label: "View Deals", to: "/deals" },
  },
  "world-cup-hub": {
    title: "World Cup Hub",
    description: "A dedicated RTM destination for campaigns, community programming, and event-driven business visibility.",
    eyebrow: "Product",
    sections: [
      {
        title: "Campaign destination",
        body: "World Cup Hub is positioned as a themed content and business-promotion surface tied to major moments, special offers, and audience engagement opportunities.",
      },
      {
        title: "Partner activation",
        body: "RTM can use this hub to spotlight participating businesses, timed promotions, community events, and branded editorial content around global football activity.",
      },
      {
        title: "Expandable structure",
        body: "RTM uses this hub to organize event-related visibility, partner offers, and community programming in one place.",
      },
    ],
    primaryCta: { label: "Explore Businesses", to: "/directory" },
    secondaryCta: { label: "See Membership", to: "/membership" },
  },
  marketplace: {
    title: "Marketplace",
    description: "An RTM marketplace surface for offers, products, services, and partner promotions.",
    eyebrow: "Product",
    sections: [
      {
        title: "Commerce-ready destination",
        body: "Marketplace is the natural place for RTM to aggregate partner offers, featured packages, digital products, and business promotions in a single conversion-focused destination.",
      },
      {
        title: "Connected to membership",
        body: "As RTM expands, the marketplace can work alongside directory listings and membership plans so visitors can browse, discover, and purchase within one ecosystem.",
      },
      {
        title: "Partner promotion surface",
        body: "The marketplace helps visitors move from business discovery to offers, services, and partner promotions.",
      },
    ],
    primaryCta: { label: "View Deals", to: "/deals" },
    secondaryCta: { label: "Find Businesses", to: "/directory" },
  },
  pricing: {
    title: "Pricing",
    description: "RTM pricing across memberships and platform participation paths.",
    eyebrow: "Product",
    sections: [
      {
        title: "Membership pricing",
        body: "RTM membership plans are the primary public-facing pricing surface for consumers who want to unlock savings and deal access across the network.",
      },
      {
        title: "Business participation",
        body: "RTM can use this area for merchant packages, promotional upgrades, sponsorship options, and partner service tiers.",
      },
      {
        title: "Current direction",
        body: "Right now, the clearest active pricing experience is the redesigned membership page, which remains the main conversion entry point.",
      },
    ],
    primaryCta: { label: "View Membership Plans", to: "/membership" },
    secondaryCta: { label: "Explore Affiliate", to: "/affiliate" },
  },
  about: {
    title: "About Us",
    description: "Learn what RTM Business Directory is building for businesses, members, and partners across Canada.",
    eyebrow: "Company",
    sections: [
      {
        title: "What RTM does",
        body: "RTM Business Directory brings together business discovery, member savings, growth tools, and partner visibility into one connected platform.",
      },
      {
        title: "Who it serves",
        body: "The platform is designed for consumers looking for value, businesses looking for exposure, and affiliates or partners looking for structured growth channels.",
      },
      {
        title: "Why this matters",
        body: "RTM aims to reduce fragmentation by combining listings, offers, memberships, and support pathways under a single brand experience.",
      },
    ],
    primaryCta: { label: "Explore Directory", to: "/directory" },
    secondaryCta: { label: "Contact RTM", to: "/contact" },
  },
  careers: {
    title: "Careers",
    description: "Opportunities to help build RTM’s business discovery and membership platform.",
    eyebrow: "Company",
    sections: [
      {
        title: "Join the mission",
        body: "RTM is building consumer and business experiences around visibility, deals, and growth. This page explains the kind of work and partnerships that support that mission.",
      },
      {
        title: "What to expect",
        body: "Career content can include role listings, contractor opportunities, and collaboration invites for marketing, operations, and product work.",
      },
      {
        title: "Current status",
        body: "Open roles are posted here when available. General collaboration inquiries can go through the contact page.",
      },
    ],
    primaryCta: { label: "Contact RTM", to: "/contact" },
    secondaryCta: { label: "Learn About RTM", to: "/about" },
  },
  blog: {
    title: "Blog",
    description: "RTM stories, updates, campaign highlights, and business insights.",
    eyebrow: "Company",
    sections: [
      {
        title: "Editorial home",
        body: "The RTM blog can house platform updates, growth advice, community stories, campaign highlights, and partner spotlights.",
      },
      {
        title: "Content role",
        body: "A blog helps RTM strengthen trust, SEO, and ongoing engagement by turning the platform into an active publishing surface instead of a static directory.",
      },
      {
        title: "Ready for expansion",
        body: "The blog is the home for RTM updates, useful business education, community stories, and partner spotlights.",
      },
    ],
    primaryCta: { label: "Explore Businesses", to: "/directory" },
    secondaryCta: { label: "See Deals", to: "/deals" },
  },
  "press-kit": {
    title: "Press Kit",
    description: "Brand and company summary information for media, collaborators, and external partners.",
    eyebrow: "Company",
    sections: [
      {
        title: "Media-ready overview",
        body: "Press Kit serves as the public destination for brand summaries, boilerplate copy, platform context, and RTM media assets.",
      },
      {
        title: "Partner communications",
        body: "This section can support journalist outreach, event promotions, and collaboration requests by giving external parties a single reference point.",
      },
      {
        title: "Current use",
        body: "Use this page for RTM positioning, brand context, and media contact direction.",
      },
    ],
    primaryCta: { label: "Contact RTM", to: "/contact" },
    secondaryCta: { label: "About RTM", to: "/about" },
  },
  partners: {
    title: "Partners",
    description: "RTM partnership opportunities across business promotion, campaigns, and member value.",
    eyebrow: "Company",
    sections: [
      {
        title: "Why partner with RTM",
        body: "RTM combines business discovery, consumer membership, affiliate reach, and promotional storytelling, making it a useful platform for ecosystem partnerships.",
      },
      {
        title: "Partnership types",
        body: "This area can support brand collaborations, merchant programs, community campaigns, event activations, referral networks, and service partnerships.",
      },
      {
        title: "Next step",
        body: "Interested organizations can start here, then contact RTM with a clear partnership proposal.",
      },
    ],
    primaryCta: { label: "Get in Touch", to: "/contact" },
    secondaryCta: { label: "View Marketplace", to: "/marketplace" },
  },
  contact: {
    title: "Contact",
    description: "Reach RTM for support, partnerships, and general questions.",
    eyebrow: "Company",
    sections: [
      {
        title: "General inquiries",
        body: "Use this route as the central contact destination for customer support, partnership requests, and business development conversations.",
      },
      {
        title: "Support routing",
        body: "Use the contact page for support questions, partnership requests, business listing help, and general RTM inquiries.",
      },
      {
        title: "Current point of contact",
        body: "Contact RTM by phone or email using the details on this page.",
      },
    ],
    primaryCta: { label: "Go to Support", to: "/business-support" },
    secondaryCta: { label: "View Directory", to: "/directory" },
  },
  terms: {
    title: "Terms of Service",
    description: "Terms governing RTM Business Directory membership, grant advisory packages, and platform use.",
    eyebrow: "Legal",
    sections: [
      {
        title: "Services covered",
        body: "RTM Global Canada operates rtmbusinessdirectory.com and related workspaces including membership, grants (GrantPilot), and business directory listings. Services include RTM membership ($100 CAD/year), grant advisory packages (Maple Checklist from $149 member / $299 list; True North Standard from $1,000 member / $2,000 list; Provincial Bridge from $1,600 member / $3,200 list; Northern Star from $3,250 member / $6,500 list), and business visibility tools.",
      },
      {
        title: "What RTM provides",
        body: "RTM provides research, narrative drafting, document preparation, eligibility checklists, and submission support through licensed advisors. RTM does not provide legal representation, financial advice, guaranteed grant funding, or direct access to government systems. RTM does not submit applications to government portals without your explicit review and consent.",
      },
      {
        title: "Refund policy",
        body: "Maple Checklist: 100% refund if RTM cannot identify at least three programs that may fit your profile. Single-application packages: 50% refund if the application is not submitted within the agreed timeline due to RTM delay. Refund requests must be submitted in writing to info@rtmbusinessdirectory.com within 14 days of purchase. RTM does not guarantee grant approval.",
      },
      {
        title: "User responsibilities",
        body: "You agree to provide accurate business information, deliver documents on agreed timelines, and review all drafts before any submission. You retain responsibility for final application accuracy.",
      },
      {
        title: "Intellectual property & governing law",
        body: "RTM-produced narratives and strategy documents become yours upon full payment. These terms are governed by the laws of the Province of Ontario, Canada. Last updated: May 2026.",
      },
    ],
    primaryCta: { label: "View Privacy Policy", to: "/privacy" },
    secondaryCta: { label: "Contact RTM", to: "/contact" },
  },
  privacy: {
    title: "Privacy Policy",
    description: "How RTM Global Canada collects, uses, and protects personal information under PIPEDA.",
    eyebrow: "Legal",
    sections: [
      {
        title: "Who we are",
        body: "RTM Global Canada operates RTM Business Directory from 640 Sentinel Road, North York, ON M3J 0B2, Canada. Contact: info@rtmbusinessdirectory.com · +1 416 900 8728. We are a private business advisory platform — not a government agency.",
      },
      {
        title: "Information we collect",
        body: "Account registration (name, email, business details), grant profile data, checklist lead submissions, grant intake answers, document uploads to the grant-documents Storage bucket, and payment confirmation metadata from Stripe. RTM does not store credit card numbers.",
      },
      {
        title: "How we use information",
        body: "To match grant programs to your profile, deliver advisor services, process membership and package orders, send transactional email, and improve platform security. Grant compatibility scores are estimates — not government eligibility determinations.",
      },
      {
        title: "Third-party processors",
        body: "Supabase (database, authentication, file storage — Canadian region where available), Stripe (payment processing), Resend (transactional email), and OpenRouter (AI-assisted drafting via secure server-side functions only). We do not sell personal information.",
      },
      {
        title: "Retention & your rights",
        body: "Account data is retained while your membership or active service order exists. You may request access, correction, or deletion by emailing info@rtmbusinessdirectory.com; we respond within 30 days per PIPEDA. Deleted accounts are purged within 90 days of verified request unless law requires retention.",
      },
    ],
    primaryCta: { label: "Read Terms", to: "/terms" },
    secondaryCta: { label: "Cookie Policy", to: "/cookies" },
  },
  cookies: {
    title: "Cookie Policy",
    description: "Cookies and similar technologies used across RTM Business Directory properties.",
    eyebrow: "Legal",
    sections: [
      {
        title: "Essential cookies",
        body: "Supabase authentication cookies maintain your signed-in session across RTM subdomains where configured. These are required for membership, grants workspace, and dashboard features.",
      },
      {
        title: "Payment & security",
        body: "Stripe may set cookies during checkout for fraud prevention and payment security. RTM does not use advertising or third-party tracking cookies on grant advisory pages.",
      },
      {
        title: "Managing cookies",
        body: "You can control cookies through your browser settings. Disabling essential cookies may prevent sign-in and checkout. Last updated: May 2026.",
      },
    ],
    primaryCta: { label: "Privacy Policy", to: "/privacy" },
    secondaryCta: { label: "Accessibility", to: "/accessibility" },
  },
  accessibility: {
    title: "Accessibility",
    description: "RTM’s approach to inclusive, usable digital experiences.",
    eyebrow: "Legal",
    sections: [
      {
        title: "Accessibility commitment",
        body: "RTM should aim to make its directory, membership, and support experiences understandable and usable across devices and assistive technologies.",
      },
      {
        title: "Ongoing improvement",
        body: "This destination can contain formal accessibility statements, conformance targets, contact methods, and issue-reporting guidance.",
      },
      {
        title: "Current use",
        body: "Visitors can use this page to understand RTM accessibility practices and report usability barriers.",
      },
    ],
    primaryCta: { label: "Contact RTM", to: "/contact" },
    secondaryCta: { label: "Privacy Policy", to: "/privacy" },
  },
};

const ContentPage = () => {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const location = useLocation();
  const slug = routeSlug ?? location.pathname.replace(/^\/+/, "");

  if (!slug || !contentPages[slug]) {
    return <Navigate to="/404" replace />;
  }

  const page = contentPages[slug];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{page.title} | RTM Business Directory</title>
        <meta name="description" content={page.description} />
      </Helmet>

      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,hsl(222_47%_11%)_0%,hsl(217_33%_17%)_55%,hsl(352_82%_49%)_140%)] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.18),transparent_26%)]" />
          <div className="container relative z-10 mx-auto max-w-[1280px] px-6 py-16 md:py-24">
            <Badge className="border-white/15 bg-white/10 text-white">{page.eyebrow}</Badge>
            <div className="mt-6 max-w-4xl">
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">{page.title}</h1>
              <p className="mt-5 max-w-2xl text-lg text-white/75 md:text-xl">{page.description}</p>
            </div>

            {(page.primaryCta || page.secondaryCta) ? (
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                {page.primaryCta ? (
                  <Button asChild variant="heroWhite" size="xl">
                    <Link to={page.primaryCta.to}>
                      {page.primaryCta.label}
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                ) : null}
                {page.secondaryCta ? (
                  <Button asChild variant="heroOutline" size="xl">
                    <Link to={page.secondaryCta.to}>{page.secondaryCta.label}</Link>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="container mx-auto grid max-w-[1280px] gap-6 px-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-6">
              {page.sections.map((section) => (
                <Card key={section.title} className="border-border/70 shadow-medium">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                    <p className="mt-4 leading-7 text-muted-foreground">{section.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6">
              <Card className="border-primary/20 bg-primary/5 shadow-medium">
                <CardContent className="p-8">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">RTM Business Directory</div>
                  <h2 className="mt-3 text-2xl font-black text-foreground">Your Trusted Business Directory</h2>
                  <p className="mt-3 text-muted-foreground">
                    This page gives visitors a concise RTM destination with relevant next steps and contact context.
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{SITE_CONTACT.officeLabel}:</span> {SITE_CONTACT.officeAddress}
                  </p>
                </CardContent>
              </Card>

              {slug === "contact" ? (
                <Card className="border-border/70 shadow-medium">
                  <CardContent className="grid gap-4 p-8 text-sm text-muted-foreground">
                    <div>
                      <div className="font-semibold text-foreground">{SITE_CONTACT.officeLabel}</div>
                      <div className="mt-1">{SITE_CONTACT.officeAddress}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>{SITE_CONTACT.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>{SITE_CONTACT.phoneDisplay}</span>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContentPage;
