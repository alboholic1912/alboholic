import Link from "next/link";
import { ArrowIcon } from "@/components/BattleMap/icons";
import CardRail from "@/components/CardRail/CardRail";
import ImagePlaceholder from "@/components/ImagePlaceholder/ImagePlaceholder";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import { getPeople } from "@/lib/content/public";
import styles from "./PeopleSection.module.css";

const SHOWN = 8;

/** "November 28, 1955 – March 7, 1998" as "1955–1998". An era that is not two plain years is shown as written. */
function years(era: string): string {
  const found = /\bBCE?\b/i.test(era) ? null : era.match(/\b\d{3,4}\b/g);
  return found?.length === 2 ? `${found[0]}–${found[1]}` : era;
}

export default async function PeopleSection() {
  const people = (await getPeople()).slice(0, SHOWN);
  if (people.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeading title="Meet the People" href="/people" linkLabel="View all people" marked />
        <div className={styles.rail}>
          <CardRail label="people">
            {people.map((person) => {
              const tag = person.category ?? person.role;
              return (
                <Link key={person.slug} href={`/people/${person.slug}`} className={styles.tile}>
                  <ImagePlaceholder
                    tone={person.imageTone}
                    aiImage
                    src={person.image}
                    sizes="(min-width: 1200px) 300px, (min-width: 960px) 33vw, (min-width: 640px) 50vw, 64vw"
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
            })}
          </CardRail>
        </div>
      </div>
    </section>
  );
}
