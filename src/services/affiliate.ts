import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AffiliateAccount {
  id: string;
  referral_code: string;
  total_earnings: number;
  commission_rate: number;
  status: string;
}

const SELECT_FIELDS = "id, referral_code, total_earnings, commission_rate, status";

function buildReferralCode(user: User) {
  const base = (user.email?.split("@")[0] || "rtm")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();

  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `${base}${suffix}`;
}

export async function getAffiliateAccount(userId: string) {
  const { data, error } = await supabase
    .from("affiliates")
    .select(SELECT_FIELDS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as AffiliateAccount | null) ?? null;
}

export async function ensureAffiliateAccount(user: User): Promise<AffiliateAccount> {
  const existing = await getAffiliateAccount(user.id);
  if (existing) return existing;

  let lastError: unknown = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referralCode = buildReferralCode(user);
    const { data, error } = await supabase
      .from("affiliates")
      .insert({
        user_id: user.id,
        referral_code: referralCode,
        commission_rate: 30,
        total_earnings: 0,
        status: "active",
      })
      .select(SELECT_FIELDS)
      .single();

    if (!error && data) {
      return data as AffiliateAccount;
    }

    lastError = error;
  }

  throw lastError ?? new Error("Unable to create affiliate account.");
}
