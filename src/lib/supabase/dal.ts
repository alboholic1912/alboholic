import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./server";

export const ADMIN_PATH = "/kalaja-cabb0da6";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`${ADMIN_PATH}/login`);
  }

  return user;
}
