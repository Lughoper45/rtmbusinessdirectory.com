import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Globe, Rocket, ShieldCheck, TrendingUp, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import GrowNavbar from "@/components/grow/GrowNavbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import GrowthAuditDialog from "@/components/growth/GrowthAuditDialog";
import GrowPackageActions from "@/components/grow/GrowPackageActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GROWTH_PACKAGES,
  GROWTH_SERVICES,
  GROWTH_DISCLAIMER,
  formatGrowthPrice,
  getGrowthMonthlyPrice,
  type GrowthPackageId,
} from "@/lib/growthPackages";
import { isGrowSurface } from "@/lib/appSurface";
import { getGrantsPortalUrl, openMembershipJoin } from "@/lib/site";
import { fetchPlatformMembership } from "@/services/membership";
import { supabase } from "@/integrations/supabase/client";

const journey = [
  { stage: "Entry", visibility: "Invisible online", sales: "Visible, not converting", scale: "Manual, no systems" },
  { stage: "RTM delivers", visibility: "GBP, website, social, directory", sales: "WhatsApp CRM, SEO, booking", scale: "AI bot, ads, full CRM" },
  { stage: "Outcome", visibility: "Customers find you", sales: "Leads captured & followed up", scale: "Less manual work, more growth" },
  { stage: "Package", visibility: "Visibility Starter", sales: "Sales Engine", scale: "Growth OS" },
];

const faqs = [
  {
    q: "Is RTM a government program?",
    a: "No. RTM Growth Services is a private Canadian business advisory division. We help you prepare for grants and digital adoption programs but do not disburse public funds.",
  },
  {
    q: "Can RTM find grants that pay for these services?",
    a: "Yes — as an RTM member you can use GrantPilot to explore programs that may fund digital marketing, websites, and training. Grant approval is always decided by the program administrator.",
  },
  {
    q: "Do I need RTM membership?",
    a: "Packages are available to all businesses. Membership ($100/year) unlocks community pricing on grant packages and positions you for member benefits on growth services as we roll them out.",
  },
  {
    q: "How fast can we start?",
    a: "After your free growth audit, Visibility Starter clients typically begin within one week. Complex builds (apps, Growth OS) are scoped with a written timeline.",
  },
];

