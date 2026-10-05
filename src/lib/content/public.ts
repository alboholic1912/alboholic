import { createPublicClient } from "@/lib/supabase/public";
import { PERSON_RECORDS } from "./config";
import { cleanRecords } from "./records";
import {
  PRONOUNS,
  type Citation,
  type PersonFact,
  type PersonMoment,
  type PersonRow,
  type PersonSignificance,
  type Pronoun,
  type RelatedPerson,
  type RelatedPlace,
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

/** Lowercases and strips diacritics, so "Skënderbeu" and "Skenderbeu" compare equal. */
function fold(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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

