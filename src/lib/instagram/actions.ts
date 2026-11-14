"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { requireUser } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/supabase/storage";
import { getContentById } from "@/lib/content/data";
import { isContentType, type ContentType } from "@/lib/content/types";
import { generateStructuredContent } from "@/lib/ai/generate";
import { DEFAULT_AI_MODEL } from "@/lib/ai/models";
import { logUsage } from "@/lib/ai/usage";
import { getProfile } from "./api";
import { getAccount, publishPost, removeFiles, toJpeg, uploadJpeg } from "./publish";
import {
  MAX_CAPTION,
  MAX_HASHTAGS,
  MAX_IMAGES,
  MAX_MENTIONS,
  captionStats,
  isInstagramAspect,
  parseUsernames,
  type InstagramImage,
  type InstagramPostRow,
} from "./types";

const STUDIO = "/kalaja-cabb0da6";
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

function editorUrl(id: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  return `${STUDIO}/instagram/${id}${query ? `?${query}` : ""}`;
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

export async function connectInstagram(formData: FormData) {
  await requireUser();
  const token = String(formData.get("token") ?? "").trim();
  if (!token) redirect(`${STUDIO}/instagram?error=${encodeURIComponent("Paste an access token.")}`);

  try {
    const { igUserId, username } = await getProfile(token);
    const now = new Date();
    const supabase = await createClient();
    const { error } = await supabase.from("instagram_account").upsert({
      id: 1,
      ig_user_id: igUserId,
      username,
      access_token: token,
      token_refreshed_at: now.toISOString(),
      // Long-lived tokens last 60 days; the scheduler refreshes them weekly.
      token_expires_at: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: now.toISOString(),
    });
    if (error) throw new Error(`Could not save the account: ${error.message}`);
  } catch (err) {
    unstable_rethrow(err);
    const message = err instanceof Error ? err.message : "Could not connect the account.";
    redirect(`${STUDIO}/instagram?error=${encodeURIComponent(message)}`);
  }
  redirect(`${STUDIO}/instagram`);
}

export async function disconnectInstagram() {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("instagram_account").delete().eq("id", 1);
  redirect(`${STUDIO}/instagram`);
}

// ---------------------------------------------------------------------------
// Creating a post
// ---------------------------------------------------------------------------

function uploadedFiles(formData: FormData, name: string): File[] {
  const files = formData.getAll(name).filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
    if (file.size > MAX_UPLOAD_BYTES) throw new Error(`${file.name} is over 20 MB.`);
  }
  return files;
}

async function storeFiles(postId: string, files: File[]): Promise<InstagramImage[]> {
  const supabase = await createClient();
  const images: InstagramImage[] = [];
  for (const file of files) {
    const { path, url } = await uploadJpeg(supabase, await toJpeg(await file.arrayBuffer()), `instagram/${postId}`);
    images.push({ path, url, tags: [], alt: "" });
  }
  return images;
}

