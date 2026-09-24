import { createPublicClient } from "@/lib/supabase/public";
import type { StoryRow, PersonRow, PeriodRow, PlaceRow } from "./types";

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

export type Person = {
  slug: string;
  name: string;
  role: string;
  era: string;
  imageTone: "crimson" | "amber" | "stone" | "slate";
  bio?: string;
  image?: string;
};

export type Period = {
  slug: string;
  name: string;
  range: string;
  description: string;
};

export type Place = {
  slug: string;
  name: string;
  region: string;
  description: string;
  imageTone: "crimson" | "amber" | "stone" | "slate";
  image?: string;
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
    credit: row.credit ?? undefined,
    body: row.body?.length ? row.body : undefined,
    image: row.image ?? undefined,
  };
}

function toPerson(row: PersonRow): Person {
  return {
    slug: row.slug,
    name: row.name,
    role: row.role,
    era: row.era,
    imageTone: row.image_tone,
    bio: row.bio ?? undefined,
    image: row.image ?? undefined,
  };
}

function toPeriod(row: PeriodRow): Period {
  return {
    slug: row.slug,
    name: row.name,
    range: row.range,
    description: row.description,
  };
}

function toPlace(row: PlaceRow): Place {
  return {
    slug: row.slug,
    name: row.name,
    region: row.region,
    description: row.description,
    imageTone: row.image_tone,
    image: row.image ?? undefined,
  };
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

export async function getPeriods(): Promise<Period[]> {
  const { data, error } = await createPublicClient()
    .from("periods")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as PeriodRow[]).map(toPeriod);
}

export async function getPeriodBySlug(slug: string): Promise<Period | undefined> {
  const { data, error } = await createPublicClient()
    .from("periods")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toPeriod(data as PeriodRow) : undefined;
}

export async function getPlaces(): Promise<Place[]> {
  const { data, error } = await createPublicClient()
    .from("places")
    .select("*")
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as PlaceRow[]).map(toPlace);
}

export async function getPlaceBySlug(slug: string): Promise<Place | undefined> {
  const { data, error } = await createPublicClient()
    .from("places")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toPlace(data as PlaceRow) : undefined;
}
