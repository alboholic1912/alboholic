"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Our own visitor counter (see supabase/analytics.sql and src/app/api/p/route.ts). It sets no
 * cookies and keeps nothing in the browser: each page view sends one message when it opens,
 * then a short "still here" every 15 seconds while the page is on screen, carrying the time
 * spent and how far down the reader has scrolled.
 */

const ENDPOINT = "/api/p";
const STUDIO_PATH = "/kalaja-cabb0da6";
const HEARTBEAT_MS = 15_000;
/** Set by the /analytics-opt-out page, so we can leave our own phones and laptops out. */
export const OPT_OUT_KEY = "alboholic:dont-count-me";

// The referring site belongs to the first page of a visit only. Later pages are clicks within the site.
let firstView = true;

function optedOut(): boolean {
  try {
    return window.localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

function send(message: object, closing = false) {
  const body = JSON.stringify(message);
  // A closing page cancels ordinary requests; a beacon is delivered anyway.
  if (closing && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }));
    return;
  }
  fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => {
    // Counting is never worth an error in the reader's console.
  });
}

function scrollDepth(): number {
  const doc = document.documentElement;
  const total = doc.scrollHeight;
  if (total <= 0) return 0;
  return Math.min(100, Math.round(((window.scrollY + window.innerHeight) / total) * 100));
}

export default function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // A battle opened on the map counts as its own view of the map.
  const battle = pathname === "/battles" ? searchParams.get("battle") : null;

  useEffect(() => {
    if (!pathname || pathname.startsWith(STUDIO_PATH)) return;
    if (navigator.webdriver || optedOut()) return;

    let id: string | null = null;
    let shownMs = 0;
    let shownSince: number | null = document.visibilityState === "visible" ? performance.now() : null;
    let deepest = scrollDepth();
    let heartbeat: number | undefined;

    const seconds = () =>
      Math.round((shownMs + (shownSince === null ? 0 : performance.now() - shownSince)) / 1000);

    const ping = (closing = false) => {
      if (id) send({ t: "p", id, s: seconds(), d: deepest }, closing);
    };

    const onScroll = () => {
      deepest = Math.max(deepest, scrollDepth());
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (shownSince !== null) shownMs += performance.now() - shownSince;
        shownSince = null;
        ping(true);
      } else {
        shownSince = performance.now();
        ping();
      }
    };

    const onPageHide = () => ping(true);

    // A short wait skips instant redirects, and React's development double-start.
    const start = window.setTimeout(() => {
      id = crypto.randomUUID();
      const params = new URLSearchParams(window.location.search);
      send({
        t: "v",
        id,
        path: pathname,
        battle,
        ref: firstView ? document.referrer : "",
        tag: params.get("utm_source") ?? params.get("ref"),
        campaign: params.get("utm_campaign"),
        touch: navigator.maxTouchPoints > 0,
      });
      firstView = false;

      heartbeat = window.setInterval(() => {
        if (document.visibilityState === "visible") ping();
      }, HEARTBEAT_MS);
    }, 300);

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearTimeout(start);
      window.clearInterval(heartbeat);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      // Moving to another page closes this view with its final time.
      ping(true);
    };
  }, [pathname, battle]);

  return null;
}
