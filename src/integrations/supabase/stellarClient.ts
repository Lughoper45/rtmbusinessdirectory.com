import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_STELLAR_SUPABASE_URL;
const key = import.meta.env.VITE_STELLAR_SUPABASE_PUBLISHABLE_KEY;

/** Read-only client for grants catalog (stellar / vinbf project). */
export const stellarSupabase =
  url && key ? createClient(url, key) : null;
