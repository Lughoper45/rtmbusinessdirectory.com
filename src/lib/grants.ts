import { stellarSupabase } from "@/integrations/supabase/stellarClient";
import type { GrantProfile, GrantRecord, ScoredGrant } from "@/types/grant";
import { provinceFromLocation } from "@/lib/grantProfile";

function requireClient() {
  return stellarSupabase;
}

export async function fetchActiveGrants(): Promise<GrantRecord[]> {
  const { data, error } = await requireClient()
    .from("grants")
    .select("*")
    .order("match_score", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as GrantRecord[]).filter((g) => g.is_active !== false);
}

export async function fetchGrantById(id: string): Promise<GrantRecord | null> {
  const { data, error } = await requireClient().from("grants").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as GrantRecord | null) ?? null;
}

function sectorMatch(grant: GrantRecord, profile?: GrantProfile): number {
  if (!profile?.industry || !grant.sectors?.length) return 0;
  const industry = profile.industry.toLowerCase();
  const hit = grant.sectors.some((s) => {
    const sector = s.toLowerCase();
    return industry.includes(sector) || sector.includes("general") || sector.includes("export");
  });
  return hit ? 12 : -5;
}

function provinceMatch(grant: GrantRecord, profile?: GrantProfile): number {
  const province = provinceFromLocation(profile?.location);
  if (!province || !grant.provinces?.length) return 0;
  if (grant.provinces.some((p) => p === "All Canada")) return 8;
  return grant.provinces.includes(province) ? 10 : -8;
}

function sizeMatch(grant: GrantRecord, profile?: GrantProfile): number {
  if (!profile?.employeeCount) return 0;
  const count = profile.employeeCount;
  if (grant.id === "nrc-irap" || grant.id === "canexport-smes") {
    return count === "Just me" ? -6 : 6;
  }
  if (grant.id === "wes-loan") return 4;
  return 2;
}

export function scoreGrantForProfile(grant: GrantRecord, profile?: GrantProfile | null): ScoredGrant {
  const base = grant.match_score ?? 60;
  const profileBoost = profile
    ? sectorMatch(grant, profile) + provinceMatch(grant, profile) + sizeMatch(grant, profile)
    : 0;
  const computedMatch = Math.max(45, Math.min(98, base + profileBoost));

  const requirements = grant.requirements ?? [];
  const metCount = Math.max(1, Math.round((requirements.length * computedMatch) / 100));
  const requirementsStatus = requirements.map((label, index) => ({
    label,
    met: index < metCount,
  }));

  return {
    ...grant,
    computedMatch,
    readyPercentage: computedMatch,
    requirementsStatus,
  };
}

export async function fetchRecommendedGrants(profile?: GrantProfile | null, limit = 6): Promise<ScoredGrant[]> {
  const grants = await fetchActiveGrants();
  return grants
    .map((g) => scoreGrantForProfile(g, profile))
    .sort((a, b) => b.computedMatch - a.computedMatch)
    .slice(0, limit);
}

export function formatGrantAmount(amount: number): string {
  if (amount >= 1_000_000) return `Up to $${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `Up to $${Math.round(amount / 1000)}K`;
  return `$${amount.toLocaleString()}`;
}

export function grantDetailPath(id: string): string {
  return `/grants/${id}`;
}
