import { Resend } from "https://esm.sh/resend@3.1.0";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  checklistNurtureHtml,
  LISTING_FROM,
  listingViewsNurtureHtml,
  postClaimNurtureHtml,
  siteUrl,
} from "./listingEmail.ts";

export async function alreadySent(
  admin: SupabaseClient,
  sequenceKey: string,
): Promise<boolean> {
  const { data } = await admin
    .from("ops_email_log")
    .select("sequence_key")
    .eq("sequence_key", sequenceKey)
    .maybeSingle();
  return !!data;
}

export async function logSent(
  admin: SupabaseClient,
  sequenceKey: string,
  email: string,
  payload: Record<string, unknown> = {},
) {
  await admin.from("ops_email_log").upsert({
    sequence_key: sequenceKey,
    email: email.toLowerCase(),
    payload,
    sent_at: new Date().toISOString(),
  });
}

function daysAgoWindow(days: number, windowHours = 26): { from: string; to: string } {
  const center = Date.now() - days * 24 * 60 * 60 * 1000;
  const half = (windowHours / 2) * 60 * 60 * 1000;
  return {
    from: new Date(center - half).toISOString(),
    to: new Date(center + half).toISOString(),
  };
}

export async function processChecklistNurture(
  admin: SupabaseClient,
  resend: Resend,
): Promise<string[]> {
  const sent: string[] = [];
  const base = siteUrl();
  const grantsUrl = Deno.env.get("GRANTS_PAGE_URL") ?? `${base}/grants`;
  const membershipUrl = Deno.env.get("MEMBERSHIP_APP_URL") ??
    "https://membership.rtmbusinessdirectory.com/signup";
  const checklistPdfUrl = Deno.env.get("GRANT_CHECKLIST_PDF_URL") ??
    `${base}/downloads/RTM_Grant_Checklist.pdf`;
  const unsubBase = `${base}/listing-opt-out`;

  const nurtureDays: Array<1 | 3 | 7> = [1, 3, 7];

  for (const day of nurtureDays) {
    const { from, to } = daysAgoWindow(day);
    const { data: leads } = await admin
      .from("grant_checklist_leads")
      .select("id, email, name, status, created_at")
      .in("status", ["new", "contacted", "replied"])
      .gte("created_at", from)
      .lte("created_at", to)
      .limit(30);

    for (const lead of leads ?? []) {
      const key = `checklist:${lead.id}:day${day}`;
      if (await alreadySent(admin, key)) continue;

      const { data: sup } = await admin
        .from("listing_suppressions")
        .select("id")
        .eq("email", lead.email.toLowerCase())
        .maybeSingle();
      if (sup) continue;

      const { subject, html } = checklistNurtureHtml({
        day,
        name: lead.name,
        grantsUrl,
        membershipUrl,
        checklistPdfUrl,
        unsubscribeUrl: `${unsubBase}?email=${encodeURIComponent(lead.email)}`,
      });

      await resend.emails.send({
        from: LISTING_FROM,
        to: lead.email,
        subject,
        html,
      });
      await logSent(admin, key, lead.email, { lead_id: lead.id, day });
      sent.push(key);
    }
  }

  return sent;
}

export async function processPostClaimNurture(
  admin: SupabaseClient,
  resend: Resend,
): Promise<string[]> {
  const sent: string[] = [];
  const dash = `${siteUrl()}/dashboard`;
  const grantsUrl = Deno.env.get("GRANTS_APP_URL") ?? "https://grants.rtmbusinessdirectory.com";

  const steps: Array<{ step: "photos" | "grants"; days: number }> = [
    { step: "photos", days: 3 },
    { step: "grants", days: 7 },
  ];

  for (const { step, days } of steps) {
    const { from, to } = daysAgoWindow(days);
    const { data: claims } = await admin
      .from("business_claims")
      .select("id, business_id, business_email, verified_at, status")
      .eq("status", "approved")
      .gte("verified_at", from)
      .lte("verified_at", to)
      .limit(25);

    for (const claim of claims ?? []) {
      const key = `post_claim:${claim.business_id}:${step}`;
      if (await alreadySent(admin, key)) continue;
      if (!claim.business_email) continue;

      const { data: biz } = await admin
        .from("businesses")
        .select("name, claim_status")
        .eq("business_id", claim.business_id)
        .maybeSingle();
      if (biz?.claim_status !== "claimed") continue;

      const nurture = postClaimNurtureHtml({
        businessName: biz?.name ?? "your business",
        step,
        dashboardUrl: step === "grants" ? `${grantsUrl}/grants` : dash,
      });

      await resend.emails.send({
        from: LISTING_FROM,
        to: claim.business_email,
        subject: nurture.subject,
        html: nurture.html,
      });
      await logSent(admin, key, claim.business_email, {
        business_id: claim.business_id,
        step,
      });
      sent.push(key);
    }
  }

  return sent;
}

export async function processListingViewsNurture(
  admin: SupabaseClient,
  resend: Resend,
): Promise<string[]> {
  const sent: string[] = [];
  const base = siteUrl();
  const featuredUrl = `${base}/pricing`;

  const { data: businesses } = await admin
    .from("businesses")
    .select("business_id, name, city, category, owner_email, listing_view_count, claim_approved_at")
    .eq("claim_status", "claimed")
    .not("owner_email", "is", null)
    .limit(40);

  for (const biz of businesses ?? []) {
    if (!biz.owner_email || !biz.claim_approved_at) continue;
    const approvedAt = new Date(biz.claim_approved_at).getTime();
    const daysSince = (Date.now() - approvedAt) / (24 * 60 * 60 * 1000);
    if (daysSince < 14 || daysSince > 16) continue;

    const key = `listing_views:${biz.business_id}:month1`;
    if (await alreadySent(admin, key)) continue;

    const slug = (s: string) =>
      s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const profileUrl =
      `${base}/directory/${slug(biz.category)}/${slug(biz.city)}/${slug(biz.name)}--${biz.business_id}`;
    const views = Math.max(biz.listing_view_count ?? 0, 25);

    const { subject, html } = listingViewsNurtureHtml({
      businessName: biz.name,
      viewCount: views,
      profileUrl,
      dashboardUrl: `${base}/dashboard`,
      featuredUrl,
    });

    await resend.emails.send({
      from: LISTING_FROM,
      to: biz.owner_email,
      subject,
      html,
    });
    await logSent(admin, key, biz.owner_email, { business_id: biz.business_id, views });
    sent.push(key);
  }

  return sent;
}
