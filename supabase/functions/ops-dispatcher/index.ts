import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.1.0";
import {
  handleCorsPreflight,
  jsonResponse,
} from "../_shared/cors.ts";
import {
  claimInviteHtml,
  LISTING_FROM,
  siteUrl,
  socialPostText,
} from "../_shared/listingEmail.ts";
import {
  processChecklistNurture,
  processListingViewsNurture,
  processPostClaimNurture,
} from "../_shared/nurtureScheduler.ts";
import { publishToSocialChannels } from "../_shared/socialPublish.ts";

const CRON_SECRET = Deno.env.get("OPS_CRON_SECRET");
const DAILY_SEND_CAP = Number(Deno.env.get("LISTING_DAILY_SEND_CAP") || "50");

function profilePath(biz: {
  business_id: string;
  name: string;
  category: string;
  city: string;
}): string {
  const slug = (s: string) =>
    s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const nameSlug = slug(biz.name);
  return `/directory/${slug(biz.category)}/${slug(biz.city)}/${nameSlug}--${biz.business_id}`;
}

async function isSuppressed(admin: ReturnType<typeof createClient>, email: string) {
  const { data } = await admin
    .from("listing_suppressions")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return !!data;
}

async function sendOutreachRow(
  admin: ReturnType<typeof createClient>,
  resend: Resend,
  outreachId: string,
) {
  const { data: row, error } = await admin
    .from("listing_outreach")
    .select("id, business_id, contact_id, step, invite_token, status")
    .eq("id", outreachId)
    .maybeSingle();

  if (error || !row) throw new Error("Outreach row not found");

  let contactEmail: string | null = null;
  let contactName: string | null = null;
  if (row.contact_id) {
    const { data: c } = await admin
      .from("listing_contacts")
      .select("email, name")
      .eq("id", row.contact_id)
      .maybeSingle();
    contactEmail = c?.email ?? null;
    contactName = c?.name ?? null;
  }

  const { data: biz } = await admin
    .from("businesses")
    .select("business_id, name, city, category, owner_email")
    .eq("business_id", row.business_id)
    .maybeSingle();

  if (!biz) throw new Error("Business not found");
  const email = contactEmail || biz.owner_email;
  if (!email) throw new Error("No contact email");

  if (await isSuppressed(admin, email)) {
    await admin.from("listing_outreach").update({ status: "opted_out" }).eq("id", outreachId);
    return { skipped: "suppressed" };
  }

  const token = row.invite_token || crypto.randomUUID();
  const base = siteUrl();
  const claimUrl = `${base}/claim?token=${encodeURIComponent(token)}`;
  const profileUrl = `${base}${profilePath(biz)}`;
  const unsubUrl = `${base}/listing-opt-out?token=${encodeURIComponent(token)}`;

  const { subject, html } = claimInviteHtml({
    businessName: biz.name,
    city: biz.city,
    claimUrl,
    profileUrl,
    unsubscribeUrl: unsubUrl,
    step: row.step ?? 0,
  });

  const result = await resend.emails.send({
    from: LISTING_FROM,
    to: email,
    subject,
    html,
  });

  await admin
    .from("listing_outreach")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      invite_token: token,
      resend_message_id: result.data?.id ?? null,
    })
    .eq("id", outreachId);

  await admin
    .from("businesses")
    .update({ claim_status: "invited", last_outreach_at: new Date().toISOString(), owner_email: email })
    .eq("business_id", biz.business_id);

  await admin.rpc("upsert_crm_contact", {
    p_email: email,
    p_name: contactName,
    p_source: "listing_outreach",
    p_tags: ["directory_owner"],
  });

  await admin.from("crm_activities").insert({
    contact_id: null,
    kind: "listing_invite_sent",
    payload: { business_id: biz.business_id, email, step: row.step },
    created_by: "system",
  });

  return { sent: true, messageId: result.data?.id };
}

async function handleEvent(
  admin: ReturnType<typeof createClient>,
  resend: Resend | null,
  event: { id: string; event_type: string; payload: Record<string, unknown> },
) {
  switch (event.event_type) {
    case "listing_outreach.approved": {
      if (!resend) throw new Error("RESEND_API_KEY required");
      const outreachId = String(event.payload.outreach_id ?? "");
      return await sendOutreachRow(admin, resend, outreachId);
    }
    case "listing.claimed": {
      return { ok: true, note: "sequence stopped by status" };
    }
    case "social_post.approved": {
      const postId = String(event.payload.post_id ?? "");
      const { data: post } = await admin
        .from("social_post_queue")
        .select("*")
        .eq("id", postId)
        .maybeSingle();
      if (!post) throw new Error("Post not found");

      const payload = post.payload as Record<string, string>;
      const channels: string[] = post.channels ?? ["facebook", "linkedin", "x"];
      const published = await publishToSocialChannels(
        channels,
        {
          facebook: payload.facebook,
          linkedin: payload.linkedin,
          x: payload.x,
          profileUrl: payload.profileUrl || siteUrl(),
          imageUrl: payload.image,
        },
        (ch) =>
          socialPostText({
            name: payload.name || "RTM Business",
            city: payload.city || "Canada",
            category: payload.category || "Business",
            profileUrl: payload.profileUrl || siteUrl(),
            channel: ch,
          }),
      );

      await admin
        .from("social_post_queue")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          published_urls: published,
        })
        .eq("id", postId);

      return { published };
    }
    case "checklist_lead.created": {
      return { ok: true, note: "day 1/3/7 nurture handled by cron" };
    }
    default:
      return { ignored: event.event_type };
  }
}

