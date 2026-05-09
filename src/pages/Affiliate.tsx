import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight,
  BadgeDollarSign,
  Check,
  ClipboardCopy,
  Globe2,
  HandCoins,
  Link2,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SITE_CONTACT } from "@/lib/site";

interface AffiliateSummary {
  id: string;
  referral_code: string;
  total_earnings: number;
  commission_rate: number;
  status: string;
}

interface AffiliateReferral {
  id: string;
  membership_tier: string | null;
  commission_amount: number | null;
  commission_paid: boolean;
  created_at: string;
}

const proofStats = [
  { value: "$30", label: "Direct member referral" },
  { value: "$10", label: "Second-level, year 1 only" },
  { value: "1 link", label: "Personal referral link" },
];

const affiliateBenefits = [
  "Tell people about real discounts at real local stores.",
  "Share one personal link by text, WhatsApp, Instagram, or in person.",
  "Earn $30 when someone joins through your link.",
  "Keep the message honest: no quotas, no pressure, and no guaranteed income.",
];

const audiences = [
  {
    title: "Community organizers",
    description: "People who already talk to neighbours, local groups, and families who need practical savings.",
  },
  {
    title: "Church and group leaders",
    description: "Trusted local voices who can explain RTM without turning it into a hard sales pitch.",
  },
  {
    title: "Small business owners",
    description: "People who already meet local customers and can recommend a discount card they believe is worth $100.",
  },
];

const steps = [
  {
    title: "Join as a member",
    description: "You sign up for the same $100 RTM membership and get the same benefits.",
  },
  {
    title: "Get your link",
    description: "Your personal referral link is tied to your account so referrals can be tracked.",
  },
  {
    title: "Share naturally",
    description: "Send it by text, WhatsApp, Instagram, or in person.",
  },
  {
    title: "Earn when they join",
    description: "Every person who joins through your link earns you $30.",
  },
];

const faqs = [
  {
    question: "Who is the RTM affiliate program for?",
    answer:
      "It works best for community organizers, church groups, neighbourhood leaders, small business owners, and people who already talk to a lot of locals.",
  },
  {
    question: "What do I actually earn?",
    answer:
      "You earn $30 when someone joins through your link, $10 when someone they refer joins during year 1, and 30% when a business signs up through you.",
  },
  {
    question: "Is income guaranteed?",
    answer:
      "No. Most affiliates may earn $0-$300/month. Some active affiliates can earn more, but RTM does not guarantee income.",
  },
  {
    question: "Where is RTM based?",
    answer: `${SITE_CONTACT.officeLabel}: ${SITE_CONTACT.officeAddress}`,
  },
];

