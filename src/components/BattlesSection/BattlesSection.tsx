import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/BattleMap/icons";
import { regionOf, yearLabel } from "@/components/BattleMap/layout";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import { getBattles } from "@/lib/content/public";
import MapTeaser from "./MapTeaser";
import styles from "./BattlesSection.module.css";

export default async function BattlesSection() {
  const battles = await getBattles();
  if (battles.length === 0) return null;

  // A battle with a photograph makes the better card.
  const featured = battles.find((battle) => battle.image) ?? battles[0];
  const pins = battles.map(({ slug, lat, lng }) => ({ slug, lat, lng, featured: slug === featured.slug }));

  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeading title="Explore the Battles" href="/battles" linkLabel="Open map" marked />

        <div className={styles.panel}>
          <MapTeaser className={styles.map} pins={pins} />

          <div className={styles.intro}>
            <h3 className={styles.title}>Key battles that shaped a nation.</h3>
            <p className={styles.lead}>Explore an interactive map of the most important battles in Albanian history.</p>
            <Link href="/battles" className={styles.cta}>
              Open Battles Map
              <ArrowIcon />
            </Link>
          </div>

          <Link href={`/battles?battle=${featured.slug}`} className={styles.card}>
            <span className={styles.thumb}>
              {featured.image && <Image src={featured.image} alt="" fill sizes="(min-width: 960px) 120px, 96px" />}
            </span>
            <span className={styles.cardBody}>
              <span className={styles.cardName}>{featured.name}</span>
              <span className={styles.cardMeta}>
                {[yearLabel(featured.year) || featured.date, regionOf(featured.location)].filter(Boolean).join(" · ")}
              </span>
              {featured.summary && <span className={styles.cardText}>{featured.summary}</span>}
              <span className={styles.cardLink}>
                View details
                <ArrowIcon size={14} />
              </span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
