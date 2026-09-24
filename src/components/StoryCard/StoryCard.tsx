import Link from "next/link";
import ImagePlaceholder from "@/components/ImagePlaceholder/ImagePlaceholder";
import type { Story } from "@/lib/mockData";
import styles from "./StoryCard.module.css";

export default function StoryCard({ story }: { story: Story }) {
  return (
    <Link href={`/stories/${story.slug}`} className={styles.card}>
      <div className={styles.media}>
        <ImagePlaceholder tone={story.imageTone} aiImage={story.aiImage} src={story.image} alt={story.title} />
      </div>
      <div className={styles.body}>
        <span className={styles.category}>{story.category}</span>
        <h3 className={styles.title}>{story.title}</h3>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <CalendarIcon />
            {story.date}
          </span>
          <span className={styles.metaItem}>
            <ClockIcon />
            {story.readTime}
          </span>
          <span className={styles.arrow} aria-hidden="true">
            <ArrowIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
