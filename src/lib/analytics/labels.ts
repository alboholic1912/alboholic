import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Labels } from "./types";

const FIXED: Labels = {
  "/": "Home",
  "/stories": "Stories",
  "/people": "People",
  "/battles": "Battles map",
  "/about": "About",
  "/contact": "Contact",
  "/privacy": "Privacy",
  "/sources": "Sources",
  "/subscribe": "Subscribe",
  "/analytics-opt-out": "Visitor counting",
};

const TABLES = [
  { prefix: "/stories/", table: "stories", column: "title" },
  { prefix: "/people/", table: "people", column: "name" },
] as const;

type Wanted = { key: string; slug: string };

// Titles hardly ever change, and the live view asks every few seconds.
const cache = new Map<string, { label: string | null; at: number }>();
const CACHE_MS = 10 * 60 * 1000;

function cached(key: string): string | null | undefined {
  const hit = cache.get(key);
  return hit && Date.now() - hit.at < CACHE_MS ? hit.label : undefined;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function lookup(supabase: SupabaseClient, table: string, column: string, wanted: Wanted[]) {
  const found = new Map<string, string>();
  if (wanted.length === 0) return found;
  const { data } = await supabase
    .from(table)
    .select(`slug, ${column}`)
    .in(
      "slug",
      wanted.map((w) => w.slug),
    );
  for (const row of (data ?? []) as unknown as Record<string, string>[]) {
    if (row[column]) found.set(row.slug, row[column]);
  }
  return found;
}

/**
 * Titles for the pages and battles in a report, so the Studio shows "Skanderbeg" instead of
 * "/people/skanderbeg". Battles use the key "battle:<slug>". Anything unknown keeps its address.
 */
export async function labelsFor(supabase: SupabaseClient, paths: string[], battles: string[]): Promise<Labels> {
  const labels: Labels = {};
  const missing: Record<"stories" | "people" | "battles", Wanted[]> = { stories: [], people: [], battles: [] };

  for (const path of new Set(paths)) {
    if (FIXED[path]) {
      labels[path] = FIXED[path];
      continue;
    }
    const source = TABLES.find((t) => path.startsWith(t.prefix));
    if (!source) continue;
    const slug = safeDecode(path.slice(source.prefix.length)).replace(/\/$/, "");
    if (!slug || slug.includes("/")) continue;
    const hit = cached(path);
    if (hit) labels[path] = hit;
    else if (hit === undefined) missing[source.table].push({ key: path, slug });
  }

  for (const slug of new Set(battles)) {
    const key = `battle:${slug}`;
    const hit = cached(key);
    if (hit) labels[key] = hit;
    else if (hit === undefined) missing.battles.push({ key, slug });
  }

  const [stories, people, battleNames] = await Promise.all([
    lookup(supabase, "stories", "title", missing.stories),
    lookup(supabase, "people", "name", missing.people),
    lookup(supabase, "battles", "name", missing.battles),
  ]);

  const results = [
    [missing.stories, stories],
    [missing.people, people],
    [missing.battles, battleNames],
  ] as const;
  for (const [wanted, found] of results) {
    for (const { key, slug } of wanted) {
      const label = found.get(slug) ?? null;
      cache.set(key, { label, at: Date.now() });
      if (label) labels[key] = label;
    }
  }

  return labels;
}
