import { Resend } from "https://esm.sh/resend@3.1.0";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  jsonProfileFields,
  memberHasLowDigitalPresence,
} from "./grantProfileSignals.ts";

function daysAgoWindow(days: number, windowHours = 26): { from: string; to: string } {
  const center = Date.now() - days * 24 * 60 * 60 * 1000;
  const half = (windowHours / 2) * 60 * 60 * 1000;
  return {
    from: new Date(center - half).toISOString(),
    to: new Date(center + half).toISOString(),
  };
}

async function memberEmailAlreadySent(
  admin: SupabaseClient,
  profileId: string,
  template: string,
): Promise<boolean> {
  const { data } = await admin
    .from("member_email_log")
    .select("id")
    .eq("profile_id", profileId)
    .eq("template", template)
    .limit(1)
    .maybeSingle();
  return !!data;
}

async function invokeSendMemberEmail(
  supabaseUrl: string,
  serviceKey: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${supabaseUrl}/functions/v1/send-member-email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: text.slice(0, 200) };
  }
  return { ok: true };
}

async function latestOpenIntake(
  admin: SupabaseClient,
  userId: string,
): Promise<{ grantId: string; grantName: string; updatedAt: string } | null> {
  const { data: intake } = await admin
    .from("grant_intakes")
    .select("grant_id, updated_at")
    .eq("user_id", userId)
    .in("status", ["draft", "collecting"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!intake?.grant_id) return null;

  const { data: grant } = await admin
    .from("grants")
    .select("name, deadline_label, deadline_days")
    .eq("id", intake.grant_id)
    .maybeSingle();

  return {
    grantId: intake.grant_id,
    grantName: grant?.name ?? intake.grant_id,
    updatedAt: intake.updated_at,
  };
}

/** S1 — 24h inactive, profile <50% complete */
export async function processProfileNudge(
  admin: SupabaseClient,
  supabaseUrl: string,
  serviceKey: string,
): Promise<string[]> {
  const sent: string[] = [];
  const { from, to } = daysAgoWindow(1);
  const template = "payment_reminder";
  const candidateIds = new Set<string>();

  const { data: sessions } = await admin
    .from("user_sessions")
    .select("user_id, profile_completion_pct, membership_status")
    .gte("last_active_at", from)
    .lte("last_active_at", to)
    .lt("profile_completion_pct", 50)
    .not("user_id", "is", null)
    .limit(50);

  for (const s of sessions ?? []) {
    if (s.user_id && s.membership_status !== "active") {
      candidateIds.add(s.user_id);
    }
  }

  const { data: newProfiles } = await admin
    .from("profiles")
    .select("id")
    .eq("membership_status", "profile_incomplete")
    .lt("profile_completion_pct", 50)
    .gte("joined_at", from)
    .lte("joined_at", to)
    .limit(30);

  for (const p of newProfiles ?? []) {
    candidateIds.add(p.id);
  }

  for (const userId of candidateIds) {
    const { data: p } = await admin
      .from("profiles")
      .select("id, email, membership_status, profile_completion_pct")
      .eq("id", userId)
      .eq("membership_status", "profile_incomplete")
      .maybeSingle();

    if (!p?.email || (p.profile_completion_pct ?? 0) >= 50) continue;
    if (await memberEmailAlreadySent(admin, p.id, template)) continue;

    const { data: gp } = await admin
      .from("grant_profiles")
      .select("profile")
      .eq("user_id", p.id)
      .maybeSingle();
    const { province } = jsonProfileFields(gp?.profile as Record<string, unknown>);

    const result = await invokeSendMemberEmail(supabaseUrl, serviceKey, {
      profileId: p.id,
      template,
      province,
    });
    if (result.ok) sent.push(`s1:${p.id}`);
  }

  return sent;
}

/** S3 — intake started, no submit progress 48h */
export async function processIntakeEncouragement(
  admin: SupabaseClient,
  supabaseUrl: string,
  serviceKey: string,
): Promise<string[]> {
  const sent: string[] = [];
  const { from, to } = daysAgoWindow(2);

  const { data: intakes } = await admin
    .from("grant_intakes")
    .select("user_id, grant_id, updated_at")
    .in("status", ["draft", "collecting"])
    .gte("updated_at", from)
    .lte("updated_at", to)
    .limit(40);

  for (const intake of intakes ?? []) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, email, membership_status")
      .eq("id", intake.user_id)
      .maybeSingle();

    if (!profile?.email || profile.membership_status === "active") continue;

    const template = "intake_encouragement";
    if (await memberEmailAlreadySent(admin, profile.id, template)) continue;

    const { data: grant } = await admin
      .from("grants")
      .select("name")
      .eq("id", intake.grant_id)
      .maybeSingle();

    const result = await invokeSendMemberEmail(supabaseUrl, serviceKey, {
      profileId: profile.id,
      template,
      grantName: grant?.name ?? "your grant application",
    });
    if (result.ok) sent.push(`s3:${profile.id}`);
  }

  return sent;
}

