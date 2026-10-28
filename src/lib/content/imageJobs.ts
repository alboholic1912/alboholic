import "server-only";
import { createClient } from "@/lib/supabase/server";
import { uploadMedia } from "@/lib/supabase/storage";
import { isImageMode, MAX_IMAGE_PROMPT_LENGTH, type ImageMode } from "@/lib/ai/imagePrompts";
import type { ContentType } from "./types";

export type ImageJobStatus = "pending" | "generating" | "done" | "failed";

export interface ImageJob {
  id: string;
  created_at: string;
  updated_at: string;
  content_type: ContentType;
  content_id: string;
  mode: ImageMode;
  prompt: string;
  brief: string;
  reference_path: string;
  status: ImageJobStatus;
  error: string | null;
  image: string | null;
}

/** A generation still "generating" after this long was cut off by the platform's time limit. */
export const STALE_JOB_MS = 6 * 60 * 1000;

const REFERENCE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const MAX_REFERENCE_BYTES = 20 * 1024 * 1024;

export interface ImageRequest {
  mode: ImageMode;
  prompt: string;
  reference: File | null;
}

/** Reads and checks the image fields shared by the Generate and Regenerate forms. */
export function readImageRequest(formData: FormData): ImageRequest {
  const file = formData.get("referenceImage");
  const reference = file instanceof File && file.size > 0 ? file : null;
  const mode = formData.get("imageMode");
  const prompt = String(formData.get("imagePrompt") ?? "").trim();

  if (reference) {
    if (!REFERENCE_TYPES[reference.type]) {
      throw new Error("The reference image must be a PNG, JPEG or WebP file.");
    }
    if (reference.size > MAX_REFERENCE_BYTES) {
      throw new Error("The reference image must be under 20 MB.");
    }
  }
  if (!isImageMode(mode)) {
    throw new Error("Choose Recreation or Restoration for the image.");
  }
  if (!prompt) {
    throw new Error("The image prompt is empty.");
  }
  if (prompt.length > MAX_IMAGE_PROMPT_LENGTH) {
    throw new Error(`The image prompt is too long (over ${MAX_IMAGE_PROMPT_LENGTH} characters).`);
  }

  return { mode, prompt, reference };
}

/** Queues an image for a content item. The edit page picks it up and runs it. */
export async function createImageJob({
  type,
  id,
  mode,
  prompt,
  brief,
  reference,
}: {
  type: ContentType;
  id: string;
  mode: ImageMode;
  prompt: string;
  brief: string;
  /** A new upload, or the storage path of a reference uploaded earlier. */
  reference: File | { path: string };
}): Promise<void> {
  const referencePath =
    reference instanceof File
      ? (await uploadMedia(reference, reference.type, REFERENCE_TYPES[reference.type], `${type}/${id}/reference`)).path
      : reference.path;

  const supabase = await createClient();
  const { error } = await supabase.from("image_generations").insert({
    content_type: type,
    content_id: id,
    mode,
    prompt,
    brief,
    reference_path: referencePath,
  });
  if (error) {
    throw new Error(`Could not queue the image: ${error.message}`);
  }
}

/** Returns null when there is none, or when the table can't be read (e.g. the migration hasn't been run). */
export async function getLatestImageJob(type: ContentType, id: string): Promise<ImageJob | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("image_generations")
    .select("*")
    .eq("content_type", type)
    .eq("content_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[image_generations] Could not read image jobs:", error.message);
    return null;
  }

  const job = (data as ImageJob | null) ?? null;
  // A run the platform cut off never gets to mark itself failed, so do it here and allow a retry.
  if (job?.status === "generating" && Date.now() - new Date(job.updated_at).getTime() > STALE_JOB_MS) {
    const timedOut = { status: "failed" as const, error: "The image took too long and was stopped. Try again." };
    await supabase.from("image_generations").update(timedOut).eq("id", job.id);
    return { ...job, ...timedOut };
  }
  return job;
}

/** Joins the editor's prompt with what this particular image has to show. */
export function buildImagePrompt(job: ImageJob, label: string, title: string): string {
  const lines = [job.prompt, "", `This image is the featured image for the ${label.toLowerCase()} "${title}".`];
  if (job.brief) lines.push(`What it should show: ${job.brief}`);
  return lines.join("\n");
}
