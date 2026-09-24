import type { Metadata } from "next";
import PageIntro from "@/components/PageIntro/PageIntro";
import PeriodCard from "@/components/PeriodCard/PeriodCard";
import { getPeriods } from "@/lib/content/public";
import styles from "./periods.module.css";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Periods — Alboholic",
  description: "Albanian history organized by era, from the ancient Illyrians to modern Albania.",
};

export default async function PeriodsPage() {
  const periods = await getPeriods();

  return (
    <div className="container">
      <PageIntro
        eyebrow="Explore"
        title="Periods"
        description="Trace Albanian history era by era, from the ancient Illyrians to the present day."
      />
      <div className={styles.grid}>
        {periods.map((period) => (
          <PeriodCard key={period.slug} period={period} />
        ))}
      </div>
    </div>
  );
}
