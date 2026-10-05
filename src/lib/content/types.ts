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

export interface PersonRow extends BaseRow {
  name: string;
  role: string;
  era: string;
  bio: string | null;
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
