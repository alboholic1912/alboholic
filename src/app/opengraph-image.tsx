import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The right half of the double-headed eagle on a 200 x 200 grid; mirror it about x = 100. Also in EagleMark.tsx. */
const EAGLE_HALF =
  "M100 62C101 49 104 38 110 29C113 23 119 19 126 20L138 24L153 29L143 32.5L150 40L136 37.5C130 40 125 46 122 54L121 60L133 57L150 46L168 38L191 21L171 47L198 41L168 57L199 60L163 66L194 79L157 74L183 95L149 82L167 107L140 88L146 109L130 93L118 99L114 112L123 121L137 134L153 132L141 139L151 151L137 144L136 159L129 144L116 131L110 129L110 139L127 153L113 151L122 169L109 163L112 183L104 173L100 193Z";

/** The card shown when a link to the site is shared and the page has no picture of its own. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 96px",
          backgroundColor: "#050303",
          backgroundImage: "radial-gradient(900px 520px at 12% 50%, rgba(184, 24, 28, 0.38), rgba(5, 3, 3, 0) 70%)",
          color: "#f6f3f1",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 260,
            height: 260,
            borderRadius: 44,
            backgroundImage: "linear-gradient(135deg, #c81f22 0%, #8c1013 100%)",
          }}
        >
          <svg width="208" height="208" viewBox="0 6 200 200" fill="#0a0606">
            <path d={EAGLE_HALF} />
            <path d={EAGLE_HALF} transform="translate(200 0) scale(-1 1)" />
          </svg>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, letterSpacing: 5, textTransform: "uppercase", color: "#ef4045" }}>
            Albanian history
          </div>
          <div style={{ marginTop: 10, fontSize: 124, fontWeight: 700, letterSpacing: -3, lineHeight: 1.05 }}>
            {SITE_NAME}
          </div>
          <div style={{ marginTop: 14, fontSize: 40, color: "#a3a19d" }}>{`${SITE_TAGLINE}.`}</div>
        </div>
      </div>
    ),
    size
  );
}
