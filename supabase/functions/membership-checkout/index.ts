import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLACEHOLDER_PRICE_IDS = new Set([
  "price_basic_year",
  "price_premium_year",
  "price_pro_year",
]);

const FALLBACK_PLAN_CATALOG = {
  basic: { id: "basic", name: "Basic", price: 99.99 },
  premium: { id: "premium", name: "Premium", price: 149.99 },
  pro: { id: "pro", name: "Pro", price: 199.99 },
} as const;

async function requireUser(req: Request, supabaseUrl: string) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!anonKey) {
    throw new Error("Supabase anon key not configured");
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await authClient.auth.getUser();
  if (error || !data.user) {
    throw new Error("Unauthorized");
  }
  return data.user;
}

function resolveStripePriceId(plan: { name: string; stripe_price_id?: string | null }) {
  if (plan.stripe_price_id && !PLACEHOLDER_PRICE_IDS.has(plan.stripe_price_id)) {
    return plan.stripe_price_id;
  }

  const planEnvMap: Record<string, string> = {
    Basic: "STRIPE_PRICE_BASIC_YEAR",
    Premium: "STRIPE_PRICE_PREMIUM_YEAR",
    Pro: "STRIPE_PRICE_PRO_YEAR",
  };

  const envKey = planEnvMap[plan.name];
  const envPriceId = envKey ? Deno.env.get(envKey) : null;

  if (envPriceId) {
    return envPriceId;
  }

  return plan.stripe_price_id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planId } = await req.json();

    if (!planId) {
      throw new Error("Missing planId");
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Stripe not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const user = await requireUser(req, supabaseUrl);
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get plan details
    const { data: planRow } = await supabase
      .from("membership_plans")
      .select("*")
      .eq("id", planId)
      .single();

    const fallbackPlan = FALLBACK_PLAN_CATALOG[planId.toLowerCase() as keyof typeof FALLBACK_PLAN_CATALOG];
    const plan = planRow ?? fallbackPlan;

    if (!plan) throw new Error("Plan not found");

    const customerEmail = user?.email;

    const priceId = resolveStripePriceId(plan);
    if (!priceId) {
      throw new Error(
        `No Stripe price ID configured for plan: ${plan.name}. Set membership_plans.stripe_price_id or the ${plan.name.toUpperCase()} yearly Stripe env variable.`,
      );
    }

    if (PLACEHOLDER_PRICE_IDS.has(priceId)) {
      throw new Error(
        `Stripe price ID for plan ${plan.name} is still a placeholder (${priceId}). Replace it in membership_plans or set the matching Supabase function env variable.`,
      );
    }

    const baseUrl = Deno.env.get("SITE_URL") || "https://rtmbusinessdirectory.com";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${baseUrl}/deals?canceled=true`,
      metadata: {
        userId: user.id,
        planId,
        planName: plan.name,
      },
    });

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Membership checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
