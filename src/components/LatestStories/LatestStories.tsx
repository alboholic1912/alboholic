import SectionHeading from "@/components/SectionHeading/SectionHeading";
import StoryCard from "@/components/StoryCard/StoryCard";
import { latestStories } from "@/lib/mockData";
import styles from "./LatestStories.module.css";

export default function LatestStories() {
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
