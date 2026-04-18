import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, Check, Crown, ShieldCheck, Sparkles, Ticket, Wallet, Star, Building2, Utensils, Car, Plane, Scissors, GraduationCap, Palette } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FALLBACK_MEMBERSHIP_PLANS, type MembershipPlan } from "@/data/membershipPlans";
import { createMembershipCheckout } from "@/services/payment";
import { toast } from "sonner";

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
  const [dineOut, setDineOut] = useState(4);
  const [shopping, setShopping] = useState(500);
  const [services, setServices] = useState(200);

  const monthlySavings = (dineOut * 40 * 0.15) + (shopping * 0.15) + (services * 0.15);
  const annualSavings = monthlySavings * 12;
  const roi = annualSavings / 100;

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
      console.error(plansError);
      setPlans(FALLBACK_MEMBERSHIP_PLANS);
      toast.error("Live membership plans were unavailable. Showing the current RTM catalog.");
    } else if (!plansData || plansData.length === 0) {
      setPlans(FALLBACK_MEMBERSHIP_PLANS);
    } else {
      setPlans(plansData);
    }

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
    "Fit naturally into RTM's wider business and media ecosystem",
    "Receive your RTM Benefit Card for exclusive discounts at participating businesses",
    "Access savings of 5% - 50% at restaurants, retail, travel, and more",
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
          <section className="relative overflow-hidden bg-gradient-to-br from-primary to-red-900 text-white">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_28%)]" />
            </div>
            <div className="container relative z-10 mx-auto max-w-[1280px] px-6 py-16 md:py-20">
              <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="max-w-3xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium">
                    🍁 RTM Membership - Redesigned as a Premium Digital Product
                  </div>
                  <h1 className="text-4xl font-extrabold leading-[1.05] md:text-5xl lg:text-6xl">
                    Activate the RTM Card Experience
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg opacity-95 md:text-xl">
                    Save 5-50% at 5,000+ Canadian businesses. Your membership pays for itself in weeks!
                  </p>

                  <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold">💳</div>
                      <div className="text-xs opacity-80">Digital + Physical Card</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold">🏪</div>
                      <div className="text-xs opacity-80">5,000+ Businesses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold">💰</div>
                      <div className="text-xs opacity-80">Save Up to 50%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold">🇨🇦</div>
                      <div className="text-xs opacity-80">Proudly Canadian</div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button 
                      variant="default" 
                      size="xl" 
                      className="bg-white text-primary hover:bg-white/90"
                      onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })}
                    >
                      View Membership Plans
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="xl" 
                      className="border-white text-white hover:bg-white hover:text-primary"
                      onClick={() => document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth" })}
                    >
                      Calculate Your Savings
                    </Button>
                  </div>
                  
                  <p className="mt-4 text-sm opacity-80">
                    ✓ Instant digital activation ✓ No contracts ✓ Cancel anytime
                  </p>
                </div>

                <Card className="overflow-hidden border-0 bg-white/10 backdrop-blur-sm shadow-heavy">
                  <CardHeader className="border-b border-white/20 pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl text-white">
                      <Wallet className="h-5 w-5" />
                      Your RTM Benefit Card
                    </CardTitle>
                    <CardDescription className="text-white/70">Present at participating businesses</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/70">Status</div>
                      <div className="mt-2 text-2xl font-bold text-white">{membership ? "Active" : "Get Started"}</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/70">Plan</div>
                      <div className="mt-2 text-2xl font-bold text-white">{activePlan?.name ?? "Not selected"}</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4 sm:col-span-2">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/70">Valid Until</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {membership ? new Date(membership.expires_at).toLocaleDateString() : "Purchase a plan to activate"}
                      </div>
                    </div>
                  </CardContent>
</Card>
            </div>
          </section>

          <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">How Your RTM Membership Works</h2>
                <p className="mt-2 text-muted-foreground">From sign-up to savings in 4 simple steps</p>
              </div>
              
              <div className="grid gap-8 md:grid-cols-4">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">1</div>
                  <div className="text-3xl mb-3">📝</div>
                  <h3 className="font-semibold">Choose Plan</h3>
                  <p className="text-sm text-muted-foreground mt-2">Select Basic, Premium, or Pro based on your savings needs</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">2</div>
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="font-semibold">Instant Activation</h3>
                  <p className="text-sm text-muted-foreground mt-2">Get immediate access to your digital card. Physical card in 5-7 days</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">3</div>
                  <div className="text-3xl mb-3">🏪</div>
                  <h3 className="font-semibold">Find Deals</h3>
                  <p className="text-sm text-muted-foreground mt-2">Browse 5,000+ participating businesses by category and location</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">4</div>
                  <div className="text-3xl mb-3">💰</div>
                  <h3 className="font-semibold">Show & Save</h3>
                  <p className="text-sm text-muted-foreground mt-2">Present your RTM card and enjoy instant 5-50% discounts</p>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 md:py-24 bg-slate-50" id="calculator">
            <div className="container mx-auto max-w-[1280px] px-6">
              <Card className="border-border/70 bg-background shadow-heavy">
                <CardHeader className="border-b border-border/60 pb-4 text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    💰 Will You Save More Than $100?
                  </CardTitle>
                  <CardDescription>Calculate your potential annual savings with RTM membership</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Dining out per month:</label>
                      <input
                        type="number"
                        value={dineOut}
                        onChange={(e) => setDineOut(Number(e.target.value))}
                        className="w-full p-3 border rounded-lg"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground">Save ~$40/month at 15% avg</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Monthly shopping:</label>
                      <input
                        type="number"
                        value={shopping}
                        onChange={(e) => setShopping(Number(e.target.value))}
                        className="w-full p-3 border rounded-lg"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground">Save ~15%</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Services (haircut, etc):</label>
                      <input
                        type="number"
                        value={services}
                        onChange={(e) => setServices(Number(e.target.value))}
                        className="w-full p-3 border rounded-lg"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground">Save ~15%</p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-xl bg-green-50 p-6 border border-green-200 text-center">
                    <div className="text-sm text-green-700">Your Estimated Annual Savings:</div>
                    <div className="text-4xl font-bold text-green-700">${annualSavings.toFixed(0)}</div>
                    <div className="text-lg text-green-600 mt-2">
                      That's <strong>{roi.toFixed(0)}x</strong> your $100 membership cost!
                    </div>
                    <p className="mt-2 text-sm text-green-600">
                      You break even after just {Math.ceil(100 / monthlySavings)} weeks of savings!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">Where You'll Save Money</h2>
                <p className="mt-2 text-muted-foreground">RTM partners across every spending category</p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
                <Card className="text-center hover:shadow-heavy transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">🍽️</div>
                    <h3 className="font-semibold">Restaurants</h3>
                    <div className="text-primary font-bold mt-1">10-30% off</div>
                    <p className="text-sm text-muted-foreground mt-2">1,200+ locations</p>
                  </CardContent>
                </Card>
                <Card className="text-center hover:shadow-heavy transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">🛍️</div>
                    <h3 className="font-semibold">Retail</h3>
                    <div className="text-primary font-bold mt-1">15-40% off</div>
                    <p className="text-sm text-muted-foreground mt-2">2,300+ stores</p>
                  </CardContent>
                </Card>
                <Card className="text-center hover:shadow-heavy transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">🏥</div>
                    <h3 className="font-semibold">Health</h3>
                    <div className="text-primary font-bold mt-1">10-25% off</div>
                    <p className="text-sm text-muted-foreground mt-2">680+ providers</p>
                  </CardContent>
                </Card>
                <Card className="text-center hover:shadow-heavy transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">🏠</div>
                    <h3 className="font-semibold">Home Services</h3>
                    <div className="text-primary font-bold mt-1">5-20% off</div>
                    <p className="text-sm text-muted-foreground mt-2">890+ contractors</p>
                  </CardContent>
                </Card>
                <Card className="text-center hover:shadow-heavy transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">🚗</div>
                    <h3 className="font-semibold">Automotive</h3>
                    <div className="text-primary font-bold mt-1">10-30% off</div>
                    <p className="text-sm text-muted-foreground mt-2">540+ shops</p>
                  </CardContent>
                </Card>
                <Card className="text-center hover:shadow-heavy transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">✈️</div>
                    <h3 className="font-semibold">Travel</h3>
                    <div className="text-primary font-bold mt-1">15-50% off</div>
                    <p className="text-sm text-muted-foreground mt-2">320+ partners</p>
                  </CardContent>
                </Card>
                <Card className="text-center hover:shadow-heavy transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">💇</div>
                    <h3 className="font-semibold">Beauty</h3>
                    <div className="text-primary font-bold mt-1">15-35% off</div>
                    <p className="text-sm text-muted-foreground mt-2">450+ salons</p>
                  </CardContent>
                </Card>
                <Card className="text-center hover:shadow-heavy transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">🎓</div>
                    <h3 className="font-semibold">Education</h3>
                    <div className="text-primary font-bold mt-1">10-40% off</div>
                    <p className="text-sm text-muted-foreground mt-2">220+ courses</p>
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
