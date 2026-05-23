import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function requireAdmin(
  req: Request,
  authClient: ReturnType<typeof createClient>,
) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("Unauthorized");

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);
  if (error || !user) throw new Error("Unauthorized");

  const { data: profile, error: profileError } = await authClient
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    throw new Error("Admin access required");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration incomplete." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const authClient = createClient(supabaseUrl, anonKey);
    await requireAdmin(req, authClient);

    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id, user_id, full_name, role, phone, avatar_url, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;

    const emailByUserId = new Map<string, string | null>();
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data: authPage, error: authError } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (authError) throw authError;

      for (const authUser of authPage.users ?? []) {
        emailByUserId.set(authUser.id, authUser.email ?? null);
      }

      if (!authPage.users?.length || authPage.users.length < perPage) break;
      page += 1;
    }

    const users = (profiles ?? []).map((profile) => ({
      ...profile,
      email: emailByUserId.get(profile.user_id) ?? null,
      role: profile.role || "member",
    }));

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list users";
    const status =
      message === "Unauthorized" || message === "Admin access required" ? 403 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
