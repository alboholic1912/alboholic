// Renders the homepage artwork into public/home: the hero landscape (a wide and a phone
// composition), the fortress vignette beside the newsletter strip, and the red grunge texture.
// Everything is drawn here as SVG and rasterised with sharp, so the art is changed by editing
// this file and running, from the project root:
//
//   node scripts/home-art/render.mjs
//
// sharp is not a direct dependency: this uses the copy Next.js installs for image optimisation.
// To use a photograph instead, replace public/home/hero.webp and hero-phone.webp; nothing else
// depends on this script.

import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = resolve(process.argv[2] ?? join(ROOT, "public/home"));

/** The right half of the double-headed eagle on a 200 x 200 grid; mirror it about x = 100. Also in EagleMark.tsx. */
const EAGLE_HALF =
  "M100 62C101 49 104 38 110 29C113 23 119 19 126 20L138 24L153 29L143 32.5L150 40L136 37.5C130 40 125 46 122 54L121 60L133 57L150 46L168 38L191 21L171 47L198 41L168 57L199 60L163 66L194 79L157 74L183 95L149 82L167 107L140 88L146 109L130 93L118 99L114 112L123 121L137 134L153 132L141 139L151 151L137 144L136 159L129 144L116 131L110 129L110 139L127 153L113 151L122 169L109 163L112 183L104 173L100 193Z";

// ---------- Geometry helpers ----------

/** A small seeded generator, so every run draws the same mountains. */
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Midpoint displacement: turns a few control points into a natural, jagged ridgeline. */
function displace(points, rand, { rough = 0.4, depth = 6, decay = 0.85, drift = 0.18 } = {}) {
  let pts = points.map((point) => [...point]);
  let amplitude = rough;
  for (let level = 0; level < depth; level++) {
    const next = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const length = x1 - x0;
      next.push([(x0 + x1) / 2 + (rand() - 0.5) * length * drift, (y0 + y1) / 2 + (rand() - 0.5) * length * amplitude], [x1, y1]);
    }
    pts = next;
    amplitude *= decay;
  }
  return pts;
}

const n = (value) => Math.round(value * 10) / 10;
const line = (pts) => pts.map(([x, y]) => `${n(x)},${n(y)}`).join(" L");
const polygon = (pts) => `M${line(pts)} Z`;
/** A ridgeline closed down to `floor`, ready to fill. */
const silhouette = (pts, floor) => `M${n(pts[0][0])},${floor} L${line(pts)} L${n(pts[pts.length - 1][0])},${floor} Z`;

/** Height of a ridgeline at x. */
function heightAt(pts, x) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if (x >= x0 && x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
  }
  return pts[pts.length - 1][1];
}

/** A conifer silhouette standing on (x, y). */
function conifer(x, y, h, rand) {
  const w = h * (0.3 + rand() * 0.1);
  const tiers = 5 + Math.floor(rand() * 3);
  const right = [];
  const left = [];
  for (let i = 1; i <= tiers; i++) {
    const t = i / tiers;
    const ty = y - h + h * 0.9 * t;
    const reach = w * (0.15 + 0.85 * t);
    right.push([x + reach * (0.35 + rand() * 0.1), ty - h * 0.05], [x + reach * (0.85 + rand() * 0.3), ty + h * 0.02]);
    left.push([x - reach * (0.35 + rand() * 0.1), ty - h * 0.05], [x - reach * (0.85 + rand() * 0.3), ty + h * 0.02]);
  }
  const trunk = w * 0.07;
  return polygon([[x, y - h], ...right, [x + trunk, y - h * 0.06], [x + trunk, y + 4], [x - trunk, y + 4], [x - trunk, y - h * 0.06], ...left.reverse()]);
}

