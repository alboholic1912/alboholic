import Image from "next/image";
import Link from "next/link";
import { regionOf } from "@/components/BattleMap/layout";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import { getBattles } from "@/lib/content/public";
import styles from "./BattlesSection.module.css";

const SHOWN = 4;

export default async function BattlesSection() {
  const battles = await getBattles();
  // Battles with a photograph make the better cards, so they go first.
  const shown = [...battles.filter((battle) => battle.image), ...battles.filter((battle) => !battle.image)].slice(0, SHOWN);
  if (shown.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeading title="Explore the Battles" href="/battles" linkLabel="Open map" />
        <div className={styles.row}>
          {shown.map((battle) => (
            <Link key={battle.slug} href={`/battles?battle=${battle.slug}`} className={styles.card}>
              <div className={styles.media}>
                {battle.image && (
                  <Image
                    src={battle.image}
                    alt={battle.name}
                    fill
                    sizes="(min-width: 1200px) 25vw, (min-width: 640px) 50vw, 78vw"
                  />
                )}
                {battle.period && <span className={styles.tag}>{battle.period}</span>}
              </div>
              <div className={styles.body}>
                <h3 className={styles.name}>{battle.name}</h3>
                <span className={styles.meta}>{[battle.date, regionOf(battle.location)].filter(Boolean).join(" · ")}</span>
                {battle.summary && <p className={styles.blurb}>{battle.summary}</p>}
                <span className={styles.cta}>
                  View on Map
                  <ArrowIcon />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
