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

    const { data: plans, error: plansError } = await supabase
      .from("membership_plans")
      .select("*")
      .order("name");

    if (plansError) throw plansError;

    const results: Record<string, { productId?: string; priceId?: string; error?: string }> = {};

    for (const plan of plans || []) {
      try {
        const product = await stripe.products.create({
          name: `RTM ${plan.name}`,
          description: plan.description || `${plan.name} membership plan`,
          active: true,
        });

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(plan.price * 100),
          currency: "cad",
          recurring: {
            interval: "year",
          },
          active: true,
        });

        await supabase
          .from("membership_plans")
          .update({ stripe_price_id: price.id })
          .eq("id", plan.id);

        results[plan.name] = { productId: product.id, priceId: price.id };
      } catch (err) {
        results[plan.name] = { error: err.message };
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Setup stripe prices error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
