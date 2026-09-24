import Link from "next/link";
import ImagePlaceholder from "@/components/ImagePlaceholder/ImagePlaceholder";
import type { Person } from "@/lib/mockData";
import styles from "./PersonCard.module.css";

export default function PersonCard({ person }: { person: Person }) {
  return (
    <Link href={`/people/${person.slug}`} className={styles.card}>
      <div className={styles.media}>
        <ImagePlaceholder tone={person.imageTone} aiImage src={person.image} alt={person.name} />
      </div>
      <span className={styles.name}>{person.name}</span>
      <span className={styles.role}>{person.role}</span>
      <span className={styles.era}>{person.era}</span>
      {person.bio && <p className={styles.bio}>{person.bio}</p>}
    </Link>
  );
}
