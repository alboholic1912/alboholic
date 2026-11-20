import { getAllStories, getBattles, getPeople } from "@/lib/content/public";
import { formatDate } from "@/lib/content/text";
import type { SearchEntry } from "@/lib/search";

/**
 * Everything the header search looks through: every published story, person and battle.
 * Built once and cached like the pages are, so searching never waits on the database.
 * The search dialog only fetches it when it is first opened.
 */
export const dynamic = "force-static";
export const revalidate = 60;

/** Story bodies can carry Markdown-style marks; search and snippets want the plain words. */
function plain(text: string): string {
  return text.replace(/[#*_>`[\]]+/g, "").replace(/\s+/g, " ").trim();
}

export async function GET() {
  const [stories, people, battles] = await Promise.all([getAllStories(), getPeople(), getBattles()]);

  const entries: SearchEntry[] = [
    ...stories.map(
      (story): SearchEntry => ({
        kind: "story",
        href: `/stories/${story.slug}`,
        title: story.title,
        meta: [story.category, formatDate(story.date)].filter(Boolean).join(" · "),
        summary: story.excerpt,
        image: story.image,
        fields: [story.title, story.category, story.excerpt, plain((story.body ?? []).join(" "))],
      }),
    ),
    ...people.map(
      (person): SearchEntry => ({
        kind: "person",
        href: `/people/${person.slug}`,
        title: person.name,
        meta: [person.role, person.era].filter(Boolean).join(" · "),
        summary: person.knownFor ?? person.summary ?? "",
        image: person.image,
        fields: [
          person.name,
          [person.category, person.role, person.era, person.birthplace].filter(Boolean).join(" "),
          [person.knownFor, person.summary].filter(Boolean).join(" "),
          [
            ...person.facts.map((fact) => `${fact.label} ${fact.value} ${fact.detail}`),
            ...person.significance.map((item) => `${item.title} ${item.text}`),
            ...person.timeline.map((moment) => `${moment.date} ${moment.title} ${moment.text}`),
          ].join(" "),
        ],
      }),
    ),
    ...battles.map(
      (battle): SearchEntry => ({
        kind: "battle",
        href: `/battles?battle=${encodeURIComponent(battle.slug)}`,
        title: battle.name,
        meta: [battle.date, battle.location].filter(Boolean).join(" · "),
        summary: battle.summary,
        image: battle.image,
        fields: [
          battle.name,
          [battle.period, battle.date, battle.location, battle.participants].filter(Boolean).join(" "),
          [battle.summary, battle.outcome].filter(Boolean).join(" "),
          [
            ...battle.keyPeople.map((person) => `${person.name} ${person.role}`),
            ...battle.details.map((detail) => `${detail.label} ${detail.value}`),
          ].join(" "),
        ],
      }),
    ),
  ];

  return Response.json(entries);
}
