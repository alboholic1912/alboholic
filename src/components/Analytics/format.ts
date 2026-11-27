import type { Labels } from "@/lib/analytics/types";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("en");

/** 1,284 in full under 10,000, then 12.9K. */
export function formatCount(n: number): string {
  return n < 10_000 ? full.format(n) : compact.format(n);
}

/** 45s, 3m 12s, 1h 04m. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

/** "just now", "4m ago", "2h ago". */
export function formatAgo(iso: string, now: number): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

let regionNames: Intl.DisplayNames | null = null;

export function countryName(code: string | null | undefined): string {
  if (!code) return "Unknown";
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** "Tirana, Albania", or just the country when the town is unknown. */
export function placeName(city: string | null, country: string | null): string {
  if (!city && !country) return "Somewhere";
  if (!city) return countryName(country);
  return `${city}, ${countryName(country)}`;
}

export function pageLabel(labels: Labels, path: string, battle?: string | null): string {
  if (battle) return labels[`battle:${battle}`] ?? battle.replace(/-/g, " ");
  return labels[path] ?? path;
}

/** Change against the period before, as a whole percentage, or null when there is nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Bucket times arrive as the viewer's local wall-clock time without a zone; read them as such. */
export function bucketDate(t: string): Date {
  return new Date(`${t}Z`);
}

const HOUR = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const DAY_SHORT = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", timeZone: "UTC" });
const DAY_MONTH = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const DAY_LONG = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export function bucketLabel(t: string, range: string, long = false): string {
  const date = bucketDate(t);
  if (range === "24h") {
    const time = HOUR.format(date);
    return long ? `${DAY_SHORT.format(date)}, ${time}` : time;
  }
  if (long) return DAY_LONG.format(date);
  return range === "7d" ? DAY_SHORT.format(date) : DAY_MONTH.format(date);
}
