import { Mrs_Saint_Delafield } from "next/font/google";
import { getImageProps } from "next/image";
import Link from "next/link";
import { ArrowIcon, PinIcon } from "@/components/BattleMap/icons";
import styles from "./Hero.module.css";

// Only the handwritten line uses this face, so it loads with the hero rather than site-wide.
const script = Mrs_Saint_Delafield({ subsets: ["latin"], weight: "400" });

/** The span of history the site covers, oldest first. A backdrop, not navigation: there are no period pages. */
const ERAS = ["Ancient Illyrians", "Medieval Era", "Ottoman Period", "Independence", "20th Century", "Kosovo War"];

/**
 * The artwork comes in two compositions, so a phone gets the fortress and its flag rather than a
 * sliver of the wide scene. Both are drawn by scripts/home-art/render.mjs.
 */
function artwork() {
  const shared = { alt: "", quality: 90, loading: "eager", fetchPriority: "high" } as const;
  // Each is cropped to cover the hero, so it is drawn wider than the screen is.
  const wide = getImageProps({ ...shared, src: "/home/hero.webp", width: 2880, height: 1440, sizes: "(min-width: 1440px) 100vw, 1440px" });
  const tall = getImageProps({ ...shared, src: "/home/hero-phone.webp", width: 1440, height: 1920, sizes: "140vw" });
  return { wide: wide.props, tall: tall.props };
}

export default function Hero() {
  const { wide, tall } = artwork();

  return (
    <section className={styles.hero}>
      <picture>
        <source media="(min-width: 700px)" srcSet={wide.srcSet} sizes={wide.sizes} />
        <img {...tall} alt="" className={styles.art} />
      </picture>

      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>History lives here</span>
          <h1 className={styles.title}>
            <span>Real stories</span> <span>from a nation</span> <span>that never</span> <span>stopped resisting.</span>
          </h1>
          <p className={styles.lead}>
            Alboholic brings you the people, battles and defining moments of Albanian history — from ancient roots to
            the modern era.
          </p>
          <div className={styles.actions}>
            <Link href="/stories" className={styles.primary}>
              Explore the Stories
              <ArrowIcon />
            </Link>
            <Link href="/battles" className={styles.secondary}>
              <span className={styles.ring}>
                <PinIcon size={20} />
              </span>
              <span className={styles.secondaryText}>
                <span>Battles Map</span>
                <span>Explore by place</span>
              </span>
            </Link>
          </div>
        </div>

        <ol className={styles.eras} aria-label="The eras covered, oldest first">
          {ERAS.map((era, index) => (
            <li key={era} className={index === ERAS.length - 1 ? styles.latest : undefined}>
              {era}
            </li>
          ))}
        </ol>

        <p className={`${styles.script} ${script.className}`}>
          A small nation
          <br />
          with a vast history.
        </p>
      </div>
    </section>
  );
}
