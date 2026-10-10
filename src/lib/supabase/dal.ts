import "server-only";
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

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(supabase))) {
    redirect(`${ADMIN_PATH}/login`);
  }

  return user;
}
