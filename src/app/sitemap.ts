import type { MetadataRoute } from "next";
import { getAllStories, getPeople } from "@/lib/content/public";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

const STATIC_PATHS = ["/", "/stories", "/people", "/battles", "/about", "/sources", "/contact", "/subscribe", "/privacy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stories, people] = await Promise.all([getAllStories(), getPeople()]);

  return [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path === "/" ? "" : path}` })),
    ...stories.map((story) => ({ url: `${SITE_URL}/stories/${story.slug}`, lastModified: story.date })),
    ...people.map((person) => ({ url: `${SITE_URL}/people/${person.slug}` })),
  ];
}
