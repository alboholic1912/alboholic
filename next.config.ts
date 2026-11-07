import type { NextConfig } from "next";

const SUPABASE_ORIGIN = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;

// Where the Battles map loads its tiles, fonts and relief from (see BattleMap/mapStyle.ts).
const MAP_ORIGINS = "https://tiles.openfreemap.org https://s3.amazonaws.com";

/**
 * Which sources a page may load. Blocks scripts from any other site, plugins, and other sites
 * framing ours. Inline scripts stay allowed because Next.js needs them on statically built pages.
 * Only sent in production: the dev server needs eval and a websocket for hot reload.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE_ORIGIN}`,
  "font-src 'self' data:",
  `connect-src 'self' ${MAP_ORIGINS}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Don't advertise what the site runs on.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY }]
            : []),
          // HTTPS only, for two years, on every subdomain too.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // The Battles map used to live at /map; old links and bookmarks still land on it.
      { source: "/map", destination: "/battles", permanent: true },
    ];
  },
  experimental: {
    serverActions: {
      // Raised from the 1MB default so Studio can accept source PDFs/papers.
      bodySizeLimit: "25mb",
    },
  },
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vjekdracmzbptaqfyuyq.supabase.co",
        pathname: "/storage/v1/object/public/media/**",
      },
    ],
  },
};

export default nextConfig;
