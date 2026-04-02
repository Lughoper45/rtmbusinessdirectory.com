export interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  features: string[];
}

export const FALLBACK_MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Access to all business deals and discounts",
    price: 99.99,
    interval: "year",
    features: [
      "Access to exclusive deals",
      "5-50% discounts at participating businesses",
      "Priority customer support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Basic plus early access to new deals",
    price: 149.99,
    interval: "year",
    features: [
      "All Basic features",
      "Early access to new deals",
      "Featured deals",
      "Deal notifications",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Premium plus affiliate earnings",
    price: 199.99,
    interval: "year",
    features: [
      "All Premium features",
      "30% affiliate commission eligibility",
      "Unlimited referrals",
      "Business listing included",
    ],
  },
];