export default function Grow() {
  const onGrowHost = isGrowSurface();
  const TopNav = onGrowHost ? GrowNavbar : Navbar;
  const [auditPackage, setAuditPackage] = useState<string | undefined>();
  const [memberActive, setMemberActive] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const m = await fetchPlatformMembership(user.id, user.email ?? undefined);
      setMemberActive(m.active);
    })();
  }, []);

  const openAuditForPackage = (packageId: GrowthPackageId) => {
    setAuditPackage(packageId);
    document.getElementById("growth-audit-cta")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Helmet>
        <title>RTM Growth Services — Grow My Business | Canadian SME Digital Marketing</title>
        <meta
          name="description"
          content="Digital marketing, websites, WhatsApp CRM, AI chatbots, and local SEO for Canadian small businesses. Free growth audit from RTM Business Directory."
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <TopNav />
        {!onGrowHost && <ParticleBackground />}

        <section className="relative pt-28 pb-16 md:pt-32 md:pb-24">
          <div className="container mx-auto max-w-[1280px] px-6 text-center">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10">
              Grow My Business — Pillar III
            </Badge>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground max-w-4xl mx-auto"
            >
              Get visible online. Sell more. Scale smarter.
            </motion.h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              RTM Growth Services helps Canadian small businesses with digital marketing, websites,
              WhatsApp CRM, AI chatbots, and sales systems — at prices main street can afford.
            </p>
            <div id="growth-audit-cta" className="mt-10 flex flex-wrap justify-center gap-4">
              <GrowthAuditDialog defaultPackage={auditPackage} />
              <Button variant="outline" size="lg" asChild>
                <Link to={onGrowHost ? "/packages" : "/pricing"}>View packages</Link>
              </Button>
              {onGrowHost && (
                <Button variant="outline" size="lg" asChild>
                  <Link to="/workspace">My workspace</Link>
                </Button>
              )}
            </div>
            <p className="mt-6 text-xs text-muted-foreground max-w-xl mx-auto">{GROWTH_DISCLAIMER}</p>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto max-w-[1280px] px-6">
            <h2 className="text-3xl font-bold text-center mb-4">Growth packages</h2>
            <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
              Tell us your problem — we match the package. Monthly billing keeps entry accessible for
              immigrant-owned and multicultural SMEs.
              {memberActive && (
                <span className="block mt-2 text-emerald-600 font-medium">RTM member pricing applied</span>
              )}
            </p>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
              {GROWTH_PACKAGES.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`flex flex-col ${pkg.popular ? "border-primary ring-2 ring-primary/20" : ""}`}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most popular</Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{pkg.name}</CardTitle>
                    <CardDescription className="font-medium text-primary">{pkg.tagline}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-2xl font-bold mb-1">
                      {getGrowthMonthlyPrice(pkg, memberActive) != null ? (
                        <>
                          {formatGrowthPrice(getGrowthMonthlyPrice(pkg, memberActive)!)}
                          <span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </>
                      ) : (
                        <span className="text-lg">{pkg.priceNote}</span>
                      )}
                    </p>
                    {memberActive && pkg.monthlyPrice != null && pkg.monthlyPriceMember != null && (
                      <p className="text-xs text-muted-foreground line-through">
                        {formatGrowthPrice(pkg.monthlyPrice)}/mo list
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                    <ul className="text-sm space-y-2">
                      {pkg.highlights.slice(0, 5).map((h) => (
                        <li key={h} className="flex gap-2">
                          <span className="text-emerald-500 shrink-0">✓</span>
                          <span>{h}</span>
                        </li>
                      ))}
                      {pkg.highlights.length > 5 && (
                        <li className="text-muted-foreground text-xs">+ {pkg.highlights.length - 5} more</li>
                      )}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <GrowPackageActions packageId={pkg.id} memberActive={memberActive} className="w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto max-w-[1280px] px-6">
            <h2 className="text-3xl font-bold text-center mb-10">Your growth path</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="p-3 text-left font-semibold">Stage</th>
                    <th className="p-3 text-left">Visibility</th>
                    <th className="p-3 text-left">Sales</th>
                    <th className="p-3 text-left">Scale</th>
                  </tr>
                </thead>
                <tbody>
                  {journey.map((row) => (
                    <tr key={row.stage} className="border-t">
                      <td className="p-3 font-medium">{row.stage}</td>
                      <td className="p-3 text-muted-foreground">{row.visibility}</td>
                      <td className="p-3 text-muted-foreground">{row.sales}</td>
                      <td className="p-3 text-muted-foreground">{row.scale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto max-w-[1280px] px-6">
            <h2 className="text-3xl font-bold text-center mb-8">12 growth services</h2>
            <Tabs defaultValue="flagship">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
                <TabsTrigger value="flagship">Flagship</TabsTrigger>
                <TabsTrigger value="core">Core</TabsTrigger>
                <TabsTrigger value="specialist">Specialist</TabsTrigger>
              </TabsList>
              {(["flagship", "core", "specialist"] as const).map((tier) => (
                <TabsContent key={tier} value={tier}>
                  <div className="grid md:grid-cols-2 gap-4">
                    {GROWTH_SERVICES.filter((s) => s.tier === tier).map((s) => (
                      <Card key={s.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span>{s.icon}</span>
                            {s.name}
                          </CardTitle>
                          <CardDescription>{s.summary}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                          <p>
                            <strong className="text-foreground">Who:</strong> {s.audience}
                          </p>
                          <p>
                            <strong className="text-foreground">Pricing:</strong> {s.pricing}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto max-w-[1280px] px-6">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Globe, title: "Directory", desc: "Get found on RTM + Google", href: "https://rtmbusinessdirectory.com/directory" },
                { icon: Rocket, title: "Grants", desc: "Fund your digital spend", href: getGrantsPortalUrl("/grants") },
                { icon: TrendingUp, title: "Growth", desc: "Execute with RTM advisors", to: onGrowHost ? "/packages" : "/packages" },
              ].map((item) => (
                <Card key={item.title} className="text-center p-6">
                  <item.icon className="h-10 w-10 mx-auto text-primary mb-4" />
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 mb-4">{item.desc}</p>
                  <Button variant="link" asChild>
                    {"href" in item && item.href ? (
                      <a href={item.href}>
                        Explore <ArrowRight className="h-4 w-4 ml-1" />
                      </a>
                    ) : (
                      <Link to={item.to!}>
                        Explore <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    )}
                  </Button>
                </Card>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8 max-w-3xl mx-auto">
              RTM is building recognition as a private partner for Canadian SME digital adoption — alongside
              directories, chambers, and future federal advisor programs. We are not a government agency.
            </p>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto max-w-3xl px-6">
            <h2 className="text-2xl font-bold text-center mb-8">FAQ</h2>
            <div className="space-y-4">
              {faqs.map((f) => (
                <Card key={f.q}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{f.q}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{f.a}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto max-w-[1280px] px-6 text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-primary mb-4" />
            <h2 className="text-3xl font-bold">Start with a free growth audit</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              No obligation. An RTM advisor reviews your digital presence and recommends Visibility,
              Sales, or Scale — often with grant options that may offset cost.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <GrowthAuditDialog />
              <Button variant="outline" onClick={() => openMembershipJoin()}>
                <Users className="h-4 w-4 mr-2" />
                Join RTM membership
              </Button>
            </div>
          </div>
        </section>

        {!onGrowHost && <Footer />}
        {onGrowHost && (
          <footer className="border-t py-8 text-center text-sm text-muted-foreground">
            <p>RTM Growth Services · Private Canadian SME advisory</p>
            <p className="mt-2">
              <a href={getGrantsPortalUrl("/grants")} className="text-primary hover:underline">
                Grants
              </a>
              {" · "}
              <a href="https://rtmbusinessdirectory.com" className="text-primary hover:underline">
                Directory
              </a>
            </p>
          </footer>
        )}
      </div>
    </>
  );
}
