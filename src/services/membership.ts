import { supabase } from "@/integrations/supabase/client";

export type PlatformMembership = {
  active: boolean;
  status: string;
  source: string;
  membershipUserId?: string | null;
};

export async function fetchPlatformMembership(
  userId: string,
  email?: string | null,
): Promise<PlatformMembership> {
  const { data, error } = await supabase.functions.invoke<PlatformMembership>("check-membership", {
    body: email ? { email } : undefined,
  });

  if (!error && data && typeof data.active === "boolean") {
    return {
      active: data.active,
      status: data.status ?? (data.active ? "active" : "inactive"),
      source: data.source ?? "edge_function",
      membershipUserId: data.membershipUserId ?? userId,
    };
  }

  const { data: byId } = await supabase
    .from("profiles")
    .select("membership_status")
    .eq("id", userId)
    .maybeSingle();

  const membershipStatus = (byId as { membership_status?: string } | null)?.membership_status;
  if (membershipStatus === "active") {
    return { active: true, status: "active", source: "profile_id", membershipUserId: userId };
  }

  const { data: byUserId } = await supabase
    .from("profiles")
    .select("membership_status")
    .eq("user_id", userId)
    .maybeSingle();

  const legacyStatus = (byUserId as { membership_status?: string } | null)?.membership_status;
  if (legacyStatus === "active") {
    return { active: true, status: "active", source: "profile_user_id", membershipUserId: userId };
  }

  const { data: legacyMembership } = await supabase
    .from("user_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (legacyMembership) {
    return { active: true, status: "active", source: "legacy_user_memberships", membershipUserId: userId };
  }

  return { active: false, status: "inactive", source: "none", membershipUserId: userId };
}
