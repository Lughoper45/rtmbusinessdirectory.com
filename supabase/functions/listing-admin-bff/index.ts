import { Resend } from "https://esm.sh/resend@3.1.0";
import {
  handleCorsPreflight,
  jsonResponse,
} from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/adminAuth.ts";
import {
  postClaimNurtureHtml,
  siteUrl,
  socialPostText,
} from "../_shared/listingEmail.ts";
import { scoreContact, domainFromUrl } from "../_shared/listingContactScore.ts";
import { isOpenRouterConfigured, openRouterChat } from "../_shared/openrouter.ts";

type Action =
  | "list-unclaimed"
  | "list-contacts"
  | "list-outreach"
  | "add-contact"
  | "verify-contact"
  | "approve-outreach"
  | "build-outreach-queue"
  | "run-enricher"
  | "list-claims"
  | "approve-claim"
  | "reject-claim"
  | "list-social"
  | "approve-social"
  | "generate-social"
  | "publish-social"
  | "list-crm-contacts"
  | "list-suppressions"
  | "dispatch-now";

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

    if (action === "list-unclaimed") {
      const search = String(body.search ?? "").toLowerCase();
      let q = admin
        .from("businesses")
        .select(
          "business_id, name, city, province, category, website, phone, owner_email, claim_status, last_outreach_at",
          { count: "exact" },
        )
        .in("claim_status", ["unclaimed", "invited"])
        .order("name")
        .limit(100);

      if (body.claim_status) q = q.eq("claim_status", body.claim_status);

      const { data, error, count } = await q;
      if (error) throw error;

      const filtered = search
        ? (data ?? []).filter(
            (b) =>
              b.name?.toLowerCase().includes(search) ||
              b.city?.toLowerCase().includes(search) ||
              b.owner_email?.toLowerCase().includes(search),
          )
        : data;

      return jsonResponse(req, { businesses: filtered, total: count });
    }

    if (action === "list-contacts") {
      const { data, error } = await admin
        .from("listing_contacts")
        .select("*, businesses(name, city)")
        .order("confidence", { ascending: false })
        .limit(200);
      if (error) throw error;
      return jsonResponse(req, { contacts: data });
    }

    if (action === "list-outreach") {
      const status = body.status as string | undefined;
      let q = admin
        .from("listing_outreach")
        .select("*, businesses(name, city), listing_contacts(email, name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (status && status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return jsonResponse(req, { outreach: data });
    }

    if (action === "add-contact") {
      const businessId = String(body.business_id ?? "");
      const email = String(body.email ?? "").trim().toLowerCase();
      const website = body.website as string | undefined;
      if (!businessId || !email) {
        return jsonResponse(req, { error: "business_id and email required" }, 400);
      }
      const websiteDomain = domainFromUrl(website);
      const { confidence, casl_basis } = scoreContact({
        email,
        websiteDomain,
      });
      const { data, error } = await admin
        .from("listing_contacts")
        .insert({
          business_id: businessId,
          email,
          name: body.name ?? null,
          phone: body.phone ?? null,
          source: "manual",
          casl_basis: body.casl_basis ?? "manual_verified",
          confidence: Math.max(confidence, 80),
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          is_primary: true,
        })
        .select()
        .single();
      if (error) throw error;

      await admin
        .from("businesses")
        .update({ owner_email: email, owner_name: body.name ?? null })
        .eq("business_id", businessId);

      return jsonResponse(req, { contact: data });
    }

    if (action === "verify-contact") {
      const contactId = String(body.contact_id ?? "");
      const { data, error } = await admin
        .from("listing_contacts")
        .update({
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          confidence: Math.max(Number(body.confidence) || 85, 70),
          casl_basis: body.casl_basis ?? "manual_verified",
          is_primary: true,
        })
        .eq("id", contactId)
        .select()
        .single();
      if (error) throw error;
      if (data?.email) {
        await admin
          .from("businesses")
          .update({ owner_email: data.email })
          .eq("business_id", data.business_id);
      }
      return jsonResponse(req, { contact: data });
    }

    if (action === "build-outreach-queue") {
      const limit = Math.min(Number(body.limit) || 50, 100);
      const { data: contacts } = await admin
        .from("listing_contacts")
        .select("id, business_id, email, confidence, casl_basis, verified_at")
        .gte("confidence", 70)
        .not("email", "is", null)
        .order("confidence", { ascending: false })
        .limit(limit * 2);

      const created: string[] = [];
      for (const c of contacts ?? []) {
        if (created.length >= limit) break;
        if (!c.casl_basis && !c.verified_at) continue;

        const { data: biz } = await admin
          .from("businesses")
          .select("claim_status")
          .eq("business_id", c.business_id)
          .maybeSingle();
        if (biz?.claim_status === "claimed" || biz?.claim_status === "suppressed") continue;

        const { data: existing } = await admin
          .from("listing_outreach")
          .select("id")
          .eq("business_id", c.business_id)
          .in("status", ["queued", "approved", "sent"])
          .limit(1);
        if (existing?.length) continue;

        const { data: sup } = await admin
          .from("listing_suppressions")
          .select("id")
          .eq("email", c.email)
          .maybeSingle();
        if (sup) continue;

        const { data: row } = await admin
          .from("listing_outreach")
          .insert({
            business_id: c.business_id,
            contact_id: c.id,
            status: "queued",
            invite_token: crypto.randomUUID(),
          })
          .select("id")
          .single();
        if (row?.id) created.push(row.id);
      }
      return jsonResponse(req, { queued: created.length, ids: created });
    }

    if (action === "approve-outreach") {
      const ids: string[] = body.ids ?? [];
      for (const id of ids) {
        await admin
          .from("listing_outreach")
          .update({
            status: "approved",
            approved_by: user.id,
            approved_at: new Date().toISOString(),
          })
          .eq("id", id);

        await admin.from("ops_events").insert({
          event_type: "listing_outreach.approved",
          payload: { outreach_id: id },
        });
      }
      return jsonResponse(req, { approved: ids.length });
    }

    if (action === "run-enricher") {
      const enrichUrl = `${supabaseUrl}/functions/v1/listing-contact-enricher`;
      const res = await fetch(enrichUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
          "x-ops-cron-secret": Deno.env.get("OPS_CRON_SECRET") ?? "",
        },
        body: JSON.stringify({
          limit: body.limit ?? 25,
          business_ids: body.business_ids,
        }),
      });
      const payload = await res.json();
      return jsonResponse(req, payload);
    }

    if (action === "list-claims") {
      const { data, error } = await admin
        .from("business_claims")
        .select("*, businesses(name, city, category)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return jsonResponse(req, { claims: data });
    }

    if (action === "approve-claim") {
      const claimId = String(body.claim_id ?? "");
      const { data: claim, error } = await admin
        .from("business_claims")
        .update({ status: "approved", verified_at: new Date().toISOString() })
        .eq("id", claimId)
        .select()
        .single();
      if (error) throw error;

      await admin
        .from("businesses")
        .update({
          claim_status: "claimed",
          claimed_by_user_id: claim.user_id,
          is_verified: true,
          owner_email: claim.business_email,
          claim_approved_at: new Date().toISOString(),
          listing_view_count: 25,
        })
        .eq("business_id", claim.business_id);

      const { data: contactId } = await admin.rpc("upsert_crm_contact", {
        p_email: claim.business_email,
        p_name: null,
        p_source: "listing_claim",
        p_tags: ["directory_owner", "claimed"],
      });

      if (contactId) {
        await admin.from("crm_deals").insert({
          contact_id: contactId,
          deal_type: "featured_listing",
          stage: "discovery",
          business_id: claim.business_id,
          notes: "Created when listing claim was approved — follow up for featured placement.",
        });
        await admin.from("crm_activities").insert({
          contact_id: contactId,
          kind: "claim_approved",
          payload: { business_id: claim.business_id, claim_id: claimId },
          created_by: "system",
        });
      }

      await admin
        .from("listing_outreach")
        .update({ status: "claimed" })
        .eq("business_id", claim.business_id);

      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const resend = new Resend(resendKey);
        const { data: biz } = await admin
          .from("businesses")
          .select("name")
          .eq("business_id", claim.business_id)
          .maybeSingle();
        const dash = `${siteUrl()}/dashboard`;
        const nurture = postClaimNurtureHtml({
          businessName: biz?.name ?? "your business",
          step: "profile",
          dashboardUrl: dash,
        });
        await resend.emails.send({
          from: "RTM Directory <noreply@rtmbusinessdirectory.com>",
          to: claim.business_email,
          subject: nurture.subject,
          html: nurture.html,
        });
        await fetch(`${supabaseUrl}/functions/v1/send-claim-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            action: "approved",
            email: claim.business_email,
            businessName: biz?.name ?? "your business",
          }),
        });
      }

      await admin.from("ops_events").insert({
        event_type: "listing.claimed",
        payload: { claim_id: claimId, business_id: claim.business_id },
      });

      return jsonResponse(req, { claim });
    }

    if (action === "reject-claim") {
      const claimId = String(body.claim_id ?? "");
      const { data: claim, error } = await admin
        .from("business_claims")
        .update({ status: "rejected" })
        .eq("id", claimId)
        .select()
        .single();
      if (error) throw error;

      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const { data: biz } = await admin
          .from("businesses")
          .select("name")
          .eq("business_id", claim.business_id)
          .maybeSingle();
        await fetch(`${supabaseUrl}/functions/v1/send-claim-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            action: "rejected",
            email: claim.business_email,
            businessName: biz?.name ?? "your business",
          }),
        });
      }
      return jsonResponse(req, { claim });
    }

    if (action === "list-social") {
      const { data, error } = await admin
        .from("social_post_queue")
        .select("*, businesses(name, city, category)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return jsonResponse(req, { posts: data });
    }

    if (action === "generate-social") {
      const businessId = String(body.business_id ?? "");
      const { data: biz, error } = await admin
        .from("businesses")
        .select("business_id, name, city, category, image")
        .eq("business_id", businessId)
        .single();
      if (error || !biz) throw error;

      const base = siteUrl();
      const slug = (s: string) =>
        s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const profileUrl =
        `${base}/directory/${slug(biz.category)}/${slug(biz.city)}/${slug(biz.name)}--${biz.business_id}`;

      const payload: Record<string, string> = {
        name: biz.name,
        city: biz.city,
        category: biz.category,
        profileUrl,
        image: biz.image ?? "",
      };

      if (isOpenRouterConfigured()) {
        try {
          const { text: draft } = await openRouterChat({
            messages: [
              {
                role: "system",
                content:
                  "Write short social posts for a Canadian business directory listing. No grant guarantees. Return JSON only: {\"facebook\":\"...\",\"linkedin\":\"...\",\"x\":\"...\"}",
              },
              {
                role: "user",
                content: `Business: ${biz.name}, ${biz.category}, ${biz.city}. URL: ${profileUrl}. Max 280 chars for x.`,
              },
            ],
            maxTokens: 600,
            xTitle: "RTM Social Publisher",
          });
          const parsed = JSON.parse(
            draft.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim(),
          ) as Record<string, string>;
          for (const ch of ["facebook", "linkedin", "x"]) {
            if (parsed[ch]) payload[ch] = parsed[ch];
          }
        } catch {
          /* fall through to templates */
        }
      }

      for (const ch of ["facebook", "linkedin", "x"]) {
        if (!payload[ch]) {
          payload[ch] = socialPostText({
            name: biz.name,
            city: biz.city,
            category: biz.category,
            profileUrl,
            channel: ch,
          });
        }
      }

      const { data: post, error: insErr } = await admin
        .from("social_post_queue")
        .insert({
          business_id: businessId,
          product_type: "listing",
          payload,
          status: "draft",
        })
        .select()
        .single();
      if (insErr) throw insErr;
      return jsonResponse(req, { post });
    }

    if (action === "approve-social") {
      const ids: string[] = body.ids ?? [];
      for (const id of ids) {
        await admin
          .from("social_post_queue")
          .update({
            status: "approved",
            approved_by: user.id,
            approved_at: new Date().toISOString(),
          })
          .eq("id", id);
        await admin.from("ops_events").insert({
          event_type: "social_post.approved",
          payload: { post_id: id },
        });
      }
      return jsonResponse(req, { approved: ids.length });
    }

    if (action === "publish-social") {
      const dispatchUrl = `${supabaseUrl}/functions/v1/ops-dispatcher`;
      const res = await fetch(dispatchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ops-cron-secret": Deno.env.get("OPS_CRON_SECRET") ?? "",
        },
      });
      return jsonResponse(req, await res.json());
    }

    if (action === "list-crm-contacts") {
      const { data, error } = await admin
        .from("crm_contacts")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return jsonResponse(req, { contacts: data });
    }

    if (action === "list-suppressions") {
      const { data, error } = await admin
        .from("listing_suppressions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return jsonResponse(req, { suppressions: data });
    }

    if (action === "dispatch-now") {
      const dispatchUrl = `${supabaseUrl}/functions/v1/ops-dispatcher`;
      const res = await fetch(dispatchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ops-cron-secret": Deno.env.get("OPS_CRON_SECRET") ?? "",
        },
      });
      return jsonResponse(req, await res.json());
    }

    return jsonResponse(req, { error: "Unknown action" }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "listing-admin-bff error";
    const status = msg.includes("Unauthorized") || msg.includes("Admin") ? 403 : 500;
    return jsonResponse(req, { error: msg }, status);
  }
});
