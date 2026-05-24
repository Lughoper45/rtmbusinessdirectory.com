import { supabase } from "@/integrations/supabase/client";
import type { GrantIntakeStatus } from "@/lib/grantIntake";

export type GrantIntakeRow = {
  id: string;
  user_id: string;
  grant_id: string;
  package_id: string | null;
  status: GrantIntakeStatus;
  readiness_score: number;
  readiness_status: string;
  created_at: string;
  updated_at: string;
};

export async function getOrCreateGrantIntake(
  grantId: string,
  packageId?: string | null,
): Promise<{ intake?: GrantIntakeRow; error?: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return { error: "Sign in to prepare your grant intake with RTM." };
  }

  const userId = session.user.id;

  const { data: existing, error: findError } = await supabase
    .from("grant_intakes")
    .select("id, user_id, grant_id, package_id, status, readiness_score, readiness_status, created_at, updated_at")
    .eq("user_id", userId)
    .eq("grant_id", grantId)
    .in("status", ["draft", "collecting", "ready_for_review", "with_advisor"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) return { error: findError.message };
  if (existing) return { intake: existing as GrantIntakeRow };

  const { data: created, error: createError } = await supabase
    .from("grant_intakes")
    .insert({
      user_id: userId,
      grant_id: grantId,
      package_id: packageId ?? null,
      status: "collecting",
      source: "grants_workspace",
    })
    .select("id, user_id, grant_id, package_id, status, readiness_score, readiness_status, created_at, updated_at")
    .single();

  if (createError) return { error: createError.message };
  return { intake: created as GrantIntakeRow };
}

export type GrantIntakeProfile = GrantIntakeRow;

export async function saveGrantIntakeAnswer(
  intakeId: string,
  fieldKey: string,
  value: unknown,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("grant_intake_answers").upsert(
    {
      intake_id: intakeId,
      field_key: fieldKey,
      value,
      source: "user_input",
    },
    { onConflict: "intake_id,field_key" },
  );

  if (error) return { error: error.message };
  return {};
}

export async function fetchGrantIntakeAnswers(
  intakeId: string,
): Promise<{ answers: Record<string, string>; error?: string }> {
  const { data, error } = await supabase
    .from("grant_intake_answers")
    .select("field_key, value")
    .eq("intake_id", intakeId);

  if (error) return { answers: {}, error: error.message };

  const answers: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.value != null) answers[row.field_key] = String(row.value);
  }
  return { answers };
}

export async function countRecentAiDrafts(intakeId: string): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("grant_intake_answers")
    .select("id", { count: "exact", head: true })
    .eq("intake_id", intakeId)
    .eq("source", "ai_suggested")
    .gte("updated_at", since);

  if (error) return 0;
  return count ?? 0;
}

export const MAX_DRAFTS_PER_HOUR = 12;
