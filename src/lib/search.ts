import { fold } from "@/lib/content/text";

export type SearchKind = "story" | "person" | "battle";

/** One entry in the site-wide search, as served by src/app/search-index/route.ts. */
export type SearchEntry = {
  kind: SearchKind;
  href: string;
  title: string;
  /** A short line under the title, e.g. a story's category or a person's role. */
  meta: string;
  /** Shown when the match isn't in the body. */
  summary: string;
  image?: string;
  /** Weighted text fields, best first: title, then tags, then summary, then body. */
  fields: [title: string, tags: string, summary: string, body: string];
};

export type SearchResult = SearchEntry & { score: number; snippet: string };

const FIELD_WEIGHTS = [10, 5, 3, 1];

/** Up to ~140 characters of `text` around the first match of `term`, with ellipses where cut. */
function snippetAround(text: string, term: string): string {
  const at = fold(text).indexOf(term);
  if (at < 0) return "";
  const start = Math.max(0, at - 50);
  const end = Math.min(text.length, at + term.length + 90);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

/**
 * Every entry that contains every word of `query`, ignoring case and accents (so "skenderbeu"
 * finds "Skënderbeu"), best matches first. A title that starts with the query ranks highest.
 */
export function searchEntries(entries: SearchEntry[], query: string, limit = 20): SearchResult[] {
  const folded = fold(query).trim();
  const terms = folded.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const results: SearchResult[] = [];
  for (const entry of entries) {
    const fields = entry.fields.map(fold);
    let score = 0;
    let matchesAll = true;

    for (const term of terms) {
      const best = fields.reduce((top, field, index) => (field.includes(term) ? Math.max(top, FIELD_WEIGHTS[index]) : top), 0);
      if (best === 0) {
        matchesAll = false;
        break;
      }
      score += best;
    }
    if (!matchesAll) continue;

    if (fields[0].startsWith(folded)) score += 20;
    else if (fields[0].includes(folded)) score += 10;

    // Explain a match that only the body contains with a line of the body itself.
    const inSummary = terms.every((term) => fields.slice(0, 3).some((field) => field.includes(term)));
    const snippet = inSummary ? entry.summary : snippetAround(entry.fields[3], terms[0]) || entry.summary;

    results.push({ ...entry, score, snippet });
  }

  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}
