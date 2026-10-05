import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
