export type ContentType = "stories" | "people";

export const CONTENT_TYPES: ContentType[] = ["stories", "people"];

export function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as string[]).includes(value);
}

export type Status = "review" | "published";

export type ImageTone = "crimson" | "amber" | "stone" | "slate";

export type SourceRecord =
  | { kind: "text"; label: string; preview: string }
  | { kind: "youtube"; url: string }
  | { kind: "file"; name: string; mimeType: string };

interface BaseRow {
  id: string;
  slug: string;
  status: Status;
  sources: SourceRecord[];
  created_at: string;
  updated_at: string;
}

export interface StoryRow extends BaseRow {
  category: string;
  title: string;
  excerpt: string;
  body: string[];
  date: string;
  read_time: string;
  image_tone: ImageTone;
  image: string | null;
  ai_image: boolean;
  credit: string | null;
  featured: boolean;
}

export const PERSON_CATEGORIES = ["Freedom Fighter", "Leader", "Scholar", "Cultural Figure"] as const;

export const PRONOUNS = ["he", "she", "they"] as const;
export type Pronoun = (typeof PRONOUNS)[number];

/** One "At a glance" field, e.g. Born / 1962 / Turiçicë. */
export interface PersonFact {
  label: string;
  value: string;
  detail: string;
}

/** One "Why they matter" point. */
export interface PersonSignificance {
  title: string;
  text: string;
}

/** One "Key moments" timeline entry. */
export interface PersonMoment {
  date: string;
  title: string;
  text: string;
}

export interface RelatedPerson {
  name: string;
  role: string;
}

export interface RelatedPlace {
  name: string;
  kind: string;
}

export const CITATION_TYPES = [
  "book",
  "archive",
  "academic",
  "website",
  "document",
  "institution",
  "other",
] as const;
export type CitationType = (typeof CITATION_TYPES)[number];

/** A public reference shown under "Sources" (unlike `sources`, which records the Studio's generation inputs). */
export interface Citation {
  type: CitationType;
  title: string;
  detail: string;
  url: string;
}

export interface PersonRow extends BaseRow {
  name: string;
  category: string;
  role: string;
  era: string;
  pronoun: Pronoun;
  birthplace: string;
  known_for: string;
  /** The 2–3 sentence profile introduction. */
  bio: string | null;
  facts: PersonFact[];
  significance: PersonSignificance[];
  timeline: PersonMoment[];
  related_stories: string[];
  related_people: RelatedPerson[];
  related_places: RelatedPlace[];
  citations: Citation[];
  image: string | null;
  image_tone: ImageTone;
}

export type ContentRow<T extends ContentType> = T extends "stories"
  ? StoryRow
  : PersonRow;

export interface IdeaRow {
  id: string;
  title: string;
  notes: string;
  status: "idea" | "planned" | "archived";
  created_at: string;
  updated_at: string;
}
