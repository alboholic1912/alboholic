"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";

const IDEAS_PATH = "/kalaja-cabb0da6/ideas";
const KINDS = ["story", "person", "battle"];
const STATUSES = ["idea", "planned", "done"];

function readFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const sources = String(formData.get("sources") ?? "").trim();
  const kind = String(formData.get("kind") ?? "story");
  if (!title) throw new Error("Give the idea a title.");
  if (!KINDS.includes(kind)) throw new Error("Invalid request.");
  return { title, notes, sources, kind };
}

export async function createIdea(formData: FormData) {
  await requireUser();
  const fields = readFields(formData);

  const supabase = await createClient();
  const { error } = await supabase.from("ideas").insert(fields);
  if (error) throw new Error(error.message);

  redirect(IDEAS_PATH);
}

export async function updateIdea(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Invalid request.");
  const fields = readFields(formData);

  const supabase = await createClient();
  const { error } = await supabase
    .from("ideas")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  redirect(IDEAS_PATH);
}

export async function updateIdeaStatus(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !STATUSES.includes(status)) throw new Error("Invalid request.");

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
