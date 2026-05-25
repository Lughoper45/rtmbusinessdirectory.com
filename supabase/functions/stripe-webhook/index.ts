import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13?target=deno";
import { Resend } from "https://esm.sh/resend@3.1.0";

const RTM_NOTIFY_EMAIL = "info@rtmbusinessdirectory.com";
const FROM_ADDRESS = "RTM Grants <noreply@rtmbusinessdirectory.com>";

async function notifyAdvisorPackagePurchase(opts: {
  orderId: string;
  packageId: string;
  grantId: string;
  userId: string;
  intakeId: string;
}) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return;

  const resend = new Resend(resendKey);
  const adminUrl = "https://rtmbusinessdirectory.com/admin/grants";
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: RTM_NOTIFY_EMAIL,
    subject: `New grant package order — ${opts.packageId}`,
    html: `<p><strong>Package purchased:</strong> ${opts.packageId}</p>
<p>Grant: ${opts.grantId}<br/>Order: ${opts.orderId}<br/>Intake: ${opts.intakeId}<br/>User: ${opts.userId}</p>
<p><a href="${adminUrl}">Open admin grants →</a></p>`,
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fulfillGrowthPackageOrder(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session,
) {
  if (session.metadata?.checkoutType !== "growth_package") return false;

  const orderId = session.metadata?.orderId;
  const engagementId = session.metadata?.engagementId;
  const userId = session.metadata?.userId;
  const packageId = session.metadata?.packageId;

  if (!orderId || !engagementId || !userId || !packageId) {
    console.error("[stripe-webhook] growth_package missing metadata", session.metadata);
    return true;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const { error: orderError } = await supabase
    .from("growth_service_orders")
    .update({
      status: "paid",
      stripe_checkout_session_id: session.id,
      stripe_subscription_id: subscriptionId,
      stripe_payment_intent_id: paymentIntentId,
      engagement_id: engagementId,
    })
    .eq("id", orderId);

  if (orderError) throw orderError;

  const { error: engagementError } = await supabase
    .from("growth_engagements")
    .update({
      status: "active",
      started_at: new Date().toISOString(),
      order_id: orderId,
    })
    .eq("id", engagementId);

  if (engagementError) throw engagementError;

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (resendKey) {
    const resend = new Resend(resendKey);
    const growUrl = Deno.env.get("GROW_APP_URL") || "https://grow.rtmbusinessdirectory.com";
    await resend.emails.send({
      from: "RTM Growth Services <noreply@rtmbusinessdirectory.com>",
      to: RTM_NOTIFY_EMAIL,
      subject: `New growth subscription — ${packageId}`,
      html: `<p><strong>Package:</strong> ${packageId}</p>
<p>Engagement: ${engagementId}<br/>Order: ${orderId}<br/>User: ${userId}</p>
<p><a href="https://rtmbusinessdirectory.com/admin/growth">Open admin growth →</a></p>
<p><a href="${growUrl}/workspace">Client workspace →</a></p>`,
    });
  }

  return true;
}

async function fulfillGrantPackageOrder(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session,
) {
  if (session.metadata?.checkoutType !== "grant_package") return false;

  const orderId = session.metadata?.orderId;
  const grantId = session.metadata?.grantId;
  const userId = session.metadata?.userId;
  const packageId = session.metadata?.packageId;

  if (!orderId || !grantId || !userId || !packageId) {
    console.error("[stripe-webhook] grant_package missing metadata", session.metadata);
    return true;
  }

  const { data: order, error: orderError } = await supabase
    .from("grant_service_orders")
    .select("id, status, intake_id, user_id, package_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) {
    console.error("[stripe-webhook] grant_service_order not found:", orderId);
    return true;
  }

  if (order.status === "paid" && order.intake_id) {
    return true;
  }

  let intakeId = order.intake_id as string | null;

  if (!intakeId) {
    const { data: existingIntakes } = await supabase
      .from("grant_intakes")
      .select("id")
      .eq("user_id", userId)
      .eq("grant_id", grantId)
      .eq("service_order_id", orderId)
      .limit(1);

    intakeId = existingIntakes?.[0]?.id ?? null;
  }

  if (!intakeId) {
    const { data: intake, error: intakeError } = await supabase
      .from("grant_intakes")
      .insert({
        user_id: userId,
        grant_id: grantId,
        package_id: packageId,
        service_order_id: orderId,
        source: "package_checkout",
        status: "draft",
      })
      .select("id")
      .single();

    if (intakeError) throw intakeError;
    intakeId = intake.id;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const { error: updateError } = await supabase
    .from("grant_service_orders")
    .update({
      status: "paid",
      intake_id: intakeId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("id", orderId);

  if (updateError) throw updateError;

  await notifyAdvisorPackagePurchase({
    orderId,
    packageId,
    grantId,
    userId,
    intakeId,
  });

  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey || !webhookSecret) {
      throw new Error("Stripe not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No signature");
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err}`);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const isGrowthPackage = await fulfillGrowthPackageOrder(supabase, session);
        if (isGrowthPackage) break;

        const isGrantPackage = await fulfillGrantPackageOrder(supabase, session);
        if (isGrantPackage) break;

        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;
        const customerEmail =
          session.customer_email?.toLowerCase() ||
          session.customer_details?.email?.toLowerCase() ||
          null;

        if (userId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          await supabase.from("subscriptions").upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
            stripe_price_id: subscription.items.data[0].price.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          });
        }

        if (customerEmail || userId) {
          const provisionUrl = `${supabaseUrl}/functions/v1/provision-member-account`;
          try {
            const provisionRes = await fetch(provisionUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${supabaseKey}`,
                apikey: supabaseKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: customerEmail,
                userId: userId ?? undefined,
                source: "stripe-webhook",
              }),
            });
            if (!provisionRes.ok) {
              const errText = await provisionRes.text();
              console.error("[stripe-webhook] provision-member-account failed:", errText);
            }
          } catch (provisionErr) {
            console.error("[stripe-webhook] provision-member-account error:", provisionErr);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        
        await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_customer_id", invoice.customer as string);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});