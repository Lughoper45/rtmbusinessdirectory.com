import { Resend } from "https://esm.sh/resend@3.1.0";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { LISTING_FROM } from "./listingEmail.ts";
import { buildProspectVars, renderMarketingTemplate } from "./marketingRenderer.ts";
import { SENDABLE_STATUSES } from "./marketingEmailValidation.ts";

function siteUrl(): string {
  return (Deno.env.get("SITE_URL") ?? "https://www.rtmbusinessdirectory.com").replace(/\/$/, "");
}

async function isSuppressed(admin: SupabaseClient, email: string): Promise<boolean> {
  const { data } = await admin
    .from("listing_suppressions")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return !!data;
}

export async function processMarketingCampaigns(
  admin: SupabaseClient,
  resend: Resend,
  dailyCap: number,
): Promise<{ sent: string[]; errors: string[] }> {
  const sent: string[] = [];
  const errors: string[] = [];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: sentToday } = await admin
    .from("marketing_sends")
    .select("id", { count: "exact", head: true })
    .gte("sent_at", todayStart.toISOString())
    .in("status", ["sent", "delivered", "opened", "clicked"]);

  let remaining = Math.max(0, dailyCap - (sentToday ?? 0));
  if (remaining <= 0) return { sent, errors };

  const { data: campaigns } = await admin
    .from("marketing_campaigns")
    .select("id, name, sequence_id, daily_send_cap, only_valid_emails, send_mode")
    .eq("status", "running")
    .limit(10);

  const base = siteUrl();

  for (const campaign of campaigns ?? []) {
    if (remaining <= 0) break;

    const cap = Math.min(remaining, campaign.daily_send_cap ?? dailyCap);

    const { data: enrollments } = await admin
      .from("marketing_campaign_enrollments")
      .select(
        "id, campaign_id, prospect_id, current_step, next_send_at, marketing_prospects(id, email, contact_name, business_name, city, province, email_status, status)",
      )
      .eq("campaign_id", campaign.id)
      .is("completed_at", null)
      .is("unsubscribed_at", null)
      .lte("next_send_at", new Date().toISOString())
      .order("next_send_at", { ascending: true })
      .limit(cap);

    const { data: steps } = await admin
      .from("marketing_sequence_steps")
      .select("step_index, delay_hours, template_key, subject_override")
      .eq("sequence_id", campaign.sequence_id)
      .order("step_index");

    if (!steps?.length) continue;

    for (const en of enrollments ?? []) {
      if (remaining <= 0) break;

      const prospect = (en as { marketing_prospects?: Record<string, unknown> }).marketing_prospects as {
        email: string;
        contact_name: string | null;
        business_name: string | null;
        city: string | null;
        province: string | null;
        email_status: string;
        status: string;
      } | null;
      const prospectId = en.prospect_id as string;

      if (!prospect?.email) continue;
      if (prospect.status === "unsubscribed" || prospect.status === "bounced") continue;

      if (campaign.only_valid_emails && !SENDABLE_STATUSES.has(prospect.email_status as "valid" | "role_account")) {
        continue;
      }

      if (await isSuppressed(admin, prospect.email)) {
        await admin
          .from("marketing_prospects")
          .update({ email_status: "suppressed", status: "unsubscribed" })
          .eq("id", prospectId);
        continue;
      }

      const stepIndex = en.current_step ?? 0;
      const step = steps.find((s) => s.step_index === stepIndex);
      if (!step) {
        await admin
          .from("marketing_campaign_enrollments")
          .update({ completed_at: new Date().toISOString(), next_send_at: null })
          .eq("id", en.id);
        continue;
      }

      const { data: tpl } = await admin
        .from("marketing_email_templates")
        .select("subject, html_body, is_active")
        .eq("template_key", step.template_key)
        .maybeSingle();

      if (!tpl?.is_active) {
        errors.push(`${en.id}: template inactive ${step.template_key}`);
        continue;
      }

      const vars = buildProspectVars(
        {
          email: prospect.email,
          contact_name: prospect.contact_name,
          business_name: prospect.business_name,
          city: prospect.city,
          province: prospect.province,
        },
        base,
      );

      const subject = renderMarketingTemplate(
        step.subject_override || tpl.subject,
        vars,
      );
      const html = renderMarketingTemplate(tpl.html_body, vars);

      const { data: sendRow, error: insertErr } = await admin
        .from("marketing_sends")
        .insert({
          enrollment_id: en.id,
          campaign_id: campaign.id,
          prospect_id: prospectId,
          step_index: stepIndex,
          template_key: step.template_key,
          email: prospect.email.toLowerCase(),
          subject,
          status: "queued",
        })
        .select("id")
        .single();

      if (insertErr || !sendRow) {
        errors.push(`${en.id}: ${insertErr?.message ?? "insert failed"}`);
        continue;
      }

      try {
        const result = await resend.emails.send({
          from: LISTING_FROM,
          to: prospect.email,
          subject,
          html,
          tags: [
            { name: "campaign_id", value: campaign.id },
            { name: "enrollment_id", value: en.id },
            { name: "send_id", value: sendRow.id },
          ],
        });

        const now = new Date().toISOString();
        await admin
          .from("marketing_sends")
          .update({
            status: "sent",
            sent_at: now,
            resend_message_id: result.data?.id ?? null,
          })
          .eq("id", sendRow.id);

        await admin.from("crm_activities").insert({
          contact_id: null,
          kind: "marketing_email_sent",
          payload: {
            campaign_id: campaign.id,
            template_key: step.template_key,
            email: prospect.email,
          },
          created_by: "marketing_automation",
        });

        const nextStep = steps.find((s) => s.step_index === stepIndex + 1);
        if (nextStep) {
          const nextAt = new Date(Date.now() + nextStep.delay_hours * 60 * 60 * 1000).toISOString();
          await admin
            .from("marketing_campaign_enrollments")
            .update({
              current_step: stepIndex + 1,
              next_send_at: nextAt,
            })
            .eq("id", en.id);
        } else {
          await admin
            .from("marketing_campaign_enrollments")
            .update({
              current_step: stepIndex + 1,
              completed_at: now,
              next_send_at: null,
            })
            .eq("id", en.id);
          await admin
            .from("marketing_prospects")
            .update({ status: "completed" })
            .eq("id", prospectId);
        }

        sent.push(sendRow.id);
        remaining -= 1;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "send failed";
        await admin
          .from("marketing_sends")
          .update({ status: "failed", error_message: msg })
          .eq("id", sendRow.id);
        errors.push(`${sendRow.id}: ${msg}`);
      }
    }
  }

  return { sent, errors };
}
