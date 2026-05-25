import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13?target=deno";
import {
  getGrantPackage,
  isGrantPackageId,
  resolvePackageAmountCents,
} from "../_shared/grantPackages.ts";
import {
  handleCorsPreflight,
  jsonResponse,
} from "../_shared/cors.ts";

type CheckoutBody = {
  package_id?: string;
  grant_id?: string;
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
  if (error || !data.user) {
    throw new Error("Unauthorized");
  }
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
    const grantId = body.grant_id?.trim();

    if (!packageId || !isGrantPackageId(packageId)) {
      return jsonResponse(req, { error: "Invalid package_id." }, 400);
    }
    if (!grantId) {
      return jsonResponse(req, { error: "grant_id is required." }, 400);
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
    const pkg = getGrantPackage(packageId)!;
    const { amountCents, label } = resolvePackageAmountCents(packageId, memberActive);

    const { data: grantRow, error: grantError } = await admin
      .from("grants")
      .select("id, name")
      .eq("id", grantId)
      .maybeSingle();

    if (grantError) throw grantError;
    if (!grantRow) {
      return jsonResponse(req, { error: "Grant not found." }, 404);
    }

    const { data: order, error: orderError } = await admin
      .from("grant_service_orders")
      .insert({
        user_id: user.id,
        package_id: packageId,
        amount_cents: amountCents,
        currency: "cad",
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      throw orderError ?? new Error("Could not create service order.");
    }

    const grantsAppUrl =
      Deno.env.get("GRANTS_APP_URL") ||
      Deno.env.get("SITE_URL") ||
      "https://grants.rtmbusinessdirectory.com";

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    const successUrl =
      `${grantsAppUrl}/grants/intake/${encodeURIComponent(grantId)}` +
      `?package=${encodeURIComponent(packageId)}&checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      `${grantsAppUrl}/grants/${encodeURIComponent(grantId)}?checkout=canceled`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      ...(user.email ? { customer_email: user.email } : {}),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: amountCents,
            product_data: {
              name: pkg.name,
              description: `RTM grant advisor package for ${grantRow.name}`,
              metadata: {
                grant_package_id: packageId,
              },
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        checkoutType: "grant_package",
        userId: user.id,
        packageId,
        grantId,
        orderId: order.id,
        memberActive: memberActive ? "true" : "false",
        priceLabel: label,
      },
    });

    await admin
      .from("grant_service_orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    return jsonResponse(req, {
      sessionId: session.id,
      url: session.url,
      orderId: order.id,
      amountCents,
      memberActive,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    console.error("[grant-package-checkout]", message);
    return jsonResponse(req, { error: message }, message === "Unauthorized" ? 401 : 500);
  }
});
