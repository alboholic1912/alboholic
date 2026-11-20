import Link from "next/link";
import { ArrowIcon } from "@/components/BattleMap/icons";
import styles from "./JoinStrip.module.css";

/** The invitation to subscribe that closes the home page. Sign-up itself lives on /subscribe. */
export default function JoinStrip() {
  return (
    <section className={styles.strip}>
      <div className={styles.art} aria-hidden="true" />
      <div className={`container ${styles.inner}`}>
        <div className={styles.text}>
          <h2 className={styles.title}>Join Alboholic</h2>
          <p className={styles.lead}>Get new stories, people and battles straight to your inbox.</p>
        </div>
        <Link href="/subscribe" className={styles.button}>
          Subscribe
          <ArrowIcon />
        </Link>
      </div>
    </section>
  );
}