/** Copies the content's featured image into the post. Only our own storage is fetched. */
async function storeFeaturedImage(postId: string, image: unknown): Promise<InstagramImage | null> {
  if (typeof image !== "string" || !image.startsWith(mediaUrl(""))) return null;
  const response = await fetch(image, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not read the featured image.");
  const supabase = await createClient();
  const { path, url } = await uploadJpeg(supabase, await toJpeg(await response.arrayBuffer()), `instagram/${postId}`);
  return { path, url, tags: [], alt: "" };
}

const HASHTAGS = "#AlbanianHistory #Albania #Shqipëria #Kosova #Alboholic";

/** A starting caption from the content, ready to edit. */
function draftCaption(type: ContentType, row: Record<string, unknown>): string {
  const text = (key: string) => String(row[key] ?? "").trim();
  const albanian = row.lang === "sq";
  const cta = albanian ? "Lexoni historinë e plotë, linku në bio." : "Read the full story, link in bio.";

  const parts =
    type === "stories"
      ? [text("title"), text("excerpt"), cta]
      : type === "people"
        ? [
            [text("name"), text("era") && `(${text("era")})`].filter(Boolean).join(" "),
            text("known_for"),
            text("bio"),
            "Full profile, link in bio.",
          ]
        : [
            [text("name"), text("date")].filter(Boolean).join(" · "),
            text("summary"),
            text("outcome"),
            "Explore the battle map, link in bio.",
          ];

  return [...parts.filter(Boolean), HASHTAGS].join("\n\n").slice(0, MAX_CAPTION);
}

export async function createInstagramPost(formData: FormData) {
  await requireUser();
  const typeValue = String(formData.get("type") ?? "");
  const contentId = String(formData.get("contentId") ?? "");
  const type = isContentType(typeValue) && contentId ? typeValue : null;
  const backTo = type ? `${STUDIO}/${type}/${contentId}/instagram` : `${STUDIO}/instagram`;

  let postId = "";
  try {
    const files = uploadedFiles(formData, "images");
    const content = type ? ((await getContentById(type, contentId)) as unknown as Record<string, unknown> | null) : null;
    const includeFeatured = formData.get("includeFeatured") === "on" && Boolean(content?.image);

    if (files.length === 0 && !includeFeatured) throw new Error("Add at least one image.");
    if (files.length + (includeFeatured ? 1 : 0) > MAX_IMAGES) {
      throw new Error(`A post can have at most ${MAX_IMAGES} images.`);
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("instagram_posts")
      .insert({
        content_type: type,
        content_id: type ? contentId : null,
        caption: type && content ? draftCaption(type, content) : "",
      })
      .select("id")
      .single();
    if (error) throw new Error(`Could not create the post: ${error.message}`);
    postId = data.id;

    const images: InstagramImage[] = [];
    if (includeFeatured) {
      const featured = await storeFeaturedImage(postId, content?.image);
      if (featured) images.push(featured);
    }
    images.push(...(await storeFiles(postId, files)));

    const { error: saveError } = await supabase.from("instagram_posts").update({ images }).eq("id", postId);
    if (saveError) throw new Error(`Could not save the images: ${saveError.message}`);
  } catch (err) {
    unstable_rethrow(err);
    console.error("[instagram] create failed:", err);
    const message = err instanceof Error ? err.message : "Could not create the post.";
    // The draft row exists even if an image failed, so open it and say what went wrong.
    redirect(postId ? editorUrl(postId, { error: message }) : `${backTo}?error=${encodeURIComponent(message)}`);
  }
  redirect(editorUrl(postId));
}

// ---------------------------------------------------------------------------
// Editing, scheduling and publishing
// ---------------------------------------------------------------------------

async function loadPost(id: string): Promise<InstagramPostRow> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("instagram_posts").select("*").eq("id", id).maybeSingle();
  if (error || !data) throw new Error("Post not found.");
  return data as InstagramPostRow;
}

function checkCaption(caption: string) {
  const stats = captionStats(caption);
  if (stats.length > MAX_CAPTION) throw new Error(`The caption is ${stats.length} characters; Instagram allows ${MAX_CAPTION}.`);
  if (stats.hashtags > MAX_HASHTAGS) throw new Error(`The caption has ${stats.hashtags} hashtags; Instagram allows ${MAX_HASHTAGS}.`);
  if (stats.mentions > MAX_MENTIONS) throw new Error(`The caption has ${stats.mentions} @mentions; Instagram allows ${MAX_MENTIONS}.`);
}

/** Reads the editor form into the post's fields, applying any image move or removal. */
async function readEditor(formData: FormData, post: InstagramPostRow, intent: string) {
  const images: InstagramImage[] = post.images.map((image, i) => ({
    ...image,
    tags: parseUsernames(String(formData.get(`tags_${i}`) ?? image.tags.join(" "))),
    alt: String(formData.get(`alt_${i}`) ?? image.alt).slice(0, 1000),
  }));

  const [verb, indexText] = intent.split(":");
  const index = Number(indexText);
  const removed: string[] = [];
  if (Number.isInteger(index) && index >= 0 && index < images.length) {
    if (verb === "remove") removed.push(...images.splice(index, 1).map((image) => image.path));
    if (verb === "up" && index > 0) [images[index - 1], images[index]] = [images[index], images[index - 1]];
    if (verb === "down" && index < images.length - 1) [images[index + 1], images[index]] = [images[index], images[index + 1]];
  }

  const files = uploadedFiles(formData, "images");
  if (images.length + files.length > MAX_IMAGES) throw new Error(`A post can have at most ${MAX_IMAGES} images.`);
  images.push(...(await storeFiles(post.id, files)));

  const aspect = String(formData.get("aspect") ?? post.aspect);
  return {
    removed,
    fields: {
      caption: String(formData.get("caption") ?? post.caption).replace(/\r\n/g, "\n"),
      location_name: String(formData.get("locationName") ?? post.location_name).trim(),
      location_id: String(formData.get("locationId") ?? post.location_id).replace(/\D/g, ""),
      aspect: isInstagramAspect(aspect) ? aspect : post.aspect,
      images,
      updated_at: new Date().toISOString(),
    },
  };
}

/** The material the AI writes a caption from: the linked content, or the draft caption. */
async function captionMaterial(post: InstagramPostRow): Promise<string> {
  if (post.content_type && post.content_id) {
    const row = (await getContentById(post.content_type, post.content_id)) as unknown as Record<string, unknown> | null;
    if (row) {
      const keep = ["title", "name", "category", "role", "era", "date", "location", "participants", "excerpt", "known_for", "bio", "summary", "outcome", "body", "significance", "lang"];
      return keep
        .filter((key) => row[key] !== undefined && row[key] !== "" && row[key] !== null)
        .map((key) => `${key}: ${typeof row[key] === "string" ? row[key] : JSON.stringify(row[key])}`)
        .join("\n");
    }
  }
  return post.caption;
}

async function writeCaptionWithAi(post: InstagramPostRow): Promise<string> {
  const material = await captionMaterial(post);
  if (!material.trim()) throw new Error("Write a few words in the caption first, so the AI has something to work from.");

  const { data, usage } = await generateStructuredContent<{ caption: string }>({
    model: DEFAULT_AI_MODEL,
    system:
      "You write Instagram captions for Alboholic, an account about Albanian history. Stay faithful to the " +
      "material: never add names, dates, numbers or events it does not contain.",
    typeInstruction:
      "Write one Instagram caption from the material above. Open with a short hook line that makes people stop " +
      "scrolling. Then 2-4 short paragraphs telling the essence of it, separated by blank lines. End with a " +
      'call to action pointing to the link in bio, then a blank line and 5-10 relevant hashtags including #Alboholic. ' +
      "Write in the same language as the material (Albanian if lang is sq). At most 1500 characters, at most " +
      "2 emoji, no @mentions.",
    parts: [{ kind: "text", text: `--- Material ---\n${material}` }],
    jsonSchema: {
      type: "object",
      properties: { caption: { type: "string" } },
      required: ["caption"],
      additionalProperties: false,
    },
  });
  await logUsage("instagram", usage);
  return data.caption.trim().slice(0, MAX_CAPTION);
}

/**
 * The editor's one form action. The button pressed sets `intent`: save, schedule, unschedule,
 * publish, ai-caption, or remove:/up:/down: plus an image index. Every intent saves the form first.
 */
export async function saveInstagramPost(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const intent = String(formData.get("intent") ?? "save");
  if (!id) throw new Error("Invalid request.");

  let notice = "";
  try {
    const post = await loadPost(id);
    if (post.status === "published" || post.status === "publishing") {
      throw new Error("This post is already on Instagram (or on its way) and can't be changed here.");
    }

    const { fields, removed } = await readEditor(formData, post, intent);
    const supabase = await createClient();

    if (intent === "ai-caption") {
      fields.caption = await writeCaptionWithAi({ ...post, ...fields });
      notice = "New caption written. Read it over before posting.";
    }

    const update: Record<string, unknown> = { ...fields };

    if (intent === "schedule" || intent === "publish") {
      checkCaption(fields.caption);
      if (fields.images.length === 0) throw new Error("Add at least one image.");
      if (!(await getAccount(supabase))) throw new Error("Connect the Instagram account first (Studio → Instagram).");
    }

    if (intent === "schedule") {
      const when = new Date(String(formData.get("scheduledAt") ?? ""));
      if (Number.isNaN(when.getTime())) throw new Error("Pick a date and time to schedule it.");
      if (when.getTime() < Date.now() - 60_000) throw new Error("Pick a time in the future.");
      Object.assign(update, { status: "scheduled", scheduled_at: when.toISOString(), error: null });
      notice = "Scheduled.";
    }

    if (intent === "unschedule") {
      Object.assign(update, { status: "draft", scheduled_at: null });
      notice = "Back to draft. It won't be posted until you schedule it again.";
    }

    // A failed post goes back to draft once it is edited, so it can be scheduled again.
    if (post.status === "failed" && intent !== "publish" && intent !== "schedule") update.status = "draft";

    const { error } = await supabase.from("instagram_posts").update(update).eq("id", id);
    if (error) throw new Error(`Could not save: ${error.message}`);
    await removeFiles(supabase, removed);

    if (intent === "publish") {
      const failure = await publishPost(supabase, id, ["draft", "scheduled", "failed"]);
      if (failure) throw new Error(failure);
      notice = "Posted to Instagram.";
    }
  } catch (err) {
    unstable_rethrow(err);
    console.error(`[instagram] ${intent} failed for ${id}:`, err);
    redirect(editorUrl(id, { error: err instanceof Error ? err.message : "Something went wrong." }));
  }
  redirect(editorUrl(id, notice ? { notice } : {}));
}

export async function deleteInstagramPost(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const post = await loadPost(id);
  const supabase = await createClient();
  const { error } = await supabase.from("instagram_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await removeFiles(supabase, post.images.map((image) => image.path));
  redirect(post.content_type && post.content_id ? `${STUDIO}/${post.content_type}/${post.content_id}/instagram` : `${STUDIO}/instagram`);
}