/** S4 — modal dismissed ≥2 or intake started 5+ days ago, not active */
export async function processPassportPitch(
  admin: SupabaseClient,
  supabaseUrl: string,
  serviceKey: string,
): Promise<string[]> {
  const sent: string[] = [];
  const template = "passport_pitch";
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  const { data: dismissUsers } = await admin
    .from("user_behavior_events")
    .select("user_id")
    .eq("event_type", "modal_dismissed")
    .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
    .not("user_id", "is", null);

  const dismissCounts = new Map<string, number>();
  for (const row of dismissUsers ?? []) {
    if (!row.user_id) continue;
    dismissCounts.set(row.user_id, (dismissCounts.get(row.user_id) ?? 0) + 1);
  }

  const candidateIds = new Set<string>();
  for (const [userId, count] of dismissCounts) {
    if (count >= 2) candidateIds.add(userId);
  }

  const { data: staleIntakes } = await admin
    .from("grant_intakes")
    .select("user_id")
    .in("status", ["draft", "collecting"])
    .lte("created_at", fiveDaysAgo)
    .limit(50);

  for (const row of staleIntakes ?? []) {
    candidateIds.add(row.user_id);
  }

  for (const userId of candidateIds) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, email, membership_status")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.email || profile.membership_status === "active") continue;
    if (await memberEmailAlreadySent(admin, profile.id, template)) continue;

    const intake = await latestOpenIntake(admin, userId);
    const grantName = intake?.grantName ?? "your matched grant";

    const result = await invokeSendMemberEmail(supabaseUrl, serviceKey, {
      profileId: profile.id,
      template,
      grantName,
    });
    if (result.ok) sent.push(`s4:${profile.id}`);
  }

  return sent;
}

/** S7 — active member, day 3 post-activation, edu access not claimed */
export async function processEduCrossSell(
  admin: SupabaseClient,
  supabaseUrl: string,
  serviceKey: string,
): Promise<string[]> {
  const sent: string[] = [];
  const { from, to } = daysAgoWindow(3);
  const template = "edu_crosssell";

  const { data: subs } = await admin
    .from("subscriptions")
    .select("user_id, current_period_start")
    .eq("status", "active")
    .gte("current_period_start", from)
    .lte("current_period_start", to)
    .limit(40);

  for (const sub of subs ?? []) {
    if (!sub.user_id) continue;

    const { data: p } = await admin
      .from("profiles")
      .select("id, email, membership_status")
      .eq("id", sub.user_id)
      .eq("membership_status", "active")
      .maybeSingle();

    if (!p?.email) continue;
    if (await memberEmailAlreadySent(admin, p.id, template)) continue;

    const { data: edu } = await admin
      .from("edu_grant_access")
      .select("claimed_at, status")
      .ilike("email", p.email)
      .maybeSingle();

    if (edu?.claimed_at) continue;

    const result = await invokeSendMemberEmail(supabaseUrl, serviceKey, {
      profileId: p.id,
      template,
    });
    if (result.ok) sent.push(`s7:${p.id}`);
  }

  return sent;
}

