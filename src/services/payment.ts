import { loadStripe, Stripe } from "@stripe/stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { getMembershipJoinUrl } from "@/lib/site";

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  priceId: string;
  features: string[];
  popular?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceId: "",
    features: [
      "Basic business listing",
      "Search visibility",
      "Save up to 10 businesses",
      "Basic categories",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 19,
    priceId: "price_starter_monthly",
    features: [
      "Enhanced business listing",
      "Priority search ranking",
      "Unlimited saves",
      "Basic analytics",
      "Contact form",
    ],
  },
  {
    id: "pro",
    name: "Professional",
    price: 49,
    priceId: "price_pro_monthly",
    popular: true,
    features: [
      "Premium listing with photos",
      "Top search placement",
      "Analytics dashboard",
      "Customer reviews management",
      "Priority support",
      "Custom website link",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    priceId: "price_enterprise_monthly",
    features: [
      "Everything in Pro",
      "Multiple locations",
      "API access",
      "White-label options",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
];

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface MembershipCheckoutResponse {
  sessionId?: string;
  url?: string;
}

export const createCheckoutSession = async (priceId: string, _userId?: string) => {
  const { data, error } = await supabase.functions.invoke<{ sessionId?: string; error?: string }>("create-checkout", {
    body: { priceId },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data?.sessionId;
};

export const createPortalSession = async (_userId?: string) => {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>("create-portal-session");

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.url) {
    throw new Error("Portal session URL was not returned.");
  }
  return data.url;
};

export const redirectToCheckout = async (priceId: string) => {
  const sessionId = await createCheckoutSession(priceId);
  window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
};

/** @deprecated Use membership.rtmbusinessdirectory.com signup instead. */
export const createMembershipCheckout = async (_planId: string, _userId?: string) => {
  return getMembershipJoinUrl({ returnUrl: typeof window !== "undefined" ? window.location.href : null });
};

export const getSubscriptionStatus = async (userId: string): Promise<Subscription | null> => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${userId}&select=*`,
    {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    }
  );
  const data = await response.json();
  return data[0] || null;
};
