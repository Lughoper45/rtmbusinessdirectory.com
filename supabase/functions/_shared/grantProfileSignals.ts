import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEAK_ONLINE = ["none", "no website", "not yet", "no", "facebook only"];

export function profileJsonFields(profileJson: Record<string, unknown> | null | undefined) {
  const p = profileJson ?? {};
  return {
    businessName: String(p.businessName ?? p.business_name ?? "").trim(),
    province: String(p.province ?? p.location ?? p.province_code ?? "Canada").trim() || "Canada",
    sector: String(p.sector ?? p.industry ?? "").trim(),
  };
}

/** Heuristic: missing website / weak online presence signals in grant profile or directory listing. */
export function profileIndicatesLowDigitalPresence(
  profileJson: Record<string, unknown> | null | undefined,
): boolean {
  const p = profileJson ?? {};
  const website = String(p.website ?? p.websiteUrl ?? "").trim();
  if (website.length > 6 && !WEAK_ONLINE.some((w) => website.toLowerCase().includes(w))) {
    return false;
  }

  const hasWebsite = p.hasWebsite ?? p.has_website;
  if (hasWebsite === true || hasWebsite === "yes" || hasWebsite === "Yes") {
    return false;
  }

  const online = p.onlinePresence ?? p.online_presence;
  if (Array.isArray(online) && online.length > 0) {
    const normalized = online.map((o) => String(o).toLowerCase());
    const onlyWeak = normalized.every((o) =>
      WEAK_ONLINE.some((w) => o.includes(w)) || o === ""
    );
    if (!onlyWeak) return false;
  }

  return true;
}

export async function hasDirectoryWebsite(
  admin: SupabaseClient,
  email: string,
): Promise<boolean> {
  const { data } = await admin
    .from("businesses")
    .select("website")
    .ilike("owner_email", email)
    .not("website", "is", null)
    .limit(1);

  for (const row of data ?? []) {
    const w = String(row.website ?? "").trim();
    if (w.length > 6) return true;
  }
  return false;
}

export async function memberHasLowDigitalPresence(
  admin: SupabaseClient,
  userId: string,
  email: string,
): Promise<boolean> {
  const { data: gp } = await admin
    .from("grant_profiles")
    .select("profile")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profileIndicatesLowDigitalPresence(gp?.profile as Record<string, unknown>)) {
    return false;
  }

  if (await hasDirectoryWebsite(admin, email)) {
    return false;
  }

  return true;
}
