import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseProjectUrl,
  getSupabasePublicApiKey,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/env";

/**
 * Server-only Supabase client. Prefer publishable/anon key + RLS for user-scoped reads;
 * use service role only in Route Handlers / Server Actions that must bypass RLS.
 */
export function createServerClient(): SupabaseClient | null {
  const url = getSupabaseProjectUrl();
  const key = getSupabaseServiceRoleKey() ?? getSupabasePublicApiKey();
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}
