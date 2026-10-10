// Renders the site icons from the eagle mark: the favicon, the Apple touch icon, and the
// two sizes the web manifest lists. Run from the project root after changing the mark:
//
//   node scripts/icons/render.mjs
//
// Like scripts/home-art/render.mjs, this uses the copy of sharp that Next.js installs.

import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** The right half of the double-headed eagle on a 200 x 200 grid; mirror it about x = 100. Also in EagleMark.tsx. */
const EAGLE_HALF =
  "M100 62C101 49 104 38 110 29C113 23 119 19 126 20L138 24L153 29L143 32.5L150 40L136 37.5C130 40 125 46 122 54L121 60L133 57L150 46L168 38L191 21L171 47L198 41L168 57L199 60L163 66L194 79L157 74L183 95L149 82L167 107L140 88L146 109L130 93L118 99L114 112L123 121L137 134L153 132L141 139L151 151L137 144L136 159L129 144L116 131L110 129L110 139L127 153L113 151L122 169L109 163L112 183L104 173L100 193Z";

/** The mark on the site's red, with square or rounded corners (`radius` is on a 200 grid). */
function icon(radius) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="red" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#c81f22"/>
      <stop offset="1" stop-color="#8c1013"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="${radius}" fill="url(#red)"/>
  <g transform="translate(100 104) scale(0.8) translate(-100 -106)" fill="#0a0606" stroke="#0a0606" stroke-width="1.6" stroke-linejoin="round">
    <path d="${EAGLE_HALF}"/>
    <path d="${EAGLE_HALF}" transform="translate(200 0) scale(-1 1)"/>
  </g>
</svg>
`;
}

const png = (svg, size) => sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();

/** An .ico file is a small directory followed by the images themselves, which may be PNGs. */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

const rounded = icon(44);
// Phones round the corners themselves, so these two fill the square.
const square = icon(0);

writeFileSync(join(ROOT, "src/app/icon.svg"), rounded);
writeFileSync(
  join(ROOT, "src/app/favicon.ico"),
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(rounded, size) }))))
);
writeFileSync(join(ROOT, "src/app/apple-icon.png"), await png(square, 180));
writeFileSync(join(ROOT, "public/icon-192.png"), await png(square, 192));
writeFileSync(join(ROOT, "public/icon-512.png"), await png(square, 512));

console.log("Icons written.");
