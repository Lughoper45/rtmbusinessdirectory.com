import { loadStripe, Stripe } from "@stripe/stripe-js";
import { supabase } from "@/integrations/supabase/client";

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

export const createCheckoutSession = async (priceId: string, userId: string) => {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ priceId, userId }),
  });

  const { sessionId, error } = await response.json();
  if (error) throw new Error(error);
  return sessionId;
};

export const createPortalSession = async (userId: string) => {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ userId }),
  });

  const { url, error } = await response.json();
  if (error) throw new Error(error);
  return url;
};

export const redirectToCheckout = async (priceId: string) => {
  const sessionId = await createCheckoutSession(priceId, "demo-user");
  window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
};

export const createMembershipCheckout = async (planId: string, userId: string) => {
  const { data, error } = await supabase.functions.invoke<MembershipCheckoutResponse>("membership-checkout", {
    body: { planId, userId },
  });

  if (error) {
    const message =
      typeof error.context === "string"
        ? error.context
        : error.message || "Membership checkout failed.";
    throw new Error(message);
  }

  if (!data?.url) {
    throw new Error("Membership checkout URL was not returned.");
  }

  return data.url;
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
