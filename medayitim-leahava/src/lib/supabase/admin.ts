import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase admin client (service role).
 *
 * NEVER import this from a Client Component. The `server-only` package above
 * makes the build fail if it is ever pulled into a client bundle.
 *
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured, so callers
 * can degrade gracefully (e.g. delete the user's data via RLS but skip the
 * auth-user deletion).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
