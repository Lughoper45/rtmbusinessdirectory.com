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
import { AFFILIATE_DIRECT_COMMISSION_LABEL, COMPLIANCE_COPY, DISCOUNT_RANGE_LABEL, MEMBERSHIP_PRICE_LABEL } from "@/content/siteCopy";

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
  { value: "30%", label: "Direct commission" },
  { value: "$100", label: "Annual membership" },
  { value: DISCOUNT_RANGE_LABEL, label: "Member discounts" },
];

const affiliateBenefits = [
  "Share RTM with people who would benefit from the directory, member savings, and local business discovery.",
  `Earn ${AFFILIATE_DIRECT_COMMISSION_LABEL} on qualified new members you directly refer.`,
  "Keep the message savings-first so the program does not become income-first.",
  "Use your dashboard to track referral codes, pending value, and paid commission.",
];

const audiences = [
  {
    title: "Affiliate partners",
    description: "People who can introduce RTM membership and business enrollment to their local network.",
  },
  {
    title: "Business partners",
    description: "Local operators who want more visibility while supporting customers through RTM discounts.",
  },
  {
    title: "Community builders",
    description: "Members who believe local commerce grows faster when customers, businesses, and partners work together.",
  },
];

const steps = [
  {
    title: "Join RTM",
    description: `Become an RTM member for ${MEMBERSHIP_PRICE_LABEL} and unlock the same customer benefits you promote.`,
  },
  {
    title: "Share the program",
    description: "Invite customers, members, and businesses into the RTM Business Directory community.",
  },
  {
    title: "Enroll new members",
    description: "Help people save 5% to 50% at participating businesses and support local commerce.",
  },
  {
    title: "Earn 30%",
    description: "Receive commission on tracked qualified members you directly refer into RTM.",
  },
];

const faqs = [
  {
    question: "Who is the RTM affiliate program for?",
    answer:
      "It is for affiliates, business partners, local connectors, and community builders who can help RTM reach more members and businesses.",
  },
  {
    question: "What do I actually earn?",
    answer:
      "The flyer offer is 30% commission paid on every new member you refer and every business you enroll in the RTM Business Directory Discount Program.",
  },
  {
    question: "What does a member receive?",
    answer:
      "Members pay $100/year and unlock exclusive discounts, mutual aid access after 90 days of active membership, and a community focused on local savings.",
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
        <title>RTM Affiliate Program | Optional Referral Earnings</title>
        <meta
          name="description"
          content="Become an RTM Affiliate, share a savings-first membership, and track optional direct referral commission."
        />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <Navbar />

        <main>
          <section className="relative overflow-hidden bg-[#06233f] text-white">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(143,190,58,0.2),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.24))]" />
            <div className="container relative z-10 mx-auto max-w-[1280px] px-6 py-16 md:py-24">
              <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="max-w-3xl">
                  <Badge className="border-[#97c93d]/40 bg-[#97c93d] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#06233f]">
                    <Sparkles className="mr-2 h-4 w-4" />
                    For affiliates & business partners
                  </Badge>
                  <h1 className="mt-6 text-4xl font-black leading-[1.03] tracking-tight md:text-6xl">
                    Earn direct commission by sharing RTM responsibly.
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
                    Share RTM with people who would benefit from local business discovery and member savings. Earn 30% direct commission on qualified new members you refer.
                  </p>
                  <p className="mt-4 max-w-2xl text-base font-semibold text-[#b4df55] md:text-lg">
                    The program works best when savings and local value come first. Referral income is optional.
                  </p>

                  <div className="mt-10 grid gap-4 sm:grid-cols-3">
                    {proofStats.map((item) => (
                      <div key={item.label} className="rounded-lg border border-white/12 bg-white/10 px-5 py-5 backdrop-blur">
                        <div className="text-3xl font-black text-[#b4df55]">{item.value}</div>
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
                        View $100 Membership
                      </Button>
                    )}
                  </div>

                  <p className="mt-5 text-sm text-white/65">
                    {SITE_CONTACT.officeLabel}: {SITE_CONTACT.officeAddress}
                  </p>
                </div>

                <div className="overflow-hidden rounded-lg border border-white/15 bg-white p-2 shadow-heavy">
                  <img
                    src="/affiliate-flyer.jpeg"
                    alt="Join RTM Business Directory affiliate and membership flyer"
                    className="max-h-[760px] w-full object-contain"
                  />
                </div>
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
                  Share RTM with clear expectations.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  The affiliate page explains earnings clearly while keeping the main RTM promise focused on directory discovery and member savings.
                </p>
              </div>

              <div className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <Card className="border-primary/20 bg-primary/5 shadow-medium">
                  <CardHeader>
                    <CardTitle className="text-2xl">What you share</CardTitle>
                    <CardDescription>A {MEMBERSHIP_PRICE_LABEL} membership with discounts, aid eligibility after 90 days, and a community-first business directory.</CardDescription>
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
                      Earn while helping RTM grow stronger together.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 text-white/80">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center gap-3 text-lg font-semibold text-white">
                        <Rocket className="h-5 w-5 text-emerald-300" />
                        A new member joins
                      </div>
                      <p className="mt-2 text-sm">
                        Members pay $100/year to unlock exclusive discounts, community impact, and mutual aid access after 90 active days.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center gap-3 text-lg font-semibold text-white">
                        <ShieldCheck className="h-5 w-5 text-emerald-300" />
                        A business joins the discount program
                      </div>
                      <p className="mt-2 text-sm">
                        Businesses gain directory visibility and a reason for RTM members to discover, visit, and support them.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center gap-3 text-lg font-semibold text-white">
                        <Globe2 className="h-5 w-5 text-emerald-300" />
                        You strengthen the network
                      </div>
                      <p className="mt-2 text-sm">
                        Affiliates earn direct commission while RTM keeps the public message focused on real savings and local business discovery.
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
              <p className="mx-auto mt-3 max-w-3xl text-sm text-white/75">
                {COMPLIANCE_COPY.affiliate}
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
