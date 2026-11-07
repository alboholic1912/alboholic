import sharp from "sharp";
import type { NextRequest } from "next/server";

/**
 * A small JPEG copy of an uploaded image, for link previews. Uploads can be several MB, and
 * WhatsApp drops preview images that big, so link cards point here instead of the original.
 * Only images from our own storage bucket are accepted.
 */

const MEDIA_ORIGIN = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
const MEDIA_PATH = "/storage/v1/object/public/media/";

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");

  let url: URL;
  try {
    url = new URL(src ?? "");
  } catch {
    return new Response("Bad image address", { status: 400 });
  }
  if (url.origin !== MEDIA_ORIGIN || !url.pathname.startsWith(MEDIA_PATH)) {
    return new Response("Image not allowed", { status: 400 });
  }

  const original = await fetch(url);
  if (!original.ok) {
    return new Response("Image not found", { status: 404 });
  }

  try {
    const image = await sharp(Buffer.from(await original.arrayBuffer()))
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();

    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/jpeg",
        // Uploads never change at the same address, so the copy can be cached for good.
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch {
    return new Response("Could not read image", { status: 422 });
  }
}
