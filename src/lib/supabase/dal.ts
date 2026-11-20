import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./server";

export const ADMIN_PATH = "/kalaja-cabb0da6";

/**
 * Whether the signed-in account is on the admins list (see supabase/schema.sql). Signing in
 * is not enough to use the Studio, because anyone can create a Supabase account. Any failure,
 * including the function not existing yet, counts as "no".
 */
export async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    console.error("[auth] is_admin check failed. Has supabase/schema.sql been run?", error.message);
    return false;
  }
  return data === true;
}

/**
 * The signed-in account from the session cookie, or null. Uses getClaims, which checks the token
 * locally when the project signs tokens with an asymmetric key instead of asking the Auth server
 * on every page. Cached per request, so the layout and the page share one check.
 */
export const getSessionUser = cache(async (): Promise<{ id: string; email: string | null } | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
});

export const requireUser = cache(async () => {
  const user = await getSessionUser();

  if (!user || !(await isAdmin(await createClient()))) {
    redirect(`${ADMIN_PATH}/login`);
  }

  return user;
});
