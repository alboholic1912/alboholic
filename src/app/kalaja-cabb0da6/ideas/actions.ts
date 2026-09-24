"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";

const IDEAS_PATH = "/kalaja-cabb0da6/ideas";

export async function createIdea(formData: FormData) {
  await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!title) throw new Error("Give the idea a title.");

  const supabase = await createClient();
  const { error } = await supabase.from("ideas").insert({ title, notes });
  if (error) throw new Error(error.message);

  redirect(IDEAS_PATH);
}

export async function updateIdeaStatus(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["idea", "planned", "archived"].includes(status)) {
    throw new Error("Invalid request.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ideas")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  redirect(IDEAS_PATH);
}

export async function deleteIdea(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Invalid request.");

  const supabase = await createClient();
  const { error } = await supabase.from("ideas").delete().eq("id", id);
  if (error) throw new Error(error.message);

  redirect(IDEAS_PATH);
}
