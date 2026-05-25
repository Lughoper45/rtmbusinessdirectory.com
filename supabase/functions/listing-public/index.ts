import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  handleCorsPreflight,
  jsonResponse,
} from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === "verify-invite") {
      const token = String(body.token ?? "").trim();
      if (!token) return jsonResponse(req, { valid: false }, 400);

      const { data: row } = await admin
        .from("listing_outreach")
        .select("id, business_id, status, step")
        .eq("invite_token", token)
        .maybeSingle();

      if (!row) return jsonResponse(req, { valid: false });

      const { data: biz } = await admin
        .from("businesses")
        .select("business_id, name, city, province, category, claim_status")
        .eq("business_id", row.business_id)
        .maybeSingle();

      return jsonResponse(req, {
        valid: true,
        business: biz,
        outreach_id: row.id,
      });
    }

    if (action === "opt-out") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const token = String(body.token ?? "").trim();
      if (!email && !token) {
        return jsonResponse(req, { error: "email or token required" }, 400);
      }

      let targetEmail = email;
      if (token && !targetEmail) {
        const { data: out } = await admin
          .from("listing_outreach")
          .select("contact_id")
          .eq("invite_token", token)
          .maybeSingle();
        if (out?.contact_id) {
          const { data: c } = await admin
            .from("listing_contacts")
            .select("email")
            .eq("id", out.contact_id)
            .maybeSingle();
          targetEmail = c?.email ?? "";
        }
      }

      if (!targetEmail) return jsonResponse(req, { error: "Could not resolve email" }, 400);

      await admin.from("listing_suppressions").upsert(
        { email: targetEmail, reason: "opt_out" },
        { onConflict: "email", ignoreDuplicates: true },
      ).catch(async () => {
        await admin.from("listing_suppressions").insert({
          email: targetEmail,
          reason: "opt_out",
        });
      });

      await admin
        .from("listing_outreach")
        .update({ status: "opted_out" })
        .eq("invite_token", token);

      const domain = targetEmail.split("@")[1];
      await admin
        .from("businesses")
        .update({ claim_status: "suppressed" })
        .eq("owner_email", targetEmail);

      return jsonResponse(req, { ok: true, message: "You have been opted out." });
    }

    return jsonResponse(req, { error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResponse(
      req,
      { error: e instanceof Error ? e.message : "Request failed" },
      500,
    );
  }
});
