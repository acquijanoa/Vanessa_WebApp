import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseProjectUrl, getSupabasePublicApiKey } from "@/lib/supabase/env";

/** Browser/client bundle: only NEXT_PUBLIC_* is available unless you inline vars at build time. */
export function createClient(): SupabaseClient | null {
  const url = getSupabaseProjectUrl();
  const key = getSupabasePublicApiKey();
  if (!url || !key) {
    return null;
  }
  return createSupabaseClient(url, key);
}
