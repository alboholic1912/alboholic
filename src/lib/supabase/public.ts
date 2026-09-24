import { createClient } from "@supabase/supabase-js";

/**
 * A cookie-free Supabase client for public, published-content reads.
 * Unlike src/lib/supabase/server.ts, this never touches next/headers, so
 * pages that use it can stay statically generated / ISR-cached instead of
 * being forced into fully dynamic rendering.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
