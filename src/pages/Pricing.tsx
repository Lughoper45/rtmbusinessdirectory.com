import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  Crown,
  HelpCircle,
  Lock,
  Rocket,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GrantAdvisoryDisclaimer from "@/components/grantpilot/GrantAdvisoryDisclaimer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  GRANT_PACKAGES,
  formatPackagePrice,
  getPackageCheckoutUrl,
  getPackageRequestMailto,
  type GrantPackageId,
} from "@/lib/grantPackages";
import { fetchPlatformMembership } from "@/services/membership";
import { getGrowPortalUrl, openMembershipJoin } from "@/lib/site";
import {
  GROWTH_PACKAGES,
  formatGrowthPrice,
  getGrowthMonthlyPrice,
} from "@/lib/growthPackages";
import {
  COMPLIANCE_COPY,
  DISCOUNT_RANGE_LABEL,
  MEMBERSHIP_PRICE_LABEL,
} from "@/content/siteCopy";

const membershipFeatures = [
  "Digital RTM Member Card — use same day",
  `${DISCOUNT_RANGE_LABEL} savings at participating businesses`,
  "GrantPilot workspace access on grants.rtmbusinessdirectory.com",
  "50% off all RTM grant advisor packages",
  "Profile-matched grant catalog (217+ programs)",
  "Community fund eligibility after 90 active days",
  "Member deals and directory perks",
];

const freeFeatures = [
  "Browse the Canadian business directory",
  "Search grants marketing catalog on /grants",
  "Free grant preparation checklist (email)",
  "LaunchBot AI guidance on homepage",
];

const businessFeatures = [
  "Basic business listing on rtmbusinessdirectory.com",
  "Category and location search visibility",
  "Upgrade paths for featured placement (contact RTM)",
];

const faqs = [
  {
    q: "Do I need membership to buy a grant package?",
    a: "You can purchase at list price without membership, but active RTM members save 50% on every advisor package. Membership also unlocks the full GrantPilot workspace with compatibility estimates and intake tracking.",
  },
  {
    q: "Are grant packages a guarantee of funding?",
    a: "No. RTM provides private advisory services — research, checklists, document review, and application prep. Program administrators make all final eligibility and funding decisions.",
  },
  {
    q: "What does the $100 membership include?",
    a: "Annual access to member discounts, your digital card, GrantPilot workspace, member-priced grant packages, and community fund eligibility after 90 days. It is not insurance or an investment product.",
  },
  {
    q: "Can I list my business for free?",
    a: "Yes. Basic directory listings are free. Contact RTM for featured placement, campaigns, or World Cup 2026 supplier opportunities.",
  },
  {
    q: "How do refunds work on grant packages?",
    a: "Maple Checklist: 100% refund if RTM cannot identify three programs that may fit your profile. Application packages: 50% refund if not submitted within the agreed timeline due to RTM delay. See Terms of Service for details.",
  },
];

