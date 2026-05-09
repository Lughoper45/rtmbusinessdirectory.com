import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight,
  CalendarClock,
  Car,
  Check,
  Clock3,
  Crown,
  HeartPulse,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Ticket,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FALLBACK_MEMBERSHIP_PLANS, type MembershipPlan } from "@/data/membershipPlans";
import { openMembershipJoin } from "@/lib/site";
import { toast } from "sonner";

interface UserMembership {
  id: string;
  plan_id: string | null;
  status: string;
  expires_at: string;
}

const heroHighlights = [
  { value: "$100 CAD", label: "Annual member fee" },
  { value: "5-50%", label: "Partner discounts" },
  { value: "Same day", label: "Digital card access" },
];

const stats = [
  { value: "$100 CAD", label: "Join once per year" },
  { value: "5-50%", label: "Save at partner stores" },
  { value: "90 days", label: "Community fund waiting period" },
  { value: "$1,000", label: "Maximum aid request" },
];

const painPoints = [
  "You want to know if RTM is real before you pay.",
  "You need savings you can use right away, not complicated points.",
  "You want honest rules around the fund, referrals, and what is not guaranteed.",
];

const solutions = [
  "The day you join, you get a digital RTM Member Card for partner discounts.",
  "After 90 days, active members can apply to the RTM Community Fund when life gets hard.",
  "70 cents of every $100 membership goes directly into the shared member fund.",
];

const howItWorks = [
  {
    title: "Join for $100",
    description: "Create your account and pay the annual RTM membership fee.",
  },
  {
    title: "Use your card",
    description: "Show your digital RTM Member Card at partner stores and save 5% to 50%.",
  },
  {
    title: "Get backup",
    description: "After 90 days of active membership, apply for community support if something unexpected hits.",
  },
];

const categories = [
  { title: "Restaurants and dining", range: "10-30% off", count: "1,200+ locations", icon: UtensilsCrossed },
  { title: "Retail and shopping", range: "15-40% off", count: "2,300+ stores", icon: ShoppingBag },
  { title: "Health and wellness", range: "10-25% off", count: "680+ providers", icon: HeartPulse },
  { title: "Home services", range: "5-20% off", count: "890+ contractors", icon: Store },
  { title: "Automotive", range: "10-30% off", count: "540+ shops", icon: Car },
  { title: "Travel and hotels", range: "15-50% off", count: "320+ partners", icon: MapPin },
];

const testimonials = [
  {
    name: "Sarah Martinez",
    location: "Toronto, ON",
    initials: "SM",
    savings: "Saved $2,140 in 2024",
    quote:
      "I was skeptical at first, but RTM has saved my family real money across restaurants, groceries, and even repairs. It paid for itself quickly.",
  },
  {
    name: "Ahmed Khan",
    location: "Vancouver, BC",
    initials: "AK",
    savings: "Saved $1,850 and gained customers",
    quote:
      "I joined as a member and also listed my business. That combination made the value clearer because I could see both the consumer and partner side.",
  },
  {
    name: "Maria Garcia",
    location: "Montreal, QC",
    initials: "MG",
    savings: "Saved $3,240 in 2024",
    quote:
      "Premium ended up being the right fit for our household. The dining savings alone made the membership feel easy to justify.",
  },
];

const faqs = [
  {
    question: "When does my card work?",
    answer:
      "The same day you pay. Your digital RTM Member Card is available immediately after membership activation.",
  },
  {
    question: "Is this a pyramid scheme?",
    answer:
      "No. Members can earn from people they directly invite and one level below them. That is where it stops by design.",
  },
  {
    question: "What if I never need the fund?",
    answer:
      "You still save money whenever you shop at a participating partner store. The fund is backup, not the only reason to join.",
  },
  {
    question: "Is my money guaranteed?",
    answer:
      "No. The fund helps members based on available money and reviewed applications. It is community aid, not insurance.",
  },
];

const currency = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

