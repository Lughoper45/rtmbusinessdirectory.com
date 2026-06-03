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
  marketing_sequences?: { name: string; sequence_key: string; audience_type?: string };
};

export type MarketingProspect = {
  id: string;
  email: string;
  business_name: string | null;
  city: string | null;
  province: string | null;
  audience_type: string;
  email_status: string;
  email_status_detail: string | null;
  status: string;
  batch_id: string | null;
};

export type ImportStats = {
  parsed: number;
  inserted: number;
  updated: number;
  skipped_no_email: number;
  duplicate_unchanged: number;
  invalid_syntax: number;
  disposable: number;
  no_mx: number;
  role_account: number;
  valid: number;
  suppressed: number;
  errors: string[];
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

/** Audience = which campaign story (pick matching sequence + templates). */
export const AUDIENCE_OPTIONS = [
  {
    id: "deal_partner_prospect",
    label: "Discount program — list a member deal",
    description: "Pitch RTM Deals: businesses add 5–50% offers for members.",
    defaultSequence: "deal_partner_onboarding",
  },
  {
    id: "directory_owner",
    label: "Claim listing — directory owner",
    description: "Invite owners to claim and update their RTM profile.",
    defaultSequence: "deal_partner_onboarding",
  },
  {
    id: "grant_seeker",
    label: "Grants — free grant profile",
    description: "Canadian SME grant matching and Submission Passport.",
    defaultSequence: "deal_partner_onboarding",
  },
  {
    id: "member_prospect",
    label: "Membership — save with member deals",
    description: "Consumer/SME: join to unlock deals across Canada.",
    defaultSequence: "deal_partner_onboarding",
  },
  {
    id: "dual",
    label: "Claim + grants (dual)",
    description: "Listing claim plus grant eligibility teaser.",
    defaultSequence: "deal_partner_onboarding",
  },
] as const;

export type AudienceId = (typeof AUDIENCE_OPTIONS)[number]["id"];

function normalizeHeader(h: string): string {
  const x = h.trim().toLowerCase().replace(/\s+/g, "_");
  if (x === "e_mail" || x === "e-mail" || x === "email_address" || x === "mail") return "email";
  if (x === "business" || x === "company" || x === "businessname") return "business_name";
  if (x === "contact" || x === "owner_name") return "contact_name";
  if (x === "prov" || x === "state") return "province";
  return x;
}

/** Parse one CSV line respecting quoted fields */
function parseCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parsePasteRows(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  const first = lines[0];
  const delimiter = first.includes("\t") ? "\t" : first.includes(";") ? ";" : ",";
  const firstLower = first.toLowerCase();

  const looksLikeHeader =
    firstLower.includes("email") ||
    firstLower.includes("business") ||
    firstLower.includes("city") ||
    firstLower.includes("company");

  if (!looksLikeHeader) {
    return lines
      .map((line) => {
        const email = line.split(/[\s,;]+/).find((p) => p.includes("@")) ?? line;
        return { email: email.trim() };
      })
      .filter((r) => r.email.includes("@"));
  }

  const headers = parseCsvLine(first, delimiter).map(normalizeHeader);

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      if (h) row[h] = (cols[i] ?? "").trim();
    });
    if (!row.email) {
      const emailCol = cols.find((c) => c.includes("@"));
      if (emailCol) row.email = emailCol;
    }
    return row;
  }).filter((r) => r.email && r.email.includes("@"));
}

export function parseCsvFileText(text: string): Record<string, string>[] {
  return parsePasteRows(text);
}

export async function importRowsAll(
  rows: Record<string, string>[],
  opts: {
    batch_name: string;
    source: "paste" | "csv";
    audience_type: string;
    validate_mx?: boolean;
  },
): Promise<{ batch: { id: string }; stats: ImportStats; total_rows: number }> {
  const res = await invokeMarketingAdmin<{
    batch: { id: string };
    stats: ImportStats;
    total_rows: number;
  }>("import-rows", {
    batch_name: opts.batch_name,
    source: opts.source,
    audience_type: opts.audience_type,
    rows,
    validate_mx: opts.validate_mx ?? false,
  });
  return { batch: res.batch, stats: res.stats, total_rows: res.total_rows };
}
