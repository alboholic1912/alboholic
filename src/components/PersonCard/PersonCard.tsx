import Link from "next/link";
import ImagePlaceholder from "@/components/ImagePlaceholder/ImagePlaceholder";
import type { Person } from "@/lib/content/public";
import styles from "./PersonCard.module.css";

export default function PersonCard({ person, layout = "grid" }: { person: Person; layout?: "grid" | "list" }) {
  const blurb = person.knownFor ?? person.summary;
  const tag = person.category ?? person.role;

  return (
    <Link href={`/people/${person.slug}`} className={[styles.card, layout === "list" && styles.list].filter(Boolean).join(" ")}>
      <div className={styles.media}>
        <ImagePlaceholder
          tone={person.imageTone}
          aiImage
          src={person.image}
          alt={person.name}
          sizes="(min-width: 960px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
        {tag && <span className={styles.tag}>{tag}</span>}
      </div>
      <div className={styles.body}>
        <h2 className={styles.name}>{person.name}</h2>
        {person.era && <span className={styles.era}>{person.era}</span>}
        {blurb && <p className={styles.blurb}>{blurb}</p>}
        <span className={styles.cta}>
          View Profile
          <ArrowIcon />
        </span>
      </div>
    </Link>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
