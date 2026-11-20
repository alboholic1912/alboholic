"use server";

import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // A valid account that isn't an admin gets the same answer as a wrong password.
  if (error || !(await isAdmin(supabase))) {
    if (!error) await supabase.auth.signOut({ scope: "local" });
    redirect(
      `/kalaja-cabb0da6/login?error=${encodeURIComponent("Invalid email or password.")}`
    );
  }

  redirect("/kalaja-cabb0da6");
}
