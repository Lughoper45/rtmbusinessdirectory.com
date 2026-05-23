import { supabase } from "@/integrations/supabase/client";
import type { GrantChecklistLead, GrantChecklistLeadStatus } from "@/lib/grantChecklistLeads";

export async function submitGrantChecklistLead(input: {
  email: string;
  name?: string;
  source?: string;
}): Promise<{ success: boolean; leadId?: string; emailsSent?: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke("grant-checklist-lead", {
    body: {
      email: input.email.trim().toLowerCase(),
      name: input.name?.trim() || undefined,
      source: input.source ?? "grants_page",
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }
  if (data?.error) {
    return { success: false, error: String(data.error) };
  }

  return {
    success: true,
    leadId: data?.leadId,
    emailsSent: data?.emailsSent,
  };
}

export async function fetchGrantChecklistLeads(): Promise<GrantChecklistLead[]> {
  const { data, error } = await supabase
    .from("grant_checklist_leads")
    .select("id, email, name, source, status, notes, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return (data ?? []) as GrantChecklistLead[];
}

export async function updateGrantChecklistLead(
  id: string,
  patch: Partial<Pick<GrantChecklistLead, "status" | "notes">>,
): Promise<void> {
  const { error } = await supabase
    .from("grant_checklist_leads")
    .update(patch)
    .eq("id", id);

  if (error) throw error;
}

export function isGrantChecklistLeadStatus(value: string): value is GrantChecklistLeadStatus {
  return ["new", "contacted", "replied", "closed"].includes(value);
}