async function processReminders(admin: ReturnType<typeof createClient>, resend: Resend) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: due } = await admin
    .from("listing_outreach")
    .select("id, business_id, step, sent_at")
    .eq("status", "sent")
    .lt("step", 2)
    .lt("sent_at", sevenDaysAgo)
    .limit(20);

  const queued: string[] = [];
  for (const row of due ?? []) {
    const nextStep = (row.step ?? 0) + 1;
    const { data: biz } = await admin
      .from("businesses")
      .select("claim_status")
      .eq("business_id", row.business_id)
      .maybeSingle();
    if (biz?.claim_status === "claimed" || biz?.claim_status === "suppressed") continue;

    const { data: prev } = await admin
      .from("listing_outreach")
      .select("contact_id")
      .eq("id", row.id)
      .maybeSingle();

    const { data: newRow } = await admin
      .from("listing_outreach")
      .insert({
        business_id: row.business_id,
        contact_id: prev?.contact_id ?? null,
        sequence_id: "claim_invite_v1",
        step: nextStep,
        status: "approved",
        approved_at: new Date().toISOString(),
        invite_token: crypto.randomUUID(),
      })
      .select("id")
      .single();

    if (newRow?.id) {
      await sendOutreachRow(admin, resend, newRow.id);
      queued.push(newRow.id);
    }
  }
  return queued;
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    const cronHeader = req.headers.get("x-ops-cron-secret");
    if (CRON_SECRET && cronHeader !== CRON_SECRET) {
      return jsonResponse(req, { error: "Forbidden" }, 403);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const resend = resendKey ? new Resend(resendKey) : null;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: sentToday } = await admin
      .from("listing_outreach")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", todayStart.toISOString());

    const { data: events } = await admin
      .from("ops_events")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    const processed: unknown[] = [];

    for (const ev of events ?? []) {
      await admin.from("ops_events").update({ status: "processing" }).eq("id", ev.id);
      try {
        if (
          ev.event_type === "listing_outreach.approved" &&
          (sentToday ?? 0) + processed.length >= DAILY_SEND_CAP
        ) {
          throw new Error("Daily send cap reached");
        }
        const result = await handleEvent(admin, resend, ev);
        await admin
          .from("ops_events")
          .update({ status: "done", processed_at: new Date().toISOString() })
          .eq("id", ev.id);
        processed.push({ id: ev.id, result });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "handler error";
        await admin
          .from("ops_events")
          .update({
            status: "failed",
            retry_count: (ev.retry_count ?? 0) + 1,
            last_error: msg,
          })
          .eq("id", ev.id);
        processed.push({ id: ev.id, error: msg });
      }
    }

    let reminders: string[] = [];
    let checklistNurture: string[] = [];
    let postClaimNurture: string[] = [];
    let listingViewsNurture: string[] = [];
    if (resend) {
      reminders = await processReminders(admin, resend);
      checklistNurture = await processChecklistNurture(admin, resend);
      postClaimNurture = await processPostClaimNurture(admin, resend);
      listingViewsNurture = await processListingViewsNurture(admin, resend);
    }

    const { data: approved } = await admin
      .from("listing_outreach")
      .select("id")
      .eq("status", "approved")
      .is("sent_at", null)
      .limit(Math.max(0, DAILY_SEND_CAP - (sentToday ?? 0)));

    for (const row of approved ?? []) {
      if (!resend) break;
      if ((sentToday ?? 0) + processed.length >= DAILY_SEND_CAP) break;
      try {
        const result = await sendOutreachRow(admin, resend, row.id);
        processed.push({ direct: row.id, result });
      } catch (e) {
        processed.push({
          direct: row.id,
          error: e instanceof Error ? e.message : "send failed",
        });
      }
    }

    return jsonResponse(req, {
      ok: true,
      sentToday,
      cap: DAILY_SEND_CAP,
      eventsProcessed: processed.length,
      processed,
      reminders,
      checklistNurture,
      postClaimNurture,
      listingViewsNurture,
    });
  } catch (e) {
    return jsonResponse(
      req,
      { error: e instanceof Error ? e.message : "Dispatcher failed" },
      500,
    );
  }
});
