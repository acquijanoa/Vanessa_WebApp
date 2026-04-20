import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client. Prefer the anon key + RLS for user-scoped reads;
 * use service role only in Route Handlers / Server Actions that must bypass RLS.
 */
export function createServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}
