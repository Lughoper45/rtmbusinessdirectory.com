import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, Check, Crown, ShieldCheck, Sparkles, Ticket, Wallet } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { createMembershipCheckout } from "@/services/payment";
import { toast } from "sonner";

interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  features: string[];
}

interface UserMembership {
  id: string;
  plan_id: string | null;
  status: string;
  expires_at: string;
}

const Membership = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);

  useEffect(() => {
    void loadPage();
  }, []);

  const loadPage = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    const plansPromise = supabase
      .from("membership_plans")
      .select("id, name, description, price, interval, features")
      .eq("is_active", true)
      .order("price");

    const membershipPromise = currentUser
      ? supabase
          .from("user_memberships")
          .select("id, plan_id, status, expires_at")
          .eq("user_id", currentUser.id)
          .eq("status", "active")
          .gt("expires_at", new Date().toISOString())
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    const [{ data: plansData, error: plansError }, { data: membershipData }] = await Promise.all([
      plansPromise,
      membershipPromise,
    ]);

    if (plansError) {
      toast.error("Unable to load membership plans.");
      return;
    }

    setPlans(plansData ?? []);
    setMembership(membershipData);
  };

  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === membership?.plan_id) ?? null,
    [membership, plans],
  );

  const handleCheckout = async (plan: MembershipPlan) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      setCheckoutPlanId(plan.id);
      const checkoutUrl = await createMembershipCheckout(plan.id, user.id);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Unable to start membership checkout.");
    } finally {
      setCheckoutPlanId(null);
    }
  };

  const benefits = [
    "Unlock member-only deals across RTM businesses",
    "Keep access in a digital-first membership experience",
    "Move from basic sign-up to repeatable loyalty and renewals",
    "Fit naturally into RTM’s wider business and media ecosystem",
  ];

  return (
    <>
      <Helmet>
        <title>RTM Membership | Digital Savings Access</title>
        <meta
          name="description"
          content="Join RTM membership, access premium business discounts, and activate the digital card experience for savings across Canada."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main>
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsla(352,82%,49%,0.10),transparent_30%),radial-gradient(circle_at_bottom_right,hsla(22,100%,60%,0.12),transparent_28%),linear-gradient(180deg,hsl(210_40%_98%)_0%,hsl(0_0%_100%)_100%)]" />
            <div className="container relative z-10 mx-auto max-w-[1280px] px-6 py-16 md:py-20">
              <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="max-w-3xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-medium text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    RTM membership, redesigned as a premium digital product
                  </div>
                  <h1 className="text-4xl font-extrabold leading-[1.05] text-foreground md:text-5xl lg:text-6xl">
                    Activate the RTM card experience with modern membership flows
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                    Membership is now positioned as a premium access product, not just a simple annual card fee. The plans below are the front door into the RTM deals ecosystem.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button variant="hero" size="xl" onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })}>
                      View Membership Plans
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="xl" onClick={() => navigate("/deals")}>
                      Explore Deals First
                    </Button>
                  </div>
                </div>

                <Card className="overflow-hidden border-border/70 bg-background shadow-heavy">
                  <CardHeader className="border-b border-border/60 pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Wallet className="h-5 w-5 text-primary" />
                      Membership Status
                    </CardTitle>
                    <CardDescription>Your current RTM access state</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
                    <div className="rounded-2xl bg-muted/50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</div>
                      <div className="mt-2 text-2xl font-bold text-foreground">{membership ? "Active" : "Inactive"}</div>
                    </div>
                    <div className="rounded-2xl bg-muted/50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Plan</div>
                      <div className="mt-2 text-2xl font-bold text-foreground">{activePlan?.name ?? "Not selected"}</div>
                    </div>
                    <div className="rounded-2xl bg-muted/50 p-4 sm:col-span-2">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Valid Until</div>
                      <div className="mt-2 text-lg font-semibold text-foreground">
                        {membership ? new Date(membership.expires_at).toLocaleDateString() : "Purchase a plan to activate access"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="mb-12 grid gap-6 md:grid-cols-2">
                <Card className="border-primary/15 bg-primary/5 shadow-medium">
                  <CardContent className="p-8">
                    <div className="mb-4 inline-flex rounded-full bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      Why Membership Works
                    </div>
                    <ul className="space-y-4">
                      {benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <div className="rounded-full bg-primary/10 p-1 text-primary">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-border/70 bg-background shadow-medium">
                  <CardContent className="grid gap-4 p-8 sm:grid-cols-2">
                    <div className="rounded-2xl bg-muted/50 p-5">
                      <Ticket className="mb-3 h-8 w-8 text-primary" />
                      <div className="text-xl font-bold text-foreground">Deal Access</div>
                      <p className="mt-2 text-sm text-muted-foreground">Premium consumer value through exclusive RTM offers.</p>
                    </div>
                    <div className="rounded-2xl bg-muted/50 p-5">
                      <ShieldCheck className="mb-3 h-8 w-8 text-accent" />
                      <div className="text-xl font-bold text-foreground">Verified Network</div>
                      <p className="mt-2 text-sm text-muted-foreground">Membership becomes a trust layer for redemption and retention.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div id="plans" className="grid gap-6 lg:grid-cols-3">
                {plans.map((plan, index) => (
                  <Card
                    key={plan.id}
                    className={`relative overflow-hidden border-border/70 shadow-medium ${
                      index === 1 ? "border-primary bg-gradient-to-b from-primary/5 to-background shadow-glow" : "bg-background"
                    }`}
                  >
                    {index === 1 ? (
                      <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground">
                        Recommended
                      </div>
                    ) : null}
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-2xl">
                        <Crown className="h-5 w-5 text-primary" />
                        {plan.name}
                      </CardTitle>
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
                        disabled={checkoutPlanId === plan.id}
                        onClick={() => void handleCheckout(plan)}
                      >
                        {checkoutPlanId === plan.id ? "Starting checkout..." : user ? "Choose Plan" : "Sign In to Join"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Membership;
