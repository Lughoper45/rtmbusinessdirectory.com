import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, HandCoins, Link2, Sparkles, Target, TrendingUp, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ensureAffiliateAccount } from "@/services/affiliate";
import { toast } from "sonner";

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

const Affiliate = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateSummary | null>(null);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [isCreatingAffiliate, setIsCreatingAffiliate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadPage();
  }, []);

  const loadPage = async () => {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    try {
      const affiliateData = await ensureAffiliateAccount(currentUser);
      setAffiliate(affiliateData);
      const { data: referralData } = await supabase
        .from("affiliate_referrals")
        .select("id, membership_tier, commission_amount, commission_paid, created_at")
        .eq("affiliate_id", affiliateData.id)
        .order("created_at", { ascending: false })
        .limit(8);

      setReferrals(referralData ?? []);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load affiliate account.");
    } finally {
      setIsLoading(false);
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

  const handleCopyLink = async () => {
    if (!user) {
      navigate("/auth?redirectTo=/affiliate");
      return;
    }

    try {
      const affiliateAccount = affiliate ?? (await ensureAffiliateAccount(user));
      if (!affiliate) {
        setAffiliate(affiliateAccount);
      }

      const url = `${window.location.origin}/ref/${affiliateAccount.referral_code}`;
      await navigator.clipboard.writeText(url);
      toast.success("Referral link copied.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to generate your referral link right now.");
    }
  };

  const handleCreateAffiliate = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      setIsCreatingAffiliate(true);
      const data = await ensureAffiliateAccount(user);
      setAffiliate(data);
      toast.success("Affiliate account activated.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to activate affiliate account.");
    } finally {
      setIsCreatingAffiliate(false);
    }
  };

  const valueCards = [
    { icon: HandCoins, label: "Commission Rate", value: `${affiliate?.commission_rate ?? 30}%` },
    { icon: TrendingUp, label: "Lifetime Earnings", value: `$${(affiliate?.total_earnings ?? 0).toFixed(2)}` },
    { icon: Users, label: "Tracked Referrals", value: `${referrals.length}` },
    { icon: Target, label: "Pending Value", value: `$${pendingValue.toFixed(2)}` },
  ];

  const referralLink = affiliate?.referral_code ? `${window.location.origin}/ref/${affiliate.referral_code}` : null;

  return (
    <>
      <Helmet>
        <title>RTM Affiliate Program | Earn With Referrals</title>
        <meta
          name="description"
          content="Promote RTM memberships and business signups, track referral earnings, and build recurring commission through the RTM affiliate ecosystem."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main>
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsla(22,100%,60%,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,hsla(352,82%,49%,0.10),transparent_30%),linear-gradient(180deg,hsl(0_0%_100%)_0%,hsl(210_40%_98%)_100%)]" />
            <div className="container relative z-10 mx-auto max-w-[1280px] px-6 py-16 md:py-20">
              <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="max-w-3xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-medium text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    RTM affiliate growth with recurring commission potential
                  </div>
                  <h1 className="text-4xl font-extrabold leading-[1.05] text-foreground md:text-5xl lg:text-6xl">
                    Turn RTM growth into a structured affiliate revenue channel
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                    The affiliate program is now positioned as a proper business engine for community builders, business promoters, and growth partners.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button variant="hero" size="xl" asChild>
                      <Link to={user ? "/dashboard" : "/auth"}>
                        {user ? "Open Dashboard" : "Sign In to Start"}
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                    {user && !affiliate ? (
                      <Button variant="outline" size="xl" onClick={() => void handleCreateAffiliate()} disabled={isCreatingAffiliate}>
                        {isCreatingAffiliate ? "Activating..." : "Activate Affiliate Account"}
                      </Button>
                    ) : null}
                    <Button variant="outline" size="xl" onClick={() => navigate("/membership")}>
                      See Membership Funnel
                    </Button>
                  </div>
                </div>

                <Card className="overflow-hidden border-border/70 bg-background shadow-heavy">
                  <CardHeader className="border-b border-border/60 pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Link2 className="h-5 w-5 text-primary" />
                      Affiliate Snapshot
                    </CardTitle>
                    <CardDescription>Your current public-facing referral position</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
                    <div className="rounded-2xl bg-muted/50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</div>
                      <div className="mt-2 text-2xl font-bold text-foreground">
                        {isLoading ? "Loading" : affiliate?.status ?? "Not Setup"}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-muted/50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Referral Code</div>
                      <div className="mt-2 text-2xl font-bold text-foreground">
                        {isLoading ? "Generating..." : affiliate?.referral_code ?? "Pending"}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-muted/50 p-4 sm:col-span-2">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Shareable Link</div>
                      <div className="mt-2 break-all text-sm font-medium text-foreground">
                        {isLoading ? "Preparing your referral link..." : referralLink ?? "Available after affiliate setup"}
                      </div>
                      <Button className="mt-4" variant="outline" onClick={() => void handleCopyLink()} disabled={isLoading}>
                        Copy Referral Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              {user && !affiliate && !isLoading ? (
                <Card className="mb-8 border-primary/15 bg-primary/5 shadow-medium">
                  <CardContent className="flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">Activate your affiliate account</h3>
                      <p className="mt-2 text-muted-foreground">
                        The visibility layer is ready. Activate your account to generate a referral code and start tracking commission-ready traffic.
                      </p>
                    </div>
                    <Button variant="hero" size="lg" onClick={() => void handleCreateAffiliate()} disabled={isCreatingAffiliate}>
                      {isCreatingAffiliate ? "Activating..." : "Activate Now"}
                    </Button>
                  </CardContent>
                </Card>
              ) : null}

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {valueCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Card key={card.label} className="border-border/70 bg-background shadow-medium">
                      <CardContent className="p-6">
                        <Icon className="mb-4 h-8 w-8 text-primary" />
                        <div className="text-sm text-muted-foreground">{card.label}</div>
                        <div className="mt-2 text-3xl font-bold text-foreground">{card.value}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                <Card className="gradient-dark border-0 text-primary-foreground shadow-heavy">
                  <CardContent className="p-8 md:p-10">
                    <div className="mb-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm">Affiliate Flow</div>
                    <h2 className="text-3xl font-bold md:text-4xl">How the RTM affiliate engine should work</h2>
                    <div className="mt-8 space-y-5">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-primary-foreground/60">Step 1</div>
                        <div className="mt-2 text-xl font-semibold">Promote RTM offers</div>
                        <p className="mt-1 text-sm text-primary-foreground/80">Drive traffic to membership and business signup funnels.</p>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-primary-foreground/60">Step 2</div>
                        <div className="mt-2 text-xl font-semibold">Convert businesses and members</div>
                        <p className="mt-1 text-sm text-primary-foreground/80">Use a cleaner public experience to improve trust and conversion rate.</p>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-primary-foreground/60">Step 3</div>
                        <div className="mt-2 text-xl font-semibold">Track and scale recurring revenue</div>
                        <p className="mt-1 text-sm text-primary-foreground/80">Turn one-time signups into a repeatable network-driven channel.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6">
                  <Card className="border-border/70 bg-background shadow-medium">
                    <CardHeader>
                      <CardTitle>Recent Referral Activity</CardTitle>
                      <CardDescription>Latest tracked conversions in the current affiliate data model</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {referrals.length === 0 ? (
                        <div className="rounded-2xl bg-muted/40 p-6 text-sm text-muted-foreground">
                          No referrals have been recorded yet. The page is live and the next step is deepening the actual referral funnel and onboarding flow.
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
                  </Card>

                  <Card className="border-primary/15 bg-primary/5 shadow-medium">
                    <CardContent className="flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">Affiliate visibility is now productized</h3>
                        <p className="mt-2 text-muted-foreground">
                          This page replaces a hidden dashboard-only concept with a proper RTM affiliate destination that matches the brand standard.
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Paid referrals</div>
                        <div className="text-3xl font-bold text-foreground">{paidReferrals}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
