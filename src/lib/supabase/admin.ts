import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * A Supabase client with the service role key, which bypasses Row Level Security. Only for jobs
 * that run without a signed-in admin, such as the Instagram scheduler. Never use it for anything
 * a visitor's request can reach.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
