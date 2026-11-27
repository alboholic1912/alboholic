/** Shapes returned by the report functions in supabase/analytics.sql. */

export const RANGES = ["24h", "7d", "30d"] as const;
export type Range = (typeof RANGES)[number];

export interface PeriodCount {
  visitors: number;
  views: number;
  prevVisitors: number;
  prevViews: number;
}

export type Overview = Record<Range, PeriodCount> & { live: number };

export interface Totals {
  visitors: number;
  views: number;
  avgVisitSeconds: number;
  bounceRate: number;
  viewsPerVisitor: number;
}

export interface NamedCount {
  name: string;
  visitors: number;
}

export interface Report {
  range: Range;
  tz: string;
  since: string;
  totals: Totals;
  prevTotals: Totals;
  /** Local time of each hour (24h) or day (7d, 30d), oldest first. */
  series: { t: string; visitors: number; views: number }[];
  pages: { path: string; views: number; visitors: number; avgSeconds: number; avgScroll: number }[];
  landing: { path: string; visitors: number }[];
  battles: { slug: string; views: number; visitors: number }[];
  sources: { name: string; visitors: number; views: number }[];
  campaigns: NamedCount[];
  countries: { code: string; visitors: number; views: number }[];
  cities: { name: string; country: string | null; lat: number; lng: number; visitors: number; views: number }[];
  unknownLocation: number;
  devices: NamedCount[];
  browsers: NamedCount[];
  os: NamedCount[];
  /** Page views by weekday (1 = Monday) and hour of day. */
  heat: { dow: number; hour: number; views: number }[];
}

export interface LiveVisitor {
  id: string;
  path: string;
  battle: string | null;
  source: string;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  device: string | null;
  browser: string | null;
  seconds: number;
  scroll: number;
  startedAt: string;
  lastSeen: string;
}

export interface RecentView {
  id: string;
  path: string;
  battle: string | null;
  source: string;
  city: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  seconds: number;
  scroll: number;
  at: string;
  lastSeen: string;
}

export interface Live {
  now: string;
  online: LiveVisitor[];
  recent: RecentView[];
  /** Page views per minute over the last 30 minutes, oldest first. */
  perMinute: number[];
}

/** Readable names for page addresses ("/stories/x") and battles ("battle:x"). */
export type Labels = Record<string, string>;

export type ReportResponse = { overview: Overview; report: Report; labels: Labels } | { error: string };
export type LiveResponse = { live: Live; labels: Labels } | { error: string };
