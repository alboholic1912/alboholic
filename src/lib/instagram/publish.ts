import "server-only";
import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mediaUrl } from "@/lib/supabase/storage";
import { publishMedia, refreshToken } from "./api";
import {
  INSTAGRAM_ASPECTS,
  type InstagramAccountRow,
  type InstagramPostRow,
  type InstagramStatus,
} from "./types";

const BUCKET = "media";

/** Turns any upload into an upright sRGB JPEG, no bigger than Instagram needs. */
export async function toJpeg(input: Buffer | ArrayBuffer): Promise<Buffer> {
  return sharp(Buffer.from(input as ArrayBuffer))
    .rotate()
    .resize({ width: 2160, height: 2700, fit: "inside", withoutEnlargement: true })
    .toColorspace("srgb")
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

export async function uploadJpeg(
  supabase: SupabaseClient,
  body: Buffer,
  prefix: string
): Promise<{ path: string; url: string }> {
  const path = `${prefix}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return { path, url: mediaUrl(path) };
}

export async function removeFiles(supabase: SupabaseClient, paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) console.error("[instagram] could not remove files:", error.message);
}

export async function getAccount(supabase: SupabaseClient): Promise<InstagramAccountRow | null> {
  const { data, error } = await supabase.from("instagram_account").select("*").eq("id", 1).maybeSingle();
  if (error) {
    console.error("[instagram] could not read the account. Has supabase/instagram.sql been run?", error.message);
    return null;
  }
  return data as InstagramAccountRow | null;
}

/** Long-lived tokens last 60 days. Refreshing weekly keeps the connection alive indefinitely. */
export async function refreshAccountIfDue(supabase: SupabaseClient) {
  const account = await getAccount(supabase);
  if (!account) return;
  const age = Date.now() - new Date(account.token_refreshed_at).getTime();
  if (age < 7 * 24 * 60 * 60 * 1000) return;

  const { token, expiresAt } = await refreshToken(account.access_token);
  const now = new Date().toISOString();
  await supabase
    .from("instagram_account")
    .update({
      access_token: token,
      token_refreshed_at: now,
      token_expires_at: expiresAt.toISOString(),
      updated_at: now,
    })
    .eq("id", 1);
}

/** Crops every image to the post's shape, the same centre crop the Studio preview shows. */
async function renderImages(supabase: SupabaseClient, post: InstagramPostRow) {
  const { width, height } = INSTAGRAM_ASPECTS[post.aspect] ?? INSTAGRAM_ASPECTS.portrait;
  const rendered: { url: string; path: string; tags: string[]; alt: string }[] = [];

  for (const image of post.images) {
    const { data, error } = await supabase.storage.from(BUCKET).download(image.path);
    if (error || !data) throw new Error(`Could not read an image: ${error?.message ?? "missing file"}`);
    const jpeg = await sharp(Buffer.from(await data.arrayBuffer()))
      .resize({ width, height, fit: "cover", position: "centre" })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
    const { path, url } = await uploadJpeg(supabase, jpeg, `instagram/${post.id}/out`);
    rendered.push({ url, path, tags: image.tags, alt: image.alt });
  }
  return rendered;
}

/**
 * Publishes one post. The row is claimed first (status → publishing) so the scheduler and a
 * "Post now" click can never both publish it. Returns the error message, or null on success.
 */
export async function publishPost(
  supabase: SupabaseClient,
  postId: string,
  claimFrom: InstagramStatus[]
): Promise<string | null> {
  const { data: claimed, error: claimError } = await supabase
    .from("instagram_posts")
    .update({ status: "publishing", error: null, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .in("status", claimFrom)
    .select("*")
    .maybeSingle();

  if (claimError) return claimError.message;
  if (!claimed) return "This post is already being published, or was published already.";
  const post = claimed as InstagramPostRow;

  let outPaths: string[] = [];
  try {
    const account = await getAccount(supabase);
    if (!account) throw new Error("Connect an Instagram account first (Studio → Instagram).");
    if (post.images.length === 0) throw new Error("Add at least one image.");

    const images = await renderImages(supabase, post);
    outPaths = images.map((image) => image.path);

    const { mediaId, permalink } = await publishMedia(account.access_token, account.ig_user_id, {
      images,
      caption: post.caption,
      locationId: post.location_id,
    });

    const now = new Date().toISOString();
    await supabase
      .from("instagram_posts")
      .update({
        status: "published",
        published_at: now,
        ig_media_id: mediaId,
        permalink,
        error: null,
        attempts: post.attempts + 1,
        updated_at: now,
      })
      .eq("id", post.id);
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publishing failed.";
    console.error(`[instagram] post ${post.id} failed:`, err);
    await supabase
      .from("instagram_posts")
      .update({ status: "failed", error: message, attempts: post.attempts + 1, updated_at: new Date().toISOString() })
      .eq("id", post.id);
    return message;
  } finally {
    // Instagram copies the images when the containers are made, so the crops can go.
    await removeFiles(supabase, outPaths);
  }
}
