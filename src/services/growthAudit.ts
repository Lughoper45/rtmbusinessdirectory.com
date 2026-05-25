import { supabase } from "@/integrations/supabase/client";

export type GrowthAuditLeadStatus =
  | "new"
  | "contacted"
  | "audit_scheduled"
  | "proposal_sent"
  | "won"
  | "closed";

export type GrowthAuditLead = {
  id: string;
  email: string;
  name: string | null;
  business_name: string | null;
  phone: string | null;
  city: string | null;
  business_type: string | null;
  years_operating: string | null;
  online_presence: string[];
  biggest_challenge: string | null;
  interested_package: string | null;
  status: GrowthAuditLeadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type GrowthAuditSubmitInput = {
  email: string;
  name?: string;
  business_name?: string;
  phone?: string;
  city?: string;
  business_type?: string;
  years_operating?: string;
  online_presence?: string[];
  biggest_challenge?: string;
  interested_package?: string;
  source?: string;
};

export async function submitGrowthAuditLead(
  input: GrowthAuditSubmitInput,
): Promise<{ success: boolean; leadId?: string; emailsSent?: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke("growth-audit-lead", {
    body: {
      ...input,
      email: input.email.trim().toLowerCase(),
    },
  });

  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: String(data.error) };

  return { success: true, leadId: data?.leadId, emailsSent: data?.emailsSent };
}

export async function fetchGrowthAuditLeads(): Promise<GrowthAuditLead[]> {
  const { data, error } = await supabase
    .from("growth_audit_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return (data ?? []) as GrowthAuditLead[];
}

export async function updateGrowthAuditLead(
  id: string,
  patch: Partial<Pick<GrowthAuditLead, "status" | "notes">>,
): Promise<void> {
  const { error } = await supabase.from("growth_audit_leads").update(patch).eq("id", id);
  if (error) throw error;
}

export function isGrowthAuditLeadStatus(value: string): value is GrowthAuditLeadStatus {
  return ["new", "contacted", "audit_scheduled", "proposal_sent", "won", "closed"].includes(value);
}