const Membership = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [dineOut, setDineOut] = useState(4);
  const [shopping, setShopping] = useState(500);
  const [services, setServices] = useState(200);

  useEffect(() => {
    void loadPage();
  }, []);

  const loadPage = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    const membershipPromise = currentUser
      ? supabase
          .from("user_memberships")
          .select("id, plan_id, status, expires_at")
          .eq("user_id", currentUser.id)
          .eq("status", "active")
          .gt("expires_at", new Date().toISOString())
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    const { data: membershipData } = await membershipPromise;

    setPlans(FALLBACK_MEMBERSHIP_PLANS);
    setMembership(membershipData);
  };

  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === membership?.plan_id) ?? null,
    [membership, plans],
  );

  const calculator = useMemo(() => {
    const diningMonthly = dineOut * 40 * 0.15;
    const shoppingMonthly = shopping * 0.15;
    const servicesMonthly = services * 0.15;
    const monthlyTotal = diningMonthly + shoppingMonthly + servicesMonthly;
    const annualTotal = monthlyTotal * 12;
    const baselinePlanPrice = plans[0]?.price ?? 99.99;
    const roi = annualTotal > 0 ? annualTotal / baselinePlanPrice : 0;
    const breakEvenWeeks = monthlyTotal > 0 ? Math.ceil((baselinePlanPrice / monthlyTotal) * 4) : 0;

    return {
      diningMonthly,
      shoppingMonthly,
      servicesMonthly,
      annualTotal,
      roi,
      breakEvenWeeks,
      baselinePlanPrice,
    };
  }, [dineOut, plans, services, shopping]);

  const handleCheckout = async (_plan: MembershipPlan) => {
    openMembershipJoin();
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <Helmet>
        <title>RTM Membership | Save More Across Canada</title>
        <meta
          name="description"
          content="Join RTM for $100/year, get a digital discount card, save 5% to 50% at partner stores, and become eligible for community aid after 90 days."
        />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <Navbar />

        <main>
          <section className="relative overflow-hidden bg-[linear-gradient(135deg,hsl(352_82%_49%)_0%,hsl(0_83%_26%)_100%)] text-primary-foreground">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_20%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(0,0,0,0.16),transparent_36%)]" />
            <div className="container relative z-10 mx-auto max-w-[1280px] px-6 py-16 md:py-24">
              <div className="mx-auto max-w-4xl text-center">
                <Badge className="border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                  <Sparkles className="mr-2 h-4 w-4" />
                  RTM membership
                </Badge>
                <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight text-white md:text-6xl">
                  Pay $100. Save real money at local stores. Get backup when life gets hard.
                </h1>
                <p className="mx-auto mt-6 max-w-3xl text-lg text-white/85 md:text-2xl">
                  RTM is a members-only discount card and community fund. Join once a year. Use it every week.
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {heroHighlights.map((item) => (
                    <div key={item.label} className="rounded-3xl border border-white/15 bg-white/10 px-5 py-5 backdrop-blur">
                      <div className="text-3xl font-black text-white">{item.value}</div>
                      <div className="mt-1 text-sm uppercase tracking-[0.16em] text-white/70">{item.label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                  <Button variant="heroWhite" size="xl" onClick={() => scrollTo("plans")}>
                    Join RTM - $100/year
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  <Button variant="heroOutline" size="xl" onClick={() => scrollTo("calculator")}>
                    Calculate Savings
                  </Button>
                </div>

                <p className="mt-5 text-sm font-medium text-white/75">
                  Takes 5 minutes. Discount card is ready immediately.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-zinc-950 py-10 text-white">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-3xl font-black text-amber-300">{stat.value}</div>
                    <div className="mt-2 text-sm text-white/70">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-stone-50 py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  What you get immediately
                </Badge>
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                  Your digital RTM Member Card starts working the day you join
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Show it at any partner store and get 5% to 50% off groceries, services, restaurants, and more. No points. No complicated app to figure out. Just show the card and save.
                </p>
              </div>

              <div className="mt-12 grid gap-6 lg:grid-cols-2">
                <Card className="border-primary/20 shadow-medium">
                  <CardHeader>
                    <CardTitle className="text-2xl text-primary">What people need to know first</CardTitle>
                    <CardDescription>Simple answers before anyone pays.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      {painPoints.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-muted-foreground">
                          <div className="mt-0.5 rounded-full bg-primary/10 p-1 text-primary">
                            <Clock3 className="h-4 w-4" />
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-emerald-200 bg-[linear-gradient(135deg,hsl(152_69%_45%)_0%,hsl(155_76%_33%)_100%)] text-white shadow-medium">
                  <CardHeader>
                    <CardTitle className="text-2xl">How RTM answers it</CardTitle>
                    <CardDescription className="text-white/80">
                      Clear benefits, clear rules, and no income promises.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      {solutions.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-white/90">
                          <div className="mt-0.5 rounded-full bg-white/15 p-1 text-white">
                            <Check className="h-4 w-4" />
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
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
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Join once, save right away, apply for support after 90 days</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  The membership flow is simple: pay, receive your digital card, use your savings, and become eligible for community support after the waiting period.
                </p>
              </div>

              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {howItWorks.map((step, index) => (
                  <Card key={step.title} className="border-border/70 text-center shadow-medium">
                    <CardContent className="p-8">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,hsl(352_82%_49%)_0%,hsl(43_100%_56%)_100%)] text-xl font-black text-white">
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

          <section id="calculator" className="bg-[linear-gradient(135deg,hsl(210_20%_96%)_0%,hsl(30_25%_93%)_100%)] py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  What you can save
                </Badge>
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                  Will you save more than your membership cost?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Most members are looking for everyday value first. Use typical monthly habits to estimate how quickly RTM can pay for itself.
                </p>
              </div>

              <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <Card className="border-border/70 shadow-heavy">
                  <CardHeader>
                    <CardTitle className="text-2xl">Personal savings calculator</CardTitle>
                    <CardDescription>Adjust the ranges based on monthly spending habits.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <label htmlFor="dine-out" className="font-semibold text-foreground">
                          Dining out per month
                        </label>
                        <span className="font-semibold text-foreground">{dineOut} times</span>
                      </div>
                      <input
                        id="dine-out"
                        type="range"
                        min="0"
                        max="30"
                        value={dineOut}
                        onChange={(event) => setDineOut(Number(event.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
                      />
                      <p className="mt-2 text-sm font-medium text-emerald-600">
                        Estimated savings: {currency.format(calculator.diningMonthly)}/month
                      </p>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <label htmlFor="shopping" className="font-semibold text-foreground">
                          Monthly shopping budget
                        </label>
                        <span className="font-semibold text-foreground">{currency.format(shopping)}</span>
                      </div>
                      <input
                        id="shopping"
                        type="range"
                        min="0"
                        max="2000"
                        step="50"
                        value={shopping}
                        onChange={(event) => setShopping(Number(event.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
                      />
                      <p className="mt-2 text-sm font-medium text-emerald-600">
                        Estimated savings: {currency.format(calculator.shoppingMonthly)}/month
                      </p>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <label htmlFor="services" className="font-semibold text-foreground">
                          Monthly services budget
                        </label>
                        <span className="font-semibold text-foreground">{currency.format(services)}</span>
                      </div>
                      <input
                        id="services"
                        type="range"
                        min="0"
                        max="1000"
                        step="25"
                        value={services}
                        onChange={(event) => setServices(Number(event.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
                      />
                      <p className="mt-2 text-sm font-medium text-emerald-600">
                        Estimated savings: {currency.format(calculator.servicesMonthly)}/month
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,hsl(352_82%_49%)_0%,hsl(0_83%_26%)_100%)] text-white shadow-heavy">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white">Your estimated annual savings</CardTitle>
                    <CardDescription className="text-white/75">
                      Benchmarked against the current lowest annual RTM plan.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-5xl font-black tracking-tight text-amber-300">
                      {currency.format(calculator.annualTotal)}
                    </div>
                    <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                      <div className="text-lg text-white/80">Return vs membership cost</div>
                      <div className="mt-2 text-3xl font-black">
                        {calculator.roi > 0 ? `${calculator.roi.toFixed(1)}x` : "0x"} your{" "}
                        {currency.format(calculator.baselinePlanPrice)} plan
                      </div>
                    </div>
                    <div className="rounded-3xl border border-white/15 bg-black/10 p-5">
                      <div className="text-lg font-semibold">
                        {calculator.breakEvenWeeks > 0
                          ? `Break even in about ${calculator.breakEvenWeeks} ${calculator.breakEvenWeeks === 1 ? "week" : "weeks"}`
                          : "Adjust the sliders to estimate break-even timing"}
                      </div>
                      <p className="mt-2 text-sm text-white/70">
                      This is an estimate, not a guarantee. Actual savings depend on where and how often you use your card.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  Where members save
                </Badge>
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Use your RTM card for everyday spending</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  RTM is strongest when members can use it in normal weekly life: food, services, retail, wellness, automotive, and travel.
                </p>
              </div>

              <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {categories.map((category) => {
                  const Icon = category.icon;

                  return (
                    <Card
                      key={category.title}
                      className="border-border/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow"
                    >
                      <CardContent className="p-8 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                          <Icon className="h-8 w-8" />
                        </div>
                        <h3 className="mt-5 text-2xl font-bold">{category.title}</h3>
                        <div className="mt-2 text-lg font-bold text-primary">{category.range}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{category.count}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          <section id="plans" className="bg-zinc-950 py-20 text-white md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="mx-auto max-w-3xl text-center">
                <Badge className="border-white/15 bg-white/10 text-white">
                  Join RTM
                </Badge>
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Join RTM - $100/year</h2>
                <p className="mt-4 text-lg text-white/70">
                  One annual membership unlocks your digital card, your dashboard, optional referral earnings, and future Community Fund eligibility.
                </p>
              </div>

              <div className="mt-12 grid gap-6 lg:grid-cols-3">
                {plans.map((plan, index) => {
                  const isFeatured = true;

                  return (
                    <Card
                      key={plan.id}
                      className={`relative overflow-hidden border bg-white text-foreground shadow-heavy transition-transform duration-300 ${
                        isFeatured ? "scale-[1.02] border-amber-400" : "border-white/10"
                      }`}
                    >
                      {isFeatured ? (
                        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[linear-gradient(135deg,hsl(352_82%_49%)_0%,hsl(43_100%_56%)_100%)] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white">
                          Active offer
                        </div>
                      ) : null}

                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <Crown className="h-5 w-5 text-primary" />
                          <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        </div>
                        <CardDescription>{plan.description ?? "Annual RTM membership access."}</CardDescription>
                        <div className="pt-4">
                          <div className="text-5xl font-black tracking-tight text-primary">${plan.price.toFixed(2)}</div>
                          <div className="mt-1 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">CAD per member</div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-5">
                        <ul className="space-y-3">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                              <div className="mt-0.5 rounded-full bg-emerald-100 p-1 text-emerald-600">
                                <Check className="h-3.5 w-3.5" />
                              </div>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="grid gap-3 rounded-3xl bg-muted/50 p-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            Checkout remains tied to RTM membership fulfillment.
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-primary" />
                            Annual billing keeps the page aligned with the current product model.
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-2">
                        <Button
                          className="w-full"
                          variant={isFeatured ? "hero" : "outline"}
                          onClick={() => void handleCheckout(plan)}
                        >
                          Join RTM - $100/year
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <Card className="border-white/10 bg-white/5 text-white shadow-medium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-white">
                      <Wallet className="h-5 w-5 text-amber-300" />
                      Membership status
                    </CardTitle>
                    <CardDescription className="text-white/65">Current access state for the signed-in user.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-white/55">Status</div>
                      <div className="mt-2 text-2xl font-black">{membership ? "Active" : "Inactive"}</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-white/55">Plan</div>
                      <div className="mt-2 text-2xl font-black">{activePlan?.name ?? "None"}</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-white/55">Valid until</div>
                      <div className="mt-2 text-lg font-bold">
                        {membership ? new Date(membership.expires_at).toLocaleDateString() : "Activate a plan"}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))] text-white shadow-medium">
                  <CardContent className="p-8">
                    <div className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-300">Community Fund</div>
                    <h3 className="mt-3 text-2xl font-black">After 90 days, active members can apply for backup.</h3>
                    <p className="mt-3 text-white/70">
                      If something unexpected hits - a medical bill, job loss, or car repair - you can apply for up to $1,000. This is not insurance. It is neighbours helping neighbours through a shared pool.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="bg-stone-50 py-20 md:py-24">
            <div className="container mx-auto max-w-[1280px] px-6">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  Member proof
                </Badge>
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Why people join</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  People should join for savings first, community backup second, and optional referral earnings third.
                </p>
              </div>

              <div className="mt-12 grid gap-6 lg:grid-cols-3">
                {testimonials.map((item) => (
                  <Card key={item.name} className="border-border/70 shadow-medium">
                    <CardContent className="p-8">
                      <div className="text-lg tracking-[0.3em] text-amber-500">★★★★★</div>
                      <p className="mt-4 text-muted-foreground">{item.quote}</p>
                      <div className="mt-6 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,hsl(352_82%_49%)_0%,hsl(43_100%_56%)_100%)] font-bold text-white">
                          {item.initials}
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.location}</div>
                          <div className="mt-1 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {item.savings}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20 md:py-24">
            <div className="container mx-auto max-w-[960px] px-6">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  FAQ
                </Badge>
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Frequently asked questions</h2>
                <p className="mt-4 text-lg text-muted-foreground">Plain answers before you join.</p>
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

          <section className="bg-[linear-gradient(135deg,hsl(352_82%_49%)_0%,hsl(0_83%_26%)_100%)] py-20 text-white">
            <div className="container mx-auto max-w-[1280px] px-6 text-center">
              <h2 className="text-3xl font-black tracking-tight md:text-5xl">Join RTM - $100/year</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80 md:text-xl">
                Takes 5 minutes. Your discount card is ready immediately after membership activation.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Button variant="heroWhite" size="xl" onClick={() => scrollTo("plans")}>
                  Join RTM - $100/year
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button variant="heroOutline" size="xl" onClick={() => navigate("/deals")}>
                  Explore Deals First
                </Button>
              </div>

              <div className="mx-auto mt-8 inline-flex rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white/90 backdrop-blur">
                RTM is community aid, not insurance or an investment. Income is not guaranteed.
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
