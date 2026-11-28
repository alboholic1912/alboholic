import sharp from "sharp";
import { getBattles, getPersonBySlug, getStoryBySlug } from "@/lib/content/public";
import { SITE_URL } from "@/lib/site";

/**
 * What the Instagram pictures of a story, person or battle share: the record they show, the
 * site's fonts and colours, and turning the drawing into a JPEG. Drawn by
 * src/app/instagram-story (the Story) and src/app/instagram-picture (posts and reels).
 */

export const BG = "#050303";
export const TEXT = "#f6f3f1";
export const RED = "#ef4045";

/** Also in EagleMark.tsx and opengraph-image.tsx. */
export const EAGLE_HALF =
  "M100 62C101 49 104 38 110 29C113 23 119 19 126 20L138 24L153 29L143 32.5L150 40L136 37.5C130 40 125 46 122 54L121 60L133 57L150 46L168 38L191 21L171 47L198 41L168 57L199 60L163 66L194 79L157 74L183 95L149 82L167 107L140 88L146 109L130 93L118 99L114 112L123 121L137 134L153 132L141 139L151 151L137 144L136 159L129 144L116 131L110 129L110 139L127 153L113 151L122 169L109 163L112 183L104 173L100 193Z";

/** The colour wash used when there is no picture, as on the site's cards. */
export const TONES = {
  crimson: "radial-gradient(120% 90% at 20% 20%, #5a1418 0%, #2a0d0f 55%, #14090a 100%)",
  amber: "radial-gradient(120% 90% at 25% 15%, #6b3a1a 0%, #34190f 55%, #170c09 100%)",
  stone: "radial-gradient(120% 90% at 30% 20%, #4a3f3a 0%, #241d1a 55%, #120f0d 100%)",
  slate: "radial-gradient(120% 90% at 25% 20%, #3a3c45 0%, #1d1e24 55%, #100f12 100%)",
} as const;

/** The site's address as shown on the pictures, e.g. "alboholic.org". */
export const SITE_HOST = new URL(SITE_URL).host.replace(/^www\./, "");

export type Card = {
  kicker: string;
  title: string;
  summary?: string;
  meta: string[];
  cta: string;
  image?: string;
  tone: keyof typeof TONES;
};

export async function loadCard(kind: string, slug: string): Promise<Card | null> {
  if (kind === "story") {
    const story = await getStoryBySlug(slug);
    if (!story) return null;
    return {
      kicker: ["Story", story.category].filter(Boolean).join("  ·  "),
      title: story.title,
      summary: story.excerpt,
      meta: [story.readTime].filter(Boolean),
      cta: "Read the full story at",
      image: story.image,
      tone: story.imageTone,
    };
  }

  if (kind === "person") {
    const person = await getPersonBySlug(slug);
    if (!person) return null;
    return {
      kicker: ["People", person.category ?? person.role].filter(Boolean).join("  ·  "),
      title: person.name,
      summary: person.summary ?? person.knownFor,
      meta: [person.era, person.birthplace].filter((item): item is string => Boolean(item)),
      cta: "Read their story at",
      image: person.image,
      tone: person.imageTone,
    };
  }

  if (kind === "battle") {
    const battle = (await getBattles()).find((item) => item.slug === slug);
    if (!battle) return null;
    return {
      kicker: ["Battle", battle.period].filter(Boolean).join("  ·  "),
      title: battle.name,
      summary: battle.summary,
      meta: [battle.date, battle.location].filter(Boolean),
      cta: "Explore the Battles map at",
      image: battle.image,
      tone: "crimson",
    };
  }

  return null;
}

/**
 * The record's picture, cropped to the given size and small enough to draw quickly. "attention"
 * keeps the busiest part (usually a face); "centre" keeps the middle.
 */
export async function loadImage(
  src: string | undefined,
  width: number,
  height: number,
  crop: "attention" | "centre" = "attention"
) {
  if (!src) return null;
  try {
    const response = await fetch(src, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return null;
    const jpeg = await sharp(Buffer.from(await response.arrayBuffer()))
      .rotate()
      .resize({ width, height, fit: "cover", position: crop === "centre" ? "centre" : sharp.strategy.attention })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

export type Font = { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: "normal" };

/**
 * The site's own faces, from Google Fonts (which serves a whole TrueType file to a server).
 * Fetched once per server; without them the picture falls back to the built-in sans-serif.
 */
let fontsPromise: Promise<Font[]> | null = null;
export async function loadFonts() {
  fontsPromise ??= Promise.all([
    googleFont("Playfair Display", 700),
    googleFont("Geist", 400),
    googleFont("Geist", 600),
  ]).catch((error) => {
    console.warn("[instagram] Could not load fonts:", error);
    fontsPromise = null;
    return [];
  });
  const fonts = await fontsPromise;
  return {
    fonts,
    serif: fonts.some((font) => font.name === "Playfair Display") ? "Playfair Display" : undefined,
    sans: fonts.some((font) => font.name === "Geist") ? "Geist" : undefined,
  };
}

async function googleFont(family: string, weight: 400 | 600 | 700): Promise<Font> {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`, {
    signal: AbortSignal.timeout(8_000),
  }).then((response) => response.text());
  const url = css.match(/src: url\(([^)]+)\) format\('(?:truetype|opentype)'\)/)?.[1];
  if (!url) throw new Error(`No TrueType file for ${family} ${weight}`);
  const data = await fetch(url, { signal: AbortSignal.timeout(8_000) }).then((response) => response.arrayBuffer());
  return { name: family, data, weight, style: "normal" };
}

/** The drawn PNG as a JPEG response: a fraction of the size, which matters when sent from a phone. */
export async function jpegResponse(png: ArrayBuffer) {
  const jpeg = await sharp(Buffer.from(png)).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
