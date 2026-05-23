import { createClient } from "@supabase/supabase-js";

/** Grants catalog - shared RTM Supabase project. */
export const STELLAR_SUPABASE_URL =
  import.meta.env.VITE_STELLAR_SUPABASE_URL || "https://kajwpmyloxaqeciyndwf.supabase.co";

/**
 * Public anon key for kajwp (grants table has RLS select for all).
 * Set VITE_STELLAR_SUPABASE_PUBLISHABLE_KEY on Vercel to override after key rotation.
 */
export const STELLAR_SUPABASE_ANON_KEY =
  import.meta.env.VITE_STELLAR_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthandwbXlsb3hhcWVjaXluZHdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNzM2OTIsImV4cCI6MjA4Nzg0OTY5Mn0.NV39WyJ0l5-ncPra6baq0-bhjP_TbvVhnHQoTxph_C4";

/** Read-only client for grants catalog. */
export const stellarSupabase = createClient(STELLAR_SUPABASE_URL, STELLAR_SUPABASE_ANON_KEY);
