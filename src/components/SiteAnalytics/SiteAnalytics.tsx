"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// The Studio lives at a hidden path; keep it (and our own editing visits) out of the stats.
const STUDIO_PATH = "/kalaja-cabb0da6";

function skipStudio<T extends { url: string }>(event: T): T | null {
  return new URL(event.url).pathname.startsWith(STUDIO_PATH) ? null : event;
}

/** Vercel Web Analytics (cookieless page views) and Speed Insights (real-visitor page speed). */
export default function SiteAnalytics() {
  return (
    <>
      <Analytics beforeSend={skipStudio} />
      <SpeedInsights beforeSend={skipStudio} />
    </>
  );
}
