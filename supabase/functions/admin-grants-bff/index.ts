import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Action = "list-applications" | "list-grants";

type ApplicationRow = {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function requireAdmin(
  req: Request,
  kajwpUrl: string,
  kajwpAnon: string,
  kajwpService: string,
) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("Unauthorized");

  const authClient = createClient(kajwpUrl, kajwpAnon);
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);
  if (error || !user) throw new Error("Unauthorized");

  const kajwpAdmin = createClient(kajwpUrl, kajwpService);

  const { data: profile, error: profileError } = await kajwpAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") return user;

  const { data: isAdmin, error: rpcError } = await kajwpAdmin.rpc("is_admin", {
    check_user_id: user.id,
  });

  if (!rpcError && isAdmin === true) return user;

  if (profileError) throw profileError;
  throw new Error("Admin access required");
}

async function resolveEmails(
  kajwpAdmin: ReturnType<typeof createClient>,
  userIds: string[],
): Promise<Map<string, string | null>> {
  const emailByUserId = new Map<string, string | null>();
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueIds.length) return emailByUserId;

  const { data: profiles } = await kajwpAdmin
    .from("profiles")
    .select("user_id, email")
    .in("user_id", uniqueIds);

  for (const row of profiles ?? []) {
    if (row.user_id) emailByUserId.set(row.user_id, row.email ?? null);
  }

  const missing = uniqueIds.filter((id) => !emailByUserId.get(id));
  for (const userId of missing) {
    const { data: authUser } = await kajwpAdmin.auth.admin.getUserById(userId);
    emailByUserId.set(userId, authUser?.user?.email ?? null);
  }

  return emailByUserId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const kajwpUrl = Deno.env.get("SUPABASE_URL");
    const kajwpService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const kajwpAnon = Deno.env.get("SUPABASE_ANON_KEY");
    const stellarUrl = Deno.env.get("STELLAR_SUPABASE_URL");
    const stellarService = Deno.env.get("STELLAR_SERVICE_ROLE_KEY");

    if (!kajwpUrl || !kajwpService || !kajwpAnon) {
      return json({ error: "Server configuration incomplete." }, 500);
    }

    if (!stellarUrl || !stellarService) {
      return json({ error: "Stellar grants backend is not configured." }, 500);
    }

    await requireAdmin(req, kajwpUrl, kajwpAnon, kajwpService);

    const body =
      req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = body?.action as Action | undefined;

    if (!action || !["list-applications", "list-grants"].includes(action)) {
      return json({ error: "Invalid action. Use list-applications or list-grants." }, 400);
    }

    const stellarAdmin = createClient(stellarUrl, stellarService);
    const kajwpAdmin = createClient(kajwpUrl, kajwpService);

    if (action === "list-grants") {
      const { data: grants, error } = await stellarAdmin
        .from("grants")
        .select("id, name, organization, amount, is_active, created_at")
        .order("name", { ascending: true });

      if (error) throw error;
      return json({ grants: grants ?? [] });
    }

    const { data: applications, error: appsError } = await stellarAdmin
      .from("applications")
      .select("id, user_id, item_type, item_id, status, notes, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (appsError) throw appsError;

    const grantIds = [
      ...new Set(
        ((applications ?? []) as ApplicationRow[])
          .filter((a) => a.item_type === "grant")
          .map((a) => a.item_id),
      ),
    ];

    const grantNameById = new Map<string, string>();
    if (grantIds.length) {
      const { data: grants } = await stellarAdmin
        .from("grants")
        .select("id, name")
        .in("id", grantIds);
      for (const grant of grants ?? []) {
        grantNameById.set(grant.id, grant.name);
      }
    }

    const userIds = ((applications ?? []) as ApplicationRow[]).map((a) => a.user_id);
    const emailByUserId = await resolveEmails(kajwpAdmin, userIds);

    const queue = ((applications ?? []) as ApplicationRow[]).map((row) => ({
      id: row.id,
      status: row.status,
      email: emailByUserId.get(row.user_id) ?? null,
      grant_name:
        row.item_type === "grant"
          ? grantNameById.get(row.item_id) ?? row.item_id
          : row.item_id,
      item_type: row.item_type,
      item_id: row.item_id,
      user_id: row.user_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return json({ applications: queue });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Grants BFF failed";
    const status =
      message === "Unauthorized" || message === "Admin access required" ? 403 : 500;
    return json({ error: message }, status);
  }
});
