import { supabase } from "@/integrations/supabase/client";

export type GrowthEngagementStatus =
  | "pending_payment"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";

export type GrowthMilestoneStatus = "pending" | "in_progress" | "done" | "skipped";

export type GrowthMilestone = {
  id: string;
  engagement_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  status: GrowthMilestoneStatus;
  due_at: string | null;
  completed_at: string | null;
};

export type GrowthEngagement = {
  id: string;
  user_id: string;
  package_id: string;
  order_id: string | null;
  business_name: string | null;
  status: GrowthEngagementStatus;
  advisor_notes: string | null;
  started_at: string | null;
  created_at: string;
  updated_at: string;
  milestones?: GrowthMilestone[];
};

export async function fetchMyGrowthEngagements(): Promise<GrowthEngagement[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: engagements, error } = await supabase
    .from("growth_engagements")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!engagements?.length) return [];

  const ids = engagements.map((e) => e.id);
  const { data: milestones, error: msError } = await supabase
    .from("growth_milestones")
    .select("*")
    .in("engagement_id", ids)
    .order("sort_order", { ascending: true });

  if (msError) throw msError;

  const byEngagement = new Map<string, GrowthMilestone[]>();
  for (const m of milestones ?? []) {
    const list = byEngagement.get(m.engagement_id) ?? [];
    list.push(m as GrowthMilestone);
    byEngagement.set(m.engagement_id, list);
  }

  return engagements.map((e) => ({
    ...(e as GrowthEngagement),
    milestones: byEngagement.get(e.id) ?? [],
  }));
}

export async function fetchGrowthEngagementsAdmin(): Promise<GrowthEngagement[]> {
  const { data: engagements, error } = await supabase
    .from("growth_engagements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  if (!engagements?.length) return [];

  const ids = engagements.map((e) => e.id);
  const { data: milestones, error: msError } = await supabase
    .from("growth_milestones")
    .select("*")
    .in("engagement_id", ids)
    .order("sort_order", { ascending: true });

  if (msError) throw msError;

  const byEngagement = new Map<string, GrowthMilestone[]>();
  for (const m of milestones ?? []) {
    const list = byEngagement.get(m.engagement_id) ?? [];
    list.push(m as GrowthMilestone);
    byEngagement.set(m.engagement_id, list);
  }

  return engagements.map((e) => ({
    ...(e as GrowthEngagement),
    milestones: byEngagement.get(e.id) ?? [],
  }));
}

export async function updateGrowthEngagementAdmin(
  id: string,
  patch: Partial<Pick<GrowthEngagement, "status" | "advisor_notes">>,
): Promise<void> {
  const { error } = await supabase.from("growth_engagements").update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateGrowthMilestoneAdmin(
  id: string,
  patch: Partial<Pick<GrowthMilestone, "status" | "due_at">>,
): Promise<void> {
  const payload: Record<string, unknown> = { ...patch };
  if (patch.status === "done" && !patch.due_at) {
    payload.completed_at = new Date().toISOString();
  }
  const { error } = await supabase.from("growth_milestones").update(payload).eq("id", id);
  if (error) throw error;
}
