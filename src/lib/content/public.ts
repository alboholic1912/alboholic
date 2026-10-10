import { createPublicClient } from "@/lib/supabase/public";
import { BATTLE_RECORDS, PERSON_RECORDS } from "./config";
import { cleanRecords } from "./records";
import { fold } from "./text";
import {
  PRONOUNS,
  type BattleDetail,
  type BattleRow,
  type Citation,
  type PersonFact,
  type PersonMoment,
  type PersonRow,
  type PersonSignificance,
  type Pronoun,
  type RelatedPerson,
  type RelatedPlace,
  type StoryLang,
  type StoryRow,
} from "./types";

export type Story = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  imageTone: "crimson" | "amber" | "stone" | "slate";
  aiImage: boolean;
  /** The language the story is written in: English or Albanian. */
  lang: StoryLang;
  credit?: string;
  body?: string[];
  image?: string;
};

/**
 * A person profile: a short dossier answering "who was this person?", never a biography.
 * Everything beyond the name is optional, and the page drops whatever is missing.
 */
export type Person = {
  slug: string;
  name: string;
  /** One of PERSON_CATEGORIES, e.g. "Freedom Fighter". */
  category?: string;
  /** Short role or affiliation tag, e.g. "UÇK Commander". */
  role: string;
  /** Life span as displayed, e.g. "1962 – 1997". */
  era: string;
  pronoun: Pronoun;
  birthplace?: string;
  /** One sentence, for cards and link previews. */
  knownFor?: string;
  /** The 2–3 sentence introduction under the name. */
  summary?: string;
  imageTone: "crimson" | "amber" | "stone" | "slate";
  image?: string;
  facts: PersonFact[];
  significance: PersonSignificance[];
  timeline: PersonMoment[];
  /** Slugs of stories pinned to this profile; see getStoriesFeaturing. */
  relatedStories: string[];
  relatedPeople: RelatedPerson[];
  relatedPlaces: RelatedPlace[];
  sources: Citation[];
};

/** An associated person, with their own profile attached when one is published. */
export type AssociatedPerson = RelatedPerson & { profile?: Person };

/** Someone named on a battle card. The slug and portrait come from their profile, when one is published. */
export type BattlePerson = RelatedPerson & { slug?: string; image?: string };

/**
 * One pin on the Battles map. It answers where a battle was fought, who fought and how it
 * ended; the full account is a Story. Only ever built for battles that have a pin.
 */
export type Battle = {
  slug: string;
  name: string;
  /** One of BATTLE_PERIODS. */
  period: string;
  /** The date as displayed, e.g. "18 March 1908". */
  date: string;
  year: number;
  /** Place, then region, e.g. "Mashkullorë, Gjirokastër". */
  location: string;
  lat: number;
  lng: number;
  participants: string;
  summary: string;
  outcome: string;
  keyPeople: BattlePerson[];
  details: BattleDetail[];
  /** The story behind "View Story", when one is linked and published. */
  story?: { slug: string; title: string };
  sources: Citation[];
  image?: string;
  aiImage: boolean;
};

function toStory(row: StoryRow): Story {
  return {
    slug: row.slug,
    category: row.category,
    title: row.title,
    excerpt: row.excerpt,
    date: row.date,
    readTime: row.read_time,
    imageTone: row.image_tone,
    aiImage: row.ai_image,
    // Rows written before the column existed lack it, and are in English.
    lang: row.lang === "sq" ? "sq" : "en",
    credit: row.credit ?? undefined,
    body: row.body?.length ? row.body : undefined,
    image: row.image ?? undefined,
  };
}

// Rows written before the profile columns existed simply lack them, so every one is optional here.
function toPerson(row: PersonRow): Person {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category || undefined,
    role: row.role,
    era: row.era,
    pronoun: PRONOUNS.includes(row.pronoun) ? row.pronoun : "they",
    birthplace: row.birthplace || undefined,
    knownFor: row.known_for || undefined,
    summary: row.bio || undefined,
    imageTone: row.image_tone,
    image: row.image ?? undefined,
    facts: cleanRecords<PersonFact>(row.facts, PERSON_RECORDS.facts),
    significance: cleanRecords<PersonSignificance>(row.significance, PERSON_RECORDS.significance),
    timeline: cleanRecords<PersonMoment>(row.timeline, PERSON_RECORDS.timeline),
    relatedStories: Array.isArray(row.related_stories) ? row.related_stories : [],
    relatedPeople: cleanRecords<RelatedPerson>(row.related_people, PERSON_RECORDS.related_people),
    relatedPlaces: cleanRecords<RelatedPlace>(row.related_places, PERSON_RECORDS.related_places),
    sources: cleanRecords<Citation>(row.citations, PERSON_RECORDS.citations),
  };
}

