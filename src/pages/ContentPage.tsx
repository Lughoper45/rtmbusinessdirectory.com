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
        body: "This section is designed to connect business owners with directory visibility, membership-driven demand, affiliate exposure, and future support workflows inside the RTM ecosystem.",
      },
      {
        title: "Next phase",
        body: "The current page acts as a live destination for navigation and can expand later into onboarding, help articles, service packages, and partner resources.",
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
        title: "Roadmap-ready destination",
        body: "This page gives the footer and navigation a real target today while leaving room for a fuller AI search experience later.",
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
        body: "This version establishes the route and message now so it can later evolve into a richer event microsite without leaving the footer broken.",
      },
    ],
    primaryCta: { label: "Explore Businesses", to: "/directory" },
    secondaryCta: { label: "See Membership", to: "/membership" },
  },
  marketplace: {
    title: "Marketplace",
    description: "A future RTM marketplace surface for offers, products, services, and partner promotions.",
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
        title: "Live placeholder with room to grow",
        body: "This page gives the product navigation a stable target today while preserving flexibility for future commerce and promotional features.",
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
        body: "As the platform grows, RTM can extend this area with merchant packages, promotional upgrades, sponsorship options, and partner service tiers.",
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
        body: "RTM is building consumer and business experiences around visibility, deals, and growth. This page establishes a destination for future hiring and partner opportunities.",
      },
      {
        title: "What to expect",
        body: "Career content can expand here over time to include role listings, contractor opportunities, and collaboration invites for marketing, operations, and product work.",
      },
      {
        title: "Current status",
        body: "No live jobs are listed yet, but the route is now active and ready for future openings.",
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
        body: "This route gives the footer a working destination now and can later be upgraded into a full editorial archive.",
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
        body: "Press Kit serves as the public destination for brand summaries, boilerplate copy, platform context, and future downloadable RTM assets.",
      },
      {
        title: "Partner communications",
        body: "This section can support journalist outreach, event promotions, and collaboration requests by giving external parties a single reference point.",
      },
      {
        title: "Current use",
        body: "The page is live now as a structured placeholder and can later be extended with downloadable logos, brand rules, and media contacts.",
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
        body: "The route is now active so the footer works properly and interested organizations have a clear place to start.",
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
        body: "As RTM expands, this page can evolve into a structured contact center with forms, department routing, and response expectations.",
      },
      {
        title: "Current point of contact",
        body: "For now, the route gives the footer and top-level company navigation a working destination instead of a dead link.",
      },
    ],
    primaryCta: { label: "Go to Support", to: "/business-support" },
    secondaryCta: { label: "View Directory", to: "/directory" },
  },
  terms: {
    title: "Terms of Service",
    description: "General terms governing use of RTM Business Directory services and public site experiences.",
    eyebrow: "Legal",
    sections: [
      {
        title: "Use of the platform",
        body: "These terms can define how visitors, members, and businesses use RTM services, listings, promotional surfaces, and related experiences.",
      },
      {
        title: "Commercial relationships",
        body: "Future updates can formalize billing, partner obligations, acceptable use rules, account access, and limitations of liability.",
      },
      {
        title: "Placeholder notice",
        body: "This page is a live legal destination for navigation integrity and should be replaced with finalized legal copy before public reliance.",
      },
    ],
    primaryCta: { label: "View Privacy Policy", to: "/privacy" },
    secondaryCta: { label: "Contact RTM", to: "/contact" },
  },
  privacy: {
    title: "Privacy Policy",
    description: "How RTM may collect, use, and manage data across its services.",
    eyebrow: "Legal",
    sections: [
      {
        title: "Data handling overview",
        body: "A privacy policy should explain what personal data RTM collects, how it is used, and how users can understand and manage that processing.",
      },
      {
        title: "Platform touchpoints",
        body: "This can cover authentication, memberships, payments, inquiries, listings, analytics, and communications across the RTM platform.",
      },
      {
        title: "Placeholder notice",
        body: "The route is now live, but the text is still placeholder content and should be replaced by finalized policy language.",
      },
    ],
    primaryCta: { label: "Read Terms", to: "/terms" },
    secondaryCta: { label: "Cookie Policy", to: "/cookies" },
  },
  cookies: {
    title: "Cookie Policy",
    description: "Information about cookies, analytics, and related tracking technologies used by RTM.",
    eyebrow: "Legal",
    sections: [
      {
        title: "Tracking transparency",
        body: "A cookie policy should explain what browser storage and measurement technologies are used and what purpose they serve across RTM properties.",
      },
      {
        title: "User awareness",
        body: "This can later expand to include essential cookies, analytics tools, marketing technologies, and consent preferences if RTM enables them.",
      },
      {
        title: "Placeholder notice",
        body: "The current page exists to support working navigation and policy references until final legal text is available.",
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
        body: "This destination can later contain formal accessibility statements, conformance targets, contact methods, and issue-reporting guidance.",
      },
      {
        title: "Current use",
        body: "The page now exists so the footer has a real destination and the site has a visible accessibility policy surface.",
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
                    This page now exists as a real destination in the footer and can be expanded with full product or legal content later.
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
