"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { requireUser } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { downloadMedia, uploadMedia } from "@/lib/supabase/storage";
import { generateImageFromReference } from "@/lib/ai/openai";
import { logUsage } from "@/lib/ai/usage";
import { CONTENT_CONFIG } from "./config";
import { buildImagePrompt, createImageJob, getLatestImageJob, readImageRequest, type ImageJob } from "./imageJobs";
import { isContentType } from "./types";

const ADMIN_PATH = "/kalaja-cabb0da6";

// People have no ai_image column; their portraits are never labelled.
const TYPES_WITH_AI_FLAG = new Set(["stories", "battles"]);

/**
 * Runs a queued image generation. Called by the edit page right after it loads, so the slow
 * OpenAI call gets a request of its own instead of sharing the text generation's time limit.
 */
export async function runImageGeneration(jobId: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  const supabase = await createClient();

  // Claim the job, so a double render or a second tab can't pay for the same image twice.
  const { data: claimed } = await supabase
    .from("image_generations")
    .update({ status: "generating", updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();
  if (!claimed) return { ok: true };

  const job = claimed as ImageJob;
  const type = job.content_type;

  try {
    const config = CONTENT_CONFIG[type];
    const { data: item } = await supabase
      .from(type)
      .select(config.titleField)
      .eq("id", job.content_id)
      .maybeSingle();
    if (!item) throw new Error(`The ${config.label.toLowerCase()} no longer exists.`);
    const title = String((item as unknown as Record<string, unknown>)[config.titleField] ?? "");

    const referenceBlob = await downloadMedia(job.reference_path);
    const { bytes, mimeType, extension, usage } = await generateImageFromReference({
      model: job.model,
      type,
      mode: job.mode,
      prompt: buildImagePrompt(job, config.label, title),
      reference: {
        bytes: Buffer.from(await referenceBlob.arrayBuffer()),
        name: job.reference_path.split("/").pop() ?? "reference.png",
        mimeType: referenceBlob.type || "image/png",
      },
    });
    await logUsage(`${type}-image`, usage);

    const { publicUrl } = await uploadMedia(bytes, mimeType, extension, `${type}/${job.content_id}`);

    const update: Record<string, unknown> = { image: publicUrl, updated_at: new Date().toISOString() };
    if (TYPES_WITH_AI_FLAG.has(type)) update.ai_image = true;
    const { error: saveError } = await supabase.from(type).update(update).eq("id", job.content_id);
    if (saveError) throw new Error(`Could not save the generated image: ${saveError.message}`);

    await supabase
      .from("image_generations")
      .update({ status: "done", image: publicUrl, error: null, updated_at: new Date().toISOString() })
      .eq("id", job.id);
    return { ok: true };
  } catch (err) {
    console.error(`[runImageGeneration] job=${job.id} failed:`, err);
    const message = err instanceof Error ? err.message : "Something went wrong while generating the image.";
    await supabase
      .from("image_generations")
      .update({ status: "failed", error: message, updated_at: new Date().toISOString() })
      .eq("id", job.id);
    return { ok: false, error: message };
  }
}

/** Queues a new image for an existing item, reusing the last reference image unless a new one is attached. */
export async function regenerateImage(formData: FormData) {
  await requireUser();
  const type = formData.get("type");
  const id = formData.get("id");
  if (typeof type !== "string" || !isContentType(type) || typeof id !== "string" || !id) {
    throw new Error("Invalid request.");
  }

  const editPath = `${ADMIN_PATH}/${type}/${id}`;
  try {
    const { mode, model, prompt, reference } = readImageRequest(formData);
    const previous = await getLatestImageJob(type, id);
    const source = reference ?? (previous ? { path: previous.reference_path } : null);
    if (!source) {
      throw new Error("Attach a reference image first.");
    }

    await createImageJob({ type, id, mode, model, prompt, brief: previous?.brief ?? "", reference: source });
  } catch (err) {
    unstable_rethrow(err);
    const message = err instanceof Error ? err.message : "Could not start the image.";
    redirect(`${editPath}?imageError=${encodeURIComponent(message)}`);
  }
  redirect(editPath);
}
