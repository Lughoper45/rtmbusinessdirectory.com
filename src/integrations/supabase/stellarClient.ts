import { supabase } from './client';

/** @deprecated Use `supabase` — grants catalog lives on the same kajwp project. */
export const stellarSupabase = supabase;

export const STELLAR_SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_STELLAR_SUPABASE_URL ||
  'https://kajwpmyloxaqeciyndwf.supabase.co';

export const STELLAR_SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_STELLAR_SUPABASE_PUBLISHABLE_KEY ||
  '';