/** S9 — 30 days inactive, was exploring grants */
/** S5 — grant detail viewed ≥2 min, not active, no package order */
export async function processPackageConsideration(
  admin: SupabaseClient,
  supabaseUrl: string,
  serviceKey: string,
): Promise<string[]> {
  const sent: string[] = [];
  const template = "package_consideration";
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: dwellEvents } = await admin
    .from("user_behavior_events")
    .select("user_id, page_path, metadata, created_at")
    .eq("event_type", "time_on_page")
    .gte("created_at", since)
    .like("page_path", "/grants/%")
    .not("user_id", "is", null)
    .limit(80);

  const candidates = new Map<string, { grantName?: string; sector?: string }>();

  for (const ev of dwellEvents ?? []) {
    if (!ev.user_id) continue;
    const seconds = Number((ev.metadata as Record<string, unknown>)?.seconds_spent ?? 0);
    if (seconds < 120) continue;

    const path = ev.page_path ?? "";
    const grantId = path.replace(/^\/grants\//, "").split("/")[0];
    if (!grantId || grantId === "packages" || grantId === "intake") continue;

    if (!candidates.has(ev.user_id)) {
      const { data: grant } = await admin
        .from("grants")
        .select("name")
        .eq("id", grantId)
        .maybeSingle();
      const { data: gp } = await admin
        .from("grant_profiles")
        .select("profile")
        .eq("user_id", ev.user_id)
        .maybeSingle();
      const fields = jsonProfileFields(gp?.profile as Record<string, unknown>);
      candidates.set(ev.user_id, {
        grantName: grant?.name ?? grantId,
        sector: fields.sector || undefined,
      });
    }
  }

  for (const [userId, ctx] of candidates) {
    const { data: p } = await admin
      .from("profiles")
      .select("id, email, membership_status")
      .eq("id", userId)
      .maybeSingle();

    if (!p?.email || p.membership_status === "active") continue;
    if (await memberEmailAlreadySent(admin, p.id, template)) continue;

    const { data: order } = await admin
      .from("grant_service_orders")
      .select("id")
      .eq("user_id", userId)
      .in("status", ["paid", "fulfilled", "pending"])
      .limit(1)
      .maybeSingle();

    if (order) continue;

    const result = await invokeSendMemberEmail(supabaseUrl, serviceKey, {
      profileId: p.id,
      template,
      grantName: ctx.grantName,
      sector: ctx.sector,
      bookUrl: "https://grants.rtmbusinessdirectory.com/grants",
    });
    if (result.ok) sent.push(`s5:${p.id}`);
  }

  return sent;
}

