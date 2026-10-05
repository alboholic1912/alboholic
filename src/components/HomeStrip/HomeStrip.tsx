import Link from "next/link";
import { BookIcon, LandmarkIcon, PeopleIcon, VersusIcon } from "@/components/BattleMap/icons";
import styles from "./HomeStrip.module.css";

const ITEMS = [
  { href: "/stories", icon: BookIcon, title: "Stories", text: "Real events, carefully researched" },
  { href: "/people", icon: PeopleIcon, title: "People", text: "Leaders, fighters, thinkers" },
  { href: "/battles", icon: VersusIcon, title: "Battles", text: "Explore Albania’s key battles" },
  { href: "/about", icon: LandmarkIcon, title: "A Nation", text: "One of Europe’s oldest cultures" },
];

/** What the site holds, in one band under the hero. Each entry leads to its section. */
export default function HomeStrip() {
  return (
    <nav className={styles.strip} aria-label="Explore Alboholic">
      <ul className={`container ${styles.list}`}>
        {ITEMS.map(({ href, icon: Icon, title, text }) => (
          <li key={href}>
            <Link href={href} className={styles.item}>
              <span className={styles.icon}>
                <Icon size={28} />
              </span>
              <span className={styles.text}>
                <span className={styles.title}>{title}</span>
                <span className={styles.sub}>{text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
