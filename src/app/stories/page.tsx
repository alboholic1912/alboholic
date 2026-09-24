import type { Metadata } from "next";
import PageIntro from "@/components/PageIntro/PageIntro";
import StoryCard from "@/components/StoryCard/StoryCard";
import { getAllStories } from "@/lib/content/public";
import styles from "./stories.module.css";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Stories — Alboholic",
  description: "Stories from Albanian history, from the ancient Illyrians to modern Albania.",
};

export default async function StoriesPage() {
  const stories = await getAllStories();

  return (
    <div className="container">
      <PageIntro
        eyebrow="Explore"
        title="Stories"
        description="Long-form stories on the people, places and events that shaped Albanian history."
      />
      <div className={styles.grid}>
        {stories.map((story) => (
          <StoryCard key={story.slug} story={story} />
        ))}
      </div>
    </div>
  );
}
