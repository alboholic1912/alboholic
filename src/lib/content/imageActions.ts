"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { requireUser } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { uploadImage } from "@/lib/supabase/storage";
import { readFeaturedImage } from "./featuredImage";
import { isContentType } from "./types";

const ADMIN_PATH = "/kalaja-cabb0da6";

/** The featured-image form on the edit page: uploads an image as it is, replacing the current one. */
export async function saveFeaturedImage(formData: FormData) {
  await requireUser();
  const type = formData.get("type");
  const id = formData.get("id");
  if (typeof type !== "string" || !isContentType(type) || typeof id !== "string" || !id) {
    throw new Error("Invalid request.");
  }

  const editPath = `${ADMIN_PATH}/${type}/${id}`;
  try {
    const file = readFeaturedImage(formData);
    if (!file) throw new Error("Choose an image to upload.");
    const supabase = await createClient();
    const image = await uploadImage(file, `${type}/${id}`);
    const { error } = await supabase
      .from(type)
      .update({ image, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(`Could not save the image: ${error.message}`);
  } catch (err) {
    unstable_rethrow(err);
    const message = err instanceof Error ? err.message : "Could not save the image.";
    redirect(`${editPath}?imageError=${encodeURIComponent(message)}`);
  }
  redirect(editPath);
}
