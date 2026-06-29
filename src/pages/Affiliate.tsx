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
  KeyRound,
  Megaphone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
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
  { value: "10%", label: "Second-level override" },
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
    icon: Users,
    title: "Affiliate partners",
    description: "People who can introduce RTM membership and business enrollment to their local network.",
  },
  {
    icon: Globe2,
    title: "Business partners",
    description: "Local operators who want more visibility while supporting customers through RTM discounts.",
  },
  {
    icon: ShieldCheck,
    title: "Community builders",
    description: "Members who believe local commerce grows faster when customers, businesses, and partners work together.",
  },
];

const steps = [
  {
    icon: KeyRound,
    title: "Activate Your Code",
    description: "Get your custom affiliate link and real-time dashboard in one click.",
  },
  {
    icon: Megaphone,
    title: "Share & Promote",
    description: "Invite customers, groups, and local businesses to join RTM and start saving.",
  },
  {
    icon: Wallet,
    title: "Watch It Grow",
    description: "Track direct payouts and second-level overrides live from your dashboard.",
  },
];

const faqs = [
  {
    question: "What do I actually earn?",
    answer: `30% direct commission on every new member you refer, plus 10% on second-level referrals your recruits bring in.`,
  },
  {
    question: "Who is this for?",
    answer: "Affiliates, business partners, local connectors, and community builders who can help RTM reach more members and businesses.",
  },
  {
    question: "What does a member receive?",
    answer: `Members pay ${MEMBERSHIP_PRICE_LABEL} and unlock exclusive 5-50% local discounts, mutual aid access after 90 days, and a community focused on local savings.`,
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
  const [calculatorMembers, setCalculatorMembers] = useState(25);

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

  const estimatedEarnings = calculatorMembers * 30;

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
        <title>RTM Affiliate Program | Earn 30% Recurring Commission</title>
        <meta
          name="description"
          content="Earn 30% recurring commission sharing RTM memberships. Promote local savings, track earnings live, and help your community grow."
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
                    Partner program
                  </Badge>
                  <h1 className="mt-6 text-4xl font-black leading-[1.03] tracking-tight md:text-6xl">
                    Earn 30% recurring commission helping local businesses grow
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
                    Turn your network into a revenue stream. Promote RTM memberships, unlock 5-50% savings for others, and keep 30% of every signup — plus 10% on second-level referrals.
                  </p>

                  <div className="mt-10 grid gap-4 sm:grid-cols-4">
                    {proofStats.map((item) => (
                      <div key={item.label} className="rounded-lg border border-white/12 bg-white/10 px-4 py-5 backdrop-blur">
                        <div className="text-3xl font-black text-[#b4df55]">{item.value}</div>
                        <div className="mt-1 text-sm uppercase tracking-[0.16em] text-white/65">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                    <Button variant="heroWhite" size="xl" asChild>
                      <Link to={user ? "/dashboard" : "/auth"}>
                        Become an RTM Partner
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

          <section className="bg-stone-50 py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  Payout structure
                </Badge>
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                  Three ways you earn
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  A multi-tiered recurring revenue model built around local business savings.
                </p>
              </div>

              <div className="mt-12 grid gap-6 md:grid-cols-3">
                <Card className="border-primary/20 bg-primary/5 shadow-medium">
                  <CardContent className="p-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-3xl font-black text-primary">30%</span>
                    </div>
                    <h3 className="mt-5 text-2xl font-bold">Direct commission</h3>
                    <p className="mt-3 text-muted-foreground">
                      Earned on every direct member signup you refer. Recurring on renewals.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/5 shadow-medium">
                  <CardContent className="p-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-3xl font-black text-primary">10%</span>
                    </div>
                    <h3 className="mt-5 text-2xl font-bold">Second-level override</h3>
                    <p className="mt-3 text-muted-foreground">
                      Earned when your referrals bring in new members — commission on their referrals too.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/5 shadow-medium">
                  <CardContent className="p-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-3xl font-black text-primary">70%</span>
                    </div>
                    <h3 className="mt-5 text-2xl font-bold">Community pool</h3>
                    <p className="mt-3 text-muted-foreground">
                      Membership revenue feeds the Member Benefit Pool — perfect for churches and community groups.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  How it works
                </Badge>
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Your path to recurring earnings</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Join once, get your member card and affiliate link, then share it however you like.
                </p>
              </div>

              <div className="mt-12 grid gap-8 md:grid-cols-3">
                {steps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <div key={step.title} className="relative text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,hsl(152_69%_45%)_0%,hsl(352_82%_49%)_100%)] text-white shadow-lg">
                        <Icon className="h-7 w-7" />
                      </div>
                      {index < steps.length - 1 && (
                        <div className="absolute left-[calc(50%+40px)] top-8 hidden h-0.5 w-[calc(100%-80px)] bg-gradient-to-r from-emerald-500 to-rose-500 md:block" />
                      )}
                      <h3 className="mt-6 text-2xl font-bold">{step.title}</h3>
                      <p className="mt-3 text-muted-foreground">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="bg-[linear-gradient(135deg,hsl(222_47%_11%)_0%,hsl(217_33%_17%)_100%)] py-20 text-white md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="mx-auto max-w-3xl text-center">
                <Badge className="border-[#97c93d]/40 bg-[#97c93d] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#06233f]">
                  <Wallet className="mr-2 h-4 w-4" />
                  Earnings calculator
                </Badge>
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                  See what you could earn
                </h2>
                <p className="mt-4 text-lg text-white/80">
                  Slide to estimate your annual commission based on members referred.
                </p>
              </div>

              <div className="mx-auto mt-12 max-w-2xl">
                <Card className="border-white/10 bg-white/5 text-white shadow-heavy">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <div className="text-sm uppercase tracking-[0.14em] text-white/55">Members referred</div>
                      <div className="mt-2 text-6xl font-black text-[#b4df55]">{calculatorMembers}</div>
                    </div>
                    <div className="mt-8">
                      <input
                        type="range"
                        min={1}
                        max={200}
                        value={calculatorMembers}
                        onChange={(e) => setCalculatorMembers(Number(e.target.value))}
                        className="w-full cursor-pointer accent-[#97c93d]"
                      />
                      <div className="mt-2 flex justify-between text-sm text-white/55">
                        <span>1</span>
                        <span>50</span>
                        <span>100</span>
                        <span>150</span>
                        <span>200</span>
                      </div>
                    </div>
                    <div className="mt-8 rounded-3xl border border-[#97c93d]/30 bg-[#97c93d]/10 p-6 text-center">
                      <div className="text-sm uppercase tracking-[0.14em] text-[#b4df55]">Your annual direct earnings</div>
                      <div className="mt-2 text-5xl font-black text-white">
                        ${estimatedEarnings.toLocaleString()}
                      </div>
                      <p className="mt-2 text-sm text-white/60">
                        Based on 30% commission of ${MEMBERSHIP_PRICE_LABEL} per member
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="bg-stone-50 py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                    For organizations
                  </Badge>
                  <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                    Built for churches, non-profits & community leaders
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground">
                    Looking for a sustainable way to fundraise? Drive signups through your organization to unlock reliable, recurring commissions while helping your members save on everyday local expenses.
                  </p>
                  <ul className="mt-8 space-y-4">
                    {[
                      "70% of membership revenue feeds your community benefit pool",
                      "Recurring commissions support ongoing programs and initiatives",
                      "Members save 5-50% at local businesses year-round",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-muted-foreground">
                        <div className="mt-0.5 rounded-full bg-primary/10 p-1 text-primary">
                          <Check className="h-4 w-4" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="hero" size="lg" className="mt-8" asChild>
                    <Link to={user ? "/dashboard" : "/auth"}>
                      Start Your Organization
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>

                <div className="grid gap-6">
                  {audiences.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Card key={item.title} className="border-border/70 shadow-medium">
                        <CardContent className="flex items-start gap-5 p-6">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{item.title}</h3>
                            <p className="mt-1 text-muted-foreground">{item.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {user && affiliate && (
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
          )}

          {user && affiliate && (
            <section className="bg-[linear-gradient(135deg,hsl(222_47%_11%)_0%,hsl(217_33%_17%)_100%)] py-20 text-white md:py-24">
              <div className="container mx-auto max-w-[1280px] px-6">
                <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
                  <Card className="border-white/10 bg-white/5 text-white shadow-heavy">
                    <CardHeader>
                      <CardTitle className="text-3xl">Your referral activity</CardTitle>
                      <CardDescription className="text-white/65">
                        Latest tracked conversions in your affiliate account.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {referrals.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
                          No referrals yet. Share your link after activation to start tracking.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {referrals.map((referral) => (
                            <div key={referral.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                              <div>
                                <div className="font-medium text-white">{referral.membership_tier ?? "Referral"}</div>
                                <div className="text-sm text-white/60">{new Date(referral.created_at).toLocaleDateString()}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-white">${(referral.commission_amount ?? 0).toFixed(2)}</div>
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
                      <div className="grid w-full gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60 sm:grid-cols-2">
                        <div>
                          <div className="font-semibold text-white">Paid referrals</div>
                          <div className="mt-1 text-2xl font-black text-white">{paidReferrals}</div>
                        </div>
                        <div>
                          <div className="font-semibold text-white">Pending referral value</div>
                          <div className="mt-1 text-2xl font-black text-white">${pendingValue.toFixed(2)}</div>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>

                  <Card className="border-white/10 bg-white/5 text-white shadow-heavy">
                    <CardContent className="flex flex-col justify-center gap-6 p-8">
                      <div>
                        <h3 className="text-2xl font-bold">Your affiliate account is ready</h3>
                        <p className="mt-2 text-white/65">
                          Share your referral link with people who would genuinely benefit from RTM.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button variant="hero" size="lg" onClick={() => void handleCopyLink()}>
                          <ClipboardCopy className="mr-2 h-5 w-5" />
                          Copy My Link
                        </Button>
                        <Button variant="heroOutline" size="lg" onClick={() => navigate("/membership")}>
                          View Membership Page
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>
          )}

          {user && !affiliate && (
            <section className="bg-[linear-gradient(135deg,hsl(222_47%_11%)_0%,hsl(217_33%_17%)_100%)] py-20 text-white md:py-24">
              <div className="container mx-auto max-w-[1280px] px-6">
                <Card className="mx-auto max-w-2xl border-white/10 bg-white/5 text-white shadow-heavy">
                  <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
                    <Rocket className="h-12 w-12 text-[#b4df55]" />
                    <div>
                      <h3 className="text-3xl font-bold">Activate your affiliate account</h3>
                      <p className="mt-2 text-white/65">
                        Create your affiliate profile to unlock your referral code, track conversions, and start earning when people join.
                      </p>
                    </div>
                    <Button variant="hero" size="xl" onClick={() => void handleCreateAffiliate()} disabled={isCreatingAffiliate}>
                      {isCreatingAffiliate ? "Activating..." : "Activate Now"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>
          )}

          <section className="bg-stone-50 py-20 md:py-24">
            <div className="container mx-auto max-w-[960px] px-6">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  FAQ
                </Badge>
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Common questions</h2>
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
              <h2 className="text-3xl font-black tracking-tight md:text-5xl">Become an RTM Partner</h2>
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
