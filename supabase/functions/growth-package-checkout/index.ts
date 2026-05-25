import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13?target=deno";
import {
  getGrowthPackage,
  isGrowthPackageId,
  resolveGrowthPackageAmountCents,
} from "../_shared/growthPackages.ts";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";

type CheckoutBody = {
  package_id?: string;
  audit_lead_id?: string;
  business_name?: string;
};

async function requireUser(req: Request, supabaseUrl: string, anonKey: string) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await authClient.auth.getUser();
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user;
}

async function isActiveMember(
  admin: ReturnType<typeof createClient>,
  userId: string,
  email: string | null | undefined,
) {
  const { data: byId } = await admin
    .from("profiles")
    .select("membership_status")
    .eq("id", userId)
    .maybeSingle();
  if (byId?.membership_status === "active") return true;

  const { data: byUserId } = await admin
    .from("profiles")
    .select("membership_status")
    .eq("user_id", userId)
    .maybeSingle();
  if (byUserId?.membership_status === "active") return true;

  if (email) {
    const { data: byEmail } = await admin
      .from("profiles")
      .select("membership_status")
      .ilike("email", email)
      .maybeSingle();
    if (byEmail?.membership_status === "active") return true;
  }

  const { data: legacy } = await admin
    .from("user_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return !!legacy;
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    const body = (await req.json()) as CheckoutBody;
    const packageId = body.package_id?.trim();
    if (!packageId || !isGrowthPackageId(packageId)) {
      return jsonResponse(req, { error: "Invalid package_id." }, 400);
    }

    const pkg = getGrowthPackage(packageId)!;
    if (!pkg.subscription) {
      return jsonResponse(
        req,
        { error: "This package requires a custom quote. Use the growth audit or contact RTM." },
        400,
      );
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return jsonResponse(req, { error: "Stripe not configured." }, 500);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !serviceKey || !anonKey) {
      return jsonResponse(req, { error: "Server configuration incomplete." }, 500);
    }

    const user = await requireUser(req, supabaseUrl, anonKey);
    const admin = createClient(supabaseUrl, serviceKey);
    const memberActive = await isActiveMember(admin, user.id, user.email);
    const { amountCents, label, monthlyDollars } = resolveGrowthPackageAmountCents(
      packageId,
      memberActive,
    );

    const businessName = body.business_name?.trim().slice(0, 200) ?? null;
    const auditLeadId = body.audit_lead_id?.trim() || null;

    const { data: engagement, error: engagementError } = await admin
      .from("growth_engagements")
      .insert({
        user_id: user.id,
        package_id: packageId,
        audit_lead_id: auditLeadId,
        business_name: businessName,
        status: "pending_payment",
      })
      .select("id")
      .single();

    if (engagementError || !engagement) {
      throw engagementError ?? new Error("Could not create engagement.");
    }

    const { data: order, error: orderError } = await admin
      .from("growth_service_orders")
      .insert({
        user_id: user.id,
        package_id: packageId,
        amount_cents: amountCents,
        currency: "cad",
        billing_interval: "month",
        member_active: memberActive,
        status: "pending",
        engagement_id: engagement.id,
        audit_lead_id: auditLeadId,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      throw orderError ?? new Error("Could not create service order.");
    }

    await admin
      .from("growth_engagements")
      .update({ order_id: order.id })
      .eq("id", engagement.id);

    const growAppUrl =
      Deno.env.get("GROW_APP_URL") ||
      Deno.env.get("SITE_URL")?.replace("www.", "grow.") ||
      "https://grow.rtmbusinessdirectory.com";

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    const successUrl =
      `${growAppUrl}/workspace?checkout=success&engagement=${encodeURIComponent(engagement.id)}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${growAppUrl}/packages?checkout=canceled&package=${encodeURIComponent(packageId)}`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      ...(user.email ? { customer_email: user.email } : {}),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: amountCents,
            recurring: { interval: "month" },
            product_data: {
              name: `RTM ${pkg.name}`,
              description: `Monthly growth services — $${monthlyDollars}/mo CAD`,
              metadata: { growth_package_id: packageId },
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        checkoutType: "growth_package",
        userId: user.id,
        packageId,
        orderId: order.id,
        engagementId: engagement.id,
        memberActive: memberActive ? "true" : "false",
        priceLabel: label,
      },
    });

    await admin
      .from("growth_service_orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    return jsonResponse(req, {
      sessionId: session.id,
      url: session.url,
      orderId: order.id,
      engagementId: engagement.id,
      amountCents,
      memberActive,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    console.error("[growth-package-checkout]", message);
    return jsonResponse(req, { error: message }, message === "Unauthorized" ? 401 : 500);
  }
});
