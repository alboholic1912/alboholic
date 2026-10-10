import type { Metadata } from "next";

export const SITE_NAME = "Alboholic";
export const SITE_TAGLINE = "Stories that last";
export const SITE_DESCRIPTION = "A modern, readable home for Albanian history — stories, heroes and events.";

/**
 * The address readers can write to, shown on the Contact and Privacy pages.
 * Leave it empty and those pages simply don't offer one.
 */
export const CONTACT_EMAIL = "alboholic1912@gmail.com";

/**
 * Where the site lives, for canonical links, the sitemap and link previews. Set
 * NEXT_PUBLIC_SITE_URL once there is a custom domain; until then Vercel's own
 * production address is used.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/+$/, "");

/** The share card drawn by src/app/opengraph-image.tsx, used wherever a page has no picture of its own. */
const DEFAULT_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} — ${SITE_TAGLINE}` };

/**
 * The metadata for one public page: its title and description, its canonical address, and
 * the card shown when the link is shared. `title` is the page's own name, without the site's.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  publishedTime,
}: {
  title?: string;
  description: string;
  path: string;
  /** A picture of the page's own, e.g. a story's featured image. */
  image?: { url: string; alt: string };
  type?: "website" | "article" | "profile";
  publishedTime?: string;
}): Metadata {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`;
  const images = [image ?? DEFAULT_IMAGE];

  return {
    title: fullTitle,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: title ?? fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      type,
      images,
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? fullTitle,
      description,
      images,
    },
  };
}