function GrantPackageCard({
  packageId,
  name,
  listPrice,
  memberPrice,
  description,
  highlights,
  memberActive,
  popular,
  onBuy,
}: {
  packageId: GrantPackageId;
  name: string;
  listPrice: number;
  memberPrice: number;
  description: string;
  highlights: string[];
  memberActive: boolean;
  popular?: boolean;
  onBuy: (id: GrantPackageId) => void;
}) {
  const displayPrice = memberActive ? memberPrice : listPrice;

  return (
    <Card
      className={`relative flex flex-col border-border/70 shadow-medium transition-shadow hover:shadow-lg ${
        popular ? "border-primary/40 ring-2 ring-primary/20" : ""
      }`}
    >
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
          Most popular
        </Badge>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">{name}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{formatPackagePrice(displayPrice)}</span>
            <span className="text-sm text-muted-foreground">CAD</span>
          </div>
          {!memberActive && (
            <p className="mt-1 text-sm text-muted-foreground">
              Members pay{" "}
              <span className="font-semibold text-success">{formatPackagePrice(memberPrice)}</span>
            </p>
          )}
          {memberActive && listPrice > memberPrice && (
            <p className="mt-1 text-xs text-success font-medium">
              Member rate — saves {formatPackagePrice(listPrice - memberPrice)}
            </p>
          )}
        </div>
        <ul className="space-y-2">
          {highlights.map((h) => (
            <li key={h} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {h}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-0">
        <Button className="w-full gap-2" onClick={() => onBuy(packageId)}>
          <ShoppingCart className="h-4 w-4" />
          Buy package
        </Button>
        <a
          href={getPackageRequestMailto(packageId)}
          className="text-center text-xs text-muted-foreground hover:text-primary"
        >
          Contact advisor instead
        </a>
      </CardFooter>
    </Card>
  );
}

const Pricing = () => {
  const [user, setUser] = useState<User | null>(null);
  const [memberActive, setMemberActive] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const returnUrl = typeof window !== "undefined" ? window.location.href : undefined;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setMemberActive(false);
      return;
    }
    fetchPlatformMembership(user.id, user.email).then((m) => setMemberActive(m.active));
  }, [user]);

  const handleBuyPackage = async (packageId: GrantPackageId) => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    window.location.href = getPackageCheckoutUrl(
      packageId,
      session?.access_token && session.refresh_token
        ? { access_token: session.access_token, refresh_token: session.refresh_token }
        : null,
    );
  };

  return (
    <>
      <Helmet>
        <title>RTM Pricing — Membership, Grant Advisory & Business Listings</title>
        <meta
          name="description"
          content="Transparent RTM pricing: $100/year membership, grant advisor packages from $149 (member rate), free directory browsing, and 50% member savings on application support."
        />
        <link rel="canonical" href="https://rtmbusinessdirectory.com/pricing" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <Navbar />

        <main>
          {/* Hero */}
          <section className="relative overflow-hidden bg-[#06233f] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(204,0,0,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(151,201,61,0.12),transparent_35%)]" />
            <div className="container relative z-10 mx-auto max-w-[1280px] px-6 py-16 md:py-24">
              <Badge className="border-[#97c93d]/40 bg-[#97c93d] px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#06233f]">
                Transparent pricing
              </Badge>
              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                One membership.{" "}
                <span className="text-[#97c93d]">Clear grant packages.</span>{" "}
                No hidden fees.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
                RTM is a private Canadian platform — member savings, grant advisory, and business visibility.
                Prices below are in CAD. Grant support does not guarantee approval.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button variant="heroWhite" size="xl" onClick={() => openMembershipJoin({ returnUrl })}>
                  Join RTM — {MEMBERSHIP_PRICE_LABEL}
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button variant="heroOutline" size="xl" asChild>
                  <Link to="/grants">Browse grant catalog</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Membership — anchor tier */}
          <section id="membership" className="border-b border-border/60 bg-secondary/20 py-16 md:py-20">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 text-primary">
                    <Crown className="h-5 w-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">RTM Membership</span>
                  </div>
                  <h2 className="mt-3 text-3xl font-black md:text-4xl">The foundation for everything</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    {COMPLIANCE_COPY.membership} Unlock member pricing on grant packages and the full GrantPilot
                    workspace.
                  </p>
                </div>

                <Card className="border-2 border-primary/30 shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between gap-4">
                      <CardTitle className="text-2xl font-black">Annual membership</CardTitle>
                      <Badge variant="secondary" className="shrink-0">Best value</Badge>
                    </div>
                    <CardDescription>Everything most members need for one year</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-primary">$100</span>
                      <span className="text-muted-foreground">/ year CAD</span>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {membershipFeatures.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Check className="h-3 w-3 text-primary" />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3 sm:flex-row">
                    <Button size="lg" className="w-full sm:flex-1" onClick={() => openMembershipJoin({ returnUrl })}>
                      Join now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button size="lg" variant="outline" className="w-full sm:flex-1" asChild>
                      <Link to="/membership">Full membership details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </section>

          {/* Grant packages */}
          <section id="grants" className="py-16 md:py-20">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 text-primary">
                  <Rocket className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Grant advisory</span>
                </div>
                <h2 className="mt-3 text-3xl font-black md:text-4xl">Advisor packages</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Paid support for Canadian grant research and application prep. Active members save{" "}
                  <strong className="text-foreground">50%</strong> on every tier.
                </p>
              </div>

              <GrantAdvisoryDisclaimer variant="slim" className="mt-6 max-w-4xl" />

              {!memberActive && (
                <div className="mt-6 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    <Lock className="mr-2 inline h-4 w-4 text-primary" />
                    List prices shown. Join RTM to unlock member rates automatically at checkout.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => openMembershipJoin({ returnUrl })}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Unlock member pricing
                  </Button>
                </div>
              )}

              <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {GRANT_PACKAGES.map((pkg) => (
                  <GrantPackageCard
                    key={pkg.id}
                    packageId={pkg.id}
                    name={pkg.name}
                    listPrice={pkg.listPrice}
                    memberPrice={pkg.memberPrice}
                    description={pkg.description}
                    highlights={pkg.highlights}
                    memberActive={memberActive}
                    popular={pkg.id === "true-north-standard"}
                    onBuy={handleBuyPackage}
                  />
                ))}
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Browse 217+ programs first on{" "}
                <Link to="/grants" className="font-medium text-primary hover:underline">
                  /grants
                </Link>
                . Checkout completes securely via Stripe on the grants workspace.
              </p>
            </div>
          </section>

          {/* Free + Business */}
          <section className="border-t border-border/60 bg-muted/30 py-16 md:py-20">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="grid gap-8 md:grid-cols-2">
                <Card className="border-border/70">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="h-5 w-5" />
                      <span className="text-sm font-bold uppercase tracking-wider">Free</span>
                    </div>
                    <CardTitle className="text-2xl">Explore before you join</CardTitle>
                    <CardDescription>No credit card required</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-black">$0</p>
                    <ul className="mt-6 space-y-2">
                      {freeFeatures.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="gap-2 flex-wrap">
                    <Button variant="outline" asChild>
                      <Link to="/directory">Browse directory</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/grants">View grants</Link>
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="border-border/70">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Store className="h-5 w-5" />
                      <span className="text-sm font-bold uppercase tracking-wider">Businesses</span>
                    </div>
                    <CardTitle className="text-2xl">List your business</CardTitle>
                    <CardDescription>For merchants and service providers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-black">
                      Free<span className="text-lg font-normal text-muted-foreground"> basic listing</span>
                    </p>
                    <ul className="mt-6 space-y-2">
                      {businessFeatures.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="gap-2 flex-wrap">
                    <Button asChild>
                      <Link to="/directory">Start listing</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/contact">Featured placement</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </section>

          {/* Growth Services */}
          <section className="border-t border-border/60 py-16 md:py-20">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-2 text-[#cc0000]">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Grow My Business</span>
                  </div>
                  <h2 className="mt-2 text-3xl font-black">RTM Growth packages</h2>
                  <p className="mt-2 text-muted-foreground max-w-2xl">
                    Monthly subscriptions on grow.rtmbusinessdirectory.com. Members save ~30% on all tiers.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <a href={getGrowPortalUrl("/packages")}>View on Growth portal →</a>
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {GROWTH_PACKAGES.filter((p) => p.subscription).map((pkg) => {
                  const price = getGrowthMonthlyPrice(pkg, memberActive);
                  return (
                    <Card key={pkg.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        <CardDescription>{pkg.tagline}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {price != null && formatGrowthPrice(price)}
                          <span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </p>
                        {memberActive && pkg.monthlyPrice != null && (
                          <p className="text-xs text-muted-foreground line-through mt-1">
                            {formatGrowthPrice(pkg.monthlyPrice)} list
                          </p>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full" size="sm" asChild>
                          <a href={getGrowPortalUrl(`/packages?start=${pkg.id}`)}>Subscribe</a>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Comparison strip */}
          <section className="py-12">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="overflow-x-auto rounded-2xl border border-border/70 bg-background shadow-sm">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="p-4 font-semibold">Feature</th>
                      <th className="p-4 font-semibold">Free</th>
                      <th className="p-4 font-semibold text-primary">Member ($100/yr)</th>
                      <th className="p-4 font-semibold">Grant packages</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {[
                      ["Directory & deals browse", "✓", "✓", "—"],
                      ["Grant catalog (217+ programs)", "Browse", "Full workspace", "Advisor-led"],
                      ["Member discounts", "—", "✓", "—"],
                      ["Grant package pricing", "List price", "50% off", "Per package"],
                      ["Application prep & review", "—", "—", "✓"],
                      ["Community fund (after 90 days)", "—", "✓", "—"],
                    ].map(([feature, free, member, grants]) => (
                      <tr key={feature}>
                        <td className="p-4 font-medium">{feature}</td>
                        <td className="p-4 text-muted-foreground">{free}</td>
                        <td className="p-4 text-foreground">{member}</td>
                        <td className="p-4 text-muted-foreground">{grants}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="border-t border-border/60 py-16 md:py-20">
            <div className="container mx-auto max-w-[800px] px-6">
              <div className="flex items-center gap-2 text-primary">
                <HelpCircle className="h-5 w-5" />
                <h2 className="text-2xl font-black">Pricing FAQ</h2>
              </div>
              <div className="mt-8 space-y-3">
                {faqs.map((item, i) => (
                  <div key={item.q} className="rounded-xl border border-border/70 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-muted/40"
                    >
                      <span className="font-medium">{item.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                          openFaq === i ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openFaq === i && (
                      <p className="border-t border-border/60 px-4 pb-4 pt-3 text-sm text-muted-foreground leading-relaxed">
                        {item.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Questions?{" "}
                <Link to="/contact" className="font-medium text-primary hover:underline">
                  Contact RTM
                </Link>{" "}
                ·{" "}
                <Link to="/terms" className="font-medium text-primary hover:underline">
                  Refund policy in Terms
                </Link>
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[#06233f] py-16 text-white">
            <div className="container mx-auto max-w-[1280px] px-6 text-center">
              <Building2 className="mx-auto h-10 w-10 text-[#97c93d]" />
              <h2 className="mt-4 text-3xl font-black md:text-4xl">Ready to get started?</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/75">
                Join {MEMBERSHIP_PRICE_LABEL} for member savings and grant workspace access, or browse programs free
                on the grant catalog.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button variant="heroWhite" size="xl" onClick={() => openMembershipJoin({ returnUrl })}>
                  Join RTM
                </Button>
                <Button variant="heroOutline" size="xl" asChild>
                  <Link to="/grants">Explore grants</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Pricing;