/** S8 — active member with grant intake, low digital presence, ~10 days into intake */
export async function processGrowthCrossSell(
  admin: SupabaseClient,
  supabaseUrl: string,
  serviceKey: string,
): Promise<string[]> {
  const sent: string[] = [];
  const { from, to } = daysAgoWindow(10);
  const template = "growth_crosssell";
  const growAuditUrl = Deno.env.get("GROW_APP_URL") ??
    "https://grow.rtmbusinessdirectory.com";

  const { data: intakes } = await admin
    .from("grant_intakes")
    .select("user_id, grant_id, created_at")
    .gte("created_at", from)
    .lte("created_at", to)
    .limit(40);

  for (const intake of intakes ?? []) {
    const { data: p } = await admin
      .from("profiles")
      .select("id, email, membership_status, display_name")
      .eq("id", intake.user_id)
      .eq("membership_status", "active")
      .maybeSingle();

    if (!p?.email) continue;
    if (await memberEmailAlreadySent(admin, p.id, template)) continue;

    const { data: growthOrder } = await admin
      .from("growth_service_orders")
      .select("id")
      .eq("user_id", intake.user_id)
      .eq("status", "paid")
      .limit(1)
      .maybeSingle();
    if (growthOrder) continue;

    const { data: auditLead } = await admin
      .from("growth_audit_leads")
      .select("id")
      .ilike("email", p.email)
      .gte("created_at", new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle();
    if (auditLead) continue;

    const lowDigital = await memberHasLowDigitalPresence(admin, p.id, p.email);
    if (!lowDigital) continue;

    const { data: grant } = await admin
      .from("grants")
      .select("name")
      .eq("id", intake.grant_id)
      .maybeSingle();

    const result = await invokeSendMemberEmail(supabaseUrl, serviceKey, {
      profileId: p.id,
      template,
      grantName: grant?.name ?? "your grant application",
      auditUrl: `${growAuditUrl.replace(/\/$/, "")}/?source=grant_s8&utm_medium=email&utm_campaign=growth_crosssell`,
    });
    if (result.ok) {
      sent.push(`s8:${p.id}`);
      await admin.rpc("upsert_crm_contact", {
        p_email: p.email,
        p_name: p.display_name,
        p_source: "grant_lifecycle_s8",
        p_tags: ["growth_crosssell_sent"],
      });
    }
  }

  return sent;
}

export async function processGrantWinBack(
  admin: SupabaseClient,
  supabaseUrl: string,
  serviceKey: string,
): Promise<string[]> {
  const sent: string[] = [];
  const { from, to } = daysAgoWindow(30, 48);
  const template = "win_back";

  const { data: sessions } = await admin
    .from("user_sessions")
    .select("user_id, last_active_at")
    .gte("last_active_at", from)
    .lte("last_active_at", to)
    .not("user_id", "is", null)
    .limit(60);

  const userIds = [...new Set((sessions ?? []).map((s) => s.user_id).filter(Boolean))] as string[];

  for (const userId of userIds) {
    const { data: p } = await admin
      .from("profiles")
      .select("id, email, membership_status")
      .eq("id", userId)
      .in("membership_status", ["grant_intake_started", "profile_incomplete"])
      .maybeSingle();

    if (!p?.email) continue;
    if (await memberEmailAlreadySent(admin, p.id, template)) continue;

    const intake = await latestOpenIntake(admin, p.id);
    let deadline: string | undefined;
    if (intake?.grantId) {
      const { data: grant } = await admin
        .from("grants")
        .select("deadline_label, deadline_days")
        .eq("id", intake.grantId)
        .maybeSingle();
      deadline = grant?.deadline_label ??
        (grant?.deadline_days != null ? `in ${grant.deadline_days} days` : undefined);
    }

    const result = await invokeSendMemberEmail(supabaseUrl, serviceKey, {
      profileId: p.id,
      template,
      grantName: intake?.grantName,
      deadline,
    });
    if (result.ok) sent.push(`s9:${p.id}`);
  }

  return sent;
}

export async function processGrantLifecycleNurture(
  admin: SupabaseClient,
  _resend: Resend,
): Promise<Record<string, string[]>> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!serviceKey) {
    return { error: ["missing service key"] };
  }

  const [s1, s3, s4, s5, s7, s8, s9] = await Promise.all([
    processProfileNudge(admin, supabaseUrl, serviceKey),
    processIntakeEncouragement(admin, supabaseUrl, serviceKey),
    processPassportPitch(admin, supabaseUrl, serviceKey),
    processPackageConsideration(admin, supabaseUrl, serviceKey),
    processEduCrossSell(admin, supabaseUrl, serviceKey),
    processGrowthCrossSell(admin, supabaseUrl, serviceKey),
    processGrantWinBack(admin, supabaseUrl, serviceKey),
  ]);

  return {
    s1_profile_nudge: s1,
    s3_intake: s3,
    s4_passport: s4,
    s5_package: s5,
    s7_edu: s7,
    s8_growth: s8,
    s9_winback: s9,
  };
}
