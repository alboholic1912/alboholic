import "server-only";
import { createClient } from "@/lib/supabase/server";
import { uploadMedia } from "@/lib/supabase/storage";
import { isImageMode, MAX_IMAGE_PROMPT_LENGTH, type ImageMode } from "@/lib/ai/imagePrompts";
import { DEFAULT_IMAGE_MODEL, getImageModel } from "@/lib/ai/models";
import type { ContentType } from "./types";

export type ImageJobStatus = "pending" | "generating" | "done" | "failed";

export interface ImageJob {
  id: string;
  created_at: string;
  updated_at: string;
  content_type: ContentType;
  content_id: string;
  mode: ImageMode;
  model: string;
  prompt: string;
  brief: string;
  /** Path inside the media bucket, or null when the image was drawn from the prompt alone. */
  reference_path: string | null;
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

export const RESTORATION_NEEDS_REFERENCE =
  "Restoration works on a reference image, so attach one or switch to Recreation.";

/** How the featured image is added: made by OpenAI, or uploaded as it is. */
export type ImageSource = "generate" | "import";

export function readImageSource(formData: FormData): ImageSource {
  return formData.get("imageSource") === "import" ? "import" : "generate";
}

export interface ImageRequest {
  mode: ImageMode;
  model: string;
  prompt: string;
  /** A newly attached reference image. Null means none, or reuse the last one (see `reuseReference`). */
  reference: File | null;
  reuseReference: boolean;
}

/** Reads and checks the image fields shared by the Generate and Regenerate forms. */
export function readImageRequest(formData: FormData): ImageRequest {
  const file = formData.get("referenceImage");
  const reference = file instanceof File && file.size > 0 ? file : null;
  const reuseReference = formData.get("reuseReference") === "on";
  const mode = formData.get("imageMode");
  const prompt = String(formData.get("imagePrompt") ?? "").trim();
  // Only allow known models so a crafted request can't pick an arbitrary (expensive) one.
  const model = getImageModel(String(formData.get("imageModel") ?? ""))?.id ?? DEFAULT_IMAGE_MODEL;

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

  return { mode, model, prompt, reference, reuseReference };
}

const MAX_IMPORT_BYTES = 20 * 1024 * 1024;

/** The image uploaded as it is, or null when the field was left empty. */
export function readImportImage(formData: FormData): File | null {
  const file = formData.get("importImage");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) {
    throw new Error("The imported file must be an image.");
  }
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error("The imported image must be under 20 MB.");
  }
  return file;
}

/** Queues an image for a content item. The edit page picks it up and runs it. */
export async function createImageJob({
  type,
  id,
  mode,
  model,
  prompt,
  brief,
  reference,
}: {
  type: ContentType;
  id: string;
  mode: ImageMode;
  model: string;
  prompt: string;
  brief: string;
  /** A new upload, the storage path of a reference uploaded earlier, or none. */
  reference: File | { path: string } | null;
}): Promise<void> {
  if (mode === "restoration" && !reference) {
    throw new Error(RESTORATION_NEEDS_REFERENCE);
  }
  const referencePath =
    reference instanceof File
      ? (await uploadMedia(reference, reference.type, REFERENCE_TYPES[reference.type], `${type}/${id}/reference`)).path
      : (reference?.path ?? null);

  const supabase = await createClient();
  const { error } = await supabase.from("image_generations").insert({
    content_type: type,
    content_id: id,
    mode,
    model,
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
  // The prompt templates talk about "the reference"; say plainly when there isn't one.
  if (!job.reference_path) {
    lines.push("No reference image is supplied, so create the whole image from this description.");
  }
  return lines.join("\n");
}