/** Catmull-Rom through the points, sampled densely. */
function smooth(points, samples = 14) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let step = 0; step < samples; step++) {
      const t = step / samples;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push(
        [0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3))
      );
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/** A band of varying width along a centreline: the river, seen from above at a low angle. */
function ribbon(centre, width) {
  const left = centre.map(([x, y], i) => [x - width(i / (centre.length - 1)) / 2, y]);
  const right = centre.map(([x, y], i) => [x + width(i / (centre.length - 1)) / 2, y]);
  return polygon([...left, ...right.reverse()]);
}

// ---------- The landscape ----------

/**
 * A mountain valley under a heavy sky, with a ruined fortress flying the flag.
 *
 * `fx, fy` is where the keep stands and `s` the fortress scale. `valley` is the x the valley and
 * its river run toward. Heights are written for a horizon 0.6 of the way down; `horizon` moves
 * it, and `lift` flattens (below 1) the mountains above it for a tall canvas.
 */
function landscape({ W, H, fx, fy, s, valley, horizon = 0.6, lift = 1, seed = 11 }) {
  const rand = mulberry32(seed);
  const X = (t) => t * W;
  const drop = (1 - horizon) / 0.4;
  const Y = (t) => (t < 0.6 ? horizon - (0.6 - t) * lift : horizon + (t - 0.6) * drop) * H;

  // Ridges, far to near. Each is laid out around the valley, wider than any canvas needs.
  const around = (list) => list.map(([u, y]) => [valley + X(u), Y(y)]);
  const far = displace(
    around([
      [-0.62, 0.42], [-0.52, 0.44], [-0.42, 0.4], [-0.33, 0.33], [-0.25, 0.37], [-0.17, 0.3], [-0.1, 0.24], [-0.03, 0.2], [0.04, 0.27],
      [0.11, 0.23], [0.19, 0.31], [0.28, 0.27], [0.37, 0.34], [0.46, 0.3], [0.56, 0.37], [0.7, 0.33],
    ]),
    rand,
    { rough: 0.5, depth: 6, decay: 0.82 }
  );
  const mid = displace(
    around([
      [-0.62, 0.34], [-0.52, 0.36], [-0.42, 0.33], [-0.34, 0.41], [-0.25, 0.46], [-0.14, 0.52], [-0.05, 0.58], [0.01, 0.61], [0.08, 0.55],
      [0.18, 0.47], [0.27, 0.4], [0.36, 0.36], [0.45, 0.4], [0.56, 0.35], [0.7, 0.38],
    ]),
    rand,
    { rough: 0.42, depth: 6, decay: 0.84 }
  );
  // The wooded slope that closes the valley on the left, falling toward the river.
  const slopeEnd = valley - X(0.13);
  const slopeAt = (t) => X(-0.02) + (slopeEnd - X(-0.02)) * t;
  const near = displace(
    [[0, 0.47], [0.2, 0.5], [0.4, 0.57], [0.6, 0.65], [0.75, 0.75], [0.88, 0.87], [1, 1.03]].map(([t, y]) => [slopeAt(t), Y(y)]),
    rand,
    { rough: 0.3, depth: 6, decay: 0.85 }
  );

  const river = ribbon(
    smooth([
      [valley + X(0.01), Y(0.612)], [valley - X(0.014), Y(0.64)], [valley + X(0.022), Y(0.672)], [valley - X(0.028), Y(0.712)],
      [valley + X(0.004), Y(0.762)], [valley - X(0.062), Y(0.83)], [valley - X(0.05), Y(0.91)], [valley - X(0.12), Y(1.03)],
    ]),
    (t) => W * (0.0045 + 0.085 * Math.pow(t, 1.7))
  );

  // The fortress hill: a steep face to the valley, a long shoulder to the right.
  const hill = displace(
    [
      [fx - 760 * s, H + 10], [fx - 660 * s, fy + 470 * s], [fx - 590 * s, fy + 300 * s], [fx - 500 * s, fy + 165 * s], [fx - 420 * s, fy + 90 * s],
      [fx - 330 * s, fy + 55 * s], [fx - 180 * s, fy + 22 * s], [fx - 70 * s, fy + 4 * s], [fx + 80 * s, fy + 6 * s],
      [fx + 240 * s, fy + 40 * s], [fx + 370 * s, fy + 120 * s], [fx + 520 * s, fy + 200 * s], [fx + 700 * s, fy + 250 * s],
      [fx + 900 * s, fy + 330 * s], [fx + 1300 * s, fy + 400 * s],
    ],
    rand,
    { rough: 0.3, depth: 5, decay: 0.9, drift: 0.12 }
  );

  // The fortress, in its own units: the origin is the foot of the keep, y grows downward.
  const P = (x, y) => [fx + x * s, fy + y * s];
  function battlements(x0, x1, y0, y1, merlon = 17, gap = 13, rise = 17) {
    const pts = [];
    const dir = x1 > x0 ? 1 : -1;
    let x = x0;
    while ((x1 - x) * dir > 0) {
      const base = y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
      const end = x + dir * Math.min(merlon, Math.abs(x1 - x));
      pts.push(P(x, base - rise), P(end, base - rise), P(end, base), P(end + dir * gap, base));
      x = end + dir * gap;
    }
    return pts;
  }
  const brokenCorner = [P(46, -226), P(58, -205), P(64, -214), P(74, -188)];
  const keep = polygon([P(-72, 60), P(-72, -236), ...battlements(-72, 40, -236, -236, 18, 12, 20), ...brokenCorner, P(72, 60)]);
  const keepShade = polygon([P(8, 60), P(8, -236), ...brokenCorner, P(72, 60)]);
  const westWall = polygon([
    P(-72, 80), P(-72, -112), ...battlements(-76, -205, -112, -96), P(-214, -70), P(-232, -58), P(-240, -74),
    ...battlements(-244, -330, -84, -66), P(-336, 110),
  ]);
  const westTower = polygon([P(-322, 120), P(-322, -152), ...battlements(-322, -410, -152, -152, 17, 12, 18), P(-410, 150)]);
  const westTowerShade = polygon([P(-322, 120), P(-322, -152), P(-352, -152), P(-352, 130)]);
  const eastWall = polygon([
    P(72, 80), P(72, -96), ...battlements(76, 196, -96, -70), P(204, -50), P(222, -58), P(236, -28), P(254, -34), P(272, 6), P(300, 70),
  ]);
  const outwork = polygon([
    P(-560, 330), P(-560, 204), ...battlements(-560, -480, 204, 190, 15, 11, 15), P(-472, 210), P(-458, 226), P(-446, 218), P(-430, 255), P(-422, 330),
  ]);
  const masonry = [outwork, westWall, eastWall, westTower, keep];
  const slits = [[-22, -176, 9, 34], [26, -128, 9, 30], [-40, -84, 8, 26], [-370, -98, 8, 26], [-150, -52, 7, 22], [130, -36, 7, 22]]
    .map(([x, y, w, h]) => `<rect x="${n(fx + x * s)}" y="${n(fy + y * s)}" width="${n(w * s)}" height="${n(h * s)}" rx="${n(3 * s)}"/>`)
    .join("");

  // The flag, flying from the keep.
  const poleX = fx - 22 * s;
  const poleTop = fy - 550 * s;
  const poleFoot = fy - 236 * s;
  const flagTop = poleTop + 14 * s;
  const flagH = 200 * s;
  const flagL = 330 * s;
  const at = (dx, dy) => `${n(poleX + flagL * dx)},${n(flagTop + dy * s)}`;
  const flag = [
    `M${at(0, 0)}`,
    `C${at(0.28, -30)} ${at(0.52, 34)} ${at(0.78, 8)}`,
    `S${at(0.95, -12)} ${at(1, 4)}`,
    `C${at(0.97, 80)} ${at(1.024, 140)} ${at(0.982, 216)}`,
    `C${at(0.82, 202)} ${at(0.66, 244)} ${at(0.46, 220)}`,
    `S${at(0.18, 174)} ${at(0, 200)}`,
    "Z",
  ].join(" ");
  const eagleScale = (flagH * 0.76) / 175;
  const eagleX = poleX + flagL * 0.5 - 100 * eagleScale;
  const eagleY = flagTop + flagH * 0.5 + 12 * s - 106 * eagleScale;

  // Trees: along the left slope, on the fortress hill, and big dark ones framing the bottom corners.
  const slopeTrees = [];
  for (let i = 0; i < 70; i++) {
    const x = X(-0.02) + rand() * (slopeEnd - X(0.01));
    const h = H * (0.03 + rand() * 0.035);
    slopeTrees.push(conifer(x, heightAt(near, x) + h * 0.2, h, rand));
  }
  const hillTrees = [];
  const scatter = (count, x0, x1, hMin, hMax) => {
    for (let i = 0; i < count; i++) {
      const x = x0 + rand() * (x1 - x0);
      const h = hMin + rand() * (hMax - hMin);
      hillTrees.push(conifer(x, heightAt(hill, x) + h * 0.12, h, rand));
    }
  };
  scatter(22, fx - 740 * s, fx - 430 * s, 45 * s, 110 * s);
  scatter(18, fx + 330 * s, fx + 1250 * s, 50 * s, 130 * s);
  const front = [];
  for (let i = 0; i < 9; i++) {
    const x = X(-0.03) + rand() * X(0.2);
    const h = H * (0.2 + rand() * 0.2);
    front.push(conifer(x, H + h * 0.12 - (X(0.2) - x) * 0.25, h, rand));
  }
  for (let i = 0; i < 7; i++) {
    const x = X(0.86) + rand() * X(0.17);
    const h = H * (0.18 + rand() * 0.2);
    front.push(conifer(x, H + h * 0.1 - (x - X(0.86)) * 0.3, h, rand));
  }
  const frontGround = displace(
    [[X(-0.02), H * 0.9], [X(0.12), H * 0.93], [X(0.3), H * 0.985], [X(0.5), H * 1.01], [X(0.8), H * 0.99], [X(0.92), H * 0.94], [X(1.02), H * 0.9]],
    rand,
    { rough: 0.12, depth: 5 }
  );

  const full = `x="0" y="0" width="${W}" height="${H}"`;
  const region = `filterUnits="userSpaceOnUse" ${full}`;
  // Texture scale, so every canvas size gets the same grain of rock and cloud.
  const k = Math.max(W, H) / 2880;

  // Rock relief: fractal noise lit from the upper left, eased toward white so it only ever tints.
  const relief = (id, freqX, freqY, height, noiseSeed, floor) => `
  <filter id="${id}" ${region} color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${freqX / k} ${freqY / k}" numOctaves="6" seed="${noiseSeed}" result="noise"/>
    <feDiffuseLighting in="noise" surfaceScale="${height * k}" diffuseConstant="1.15" lighting-color="#ffffff" result="lit">
      <feDistantLight azimuth="222" elevation="48"/>
    </feDiffuseLighting>
    <feComponentTransfer in="lit" result="eased">
      <feFuncR type="linear" slope="${1 - floor}" intercept="${floor}"/>
      <feFuncG type="linear" slope="${1 - floor}" intercept="${floor}"/>
      <feFuncB type="linear" slope="${1 - floor}" intercept="${floor}"/>
    </feComponentTransfer>
    <feComposite in="SourceGraphic" in2="eased" operator="arithmetic" k1="1.18" k2="0" k3="0" k4="0"/>
  </filter>`;
  // Drifting cloud or mist: noise turned into the alpha of one flat colour.
  const vapour = (id, freqX, freqY, noiseSeed, rgb, gain, bias) => `
  <filter id="${id}" ${region} color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${freqX / k} ${freqY / k}" numOctaves="5" seed="${noiseSeed}"/>
    <feColorMatrix type="matrix" values="0 0 0 0 ${rgb[0]}  0 0 0 0 ${rgb[1]}  0 0 0 0 ${rgb[2]}  0 0 0 ${gain} ${bias}"/>
  </filter>`;
  const stops = (list) => list.map(([offset, color, opacity]) => `<stop offset="${offset}" stop-color="${color}"${opacity === undefined ? "" : ` stop-opacity="${opacity}"`}/>`).join("");
  const vertical = (id, y0, y1, list) => `<linearGradient id="${id}" x1="0" y1="${n(y0)}" x2="0" y2="${n(y1)}" gradientUnits="userSpaceOnUse">${stops(list)}</linearGradient>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  ${vertical("sky", 0, Y(0.66), [[0, "#040405"], [0.32, "#0f1116"], [0.62, "#2a2f38"], [0.86, "#565c66"], [1, "#6c7078"]])}
  <radialGradient id="glow" cx="${n(valley + X(0.02))}" cy="${n(Y(0.3))}" r="${n(X(0.36))}" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 ${n(Y(0.3) * 0.35)}) scale(1 0.65)">
    ${stops([[0, "#dcd8d6", 0.7], [0.4, "#9c9aa0", 0.32], [1, "#8e8a90", 0]])}
  </radialGradient>
  ${vertical("farFill", Y(0.2), Y(0.62), [[0, "#8b94a1"], [0.45, "#6a7380"], [1, "#7d838d"]])}
  ${vertical("midFill", Y(0.32), Y(0.66), [[0, "#525b63"], [0.55, "#3a4247"], [1, "#565c62"]])}
  ${vertical("floorFill", Y(0.6), H, [[0, "#70767b"], [0.12, "#474e4f"], [0.38, "#262c2b"], [1, "#0d1010"]])}
  ${vertical("nearFill", Y(0.46), H, [[0, "#272d2c"], [0.5, "#151918"], [1, "#090a0a"]])}
  ${vertical("hillFill", fy, H, [[0, "#2b2826"], [0.3, "#171514"], [1, "#070606"]])}
  ${vertical("riverFill", Y(0.6), H, [[0, "#eef1f4"], [0.4, "#b9c3cd"], [1, "#66717d"]])}
  ${vertical("stoneFade", fy - 250 * s, fy + 150 * s, [[0, "#000", 0], [0.6, "#000", 0.2], [1, "#050404", 0.92]])}
  <linearGradient id="stone" x1="${n(fx - 420 * s)}" y1="0" x2="${n(fx + 300 * s)}" y2="0" gradientUnits="userSpaceOnUse">
    ${stops([[0, "#8d8379"], [0.5, "#70675f"], [1, "#4a433f"]])}
  </linearGradient>
  <linearGradient id="cloth" x1="${n(poleX)}" y1="0" x2="${n(poleX + flagL)}" y2="0" gradientUnits="userSpaceOnUse">
    ${stops([[0, "#a9151a"], [0.14, "#d9292e"], [0.3, "#8c0f13"], [0.5, "#d0252a"], [0.68, "#e0353a"], [0.84, "#87090d"], [1, "#b4171c"]])}
  </linearGradient>
  <linearGradient id="fogBand" x1="0" y1="0" x2="0" y2="1">${stops([[0, "#c3c7ce", 0], [0.6, "#c3c7ce", 0.55], [1, "#c3c7ce", 0]])}</linearGradient>
  <radialGradient id="vignette" cx="0.58" cy="0.42" r="0.8">${stops([[0.4, "#050303", 0], [1, "#050303", 0.8]])}</radialGradient>
  <linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1">${stops([[0.7, "#050303", 0], [1, "#050303", 0.95]])}</linearGradient>
${relief("rockFar", 0.003, 0.002, 13, 4, 0.36)}
${relief("rockMid", 0.004, 0.0026, 11, 14, 0.42)}
${relief("rockNear", 0.006, 0.004, 9, 24, 0.5)}
${relief("stonework", 0.028, 0.07, 3.2, 9, 0.5)}
${vapour("clouds", 0.0009, 0.0032, 21, [0.78, 0.78, 0.82], 3.2, -1.5)}
${vapour("gloom", 0.0012, 0.003, 57, [0.02, 0.02, 0.03], 3.4, -1.45)}
${vapour("mist", 0.0016, 0.006, 33, [0.78, 0.8, 0.84], 2.4, -0.9)}
  <filter id="soft" ${region}><feGaussianBlur stdDeviation="${n(2.5 * k)}"/></filter>
  <filter id="softer" ${region}><feGaussianBlur stdDeviation="${n(14 * k)}"/></filter>
  ${vertical("skyMask", 0, Y(0.6), [[0, "#fff", 0.25], [0.6, "#fff", 1], [1, "#fff", 0.4]])}
  <mask id="skyOnly"><rect ${full} fill="url(#skyMask)"/></mask>
  ${vertical("valleyMask", Y(0.4), Y(0.9), [[0, "#fff", 0], [0.45, "#fff", 1], [1, "#fff", 0]])}
  <mask id="valleyOnly"><rect ${full} fill="url(#valleyMask)"/></mask>
  <clipPath id="flagClip"><path d="${flag}"/></clipPath>
  <path id="eagleHalf" d="${EAGLE_HALF}"/>
</defs>

<rect ${full} fill="url(#sky)"/>
<g mask="url(#skyOnly)">
  <rect ${full} filter="url(#gloom)" opacity="0.8"/>
  <rect ${full} filter="url(#clouds)" opacity="0.5"/>
</g>
<rect ${full} fill="url(#glow)"/>

<path d="${silhouette(far, H)}" fill="url(#farFill)" filter="url(#rockFar)"/>
<rect x="0" y="${n(Y(0.3))}" width="${W}" height="${n(Y(0.64) - Y(0.3))}" fill="url(#fogBand)" opacity="0.55"/>
<path d="${silhouette(mid, H)}" fill="url(#midFill)" filter="url(#rockMid)"/>
<rect x="0" y="${n(Y(0.44))}" width="${W}" height="${n(Y(0.7) - Y(0.44))}" fill="url(#fogBand)" opacity="0.7"/>

<rect x="0" y="${n(Y(0.6))}" width="${W}" height="${n(H - Y(0.6))}" fill="url(#floorFill)"/>
<rect x="0" y="${n(Y(0.5))}" width="${W}" height="${n(Y(0.7) - Y(0.5))}" fill="url(#fogBand)" opacity="0.75"/>
<g mask="url(#valleyOnly)"><rect ${full} filter="url(#mist)" opacity="0.55"/></g>
<path d="${river}" fill="url(#riverFill)" filter="url(#soft)"/>

<path d="${silhouette(near, H + 20)}" fill="url(#nearFill)" filter="url(#rockNear)"/>
<path d="${slopeTrees.join(" ")}" fill="#121514"/>

<g filter="url(#stonework)">${masonry.map((d) => `<path d="${d}" fill="url(#stone)"/>`).join("")}</g>
<path d="${keepShade} ${westTowerShade}" fill="#0b0909" opacity="0.5"/>
<g fill="#0a0808" opacity="0.9">${slits}</g>
<path d="${masonry.join(" ")}" fill="url(#stoneFade)"/>

<path d="${silhouette(hill, H + 20)}" fill="url(#hillFill)" filter="url(#rockNear)"/>
<path d="${hillTrees.join(" ")}" fill="#0a0909"/>

<rect x="${n(poleX - 4.5 * s)}" y="${n(poleTop)}" width="${n(9 * s)}" height="${n(poleFoot - poleTop)}" fill="#1a1716"/>
<rect x="${n(poleX - 4.5 * s)}" y="${n(poleTop)}" width="${n(3 * s)}" height="${n(poleFoot - poleTop)}" fill="#6b6562" opacity="0.7"/>
<circle cx="${n(poleX)}" cy="${n(poleTop - 5 * s)}" r="${n(8 * s)}" fill="#2a2523"/>
<path d="${flag}" fill="#000" opacity="0.35" filter="url(#softer)" transform="translate(${n(10 * s)} ${n(14 * s)})"/>
<path d="${flag}" fill="url(#cloth)"/>
<g clip-path="url(#flagClip)">
  <g transform="translate(${n(eagleX)} ${n(eagleY)}) scale(${eagleScale.toFixed(4)}) skewY(-4)" fill="#0d0809" stroke="#0d0809" stroke-width="1.6" stroke-linejoin="round">
    <use href="#eagleHalf" xlink:href="#eagleHalf"/>
    <use href="#eagleHalf" xlink:href="#eagleHalf" transform="translate(200 0) scale(-1 1)"/>
  </g>
  <path d="${flag}" fill="url(#cloth)" opacity="0.22"/>
</g>

<path d="${silhouette(frontGround, H + 20)}" fill="#050404"/>
<path d="${front.join(" ")}" fill="#050404"/>
<rect ${full} fill="url(#vignette)"/>
<rect ${full} fill="url(#floorFade)"/>
</svg>`;
}

