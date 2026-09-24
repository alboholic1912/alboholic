import Link from "next/link";
import ImagePlaceholder from "@/components/ImagePlaceholder/ImagePlaceholder";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import { people } from "@/lib/mockData";
import styles from "./PeopleSection.module.css";

export default function PeopleSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeading title="Meet the People" href="/people" />
        <div className={styles.row}>
          {people.map((person) => (
            <Link key={person.slug} href={`/people/${person.slug}`} className={styles.card}>
              <div className={styles.media}>
                <ImagePlaceholder tone={person.imageTone} aiImage src={person.image} alt={person.name} />
              </div>
              <span className={styles.name}>{person.name}</span>
              <span className={styles.role}>{person.role}</span>
              <span className={styles.era}>{person.era}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
