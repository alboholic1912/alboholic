import PersonCard from "@/components/PersonCard/PersonCard";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import { getPeople } from "@/lib/content/public";
import styles from "./PeopleSection.module.css";

const SHOWN = 4;

export default async function PeopleSection() {
  const people = (await getPeople()).slice(0, SHOWN);
  if (people.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeading title="Meet the People" href="/people" />
        <div className={styles.row}>
          {people.map((person) => (
            <PersonCard key={person.slug} person={person} />
          ))}
        </div>
      </div>
    </section>
  );
}