// ---------- The grunge texture ----------

/** Flag-red paint, dry-brushed and spattered: transparent everywhere else, so it layers over any section. */
function grunge(W, H) {
  const region = `filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <filter id="paint" ${region} color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.0042 0.0075" numOctaves="5" seed="12" result="blots"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.018 0.085" numOctaves="2" seed="3" result="bristle"/>
    <feComposite in="blots" in2="bristle" operator="arithmetic" k1="0" k2="1" k3="0.42" k4="-0.21" result="mix"/>
    <feColorMatrix in="mix" type="matrix" values="0 0 0 0 0.70  0 0 0 0 0.075  0 0 0 0 0.09  0 0 0 9 -4.75"/>
  </filter>
  <filter id="spatter" ${region} color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="40" result="dots"/>
    <feColorMatrix in="dots" type="matrix" values="0 0 0 0 0.78  0 0 0 0 0.1  0 0 0 0 0.11  0 0 0 24 -16.6"/>
  </filter>
</defs>
<rect width="${W}" height="${H}" filter="url(#paint)"/>
<rect width="${W}" height="${H}" filter="url(#spatter)" opacity="0.8"/>
</svg>`;
}

// ---------- Output ----------

const HERO = { W: 2880, H: 1440, fx: 1930, fy: 800, s: 1, valley: 1420 };
const PHONE = { W: 1440, H: 1920, fx: 1010, fy: 800, s: 0.8, valley: 470, horizon: 0.42, lift: 0.62 };

mkdirSync(OUT, { recursive: true });

async function write(name, image, options) {
  const { size } = await image.webp(options).toFile(join(OUT, name));
  console.log(`${name}  ${(size / 1024).toFixed(0)} KB`);
}

const hero = await sharp(Buffer.from(landscape(HERO)), { limitInputPixels: false }).png().toBuffer();
await write("hero.webp", sharp(hero), { quality: 86 });
await write("hero-phone.webp", sharp(Buffer.from(landscape(PHONE)), { limitInputPixels: false }), { quality: 84 });
// The fortress and its flag, cut from the wide scene, for the newsletter strip.
await write(
  "fortress.webp",
  sharp(hero)
    .extract({ left: HERO.fx - 760, top: HERO.fy - 620, width: 1400, height: 880 })
    .resize({ width: 1000 }),
  { quality: 82 }
);
await write("grunge.webp", sharp(Buffer.from(grunge(960, 620))), { quality: 52, alphaQuality: 60 });
