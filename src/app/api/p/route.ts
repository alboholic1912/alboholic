import { after, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { classifySource, isBot, parseUserAgent } from "@/lib/analytics/classify";

/**
 * Receives page views from src/components/SiteAnalytics/PageTracker.tsx and passes them to the
 * database (see supabase/analytics.sql). The short, plain address keeps ad blockers' lists of
 * "analytics" URLs from dropping real readers.
 *
 * The reply is sent at once; the database write happens afterwards, so a slow write never
 * holds up the reader's browser.
 */

type ViewMessage = {
  t: "v";
  id: string;
  path: string;
  battle?: string | null;
  ref?: string;
  tag?: string | null;
  campaign?: string | null;
  touch?: boolean;
};

type PingMessage = { t: "p"; id: string; s: number; d: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STUDIO_PATH = "/kalaja-cabb0da6";

function str(value: unknown, max: number): string | null {
  return typeof value === "string" && value.length > 0 ? value.slice(0, max) : null;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0;
}

function header(request: NextRequest, name: string): string | null {
  const value = request.headers.get(name);
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function coordinate(request: NextRequest, name: string): number | null {
  const value = Number.parseFloat(request.headers.get(name) ?? "");
  return Number.isFinite(value) ? value : null;
}

/**
 * Visits that shouldn't count: development and preview copies of the site (they share the
 * live database), and anyone signed in to the Studio, which is us.
 */
function shouldSkip(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production" && process.env.ANALYTICS_IN_DEV !== "1") return true;
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return true;
  if (request.cookies.getAll().some((cookie) => /^sb-.+-auth-token/.test(cookie.name))) return true;

  // Only our own pages send these; a post from another site is ignored.
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.nextUrl.host) return true;
    } catch {
      return true;
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  const done = new Response(null, { status: 204 });
  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBot(userAgent) || shouldSkip(request)) return done;

  let message: ViewMessage | PingMessage;
  try {
    message = JSON.parse(await request.text());
  } catch {
    return done;
  }
  if (!message || typeof message !== "object" || typeof message.id !== "string" || !UUID.test(message.id)) {
    return done;
  }

  const supabase = createPublicClient();

  if (message.t === "p") {
    const { id } = message;
    const seconds = num(message.s);
    const scroll = num(message.d);
    after(async () => {
      const { error } = await supabase.rpc("analytics_record_ping", {
        p_id: id,
        p_seconds: seconds,
        p_scroll: scroll,
      });
      if (error) console.error("[analytics] ping failed:", error.message);
    });
    return done;
  }

  if (message.t !== "v") return done;

  const path = str(message.path, 300);
  if (!path || !path.startsWith("/") || path.startsWith(STUDIO_PATH)) return done;

  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const { device, browser, os } = parseUserAgent(userAgent, message.touch === true);
  const { source, referrerHost } = classifySource({
    referrer: str(message.ref, 500) ?? "",
    userAgent,
    tag: str(message.tag, 60),
    ownHost: request.nextUrl.host,
  });

  const row = {
    p_id: message.id,
    p_ip: ip,
    p_user_agent: userAgent.slice(0, 400),
    p_path: path,
    p_battle: path === "/battles" ? str(message.battle, 120) : null,
    p_source: source,
    p_referrer: referrerHost,
    p_utm_campaign: str(message.campaign, 120),
    // Added by Vercel's network to every request. Missing when running locally.
    p_country: header(request, "x-vercel-ip-country"),
    p_region: header(request, "x-vercel-ip-country-region"),
    p_city: header(request, "x-vercel-ip-city"),
    p_lat: coordinate(request, "x-vercel-ip-latitude"),
    p_lng: coordinate(request, "x-vercel-ip-longitude"),
    p_device: device,
    p_browser: browser,
    p_os: os,
  };

  after(async () => {
    const { error } = await supabase.rpc("analytics_record_view", row);
    if (error) console.error("[analytics] page view failed:", error.message);
  });

  return done;
}
