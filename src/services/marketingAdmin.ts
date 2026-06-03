import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionErrorMessage } from "@/lib/edgeFunctionErrors";

export async function invokeMarketingAdmin<T = unknown>(
  action: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const { data: payload, error } = await supabase.functions.invoke("marketing-admin-bff", {
    body: { action, ...body },
  });
  if (payload?.error) throw new Error(payload.error);
  if (error) throw new Error(await getEdgeFunctionErrorMessage(error, payload));
  return payload as T;
}

export type MarketingTemplate = {
  id: string;
  template_key: string;
  name: string;
  audience_type: string;
  subject: string;
  html_body: string;
  description: string | null;
  is_active: boolean;
};

export type SequenceStep = {
  step_index: number;
  delay_hours: number;
  template_key: string;
  subject_override?: string | null;
};

export type MarketingSequence = {
  id: string;
  sequence_key: string;
  name: string;
  audience_type: string;
  is_active: boolean;
  marketing_sequence_steps?: SequenceStep[];
};

export type MarketingCampaign = {
  id: string;
  name: string;
  sequence_id: string;
  status: string;
  send_mode: string;
  daily_send_cap: number;
  only_valid_emails: boolean;
  marketing_sequences?: { name: string; sequence_key: string };
};

export type MarketingProspect = {
  id: string;
  email: string;
  business_name: string | null;
  city: string | null;
  province: string | null;
  email_status: string;
  email_status_detail: string | null;
  status: string;
  batch_id: string | null;
};

export type MarketingAnalytics = {
  total_sends: number;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  open_rate: number;
  click_rate: number;
  enrolled: number | null;
};

export function parsePasteRows(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(delimiter).map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "_"),
  );

  const mapHeader = (h: string) => {
    if (h === "business" || h === "company") return "business_name";
    if (h === "name" && !headers.includes("business_name")) return "contact_name";
    return h;
  };

  return lines.slice(1).map((line) => {
    const cols = line.split(delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[mapHeader(h)] = (cols[i] ?? "").trim();
    });
    if (!row.email && cols[0]?.includes("@")) row.email = cols[0].trim();
    return row;
  }).filter((r) => r.email);
}
