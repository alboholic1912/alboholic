import SectionHeading from "@/components/SectionHeading/SectionHeading";
import StoryCard from "@/components/StoryCard/StoryCard";
import { getLatestStories } from "@/lib/content/public";
import styles from "./LatestStories.module.css";

export default async function LatestStories() {
  const latestStories = await getLatestStories();

  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeading title="Latest Stories" href="/stories" />
        <div className={styles.grid}>
          {latestStories.map((story) => (
            <StoryCard key={story.slug} story={story} />
          ))}
        </div>
      </div>
    </section>
  );
}
