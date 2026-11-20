import CardRail from "@/components/CardRail/CardRail";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import StoryCard from "@/components/StoryCard/StoryCard";
import { getLatestStories } from "@/lib/content/public";
import styles from "./LatestStories.module.css";

export default async function LatestStories() {
  const latestStories = await getLatestStories();
  if (latestStories.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeading title="Latest Stories" href="/stories" linkLabel="View all stories" marked />
        <CardRail label="stories">
          {latestStories.map((story) => (
            <StoryCard key={story.slug} story={story} compact />
          ))}
        </CardRail>
      </div>
    </section>
  );
}
