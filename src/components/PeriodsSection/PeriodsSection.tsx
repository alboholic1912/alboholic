import Link from "next/link";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import { periods } from "@/lib/mockData";
import styles from "./PeriodsSection.module.css";

export default function PeriodsSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeading title="Explore by Period" href="/periods" />
        <div className={styles.grid}>
          {periods.map((period) => (
            <Link key={period.slug} href={`/periods/${period.slug}`} className={styles.card}>
              <span className={styles.range}>{period.range}</span>
              <h3 className={styles.name}>{period.name}</h3>
              <p className={styles.description}>{period.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
