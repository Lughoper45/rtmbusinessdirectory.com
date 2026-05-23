import { STELLAR_SUPABASE_ANON_KEY, STELLAR_SUPABASE_URL } from "@/integrations/supabase/stellarClient";

const stellarUrl = STELLAR_SUPABASE_URL.replace(/\/$/, "");
const stellarAnon = STELLAR_SUPABASE_ANON_KEY;

export type PlatformApplication = {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchMyGrantApplications(accessToken: string): Promise<PlatformApplication[]> {
  if (!stellarUrl || !stellarAnon) {
    throw new Error("Grant applications API is not configured.");
  }

  const response = await fetch(`${stellarUrl}/functions/v1/list-my-applications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: stellarAnon,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  const payload = (await response.json()) as { applications?: PlatformApplication[]; error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Could not load applications");
  }

  return (payload.applications ?? []).filter((a) => a.item_type === "grant");
}
