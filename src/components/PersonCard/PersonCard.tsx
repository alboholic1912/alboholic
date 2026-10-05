import Link from "next/link";
import { ArrowIcon } from "@/components/BattleMap/icons";
import ImagePlaceholder from "@/components/ImagePlaceholder/ImagePlaceholder";
import type { Person } from "@/lib/content/public";
import styles from "./PersonCard.module.css";

/** "November 28, 1955 – March 7, 1998" as "1955–1998". An era that is not two plain years is shown as written. */
function years(era: string): string {
  const found = /\bBCE?\b/i.test(era) ? null : era.match(/\b\d{3,4}\b/g);
  return found?.length === 2 ? `${found[0]}–${found[1]}` : era;
}

export default function PersonCard({ person, layout = "grid" }: { person: Person; layout?: "grid" | "list" }) {
  const tag = person.category ?? person.role;

  return (
    <Link href={`/people/${person.slug}`} className={[styles.tile, layout === "list" && styles.list].filter(Boolean).join(" ")}>
      <ImagePlaceholder
        tone={person.imageTone}
        aiImage
        src={person.image}
        alt={person.name}
        sizes="(min-width: 1200px) 300px, (min-width: 960px) 33vw, (min-width: 640px) 50vw, 100vw"
      />
      <span className={styles.caption}>
        <span className={styles.name}>{person.name}</span>
        <span className={styles.meta}>
          {tag && <span className={styles.tag}>{tag}</span>}
          {person.era && <span className={styles.years}>{years(person.era)}</span>}
        </span>
      </span>
      <span className={styles.go} aria-hidden="true">
        <ArrowIcon size={15} />
      </span>
    </Link>
  );
}
