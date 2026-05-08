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
    id: "rtm-member",
    name: "RTM Member",
    description: "One membership for savings, referral earnings, and community support access",
    price: 100,
    interval: "one-time",
    features: [
      "Digital member dashboard",
      "5-50% discounts at participating businesses",
      "30% direct referral commission",
      "10% second-level referral commission",
      "70% contribution to the Member Benefit Pool",
    ],
  },
];
