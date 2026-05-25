import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function requireAdmin(
  req: Request,
  supabaseUrl: string,
  anonKey: string,
  serviceKey: string,
) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("Unauthorized");

  const authClient = createClient(supabaseUrl, anonKey);
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);
  if (error || !user) throw new Error("Unauthorized");

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") return { user, admin };

  const { data: isAdmin, error: rpcError } = await admin.rpc("is_admin", {
    check_user_id: user.id,
  });

  if (!rpcError && isAdmin === true) return { user, admin };

  throw new Error("Admin access required");
}

export function getServiceClient(
  supabaseUrl: string,
  serviceKey: string,
): SupabaseClient {
  return createClient(supabaseUrl, serviceKey);
}
