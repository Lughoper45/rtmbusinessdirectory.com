import { createClient } from "@supabase/supabase-js";

/** Stellar / vinbf grants catalog — same Supabase project as grants.rtmbusinessdirectory.com */
export const STELLAR_SUPABASE_URL =
  import.meta.env.VITE_STELLAR_SUPABASE_URL || "https://vinbfneyficvgjrcduuj.supabase.co";

/**
 * Public anon key for vinbf (grants table has RLS select for all).
 * Set VITE_STELLAR_SUPABASE_PUBLISHABLE_KEY on Vercel (Lughoper45 launchpad project) to override after key rotation.
 */
export const STELLAR_SUPABASE_ANON_KEY =
  import.meta.env.VITE_STELLAR_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbmJmbmV5ZmljdmdqcmNkdXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTY2MjUsImV4cCI6MjA5NDc5MjYyNX0.tVXFqiBBlYm2x8AoxoQsEELD9-Xd2rhshTrze2S5qG0";

/** Read-only client for grants catalog (stellar / vinbf project). */
export const stellarSupabase = createClient(STELLAR_SUPABASE_URL, STELLAR_SUPABASE_ANON_KEY);
