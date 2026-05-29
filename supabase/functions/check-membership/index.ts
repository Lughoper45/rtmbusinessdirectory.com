import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-platform-service-key",
};

type CheckBody = {
  email?: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type MembershipResult = {
  status: string;
  active: boolean;
  source: string;
  membershipUserId?: string;
};

async function getMembershipStatus(
  admin: ReturnType<typeof createClient>,
  userId: string | null,
  email: string | null,
): Promise<MembershipResult> {
  if (userId) {
    const { data: byId } = await admin
      .from("profiles")
      .select("membership_status")
      .eq("id", userId)
      .maybeSingle();

    if (byId?.membership_status) {
      const s = byId.membership_status as string;
      return { status: s, active: s === "active", source: "profile_id" };
    }

    const { data: byUserId } = await admin
      .from("profiles")
      .select("membership_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (byUserId?.membership_status) {
      const s = byUserId.membership_status as string;
      return { status: s, active: s === "active", source: "profile_user_id" };
    }

    const { data: legacy } = await admin
      .from("user_memberships")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (legacy) {
      return { status: "active", active: true, source: "legacy_user_memberships" };
    }
  }

  if (email) {
    const { data: byEmail } = await admin
      .from("profiles")
      .select("membership_status, id")
      .ilike("email", email)
      .maybeSingle();

    if (byEmail?.membership_status) {
      const s = byEmail.membership_status as string;
      return {
        status: s,
        active: s === "active",
        source: "profile_email",
        membershipUserId: byEmail.id,
      };
    }
  }

  return { status: "profile_incomplete", active: false, source: "none" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const platformServiceKey = Deno.env.get("PLATFORM_SERVICE_KEY");

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return json({ active: false, status: "profile_incomplete", error: "Server configuration incomplete." }, 500);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const body: CheckBody =
      req.method === "POST" ? await req.json().catch(() => ({})) : {};

    let userId: string | null = null;
    let email: string | null =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : null;

    const serviceHeader = req.headers.get("x-platform-service-key");
    const serviceAuthorized =
      !!platformServiceKey && serviceHeader === platformServiceKey && !!email;

    if (!serviceAuthorized) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return json({ active: false, status: "profile_incomplete", error: "Unauthorized" }, 401);
      }

      const authClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userError } = await authClient.auth.getUser();
      if (userError || !userData.user) {
        return json({ active: false, status: "profile_incomplete", error: "Unauthorized" }, 401);
      }

      userId = userData.user.id;
      email = email ?? userData.user.email?.toLowerCase() ?? null;
    }

    const result = await getMembershipStatus(admin, userId, email);

    return json({
      active: result.active,
      status: result.status,
      membershipUserId: result.membershipUserId ?? userId,
      email,
      source: result.source,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Membership check failed.";
    return json({ active: false, status: "profile_incomplete", error: message }, 500);
  }
});
