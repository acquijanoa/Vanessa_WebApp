/**
 * Resolves Supabase credentials from env. Dashboard / Vercel may use
 * NEXT_PUBLIC_* (browser) or server-only names like SUPABASE_URL.
 */
export function getSupabaseProjectUrl(): string | undefined {
  const v =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  return v || undefined;
}

/** Low-privilege key (anon / publishable) for API + RLS. */
export function getSupabasePublicApiKey(): string | undefined {
  const v =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  return v || undefined;
}

export function getSupabaseServiceRoleKey(): string | undefined {
  const v = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return v || undefined;
}
