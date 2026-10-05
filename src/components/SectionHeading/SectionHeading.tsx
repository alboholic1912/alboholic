import Link from "next/link";
import styles from "./SectionHeading.module.css";

export default function SectionHeading({
  title,
  href,
  linkLabel = "View all",
  compact = false,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  /** A smaller heading, for secondary sections that sit side by side. */
  compact?: boolean;
}) {
  return (
    <div className={[styles.root, compact && styles.compact].filter(Boolean).join(" ")}>
      <h2 className={styles.title}>{title}</h2>
      {href && (
        <Link href={href} className={styles.link}>
          {linkLabel}
          <ArrowIcon />
        </Link>
      )}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
