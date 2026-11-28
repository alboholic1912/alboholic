import { ImageResponse } from "next/og";
import { BG, EAGLE_HALF, RED, SITE_HOST, TEXT, TONES, jpegResponse, loadCard, loadFonts, loadImage } from "@/lib/instagram/picture";
import { SITE_NAME } from "@/lib/site";

/**
 * A 1080 x 1920 picture of a story, person or battle, made to be posted as an Instagram Story,
 * or as a feed post, which crops it to 4:5: its image, title and summary, and where to read the
 * rest. The Share button hands it to the phone's share menu. Instagram never lets a picture
 * carry a link, so the button copies the page's address for the person sharing to paste into a
 * Link sticker. Posts and reels get their own pictures, from src/app/instagram-picture.
 */

// Made on first request, then kept for an hour like the pages themselves.
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

const WIDTH = 1080;
const HEIGHT = 1920;

/**
 * Shared as a feed post instead, the picture is cropped to 4:5 around its middle, losing 285px
 * at the top and bottom. Everything that matters sits inside that middle, so one picture works
 * as both: on a story the extra top is picture, under Instagram's own bar, and the extra bottom
 * is room for its reply box and a Link sticker.
 */
const POST_CROP = (HEIGHT - (WIDTH * 5) / 4) / 2;
/** The margin around everything, at the sides and inside the post's crop. */
const INSET = 72;
const SAFE_TOP = POST_CROP + INSET;
const SAFE_BOTTOM = POST_CROP + INSET;

/**
 * The picture runs from just under Instagram's bar to behind the words, where it fades into the
 * page colour. Starting it below the top keeps a portrait's face, which sits high in the
 * picture, inside the post's crop instead of cut off at its edge.
 */
const IMAGE_TOP = 200;
const IMAGE_BOTTOM = 1240;
const IMAGE_HEIGHT = IMAGE_BOTTOM - IMAGE_TOP;
/** A point on the picture's shade, as a share of its height. */
const shadeAt = (y: number) => `${((y / IMAGE_BOTTOM) * 100).toFixed(1)}%`;

/**
 * Shortens text so the summary never runs into the bottom of the story: at the end of a
 * sentence if one ends well into the space, otherwise at a word.
 */
function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  // Short words before a full stop are mostly abbreviations ("St.", "c."), not a sentence's end.
  const sentence = clean.slice(0, max + 1).match(/^.*(?:\p{L}{3,}|\d+)[.!?]["'”’)]?(?= )/u)?.[0];
  if (sentence && sentence.length >= max * 0.6) return sentence;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.–—-]+$/, "")}…`;
}

/** Long titles get smaller type, so they stay within three or four lines. */
function titleSize(title: string) {
  if (title.length > 72) return 66;
  if (title.length > 48) return 78;
  if (title.length > 26) return 92;
  return 108;
}

export async function GET(_request: Request, { params }: RouteContext<"/instagram-story/[kind]/[slug]">) {
  const { kind, slug } = await params;
  const card = await loadCard(kind, slug);
  if (!card) {
    return new Response("Not found", { status: 404 });
  }

  const [image, { fonts, serif, sans }] = await Promise.all([
    loadImage(card.image, WIDTH, IMAGE_HEIGHT),
    loadFonts(),
  ]);
  const host = SITE_HOST;
  const size = titleSize(card.title);
  // Some records repeat the name as the place; it says nothing the title doesn't.
  const meta = card.meta.filter((item) => item.trim().toLowerCase() !== card.title.trim().toLowerCase());

  const png = await new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: BG,
          backgroundImage: "radial-gradient(900px 700px at 0% 100%, rgba(184, 24, 28, 0.32), rgba(5, 3, 3, 0) 70%)",
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
            height={IMAGE_HEIGHT}
            style={{
              position: "absolute",
              top: IMAGE_TOP,
              left: 0,
              width: WIDTH,
              height: IMAGE_HEIGHT,
              objectFit: "cover",
            }}
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
              height: IMAGE_BOTTOM,
              backgroundImage: TONES[card.tone],
            }}
          >
            <svg width="640" height="640" viewBox="0 6 200 200" fill="rgba(239, 64, 69, 0.16)">
              <path d={EAGLE_HALF} />
              <path d={EAGLE_HALF} transform="translate(200 0) scale(-1 1)" />
            </svg>
          </div>
        )}

        {/*
          Page colour behind Instagram's bar, the picture fading in under the brand, and fading
          out again into the page under the words.
        */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: WIDTH,
            height: IMAGE_BOTTOM + 2,
            backgroundImage: `linear-gradient(180deg, ${BG} 0%, ${BG} ${shadeAt(IMAGE_TOP)}, rgba(5, 3, 3, 0.55) ${shadeAt(IMAGE_TOP + 150)}, rgba(5, 3, 3, 0) ${shadeAt(IMAGE_TOP + 400)}, rgba(5, 3, 3, 0.72) ${shadeAt(845)}, ${BG} ${shadeAt(1190)})`,
          }}
        />

        {/* The brand, on the left: Instagram's story editor puts its tools down the right-hand side. */}
        <div
          style={{
            position: "absolute",
            top: SAFE_TOP,
            left: INSET,
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 68,
              height: 68,
              borderRadius: 14,
              backgroundImage: "linear-gradient(135deg, #c81f22 0%, #8c1013 100%)",
            }}
          >
            <svg width="52" height="52" viewBox="0 6 200 200" fill="#0a0606">
              <path d={EAGLE_HALF} />
              <path d={EAGLE_HALF} transform="translate(200 0) scale(-1 1)" />
            </svg>
          </div>
          <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 44, letterSpacing: -0.5 }}>{SITE_NAME}</div>
        </div>

        {/* The words, kept clear of Instagram's reply box and of room for a Link sticker. */}
        <div
          style={{
            position: "absolute",
            left: INSET,
            right: INSET,
            bottom: SAFE_BOTTOM,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 27,
              fontWeight: 600,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: RED,
            }}
          >
            {card.kicker}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontFamily: serif,
              fontWeight: 700,
              fontSize: size,
              lineHeight: 1.06,
              letterSpacing: -1,
            }}
          >
            {card.title}
          </div>

          {card.summary && (
            <div
              style={{
                display: "flex",
                marginTop: 30,
                fontSize: 36,
                lineHeight: 1.45,
                color: "rgba(246, 243, 241, 0.8)",
              }}
            >
              {clip(card.summary, size > 80 ? 210 : 165)}
            </div>
          )}

          {meta.length > 0 && (
            <div style={{ display: "flex", marginTop: 26, fontSize: 28, color: "rgba(246, 243, 241, 0.56)" }}>
              {clip(meta.join("  ·  "), 60)}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginTop: 44,
              paddingTop: 34,
              borderTop: "2px solid rgba(246, 243, 241, 0.14)",
              fontSize: 30,
            }}
          >
            <div style={{ display: "flex", width: 36, height: 4, borderRadius: 2, backgroundColor: RED }} />
            <div style={{ display: "flex", color: "rgba(246, 243, 241, 0.72)" }}>{card.cta}</div>
            <div style={{ display: "flex", fontWeight: 600 }}>{host}</div>
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, fonts }
  ).arrayBuffer();

  return jpegResponse(png);
}
