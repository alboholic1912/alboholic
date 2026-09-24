import Link from "next/link";
import type { Period } from "@/lib/mockData";
import styles from "./PeriodCard.module.css";

export default function PeriodCard({ period }: { period: Period }) {
  return (
    <Link href={`/periods/${period.slug}`} className={styles.card}>
      <span className={styles.range}>{period.range}</span>
      <h3 className={styles.name}>{period.name}</h3>
      <p className={styles.description}>{period.description}</p>
    </Link>
  );
}