function nameTokens(name: string): string[] {
  return fold(name)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Matches a name by first and last word, so "Adem Jashari" also finds "Adem Shaban Jashari". */
function nameMatcher(name: string): RegExp | null {
  const tokens = nameTokens(name);
  if (tokens.length === 0) return null;
  if (tokens.length === 1) return new RegExp(`\\b${tokens[0]}\\b`);
  return new RegExp(`\\b${tokens[0]}\\b(?:\\W+\\w+){0,2}?\\W+${tokens[tokens.length - 1]}\\b`);
}

function sameName(a: string, b: string): boolean {
  const [first, second] = [nameTokens(a), nameTokens(b)];
  if (first.length === 0 || second.length === 0) return false;
  if (first.join(" ") === second.join(" ")) return true;
  return (
    first.length > 1 &&
    second.length > 1 &&
    first[0] === second[0] &&
    first[first.length - 1] === second[second.length - 1]
  );
}

export async function getFeaturedStories(limit = 2): Promise<Story[]> {
  const { data, error } = await createPublicClient()
    .from("stories")
    .select("*")
    .eq("status", "published")
    .eq("featured", true)
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data ?? []) as StoryRow[]).map(toStory);
}

export async function getLatestStories(limit = 6): Promise<Story[]> {
  const { data, error } = await createPublicClient()
    .from("stories")
    .select("*")
    .eq("status", "published")
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data ?? []) as StoryRow[]).map(toStory);
}

export async function getAllStories(): Promise<Story[]> {
  const { data, error } = await createPublicClient()
    .from("stories")
    .select("*")
    .eq("status", "published")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as StoryRow[]).map(toStory);
}

export async function getStoryBySlug(slug: string): Promise<Story | undefined> {
  const { data, error } = await createPublicClient()
    .from("stories")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toStory(data as StoryRow) : undefined;
}

export async function getPeople(): Promise<Person[]> {
  const { data, error } = await createPublicClient()
    .from("people")
    .select("*")
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as PersonRow[]).map(toPerson);
}

export async function getPersonBySlug(slug: string): Promise<Person | undefined> {
  const { data, error } = await createPublicClient()
    .from("people")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toPerson(data as PersonRow) : undefined;
}

/**
 * The stories shown on a profile: those pinned to it in the Studio first, then any
 * published story that mentions the person by name, so new stories link up on their own.
 */
export async function getStoriesFeaturing(person: Person, limit = 4): Promise<Story[]> {
  const stories = await getAllStories();

  const pinned = person.relatedStories
    // Accept a pasted URL or path as well as a bare slug.
    .map((entry) => entry.split("/").filter(Boolean).pop())
    .map((slug) => stories.find((story) => story.slug === slug))
    .filter((story): story is Story => Boolean(story));

  const matcher = nameMatcher(person.name);
  const mentioned = matcher
    ? stories.filter((story) => matcher.test(fold([story.title, story.excerpt, ...(story.body ?? [])].join(" "))))
    : [];

  return [...new Set([...pinned, ...mentioned])].slice(0, limit);
}

export async function getAssociatedPeople(person: Person): Promise<AssociatedPerson[]> {
  if (person.relatedPeople.length === 0) return [];

  const others = (await getPeople()).filter((other) => other.slug !== person.slug);
  return person.relatedPeople.map((related) => ({
    ...related,
    profile: others.find((other) => sameName(other.name, related.name)),
  }));
}


// PostgREST's "no such table": supabase/schema.sql hasn't been re-run since battles were added.
const MISSING_TABLE = "PGRST205";

/**
 * Every published battle that has a pin, oldest first, with its key people and story already
 * resolved so the map needs nothing else. Empty until the battles table has been created.
 */
export async function getBattles(): Promise<Battle[]> {
  const { data, error } = await createPublicClient()
    .from("battles")
    .select("*")
    .eq("status", "published")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("year", { ascending: true });
  if (error?.code === MISSING_TABLE) {
    console.warn("[battles] The battles table does not exist yet. Run supabase/schema.sql in the Supabase SQL editor.");
    return [];
  }
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as BattleRow[];
  if (rows.length === 0) return [];

  const [people, stories] = await Promise.all([getPeople(), getAllStories()]);

  return rows.map((row) => {
    // Accept a pasted URL or path as well as a bare slug.
    const pinned = (row.story_slug ?? "").split("/").filter(Boolean).pop();
    const name = fold(row.name).trim();
    const story =
      stories.find((candidate) => candidate.slug === pinned) ??
      (name ? stories.find((candidate) => fold(`${candidate.title} ${candidate.excerpt}`).includes(name)) : undefined);

    return {
      slug: row.slug,
      name: row.name,
      period: row.period,
      date: row.date,
      year: row.year,
      location: row.location,
      lat: row.lat as number,
      lng: row.lng as number,
      participants: row.participants,
      summary: row.summary,
      outcome: row.outcome,
      keyPeople: cleanRecords<RelatedPerson>(row.key_people, BATTLE_RECORDS.key_people).map((person) => {
        const profile = people.find((candidate) => sameName(candidate.name, person.name));
        return { ...person, slug: profile?.slug, image: profile?.image };
      }),
      details: cleanRecords<BattleDetail>(row.details, BATTLE_RECORDS.details),
      story: story && { slug: story.slug, title: story.title },
      sources: cleanRecords<Citation>(row.citations, BATTLE_RECORDS.citations),
      image: row.image ?? undefined,
      aiImage: row.ai_image,
    };
  });
}
