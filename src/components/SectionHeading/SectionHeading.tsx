import Link from "next/link";
import styles from "./SectionHeading.module.css";

export default function SectionHeading({
  title,
  href,
  linkLabel = "View all",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className={styles.root}>
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
