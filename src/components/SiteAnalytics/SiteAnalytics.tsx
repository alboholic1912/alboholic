"use client";

import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import PageTracker from "./PageTracker";

// The Studio lives at a hidden path; keep it (and our own editing visits) out of the stats.
const STUDIO_PATH = "/kalaja-cabb0da6";

function skipStudio<T extends { url: string }>(event: T): T | null {
  return new URL(event.url).pathname.startsWith(STUDIO_PATH) ? null : event;
}

/**
 * Our own visitor analytics (PageTracker, shown in the Studio under Analytics), plus Vercel
 * Web Analytics while the two are compared, and Speed Insights (real-visitor page speed).
 */
export default function SiteAnalytics() {
  return (
    <>
      {/* Reading the address's ?battle= needs a Suspense boundary, or every page would render in the browser only. */}
      <Suspense fallback={null}>
        <PageTracker />
      </Suspense>
      <Analytics beforeSend={skipStudio} />
      <SpeedInsights beforeSend={skipStudio} />
    </>
  );
}
