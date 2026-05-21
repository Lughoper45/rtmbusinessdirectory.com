import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight,
  Check,
  Crown,
  Gift,
  HandCoins,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { FALLBACK_MEMBERSHIP_PLANS, type MembershipPlan } from "@/data/membershipPlans";
import { openMembershipJoin } from "@/lib/site";
import { fetchPlatformMembership } from "@/services/membership";
import { toast } from "sonner";
import { AFFILIATE_DIRECT_COMMISSION_LABEL, DISCOUNT_RANGE_LABEL, MEMBERSHIP_PRICE_LABEL } from "@/content/siteCopy";

interface Deal {
  id: string;
  business_id: string | null;
  title: string;
  description: string | null;
  discount_percent: number;
  code: string | null;
  expires_at: string | null;
  is_active: boolean;
  business?: {
    id: string;
    name: string;
    category: string;
    city: string;
    province: string;
    image: string;
    rating: number;
  };
}

interface PlatformMembershipState {
  active: boolean;
  status: string;
  source: string;
}

interface AffiliateSummary {
  id: string;
  referral_code: string;
  total_earnings: number;
  commission_rate: number;
}

const Deals = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [platformMembership, setPlatformMembership] = useState<PlatformMembershipState | null>(null);
  const [affiliateSummary, setAffiliateSummary] = useState<AffiliateSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadPage();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast.success("Membership checkout completed. Access will update once payment confirmation syncs.");
    }
    if (params.get("canceled") === "true") {
      toast.error("Membership checkout was canceled.");
    }
  }, []);

  const loadPage = async () => {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    const tasks: Promise<unknown>[] = [loadDeals(), loadMembershipPlans()];
    if (currentUser) {
      tasks.push(loadPlatformMembership(currentUser.id, currentUser.email), loadAffiliateSummary(currentUser.id));
    }
    await Promise.all(tasks);
    setIsLoading(false);
  };

  const loadDeals = async () => {
    const { data, error } = await supabase
      .from("business_deals")
      .select("id, business_id, title, description, discount_percent, code, expires_at, is_active")
      .eq("is_active", true)
      .order("discount_percent", { ascending: false });

    if (error) {
      toast.error("Unable to load current deals.");
      return;
    }

    const baseDeals = (data ?? []) as Deal[];
    const businessIds = [...new Set(baseDeals.map((deal) => deal.business_id).filter(Boolean))] as string[];

    if (businessIds.length === 0) {
      setDeals(baseDeals);
      return;
    }

    const { data: businesses } = await supabase
      .from("businesses")
      .select("id, name, category, city, province, image, rating")
      .in("id", businessIds);

    const businessMap = new Map((businesses ?? []).map((business) => [business.id, business]));
    setDeals(
      baseDeals.map((deal) => ({
        ...deal,
        business: deal.business_id ? businessMap.get(deal.business_id) : undefined,
      })),
    );
  };

  const loadMembershipPlans = async () => {
    setMembershipPlans(FALLBACK_MEMBERSHIP_PLANS);
  };

  const loadPlatformMembership = async (userId: string, email?: string | null) => {
    const membership = await fetchPlatformMembership(userId, email);
    setPlatformMembership(membership);
  };

  const loadAffiliateSummary = async (userId: string) => {
    const { data } = await supabase
      .from("affiliates")
      .select("id, referral_code, total_earnings, commission_rate")
      .eq("user_id", userId)
      .maybeSingle();

    setAffiliateSummary(data);
  };

  const categories = useMemo(
    () => [...new Set(deals.map((deal) => deal.business?.category).filter(Boolean))] as string[],
    [deals],
  );

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        deal.title.toLowerCase().includes(query) ||
        deal.business?.name.toLowerCase().includes(query) ||
        deal.business?.city.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === "all" || deal.business?.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [deals, searchQuery, selectedCategory]);

  const hasActiveMembership = platformMembership?.active === true;
  const activePlan = hasActiveMembership ? membershipPlans[0] ?? null : null;

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleGetDeal = (deal: Deal) => {
    if (!user) {
      toast.error("Sign in to access member deal codes.");
      navigate("/auth");
      return;
    }
    if (!hasActiveMembership) {
      toast.error("You need an active RTM membership to unlock this deal.");
      openMembershipJoin({ returnUrl: window.location.href });
      return;
    }
    const code = deal.code || "RTMDEAL";
    void navigator.clipboard.writeText(code);
    toast.success(`Deal code copied: ${code}`);
  };

  const handleMembershipCheckout = async (_plan: MembershipPlan) => {
    openMembershipJoin();
  };

  const heroMetrics = [
    { icon: Ticket, label: "Live deals", value: `${deals.length}+` },
    { icon: Crown, label: "Member savings", value: DISCOUNT_RANGE_LABEL },
    { icon: HandCoins, label: "Affiliate payout", value: affiliateSummary ? `${affiliateSummary.commission_rate}%` : AFFILIATE_DIRECT_COMMISSION_LABEL },
    { icon: ShieldCheck, label: "Trusted network", value: "Canada-wide" },
  ];

  return (
    <>
      <Helmet>
        <title>RTM Deals & Memberships | Exclusive Savings Across Canada</title>
        <meta
          name="description"
          content="Unlock RTM digital memberships, browse premium business deals, and grow referral income with the affiliate-powered RTM savings ecosystem."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsla(352,82%,49%,0.10),transparent_32%),radial-gradient(circle_at_bottom_right,hsla(22,100%,60%,0.10),transparent_30%),linear-gradient(180deg,hsl(210_40%_98%)_0%,hsl(0_0%_100%)_50%,hsl(210_40%_98%)_100%)]" />
            <div className="absolute left-8 top-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-10 right-8 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />

            <div className="container relative z-10 mx-auto max-w-[1280px] px-6 py-16 md:py-20">
              <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="max-w-3xl">
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-medium text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    RTM deals from participating businesses
                  </div>
                  <h1 className="mb-6 text-4xl font-extrabold leading-[1.05] text-foreground md:text-5xl lg:text-6xl">
                    Browse offers from businesses in the RTM network
                  </h1>
                  <p className="mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
                    Search current offers, find participating businesses, and unlock deal codes when your RTM membership is active.
                  </p>
                  <div className="mb-8 flex flex-col gap-3 sm:flex-row">
                    <Button variant="hero" size="xl" onClick={() => scrollToSection("deals-grid")}>
                      Browse Deals
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="xl" onClick={() => navigate("/membership")}>
                      Get Membership
                    </Button>
                  </div>
                  <div className="mb-8 max-w-[820px]">
                    <div className="relative">
                      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/15 to-primary/20 blur-lg opacity-60" />
                      <div className="relative flex items-center gap-2 rounded-2xl border-2 border-border bg-background p-2 shadow-medium transition-all duration-300 focus-within:border-primary">
                        <Search className="ml-4 h-5 w-5 shrink-0 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder="Search deals by business, city, or category"
                          className="border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
                        />
                        <Button variant="hero" size="lg" onClick={() => scrollToSection("deals-grid")}>
                          Search
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {heroMetrics.map((metric) => {
                      const Icon = metric.icon;
                      return (
                        <div
                          key={metric.label}
                          className="flex items-center gap-3 rounded-full border border-border bg-background px-5 py-3 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30"
                        >
                          <div className="rounded-full bg-primary/10 p-2 text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">{metric.value}</div>
                            <div className="text-xs text-muted-foreground">{metric.label}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-5">
                  <Card className="overflow-hidden border-border/70 bg-background shadow-heavy">
                    <CardHeader className="border-b border-border/60 pb-4">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Gift className="h-5 w-5 text-primary" />
                        Member Snapshot
                      </CardTitle>
                      <CardDescription>Everything important before you redeem or refer.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
                      <div className="rounded-2xl bg-muted/50 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</div>
                        <div className="mt-2 text-2xl font-bold text-foreground">{hasActiveMembership ? "Active" : "Not Active"}</div>
                      </div>
                      <div className="rounded-2xl bg-muted/50 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current Plan</div>
                        <div className="mt-2 text-2xl font-bold text-foreground">{activePlan?.name ?? "Choose One"}</div>
                      </div>
                      <div className="rounded-2xl bg-muted/50 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Valid Until</div>
                        <div className="mt-2 text-lg font-semibold text-foreground">
                          {hasActiveMembership ? "RTM membership active" : "No active access"}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-muted/50 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Affiliate Code</div>
                        <div className="mt-2 text-lg font-semibold text-foreground">
                          {affiliateSummary?.referral_code ?? "Available after setup"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Card className="border-primary/15 bg-gradient-to-br from-primary/5 to-background shadow-medium">
                      <CardContent className="p-6">
                        <div className="mb-3 flex items-center gap-2 text-primary">
                          <TrendingUp className="h-5 w-5" />
                          <span className="text-sm font-semibold uppercase tracking-[0.18em]">Savings Engine</span>
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                          Member-only discounts and offer redemption presented with RTM-level polish.
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-background shadow-medium">
                      <CardContent className="p-6">
                        <div className="mb-3 flex items-center gap-2 text-accent">
                          <Users className="h-5 w-5" />
                          <span className="text-sm font-semibold uppercase tracking-[0.18em]">Community Growth</span>
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                          Churches, groups, and promoters can drive signups and recurring commissions from the same system.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="mb-12 max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2 text-sm text-primary">
                  <Tag className="h-4 w-4" />
                  Premium offer discovery
                </div>
                <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Designed for quick local savings</h2>
                <p className="text-lg text-muted-foreground">
                  Deals should help members act quickly: find the offer, understand the business, and use the code when their membership is active.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-border/70 bg-background shadow-medium">
                  <CardContent className="p-6">
                    <ShieldCheck className="mb-4 h-10 w-10 text-primary" />
                    <h3 className="mb-2 text-xl font-bold text-foreground">Verified Access</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Digital memberships control who can redeem deals while businesses keep a simple code-based flow.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/70 bg-background shadow-medium">
                  <CardContent className="p-6">
                    <MapPin className="mb-4 h-10 w-10 text-accent" />
                    <h3 className="mb-2 text-xl font-bold text-foreground">Local Discovery</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Categories, businesses, and city context surface naturally so members can act fast.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/70 bg-background shadow-medium">
                  <CardContent className="p-6">
                    <HandCoins className="mb-4 h-10 w-10 text-primary" />
                    <h3 className="mb-2 text-xl font-bold text-foreground">Affiliate Revenue</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Referral growth now lives in a premium conversion environment instead of an afterthought page.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section id="deals-grid" className="bg-surface-light py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <h2 className="text-3xl font-bold text-foreground md:text-4xl">Featured Deals</h2>
                  <p className="mt-3 text-muted-foreground">
                    Browse high-intent offers from RTM businesses and unlock deal codes once your membership is active.
                  </p>
                </div>
                <div className="flex flex-col gap-3 md:flex-row">
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Filter deals"
                    className="min-w-[260px] bg-background"
                  />
                  <select
                    className="h-11 rounded-lg border border-input bg-background px-4 text-sm font-medium"
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                  >
                    <option value="all">All categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isLoading ? (
                <div className="py-20 text-center text-muted-foreground">Loading deals...</div>
              ) : filteredDeals.length === 0 ? (
                <Card className="border-dashed border-border bg-background">
                  <CardContent className="py-16 text-center">
                    <p className="text-muted-foreground">No deals matched the current search.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                      }}
                    >
                      Reset Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredDeals.slice(0, 6).map((deal, index) => (
                    <Card
                      key={deal.id}
                      className="group overflow-hidden border-border/70 bg-background shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-heavy"
                    >
                      <div className="relative h-52 overflow-hidden">
                        <img
                          src={deal.business?.image || "/placeholder.svg"}
                          alt={deal.business?.name || deal.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                        <Badge className="absolute right-4 top-4 bg-primary text-primary-foreground hover:bg-primary">
                          {deal.discount_percent}% OFF
                        </Badge>
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="text-xs uppercase tracking-[0.2em] text-white/80">Featured Deal {index + 1}</div>
                          <h3 className="mt-1 text-xl font-bold text-white">{deal.title}</h3>
                        </div>
                      </div>
                      <CardContent className="space-y-4 p-6">
                        <div>
                          <p className="font-semibold text-foreground">{deal.business?.name ?? "RTM Business"}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {deal.description ?? "Member-exclusive pricing and promotional access."}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {deal.business?.category ? <span className="rounded-full bg-muted px-3 py-1">{deal.business.category}</span> : null}
                          {deal.business?.city ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {deal.business.city}, {deal.business.province}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                          <div className="flex items-center gap-1 text-sm text-foreground">
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            {typeof deal.business?.rating === "number" ? deal.business.rating.toFixed(1) : "New"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {deal.expires_at ? `Expires ${new Date(deal.expires_at).toLocaleDateString()}` : "Ongoing"}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-6 pt-0">
                        <Button className="w-full" variant="card" onClick={() => handleGetDeal(deal)}>
                          {hasActiveMembership ? "Copy Deal Code" : "Unlock With Membership"}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section id="membership" className="py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm text-accent">
                    <Crown className="h-4 w-4" />
                    Digital membership plans
                  </div>
                  <h2 className="text-3xl font-bold text-foreground md:text-4xl">Want member access?</h2>
                  <p className="mt-3 text-lg text-muted-foreground">
                    RTM membership is {MEMBERSHIP_PRICE_LABEL}. Active members can unlock deal codes and use participating business discounts.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">RTM Benefit Card:</span> Get {DISCOUNT_RANGE_LABEL} discounts where participating businesses offer member pricing.
                  </p>
                </div>
                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4 text-sm text-foreground">
                  <span className="font-semibold text-primary">Current access:</span> {activePlan?.name ?? "No active membership"}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {membershipPlans.map((plan, index) => (
                  <Card
                    key={plan.id}
                    className={`relative overflow-hidden border-border/70 shadow-medium ${
                      index === 1 ? "border-primary bg-gradient-to-b from-primary/5 to-background shadow-glow" : "bg-background"
                    }`}
                  >
                    {index === 1 ? (
                      <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground">
                        Most Popular
                      </div>
                    ) : null}
                    <CardHeader className="pb-4">
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="pt-3 text-4xl font-extrabold text-foreground">
                        ${plan.price.toFixed(2)}
                        <span className="ml-1 text-sm font-medium text-muted-foreground">/{plan.interval}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                            <div className="rounded-full bg-primary/10 p-1 text-primary">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button
                        className="w-full"
                        variant={index === 1 ? "hero" : "outline"}
                        onClick={() => void handleMembershipCheckout(plan)}
                      >
                        Purchase membership - $100 CAD
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                <Card className="gradient-dark overflow-hidden border-0 text-primary-foreground shadow-heavy">
                  <CardContent className="p-8 md:p-10">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
                      <HandCoins className="h-4 w-4" />
                      Earn with RTM
                    </div>
                      <h2 className="text-3xl font-bold md:text-4xl">Affiliate details live on the affiliate page</h2>
                    <p className="mt-4 max-w-xl text-primary-foreground/80">
                      Members who want to share RTM can review the affiliate program separately. Deals stays focused on savings and participating businesses.
                    </p>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/10 p-5">
                        <div className="text-xs uppercase tracking-[0.18em] text-primary-foreground/60">Commission Rate</div>
                        <div className="mt-2 text-3xl font-bold">{affiliateSummary?.commission_rate ?? 30}%</div>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-5">
                        <div className="text-xs uppercase tracking-[0.18em] text-primary-foreground/60">Lifetime Earnings</div>
                        <div className="mt-2 text-3xl font-bold">${(affiliateSummary?.total_earnings ?? 0).toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <Button variant="heroWhite" size="lg" asChild>
                        <Link to={user ? "/dashboard" : "/auth"}>
                          Open Dashboard
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                      </Button>
                      <Button variant="heroOutline" size="lg" onClick={() => scrollToSection("membership")}>
                        Review Membership
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6">
                  <Card className="border-border/70 bg-background shadow-medium">
                    <CardContent className="grid gap-6 p-8 md:grid-cols-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Step 1</div>
                        <div className="mt-2 text-xl font-bold text-foreground">Join or activate</div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">Activate membership or affiliate setup in the RTM flow.</p>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Step 2</div>
                        <div className="mt-2 text-xl font-bold text-foreground">Redeem or refer</div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">Use deals or share referrals inside a polished consumer-facing experience.</p>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Step 3</div>
                        <div className="mt-2 text-xl font-bold text-foreground">Track growth</div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">Keep membership status and affiliate readiness visible without leaving RTM.</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/15 bg-primary/5 shadow-medium">
                    <CardContent className="flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
                      <div className="max-w-2xl">
                        <h3 className="text-2xl font-bold text-foreground">This now fits the RTM standard</h3>
                        <p className="mt-2 text-muted-foreground">
                          Deals, membership, and affiliate tracking now have clearer jobs instead of repeating the same pitch.
                        </p>
                      </div>
                      <Button variant="hero" size="lg" onClick={() => scrollToSection("deals-grid")}>
                        Explore Live Deals
                      </Button>
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

export default Deals;
