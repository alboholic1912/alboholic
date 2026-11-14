import type { ContentType } from "@/lib/content/types";

export type InstagramStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";

/** How every image in the post is cropped. Instagram allows 4:5 up to 1.91:1, and crops a carousel to its first image. */
export const INSTAGRAM_ASPECTS = {
  portrait: { label: "Portrait 4:5", ratio: 4 / 5, width: 1080, height: 1350 },
  square: { label: "Square 1:1", ratio: 1, width: 1080, height: 1080 },
  landscape: { label: "Landscape 1.91:1", ratio: 1.91, width: 1080, height: 566 },
} as const;

export type InstagramAspect = keyof typeof INSTAGRAM_ASPECTS;

export function isInstagramAspect(value: string): value is InstagramAspect {
  return value in INSTAGRAM_ASPECTS;
}

export interface InstagramImage {
  /** Path inside the `media` bucket. */
  path: string;
  url: string;
  /** Instagram usernames tagged on this image, without the @. */
  tags: string[];
  /** Alt text for screen readers, up to 1000 characters. */
  alt: string;
}

export interface InstagramPostRow {
  id: string;
  created_at: string;
  updated_at: string;
  content_type: ContentType | null;
  content_id: string | null;
  caption: string;
  location_id: string;
  location_name: string;
  aspect: InstagramAspect;
  images: InstagramImage[];
  status: InstagramStatus;
  scheduled_at: string | null;
  published_at: string | null;
  ig_media_id: string | null;
  permalink: string | null;
  error: string | null;
  attempts: number;
}

export interface InstagramAccountRow {
  id: number;
  ig_user_id: string;
  username: string;
  access_token: string;
  token_refreshed_at: string;
  token_expires_at: string | null;
}

export const MAX_IMAGES = 20;
export const MAX_CAPTION = 2200;
export const MAX_HASHTAGS = 30;
export const MAX_MENTIONS = 20;

/** Counts what Instagram limits in a caption. */
export function captionStats(caption: string) {
  return {
    length: caption.length,
    hashtags: (caption.match(/(^|\s)#[\p{L}\p{N}_]+/gu) ?? []).length,
    mentions: (caption.match(/(^|\s)@[\w.]+/g) ?? []).length,
  };
}

/** "@a, b  @c" → ["a", "b", "c"], keeping only valid Instagram usernames. */
export function parseUsernames(text: string): string[] {
  const names = text
    .split(/[\s,]+/)
    .map((name) => name.replace(/^@/, "").trim().toLowerCase())
    .filter((name) => /^[a-z0-9._]{1,30}$/.test(name));
  return [...new Set(names)];
}
