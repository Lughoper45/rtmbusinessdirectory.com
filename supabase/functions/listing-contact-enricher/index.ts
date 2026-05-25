import {
  handleCorsPreflight,
  jsonResponse,
} from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/adminAuth.ts";
import {
  domainFromUrl,
  extractEmailsFromHtml,
  scoreContact,
} from "../_shared/listingContactScore.ts";

const CRON_SECRET = Deno.env.get("OPS_CRON_SECRET");

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    const cronHeader = req.headers.get("x-ops-cron-secret");
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const isCron = CRON_SECRET && cronHeader === CRON_SECRET;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = getServiceClient(supabaseUrl, serviceKey);

    const limit = Math.min(Number(body.limit) || 25, 100);
    const businessIds: string[] | undefined = body.business_ids;

    let query = admin
      .from("businesses")
      .select("business_id, name, website, phone, city, claim_status")
      .eq("claim_status", "unclaimed")
      .limit(limit);

    if (businessIds?.length) {
      query = admin
        .from("businesses")
        .select("business_id, name, website, phone, city, claim_status")
        .in("business_id", businessIds)
        .limit(limit);
    }

    const { data: businesses, error } = await query;
    if (error) throw error;

    const results: { business_id: string; contacts_added: number; error?: string }[] = [];

    const placesKey = Deno.env.get("GOOGLE_PLACES_API_KEY")?.trim();

    for (const biz of businesses ?? []) {
      try {
        let added = 0;
        let website = biz.website;

        if (placesKey && biz.name && biz.city) {
          try {
            const q = encodeURIComponent(`${biz.name} ${biz.city} Canada`);
            const findRes = await fetch(
              `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${q}&inputtype=textquery&fields=place_id,website,formatted_phone_number&key=${placesKey}`,
            );
            const findJson = await findRes.json();
            const placeId = findJson?.candidates?.[0]?.place_id;
            if (placeId) {
              const detRes = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=website,formatted_phone_number&key=${placesKey}`,
              );
              const det = await detRes.json();
              const place = det?.result;
              if (place?.website && !website) website = place.website;
              if (place?.formatted_phone_number && !biz.phone) {
                await admin
                  .from("businesses")
                  .update({ phone: place.formatted_phone_number, website: website ?? biz.website })
                  .eq("business_id", biz.business_id);
              } else if (website && website !== biz.website) {
                await admin.from("businesses").update({ website }).eq("business_id", biz.business_id);
              }
            }
          } catch {
            /* Places optional */
          }
        }

        const resolvedDomain = domainFromUrl(website);

        if (website) {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          try {
            const res = await fetch(
              website.startsWith("http") ? website : `https://${website}`,
              {
                signal: controller.signal,
                headers: { "User-Agent": "RTM-Directory-Bot/1.0 (+https://rtmbusinessdirectory.com)" },
              },
            );
            clearTimeout(timeout);
            if (res.ok) {
              const html = await res.text();
              const emails = extractEmailsFromHtml(html, resolvedDomain);
              for (const found of emails.slice(0, 3)) {
                const { confidence, casl_basis } = scoreContact({
                  email: found.email,
                  websiteDomain: resolvedDomain,
                  foundOnContactPage: found.foundOnContactPage,
                  foundInFooter: found.foundInFooter,
                  isMailto: found.isMailto,
                });
                if (confidence < 40) continue;

                await admin.from("listing_contacts").upsert(
                  {
                    business_id: biz.business_id,
                    email: found.email,
                    source: "website",
                    source_url: website,
                    confidence,
                    casl_basis,
                    is_primary: added === 0,
                  },
                  { onConflict: "business_id,email", ignoreDuplicates: false },
                ).catch(async () => {
                  const { data: existing } = await admin
                    .from("listing_contacts")
                    .select("id")
                    .eq("business_id", biz.business_id)
                    .eq("email", found.email)
                    .maybeSingle();
                  if (!existing) {
                    await admin.from("listing_contacts").insert({
                      business_id: biz.business_id,
                      email: found.email,
                      source: "website",
                      source_url: website,
                      confidence,
                      casl_basis,
                      is_primary: added === 0,
                    });
                  }
                });
                added++;
              }
            }
          } catch {
            clearTimeout(timeout);
          }
        }

        if (added === 0 && resolvedDomain) {
          const guessed = `info@${resolvedDomain}`;
          const { confidence, casl_basis } = scoreContact({
            email: guessed,
            websiteDomain: resolvedDomain,
          });
          if (confidence >= 50) {
            await admin.from("listing_contacts").insert({
              business_id: biz.business_id,
              email: guessed,
              source: "ai_inferred",
              confidence: Math.min(confidence, 55),
              casl_basis,
              is_primary: true,
            }).catch(() => {});
            added = 1;
          }
        }

        if (added > 0) {
          const { data: primary } = await admin
            .from("listing_contacts")
            .select("email, confidence, casl_basis")
            .eq("business_id", biz.business_id)
            .order("confidence", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (primary?.email) {
            await admin
              .from("businesses")
              .update({
                owner_email: primary.email,
                claim_status: biz.claim_status === "unclaimed" ? "unclaimed" : biz.claim_status,
              })
              .eq("business_id", biz.business_id);
          }

          await admin.from("ops_events").insert({
            event_type: "listing.contact_found",
            payload: {
              business_id: biz.business_id,
              contacts_added: added,
              confidence: primary?.confidence,
            },
          });
        }

        results.push({ business_id: biz.business_id, contacts_added: added });
      } catch (e) {
        results.push({
          business_id: biz.business_id,
          contacts_added: 0,
          error: e instanceof Error ? e.message : "enrich failed",
        });
      }
    }

    return jsonResponse(req, { ok: true, isCron, processed: results.length, results });
  } catch (e) {
    return jsonResponse(
      req,
      { error: e instanceof Error ? e.message : "Enricher failed" },
      500,
    );
  }
});
