import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planId, userId } = await req.json();

    if (!planId || !userId) {
      throw new Error("Missing planId or userId");
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Stripe not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get plan details
    const { data: plan } = await supabase
      .from("membership_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (!plan) {
      throw new Error("Plan not found");
    }

    const {
      data: { user },
    } = await supabase.auth.admin.getUserById(userId);

    const customerEmail = user?.email;

    const priceId = plan.stripe_price_id;
    if (!priceId) {
      throw new Error(`No Stripe price ID configured for plan: ${plan.name}`);
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
        userId,
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
