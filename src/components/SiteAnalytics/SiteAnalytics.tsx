"use client";

import { Analytics } from "@vercel/analytics/next";

// The Studio lives at a hidden path; keep it (and our own editing visits) out of the stats.
const STUDIO_PATH = "/kalaja-cabb0da6";

/** Vercel Web Analytics: cookieless, aggregate page views. */
export default function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => (new URL(event.url).pathname.startsWith(STUDIO_PATH) ? null : event)}
    />
  );
}