const Affiliate = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateSummary | null>(null);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [isCreatingAffiliate, setIsCreatingAffiliate] = useState(false);

  useEffect(() => {
    void loadPage();
  }, []);

  const loadPage = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (!currentUser) {
      return;
    }

    const { data: affiliateData } = await supabase
      .from("affiliates")
      .select("id, referral_code, total_earnings, commission_rate, status")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    setAffiliate(affiliateData);

    if (affiliateData?.id) {
      const { data: referralData } = await supabase
        .from("affiliate_referrals")
        .select("id, membership_tier, commission_amount, commission_paid, created_at")
        .eq("affiliate_id", affiliateData.id)
        .order("created_at", { ascending: false })
        .limit(8);

      setReferrals(referralData ?? []);
    }
  };

  const paidReferrals = useMemo(
    () => referrals.filter((referral) => referral.commission_paid).length,
    [referrals],
  );

  const pendingValue = useMemo(
    () =>
      referrals
        .filter((referral) => !referral.commission_paid)
        .reduce((sum, referral) => sum + (referral.commission_amount ?? 0), 0),
    [referrals],
  );

  const paidValue = useMemo(
    () =>
      referrals
        .filter((referral) => referral.commission_paid)
        .reduce((sum, referral) => sum + (referral.commission_amount ?? 0), 0),
    [referrals],
  );

  const shareUrl = affiliate?.referral_code ? `${window.location.origin}/ref/${affiliate.referral_code}` : null;

  const handleCopyLink = async () => {
    if (!shareUrl) {
      toast.error("Referral code not available yet.");
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    toast.success("Referral link copied.");
  };

  const handleCreateAffiliate = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      setIsCreatingAffiliate(true);
      const base = (user.email?.split("@")[0] || "rtm").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
      const referralCode = `${base}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const { data, error } = await supabase
        .from("affiliates")
        .insert({
          user_id: user.id,
          referral_code: referralCode,
          commission_rate: 30,
          total_earnings: 0,
          status: "active",
        })
        .select("id, referral_code, total_earnings, commission_rate, status")
        .single();

      if (error) throw error;

      setAffiliate(data);
      toast.success("Affiliate account activated.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to activate affiliate account.");
    } finally {
      setIsCreatingAffiliate(false);
    }
  };

  const dashboardCards = [
    { icon: HandCoins, label: "Commission rate", value: `${affiliate?.commission_rate ?? 30}%` },
    { icon: TrendingUp, label: "Lifetime earnings", value: `$${(affiliate?.total_earnings ?? 0).toFixed(2)}` },
    { icon: Target, label: "Pending value", value: `$${pendingValue.toFixed(2)}` },
    { icon: BadgeDollarSign, label: "Paid commission", value: `$${paidValue.toFixed(2)}` },
  ];

  return (
    <>
      <Helmet>
        <title>RTM Affiliate Program | Earn With Referrals</title>
        <meta
          name="description"
          content="Become an RTM Affiliate, share your personal link, and earn $30 when someone joins RTM through your referral."
        />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <Navbar />

        <main>
          <section className="relative overflow-hidden bg-[linear-gradient(135deg,hsl(152_69%_20%)_0%,hsl(222_47%_11%)_55%,hsl(352_82%_49%)_140%)] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.18),transparent_26%)]" />
            <div className="container relative z-10 mx-auto max-w-[1280px] px-6 py-16 md:py-24">
              <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="max-w-3xl">
                  <Badge className="border-white/15 bg-white/10 text-white">
                    <Sparkles className="mr-2 h-4 w-4" />
                    RTM affiliate program
                  </Badge>
                  <h1 className="mt-6 text-4xl font-black leading-[1.03] tracking-tight md:text-6xl">
                    Earn $30 every time you help someone join RTM.
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
                    No sales pitch needed. You are just telling people about real discounts at real local stores.
                  </p>

                  <div className="mt-10 grid gap-4 sm:grid-cols-3">
                    {proofStats.map((item) => (
                      <div key={item.label} className="rounded-3xl border border-white/12 bg-white/10 px-5 py-5 backdrop-blur">
                        <div className="text-3xl font-black text-emerald-300">{item.value}</div>
                        <div className="mt-1 text-sm uppercase tracking-[0.16em] text-white/65">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                    <Button variant="heroWhite" size="xl" asChild>
                      <Link to={user ? "/dashboard" : "/auth"}>
                        {user ? "Open Dashboard" : "Sign In to Start"}
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                    {user && !affiliate ? (
                      <Button variant="heroOutline" size="xl" onClick={() => void handleCreateAffiliate()} disabled={isCreatingAffiliate}>
                        {isCreatingAffiliate ? "Activating..." : "Activate Affiliate Account"}
                      </Button>
                    ) : (
                      <Button variant="heroOutline" size="xl" onClick={() => navigate("/membership")}>
                        See Membership
                      </Button>
                    )}
                  </div>

                  <p className="mt-5 text-sm text-white/65">
                    {SITE_CONTACT.officeLabel}: {SITE_CONTACT.officeAddress}
                  </p>
                </div>

                <Card className="overflow-hidden border-white/10 bg-white/95 text-foreground shadow-heavy">
                  <CardHeader className="border-b border-border/60 pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Link2 className="h-5 w-5 text-primary" />
                      Affiliate snapshot
                    </CardTitle>
                    <CardDescription>Your live referral position inside RTM.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-muted/50 p-4">
                        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Status</div>
                        <div className="mt-2 text-2xl font-black">{affiliate?.status ?? "Not active yet"}</div>
                      </div>
                      <div className="rounded-2xl bg-muted/50 p-4">
                        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Referral code</div>
                        <div className="mt-2 text-2xl font-black">{affiliate?.referral_code ?? "Pending"}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-muted/50 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Shareable affiliate link</div>
                      <div className="mt-2 break-all text-sm font-medium text-foreground">
                        {shareUrl ?? "Available immediately after affiliate activation"}
                      </div>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <Button variant="outline" onClick={() => void handleCopyLink()} disabled={!shareUrl}>
                          <ClipboardCopy className="h-4 w-4" />
                          Copy referral link
                        </Button>
                        {!affiliate ? (
                          <Button variant="hero" onClick={() => void handleCreateAffiliate()} disabled={isCreatingAffiliate}>
                            {isCreatingAffiliate ? "Activating..." : "Activate now"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="bg-zinc-950 py-10 text-white">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {dashboardCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div key={card.label} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <Icon className="h-7 w-7 text-emerald-300" />
                      <div className="mt-4 text-sm uppercase tracking-[0.14em] text-white/55">{card.label}</div>
                      <div className="mt-2 text-3xl font-black">{card.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="bg-stone-50 py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  What you actually earn
                </Badge>
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                  Simple commissions, clear limits, no income promises
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Most affiliates earn $0-$300/month. A few active ones do more. There is no guarantee. We say this clearly because trust matters more than hype.
                </p>
              </div>

              <div className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <Card className="border-primary/20 bg-primary/5 shadow-medium">
                  <CardHeader>
                    <CardTitle className="text-2xl">What you share</CardTitle>
                    <CardDescription>A practical $100 membership with discounts, backup, and optional referral earnings.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      {affiliateBenefits.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-muted-foreground">
                          <div className="mt-0.5 rounded-full bg-primary/10 p-1 text-primary">
                            <Check className="h-4 w-4" />
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <div className="grid gap-6 sm:grid-cols-3">
                  {audiences.map((item) => (
                    <Card key={item.title} className="border-border/70 shadow-medium">
                      <CardContent className="p-8">
                        <Users className="h-8 w-8 text-primary" />
                        <h3 className="mt-5 text-2xl font-bold">{item.title}</h3>
                        <p className="mt-3 text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  How it works
                </Badge>
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">How it works</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Join once, get your member card and affiliate link in one step, then share it however you like.
                </p>
              </div>

              <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {steps.map((step, index) => (
                  <Card key={step.title} className="border-border/70 shadow-medium">
                    <CardContent className="p-8">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,hsl(152_69%_45%)_0%,hsl(352_82%_49%)_100%)] text-lg font-black text-white">
                        {index + 1}
                      </div>
                      <h3 className="mt-5 text-2xl font-bold">{step.title}</h3>
                      <p className="mt-3 text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-[linear-gradient(135deg,hsl(222_47%_11%)_0%,hsl(217_33%_17%)_100%)] py-20 text-white md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                <Card className="border-white/10 bg-white/5 text-white shadow-heavy">
                  <CardHeader>
                    <CardTitle className="text-3xl">Affiliate positioning</CardTitle>
                    <CardDescription className="text-white/65">
                      Keep it honest, simple, and local.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 text-white/80">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center gap-3 text-lg font-semibold text-white">
                        <Rocket className="h-5 w-5 text-emerald-300" />
                        Someone joins through your link
                      </div>
                      <p className="mt-2 text-sm">
                        You earn $30 when a new member pays for RTM through your referral link.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center gap-3 text-lg font-semibold text-white">
                        <ShieldCheck className="h-5 w-5 text-emerald-300" />
                        Someone they refer joins
                      </div>
                      <p className="mt-2 text-sm">
                        You earn $10 for second-level referrals in year 1 only. The program stops at two levels by design.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center gap-3 text-lg font-semibold text-white">
                        <Globe2 className="h-5 w-5 text-emerald-300" />
                        A business signs up through you
                      </div>
                      <p className="mt-2 text-sm">
                        You earn 30% of their package when the business signup is tracked to your referral.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6">
                  <Card className="border-white/10 bg-white text-foreground shadow-heavy">
                    <CardHeader>
                      <CardTitle>Recent referral activity</CardTitle>
                      <CardDescription>Latest tracked conversions in the current affiliate data model.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {referrals.length === 0 ? (
                        <div className="rounded-2xl bg-muted/40 p-6 text-sm text-muted-foreground">
                          No referrals have been recorded yet. Share your link after activation to start tracking referrals.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {referrals.map((referral) => (
                            <div key={referral.id} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background p-4">
                              <div>
                                <div className="font-medium text-foreground">{referral.membership_tier ?? "Referral"}</div>
                                <div className="text-sm text-muted-foreground">{new Date(referral.created_at).toLocaleDateString()}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-foreground">${(referral.commission_amount ?? 0).toFixed(2)}</div>
                                <Badge variant={referral.commission_paid ? "default" : "secondary"}>
                                  {referral.commission_paid ? "Paid" : "Pending"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="grid w-full gap-4 rounded-3xl bg-muted/50 p-5 text-sm text-muted-foreground sm:grid-cols-2">
                        <div>
                          <div className="font-semibold text-foreground">Paid referrals</div>
                          <div className="mt-1 text-2xl font-black text-foreground">{paidReferrals}</div>
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">Pending referral value</div>
                          <div className="mt-1 text-2xl font-black text-foreground">${pendingValue.toFixed(2)}</div>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>

                  <Card className="border-primary/15 bg-primary/5 shadow-medium">
                    <CardContent className="flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">
                          {affiliate ? "Your affiliate account is ready to use" : "Activate your affiliate account"}
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                          {affiliate
                            ? "Your next step is sharing your referral link with people who would genuinely benefit from RTM."
                            : "Create your affiliate profile to unlock your referral code, track conversions, and start earning when people join."}
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        {!affiliate ? (
                          <Button variant="hero" size="lg" onClick={() => void handleCreateAffiliate()} disabled={isCreatingAffiliate}>
                            {isCreatingAffiliate ? "Activating..." : "Activate Now"}
                          </Button>
                        ) : (
                          <Button variant="hero" size="lg" onClick={() => void handleCopyLink()}>
                            Copy My Link
                          </Button>
                        )}
                        <Button variant="outline" size="lg" onClick={() => navigate("/membership")}>
                          View Membership Page
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-stone-50 py-20 md:py-24">
            <div className="container mx-auto max-w-[960px] px-6">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  FAQ
                </Badge>
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Affiliate questions people ask before joining</h2>
              </div>

              <div className="mt-12 grid gap-4">
                {faqs.map((item) => (
                  <Card key={item.question} className="border-primary/20 shadow-sm">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-foreground">{item.question}</h3>
                      <p className="mt-3 text-muted-foreground">{item.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-[linear-gradient(135deg,hsl(152_69%_45%)_0%,hsl(352_82%_49%)_100%)] py-20 text-white">
            <div className="container mx-auto max-w-[1280px] px-6 text-center">
              <h2 className="text-3xl font-black tracking-tight md:text-5xl">Become an RTM Affiliate</h2>
              <p className="mx-auto mt-4 max-w-3xl text-lg text-white/85 md:text-xl">
                Join for $100/year. Get your member card and your affiliate link in one step.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Button variant="heroWhite" size="xl" asChild>
                  <Link to={user ? "/dashboard" : "/auth"}>
                    {user ? "Open Dashboard" : "Sign In to Start"}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="heroOutline" size="xl" onClick={() => navigate("/membership")}>
                  Review Membership
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

export default Affiliate;
