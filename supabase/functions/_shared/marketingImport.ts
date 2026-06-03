import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  normalizeEmail,
  validateMarketingEmail,
  SENDABLE_STATUSES,
} from "./marketingEmailValidation.ts";

export type ImportRow = Record<string, string>;

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

export async function upsertCrmFromProspect(
  admin: SupabaseClient,
  prospect: {
    email: string;
    contact_name?: string | null;
    business_name?: string | null;
    audience_type: string;
  },
): Promise<string | null> {
  const email = normalizeEmail(prospect.email);
  const { data: existing } = await admin
    .from("crm_contacts")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing?.id) {
    await admin
      .from("crm_contacts")
      .update({
        name: prospect.contact_name ?? undefined,
        company: prospect.business_name ?? undefined,
        source: "marketing_import",
        tags: ["marketing", prospect.audience_type],
      })
      .eq("id", existing.id);
    return existing.id;
  }

  const { data: created } = await admin.rpc("upsert_crm_contact", {
    p_email: email,
    p_name: prospect.contact_name,
    p_source: "marketing_import",
    p_tags: ["marketing", prospect.audience_type],
  });

  return (created as string) ?? null;
}

export async function processMarketingImport(
  admin: SupabaseClient,
  opts: {
    batchId: string;
    rows: ImportRow[];
    audience_type: string;
    validate_mx?: boolean;
    offset?: number;
    limit?: number;
  },
): Promise<ImportStats> {
  const stats: ImportStats = {
    parsed: opts.rows.length,
    inserted: 0,
    updated: 0,
    skipped_no_email: 0,
    duplicate_unchanged: 0,
    invalid_syntax: 0,
    disposable: 0,
    no_mx: 0,
    role_account: 0,
    valid: 0,
    suppressed: 0,
    errors: [],
  };

  const offset = opts.offset ?? 0;
  const limit = Math.min(opts.limit ?? 75, 100);
  const slice = opts.rows.slice(offset, offset + limit);
  const checkMx = opts.validate_mx === true;

  for (const row of slice) {
    const email = normalizeEmail(String(row.email ?? ""));
    if (!email) {
      stats.skipped_no_email += 1;
      continue;
    }

    const { data: existing } = await admin
      .from("marketing_prospects")
      .select("id, batch_id, audience_type")
      .eq("email", email)
      .maybeSingle();

    let email_status = "pending";
    let email_status_detail: string | null = null;

    const v = await validateMarketingEmail(email, { checkMx });
    email_status = v.status;
    email_status_detail = v.detail;

    if (email_status === "invalid_syntax") stats.invalid_syntax += 1;
    else if (email_status === "disposable") stats.disposable += 1;
    else if (email_status === "no_mx") stats.no_mx += 1;
    else if (email_status === "role_account") stats.role_account += 1;
    else if (SENDABLE_STATUSES.has(v.status)) stats.valid += 1;

    const { data: sup } = await admin
      .from("listing_suppressions")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (sup) {
      email_status = "suppressed";
      email_status_detail = "On suppression list";
      stats.suppressed += 1;
    }

    const prospectRow = {
      batch_id: opts.batchId,
      email,
      contact_name: row.contact_name || row.name || null,
      business_name: row.business_name || row.business || null,
      phone: row.phone || null,
      city: row.city || null,
      province: row.province || null,
      category: row.category || null,
      website: row.website || null,
      business_id: row.business_id || null,
      audience_type: opts.audience_type,
      casl_basis: String(row.casl_basis ?? "website_public"),
      email_status,
      email_status_detail,
      validated_at: new Date().toISOString(),
      status: "validated",
    };

    const { data: upserted, error: iErr } = await admin
      .from("marketing_prospects")
      .upsert(prospectRow, { onConflict: "email" })
      .select("id")
      .single();

    if (iErr) {
      stats.errors.push(`${email}: ${iErr.message}`);
      continue;
    }

    if (existing?.id) {
      if (existing.batch_id === opts.batchId && existing.audience_type === opts.audience_type) {
        stats.duplicate_unchanged += 1;
      } else {
        stats.updated += 1;
      }
    } else {
      stats.inserted += 1;
    }

    if (upserted?.id) {
      try {
        const crmId = await upsertCrmFromProspect(admin, {
          email,
          contact_name: prospectRow.contact_name,
          business_name: prospectRow.business_name,
          audience_type: opts.audience_type,
        });
        if (crmId) {
          await admin.from("marketing_prospects").update({ crm_contact_id: crmId }).eq("id", upserted.id);
        }
      } catch (e) {
        stats.errors.push(`crm ${email}: ${e instanceof Error ? e.message : "crm failed"}`);
      }
    }
  }

  return stats;
}
