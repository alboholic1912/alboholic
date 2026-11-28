import { ImageResponse } from "next/og";
import { BG, EAGLE_HALF, SITE_HOST, TEXT, TONES, jpegResponse, loadCard, loadFonts, loadImage } from "@/lib/instagram/picture";

/**
 * A picture of a story, person or battle for an Instagram feed post (1080 x 1350, 4:5) or reel
 * (1080 x 1920, 9:16): its image filling the frame, with only the title in the middle and where
 * to read the rest under it. The Story has its own, fuller picture: src/app/instagram-story.
 *
 * Keeping the words in the middle keeps them clear of a reel's caption and buttons, and inside
 * the 3:4 crop that profile grids show of both.
 */

// Made on first request, then kept for an hour like the pages themselves.
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

const WIDTH = 1080;
const HEIGHTS = { post: 1350, reel: 1920 } as const;

/** Clear of the reel's like and comment buttons, which run down the right-hand side. */
const INSET = 110;

/** Long titles get smaller type, so they stay within three or four lines. */
function titleSize(title: string) {
  if (title.length > 72) return 74;
  if (title.length > 48) return 88;
  if (title.length > 26) return 104;
  return 124;
}

export async function GET(_request: Request, { params }: RouteContext<"/instagram-picture/[format]/[kind]/[slug]">) {
  const { format, kind, slug } = await params;
  if (format !== "post" && format !== "reel") {
    return new Response("Not found", { status: 404 });
  }
  const card = await loadCard(kind, slug);
  if (!card) {
    return new Response("Not found", { status: 404 });
  }

  const height = HEIGHTS[format];
  const [image, { fonts, serif, sans }] = await Promise.all([loadImage(card.image, WIDTH, height, "centre"), loadFonts()]);

  const png = await new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: BG,
          color: TEXT,
          fontFamily: sans,
        }}
      >
        {/* The picture, or the card colour with a large eagle when there is none. */}
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- drawn by ImageResponse, not a page
          <img
            src={image}
            alt=""
            width={WIDTH}
            height={height}
            style={{ position: "absolute", top: 0, left: 0, width: WIDTH, height, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: WIDTH,
              height,
              backgroundImage: TONES[card.tone],
            }}
          >
            <svg width="760" height="760" viewBox="0 6 200 200" fill="rgba(239, 64, 69, 0.14)">
              <path d={EAGLE_HALF} />
              <path d={EAGLE_HALF} transform="translate(200 0) scale(-1 1)" />
            </svg>
          </div>
        )}

        {/* Darkened overall and most of all behind the words, so they read on any picture. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: WIDTH,
            height,
            backgroundColor: "rgba(5, 3, 3, 0.34)",
            backgroundImage:
              "radial-gradient(70% 42% at 50% 50%, rgba(5, 3, 3, 0.62) 0%, rgba(5, 3, 3, 0.3) 60%, rgba(5, 3, 3, 0) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: `0 ${INSET}px`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              fontFamily: serif,
              fontWeight: 700,
              fontSize: titleSize(card.title),
              lineHeight: 1.08,
              letterSpacing: -1,
              textShadow: "0 4px 28px rgba(0, 0, 0, 0.55)",
            }}
          >
            {card.title}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 44,
              fontSize: 34,
              textShadow: "0 2px 16px rgba(0, 0, 0, 0.6)",
            }}
          >
            <span style={{ color: "rgba(246, 243, 241, 0.82)" }}>Read the full story at&nbsp;</span>
            <span style={{ fontWeight: 600 }}>{SITE_HOST}</span>
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height, fonts }
  ).arrayBuffer();

  return jpegResponse(png);
}
