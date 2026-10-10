"use server";

import { createPublicClient } from "@/lib/supabase/public";

export type SubscribeState = { status: "idle" | "done" | "error"; message?: string };

const DONE: SubscribeState = { status: "done" };

// Postgres' "unique violation": the address is already on the list.
const ALREADY_SUBSCRIBED = "23505";

export async function subscribe(_previous: SubscribeState, formData: FormData): Promise<SubscribeState> {
  // A field people never see. Only a bot fills it in, and it is told all went well.
  if (formData.get("website")) return DONE;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  const { error } = await createPublicClient().from("subscribers").insert({ email });
  if (error && error.code !== ALREADY_SUBSCRIBED) {
    console.error("[subscribe] Could not save the address. Has supabase/schema.sql been run?", error.message);
    return { status: "error", message: "We couldn't sign you up just now. Please try again in a moment." };
  }

  return DONE;
}
