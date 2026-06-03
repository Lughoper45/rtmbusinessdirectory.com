import {
  handleCorsPreflight,
  jsonResponse,
} from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/adminAuth.ts";
import {
  normalizeEmail,
  validateMarketingEmail,
  SENDABLE_STATUSES,
} from "../_shared/marketingEmailValidation.ts";
import { buildProspectVars, renderMarketingTemplate } from "../_shared/marketingRenderer.ts";
import { processMarketingCampaigns } from "../_shared/marketingCampaignProcessor.ts";
import { processMarketingImport, type ImportRow } from "../_shared/marketingImport.ts";
import { Resend } from "https://esm.sh/resend@3.1.0";

type Action =
  | "list-templates"
  | "upsert-template"
  | "list-sequences"
  | "get-sequence"
  | "upsert-sequence"
  | "list-campaigns"
  | "upsert-campaign"
  | "start-campaign"
  | "pause-campaign"
  | "import-rows"
  | "import-from-directory"
  | "preview-directory-import"
  | "validate-batch"
  | "list-prospects"
  | "list-enrollments"
  | "get-analytics"
  | "preview-template"
  | "run-dispatcher-marketing";

const SITE = () => (Deno.env.get("SITE_URL") ?? "https://www.rtmbusinessdirectory.com").replace(/\/$/, "");

const CHUNK_SIZE = 75;

