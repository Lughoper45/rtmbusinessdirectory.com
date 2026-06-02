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

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.email) {
    await supabase.rpc("upsert_crm_contact", {
      p_email: profile.email,
      p_source: "growth_package",
      p_tags: ["growth_client"],
    });
    await supabase
      .from("crm_contacts")
      .update({ stage: "client", updated_at: new Date().toISOString() })
      .ilike("email", profile.email);
  }

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

  const { data: grantProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  if (grantProfile?.email) {
    await supabase.rpc("upsert_crm_contact", {
      p_email: grantProfile.email,
      p_source: "grant_package",
      p_tags: ["grant_client"],
    });
    await supabase
      .from("crm_contacts")
      .update({ stage: "client", updated_at: new Date().toISOString() })
      .ilike("email", grantProfile.email);
  }

  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey) {
      console.error("[stripe-webhook] STRIPE_SECRET_KEY not set");
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!webhookSecret) {
      console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set — cannot verify signature");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("[stripe-webhook] Missing stripe-signature header");
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[stripe-webhook] Signature verification failed:", msg);
      // Return 400 so Stripe stops retrying — this is not a recoverable server error
      return new Response(JSON.stringify({ error: `Webhook signature invalid: ${msg}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            await supabase.from("subscriptions").upsert({
              user_id: userId,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: session.customer as string,
              stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            });
          } catch (subErr) {
            // Non-fatal — log and continue to provision member account
            console.error("[stripe-webhook] subscription upsert failed:", subErr instanceof Error ? subErr.message : subErr);
          }
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
            } else {
              const provisionBody = await provisionRes.json().catch(() => ({})) as { userId?: string };
              const profileId = provisionBody.userId ?? userId;
              if (profileId) {
                try {
                  const welcomeRes = await fetch(`${supabaseUrl}/functions/v1/send-member-email`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${supabaseKey}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ profileId, template: "activation_welcome" }),
                  });
                  if (!welcomeRes.ok) {
                    console.error(
                      "[stripe-webhook] activation_welcome failed:",
                      await welcomeRes.text(),
                    );
                  }
                } catch (welcomeErr) {
                  console.error("[stripe-webhook] activation_welcome error:", welcomeErr);
                }
              }
            }
          } catch (provisionErr) {
            console.error("[stripe-webhook] provision-member-account error:", provisionErr);
          }

          // Provision free education grant access on govgranteducation.ca
          try {
            const eduRes = await fetch(`${supabaseUrl}/functions/v1/provision-edu-grant`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${supabaseKey}`,
                apikey: supabaseKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: customerEmail,
                userId: userId ?? undefined,
                memberName: session.customer_details?.name ?? undefined,
              }),
            });
            if (!eduRes.ok) {
              console.error("[stripe-webhook] provision-edu-grant failed:", await eduRes.text());
            }
          } catch (eduErr) {
            console.error("[stripe-webhook] provision-edu-grant error:", eduErr);
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
    const message = error instanceof Error ? error.message : String(error);
    console.error("[stripe-webhook] Unhandled error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});