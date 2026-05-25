import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionErrorMessage } from "@/lib/edgeFunctionErrors";
import type { ReadinessDetails, ReadinessResult } from "@/lib/grantIntake";

export type GrantIntakeAssistantAction =
  | "analyze_readiness"
  | "generate_draft"
  | "list_missing";

export type AnalyzeReadinessResponse = {
  intake_id: string;
  score: number;
  status: ReadinessResult["status"];
  details: ReadinessDetails;
  check_id: string;
  checked_at: string;
  assistant: string;
};

export type ListMissingResponse = {
  intake_id: string;
  missing_fields: { key: string; label: string }[];
  missing_documents: { key: string; label: string }[];
};

export type GenerateDraftResponse = {
  intake_id: string;
  field_key: string;
  draft: string;
  source: "ai_suggested";
  assistant: string;
  disclaimer: string;
};

async function invokeGrantIntakeAssistant<T>(
  body: Record<string, unknown>,
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke("grant-intake-assistant", { body });

  if (error) {
    return { data: null, error: await getEdgeFunctionErrorMessage(error, data) };
  }
  if (data?.error) {
    return { data: null, error: String(data.error) };
  }

  return { data: data as T, error: null };
}

export async function analyzeGrantIntakeReadiness(
  intakeId: string,
  grantId?: string,
): Promise<{ result?: AnalyzeReadinessResponse; error?: string }> {
  const { data, error } = await invokeGrantIntakeAssistant<AnalyzeReadinessResponse>({
    action: "analyze_readiness",
    intake_id: intakeId,
    grant_id: grantId,
  });
  if (error) return { error };
  return { result: data ?? undefined };
}

export async function listGrantIntakeMissing(
  intakeId: string,
  grantId?: string,
): Promise<{ result?: ListMissingResponse; error?: string }> {
  const { data, error } = await invokeGrantIntakeAssistant<ListMissingResponse>({
    action: "list_missing",
    intake_id: intakeId,
    grant_id: grantId,
  });
  if (error) return { error };
  return { result: data ?? undefined };
}

export async function generateGrantIntakeDraft(
  intakeId: string,
  fieldKey: string,
  grantId?: string,
): Promise<{ result?: GenerateDraftResponse; error?: string }> {
  const { data, error } = await invokeGrantIntakeAssistant<GenerateDraftResponse>({
    action: "generate_draft",
    intake_id: intakeId,
    field_key: fieldKey,
    grant_id: grantId,
  });
  if (error) return { error };
  return { result: data ?? undefined };
}

export const DRAFT_FIELD_KEYS = [
  "project_summary",
  "use_of_funds",
  "business_description",
  "objectives",
  "budget_notes",
] as const;

export type DraftFieldKey = (typeof DRAFT_FIELD_KEYS)[number];

export const WIZARD_FIELD_TO_DRAFT_KEY: Record<string, DraftFieldKey> = {
  projectSummary: "project_summary",
  objectives: "objectives",
  budgetBreakdown: "budget_notes",
};
