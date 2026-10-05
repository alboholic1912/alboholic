import { createPublicClient } from "@/lib/supabase/public";
import type { StoryRow, PersonRow } from "./types";

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

