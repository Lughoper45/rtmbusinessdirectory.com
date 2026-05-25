import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/adminAuth.ts";

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return jsonResponse(req, { error: "Server configuration incomplete." }, 500);
    }

    const { admin } = await requireAdmin(req, supabaseUrl, anonKey, serviceKey);

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

    return jsonResponse(req, { users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list users";
    const status =
      message === "Unauthorized" || message === "Admin access required" ? 403 : 500;
    return jsonResponse(req, { error: message }, status);
  }
});