async function buildDirectoryImportRows(
  admin: ReturnType<Awaited<ReturnType<typeof requireAdmin>>["admin"]>,
  filters: {
    claim_status?: string;
    category?: string;
    province?: string;
    city?: string;
    limit?: number;
    include_listing_contacts?: boolean;
    require_email?: boolean;
  },
): Promise<ImportRow[]> {
  const limit = Math.min(Number(filters.limit) || 300, 500);
  const seen = new Set<string>();
  const rows: ImportRow[] = [];

  let bq = admin
    .from("businesses")
    .select("business_id, name, city, province, category, website, owner_email, owner_name, claim_status")
    .order("name")
    .limit(limit);

  const cs = String(filters.claim_status ?? "unclaimed");
  if (cs && cs !== "all") bq = bq.eq("claim_status", cs);
  if (filters.province) bq = bq.eq("province", filters.province);
  if (filters.city) bq = bq.ilike("city", `%${filters.city}%`);
  if (filters.category) bq = bq.ilike("category", `%${filters.category}%`);

  const { data: businesses, error: bErr } = await bq;
  if (bErr) throw bErr;

  for (const b of businesses ?? []) {
    if (b.owner_email) {
      const e = normalizeEmail(b.owner_email);
      if (e && !seen.has(e)) {
        seen.add(e);
        rows.push({
          email: e,
          business_name: b.name ?? "",
          city: b.city ?? "",
          province: b.province ?? "",
          category: b.category ?? "",
          website: b.website ?? "",
          contact_name: b.owner_name ?? "",
          business_id: b.business_id,
          casl_basis: "website_public",
        });
      }
    }
  }

  if (filters.include_listing_contacts !== false) {
    const bizIds = (businesses ?? []).map((b) => b.business_id);
    if (bizIds.length) {
      const { data: contacts } = await admin
        .from("listing_contacts")
        .select("email, name, business_id, is_primary, confidence")
        .in("business_id", bizIds)
        .not("email", "is", null)
        .order("is_primary", { ascending: false })
        .order("confidence", { ascending: false })
        .limit(limit * 2);

      const bizMap = new Map((businesses ?? []).map((b) => [b.business_id, b]));

      for (const c of contacts ?? []) {
        if (!c.email) continue;
        const e = normalizeEmail(c.email);
        if (!e || seen.has(e)) continue;
        seen.add(e);
        const b = bizMap.get(c.business_id);
        rows.push({
          email: e,
          contact_name: c.name ?? "",
          business_name: b?.name ?? "",
          city: b?.city ?? "",
          province: b?.province ?? "",
          category: b?.category ?? "",
          website: b?.website ?? "",
          business_id: c.business_id,
          casl_basis: "website_public",
        });
      }
    }
  }

  if (filters.require_email) {
    return rows;
  }
  return rows;
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const { user, admin } = await requireAdmin(req, supabaseUrl, anonKey, serviceKey);
    const body = await req.json();
    const action = body.action as Action;

    if (action === "list-templates") {
      const { data, error } = await admin
        .from("marketing_email_templates")
        .select("*")
        .order("template_key");
      if (error) throw error;
      return jsonResponse(req, { templates: data });
    }

    if (action === "upsert-template") {
      const template_key = String(body.template_key ?? "").trim();
      if (!template_key) return jsonResponse(req, { error: "template_key required" }, 400);
      const row = {
        template_key,
        name: String(body.name ?? template_key),
        audience_type: String(body.audience_type ?? "deal_partner_prospect"),
        subject: String(body.subject ?? ""),
        html_body: String(body.html_body ?? ""),
        description: body.description ? String(body.description) : null,
        is_active: body.is_active !== false,
      };
      const { data, error } = await admin
        .from("marketing_email_templates")
        .upsert(row, { onConflict: "template_key" })
        .select()
        .single();
      if (error) throw error;
      return jsonResponse(req, { template: data });
    }

    if (action === "list-sequences") {
      const { data, error } = await admin
        .from("marketing_sequences")
        .select("*, marketing_sequence_steps(step_index, delay_hours, template_key, subject_override)")
        .order("sequence_key");
      if (error) throw error;
      return jsonResponse(req, { sequences: data });
    }

    if (action === "get-sequence") {
      const id = body.sequence_id as string;
      const { data, error } = await admin
        .from("marketing_sequences")
        .select("*, marketing_sequence_steps(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return jsonResponse(req, { sequence: data });
    }

    if (action === "upsert-sequence") {
      const sequence_key = String(body.sequence_key ?? "").trim();
      const name = String(body.name ?? sequence_key);
      const audience_type = String(body.audience_type ?? "deal_partner_prospect");
      const steps = (body.steps ?? []) as Array<{
        step_index: number;
        delay_hours: number;
        template_key: string;
        subject_override?: string;
      }>;

      const { data: seq, error: seqErr } = await admin
        .from("marketing_sequences")
        .upsert(
          { sequence_key, name, audience_type, description: body.description ?? null, is_active: body.is_active !== false },
          { onConflict: "sequence_key" },
        )
        .select()
        .single();
      if (seqErr) throw seqErr;

      await admin.from("marketing_sequence_steps").delete().eq("sequence_id", seq.id);
      if (steps.length) {
        const { error: stErr } = await admin.from("marketing_sequence_steps").insert(
          steps.map((s) => ({
            sequence_id: seq.id,
            step_index: s.step_index,
            delay_hours: s.delay_hours,
            template_key: s.template_key,
            subject_override: s.subject_override ?? null,
          })),
        );
        if (stErr) throw stErr;
      }

      return jsonResponse(req, { sequence: seq });
    }

    if (action === "list-campaigns") {
      const { data, error } = await admin
        .from("marketing_campaigns")
        .select("*, marketing_sequences(name, sequence_key)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return jsonResponse(req, { campaigns: data });
    }

    if (action === "upsert-campaign") {
      const row = {
        id: body.id as string | undefined,
        name: String(body.name ?? "Campaign"),
        sequence_id: body.sequence_id as string,
        status: body.status ?? "draft",
        send_mode: body.send_mode ?? "automated",
        daily_send_cap: Number(body.daily_send_cap ?? 50),
        only_valid_emails: body.only_valid_emails !== false,
      };
      if (!row.sequence_id) return jsonResponse(req, { error: "sequence_id required" }, 400);

      let data;
      if (row.id) {
        const { data: u, error } = await admin
          .from("marketing_campaigns")
          .update(row)
          .eq("id", row.id)
          .select()
          .single();
        if (error) throw error;
        data = u;
      } else {
        const { data: i, error } = await admin
          .from("marketing_campaigns")
          .insert({ ...row, created_by: user.id })
          .select()
          .single();
        if (error) throw error;
        data = i;
      }
      return jsonResponse(req, { campaign: data });
    }

    if (action === "start-campaign") {
      const campaignId = body.campaign_id as string;
      const prospectIds = body.prospect_ids as string[] | undefined;

      const { data: campaign, error: cErr } = await admin
        .from("marketing_campaigns")
        .select("*, marketing_sequences(audience_type)")
        .eq("id", campaignId)
        .single();
      if (cErr || !campaign) throw cErr ?? new Error("Campaign not found");

      const seqAudience = (campaign as { marketing_sequences?: { audience_type?: string } })
        .marketing_sequences?.audience_type;
      const filterAudience = String(body.audience_type ?? seqAudience ?? "");

      let q = admin
        .from("marketing_prospects")
        .select("id, email, email_status, status, audience_type")
        .in("email_status", ["valid", "role_account"]);

      if (filterAudience) q = q.eq("audience_type", filterAudience);

      if (prospectIds?.length) {
        q = q.in("id", prospectIds);
      } else if (body.batch_id) {
        q = q.eq("batch_id", body.batch_id as string);
      } else {
        return jsonResponse(req, { error: "batch_id or prospect_ids required to start campaign" }, 400);
      }

      const { data: prospects, error: pErr } = await q.limit(5000);
      if (pErr) throw pErr;

      const now = new Date().toISOString();
      let enrolled = 0;

      for (const p of prospects ?? []) {
        const { data: sup } = await admin
          .from("listing_suppressions")
          .select("id")
          .eq("email", p.email.toLowerCase())
          .maybeSingle();
        if (sup) continue;

        const { error: enErr } = await admin.from("marketing_campaign_enrollments").upsert(
          {
            campaign_id: campaignId,
            prospect_id: p.id,
            current_step: 0,
            next_send_at: now,
          },
          { onConflict: "campaign_id,prospect_id", ignoreDuplicates: false },
        );
        if (!enErr) {
          enrolled += 1;
          await admin.from("marketing_prospects").update({ status: "enrolled" }).eq("id", p.id);
        }
      }

      await admin
        .from("marketing_campaigns")
        .update({ status: "running", started_at: campaign.started_at ?? now })
        .eq("id", campaignId);

      return jsonResponse(req, { ok: true, enrolled });
    }

    if (action === "pause-campaign") {
      await admin
        .from("marketing_campaigns")
        .update({ status: "paused" })
        .eq("id", body.campaign_id as string);
      return jsonResponse(req, { ok: true });
    }

    if (action === "preview-directory-import") {
      const rows = await buildDirectoryImportRows(admin, {
        claim_status: String(body.claim_status ?? "unclaimed"),
        category: body.category ? String(body.category) : undefined,
        province: body.province ? String(body.province) : undefined,
        city: body.city ? String(body.city) : undefined,
        limit: Number(body.limit ?? 300),
        include_listing_contacts: body.include_listing_contacts !== false,
        require_email: true,
      });
      return jsonResponse(req, { count: rows.length, sample: rows.slice(0, 5) });
    }

    if (action === "import-from-directory") {
      const audience_type = String(body.audience_type ?? "directory_owner");
      const rows = await buildDirectoryImportRows(admin, {
        claim_status: String(body.claim_status ?? "unclaimed"),
        category: body.category ? String(body.category) : undefined,
        province: body.province ? String(body.province) : undefined,
        city: body.city ? String(body.city) : undefined,
        limit: Number(body.limit ?? 300),
        include_listing_contacts: body.include_listing_contacts !== false,
        require_email: true,
      });

      if (!rows.length) {
        return jsonResponse(req, { error: "No businesses with email found for these filters" }, 400);
      }

      const { data: batch, error: bErr } = await admin
        .from("marketing_import_batches")
        .insert({
          name: String(body.batch_name ?? `Directory ${new Date().toLocaleDateString()}`),
          source: "directory",
          row_count: rows.length,
          status: "processing",
          created_by: user.id,
        })
        .select()
        .single();
      if (bErr) throw bErr;

      let totalValid = 0;
      const merged = {
        parsed: rows.length,
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
        errors: [] as string[],
      };

      for (let offset = 0; offset < rows.length; offset += CHUNK_SIZE) {
        const stats = await processMarketingImport(admin, {
          batchId: batch.id,
          rows,
          audience_type,
          validate_mx: body.validate_mx === true,
          offset,
          limit: CHUNK_SIZE,
        });
        totalValid += stats.valid;
        merged.inserted += stats.inserted;
        merged.updated += stats.updated;
        merged.skipped_no_email += stats.skipped_no_email;
        merged.duplicate_unchanged += stats.duplicate_unchanged;
        merged.invalid_syntax += stats.invalid_syntax;
        merged.disposable += stats.disposable;
        merged.no_mx += stats.no_mx;
        merged.role_account += stats.role_account;
        merged.valid += stats.valid;
        merged.suppressed += stats.suppressed;
        merged.errors.push(...stats.errors);
      }

      await admin
        .from("marketing_import_batches")
        .update({
          valid_count: totalValid,
          row_count: rows.length,
          status: "ready",
        })
        .eq("id", batch.id);

      return jsonResponse(req, {
        batch,
        stats: merged,
        total_rows: rows.length,
        has_more: false,
        next_offset: null,
      });
    }

    if (action === "import-rows") {
      const batchName = String(body.batch_name ?? `Import ${new Date().toISOString().slice(0, 10)}`);
      const source = String(body.source ?? "paste");
      const audience_type = String(body.audience_type ?? "deal_partner_prospect");
      const rows = ((body.rows ?? []) as ImportRow[]).slice(0, 500);
      const validate_mx = body.validate_mx === true;

      const { data: batch, error: bErr } = await admin
        .from("marketing_import_batches")
        .insert({
          name: batchName,
          source,
          row_count: rows.length,
          status: "processing",
          created_by: user.id,
        })
        .select()
        .single();
      if (bErr) throw bErr;

      const merged = {
        parsed: rows.length,
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
        errors: [] as string[],
      };

      for (let offset = 0; offset < rows.length; offset += CHUNK_SIZE) {
        const stats = await processMarketingImport(admin, {
          batchId: batch.id,
          rows,
          audience_type,
          validate_mx,
          offset,
          limit: CHUNK_SIZE,
        });
        merged.inserted += stats.inserted;
        merged.updated += stats.updated;
        merged.skipped_no_email += stats.skipped_no_email;
        merged.duplicate_unchanged += stats.duplicate_unchanged;
        merged.invalid_syntax += stats.invalid_syntax;
        merged.disposable += stats.disposable;
        merged.no_mx += stats.no_mx;
        merged.role_account += stats.role_account;
        merged.valid += stats.valid;
        merged.suppressed += stats.suppressed;
        merged.errors.push(...stats.errors);
      }

      await admin
        .from("marketing_import_batches")
        .update({
          valid_count: merged.valid,
          row_count: rows.length,
          status: "ready",
        })
        .eq("id", batch.id);

      return jsonResponse(req, {
        batch,
        stats: merged,
        total_rows: rows.length,
        has_more: false,
        next_offset: null,
        validate_mx,
      });
    }

    if (action === "validate-batch") {
      const batchId = body.batch_id as string;
      const { data: prospects, error } = await admin
        .from("marketing_prospects")
        .select("id, email")
        .eq("batch_id", batchId)
        .eq("email_status", "pending");
      if (error) throw error;

      let valid = 0;
      for (const p of prospects ?? []) {
        const v = await validateMarketingEmail(p.email);
        await admin
          .from("marketing_prospects")
          .update({
            email_status: v.status,
            email_status_detail: v.detail,
            validated_at: new Date().toISOString(),
            status: "validated",
          })
          .eq("id", p.id);
        if (SENDABLE_STATUSES.has(v.status)) valid += 1;
      }

      return jsonResponse(req, { validated: prospects?.length ?? 0, valid });
    }

    if (action === "list-prospects") {
      const pageLimit = Math.min(Number(body.limit ?? 500), 1000);
      let q = admin
        .from("marketing_prospects")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(pageLimit);
      if (body.batch_id) q = q.eq("batch_id", body.batch_id);
      if (body.audience_type) q = q.eq("audience_type", body.audience_type);
      if (body.email_status) q = q.eq("email_status", body.email_status);
      const { data, error, count } = await q;

      if (error) throw error;
      return jsonResponse(req, { prospects: data, count });
    }

    if (action === "list-enrollments") {
      const { data, error } = await admin
        .from("marketing_campaign_enrollments")
        .select("*, marketing_prospects(email, business_name), marketing_campaigns(name)")
        .eq("campaign_id", body.campaign_id as string)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return jsonResponse(req, { enrollments: data });
    }

    if (action === "get-analytics") {
      const campaignId = body.campaign_id as string | undefined;

      let sendsQ = admin.from("marketing_sends").select("status, sent_at, opened_at, clicked_at, campaign_id");
      if (campaignId) sendsQ = sendsQ.eq("campaign_id", campaignId);
      const { data: sends, error } = await sendsQ;
      if (error) throw error;

      const total = sends?.length ?? 0;
      const sent = sends?.filter((s) => s.sent_at).length ?? 0;
      const opened = sends?.filter((s) => s.opened_at).length ?? 0;
      const clicked = sends?.filter((s) => s.clicked_at).length ?? 0;
      const bounced = sends?.filter((s) => s.status === "bounced").length ?? 0;

      let enrolled: number | null = null;
      if (campaignId) {
        const { count } = await admin
          .from("marketing_campaign_enrollments")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", campaignId);
        enrolled = count;
      }

      return jsonResponse(req, {
        total_sends: total,
        sent,
        opened,
        clicked,
        bounced,
        open_rate: sent ? Math.round((opened / sent) * 1000) / 10 : 0,
        click_rate: sent ? Math.round((clicked / sent) * 1000) / 10 : 0,
        enrolled: campaignId ? enrolled : null,
      });
    }

    if (action === "preview-template") {
      const template_key = String(body.template_key ?? "");
      const { data: tpl, error } = await admin
        .from("marketing_email_templates")
        .select("subject, html_body")
        .eq("template_key", template_key)
        .single();
      if (error) throw error;

      const sample = buildProspectVars(
        {
          email: "owner@example.ca",
          contact_name: "Alex",
          business_name: "Maple Leaf Bakery",
          city: "Toronto",
          province: "ON",
        },
        SITE(),
      );

      return jsonResponse(req, {
        subject: renderMarketingTemplate(
          body.subject_override ? String(body.subject_override) : tpl.subject,
          sample,
        ),
        html: renderMarketingTemplate(
          body.html_body ? String(body.html_body) : tpl.html_body,
          sample,
        ),
      });
    }

    if (action === "run-dispatcher-marketing") {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (!resendKey) return jsonResponse(req, { error: "RESEND_API_KEY not set" }, 500);
      const cap = Number(Deno.env.get("MARKETING_DAILY_SEND_CAP") || "50");
      const result = await processMarketingCampaigns(admin, new Resend(resendKey), cap);
      return jsonResponse(req, result);
    }

    return jsonResponse(req, { error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResponse(
      req,
      { error: e instanceof Error ? e.message : "Marketing BFF failed" },
      e instanceof Error && e.message.includes("Unauthorized") ? 401 : 500,
    );
  }
});
