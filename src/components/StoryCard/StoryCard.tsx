import Link from "next/link";
import ImagePlaceholder from "@/components/ImagePlaceholder/ImagePlaceholder";
import type { Story } from "@/lib/content/public";
import { formatDate } from "@/lib/content/text";
import styles from "./StoryCard.module.css";

// How wide the picture is drawn, so each screen gets a file that fits it.
// Compact cards sit in CardRail: 78% wide on a phone, then 2, 3 and 4 across.
const RAIL_SIZES =
  "(min-width: 1200px) 290px, (min-width: 960px) calc((100vw - 128px) / 3), (min-width: 640px) calc((100vw - 48px) / 2), 78vw";
// Full cards sit in the Stories grid: 1 column on a phone, 2 on a tablet, 3 on desktop.
const GRID_SIZES =
  "(min-width: 1240px) 366px, (min-width: 960px) calc((100vw - 144px) / 3), (min-width: 640px) calc((100vw - 48px) / 2), calc(100vw - 32px)";

export default function StoryCard({
  story,
  compact = false,
  eager = false,
}: {
  story: Story;
  /** A tighter card for a row of four: the title is cut at two lines. */
  compact?: boolean;
  /** Load the picture straight away, for the first cards on screen. */
  eager?: boolean;
}) {
  return (
    <Link href={`/stories/${story.slug}`} className={[styles.card, compact && styles.compact].filter(Boolean).join(" ")}>
      <div className={styles.media}>
        <ImagePlaceholder
          tone={story.imageTone}
          aiImage={story.aiImage}
          src={story.image}
          alt={story.title}
          sizes={compact ? RAIL_SIZES : GRID_SIZES}
          eager={eager}
        />
      </div>
      <div className={styles.body}>
        <span className={styles.category}>{story.category}</span>
        <h3 className={styles.title}>{story.title}</h3>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <CalendarIcon />
            {formatDate(story.date)}
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
