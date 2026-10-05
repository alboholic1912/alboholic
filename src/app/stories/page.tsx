import type { Metadata } from "next";
import PageBanner from "@/components/PageBanner/PageBanner";
import StoriesBrowser from "@/components/StoriesBrowser/StoriesBrowser";
import { getAllStories } from "@/lib/content/public";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Stories — Alboholic",
  description: "Stories from Albanian history, from the ancient Illyrians to modern Albania.",
};

export default async function StoriesPage() {
  const stories = await getAllStories();

  return (
    <>
      <PageBanner
        eyebrow="Stories"
        title="Stories of Albania"
        description="Long-form stories on the people, places and events that shaped Albanian history."
      />

      <div className="container">
        <StoriesBrowser
          stories={stories.map(({ body, ...story }) => ({
            story,
            text: [story.title, story.category, story.excerpt, ...(body ?? [])].join(" "),
          }))}
        />
      </div>
    </>
  );
}
