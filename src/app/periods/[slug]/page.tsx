import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BackLink from "@/components/BackLink/BackLink";
import { getPeriodBySlug, periods } from "@/lib/mockData";
import styles from "./period.module.css";

export function generateStaticParams() {
  return periods.map((period) => ({ slug: period.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/periods/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const period = getPeriodBySlug(slug);

  if (!period) {
    return { title: "Period not found — Alboholic" };
  }

  return {
    title: `${period.name} — Alboholic`,
    description: period.description,
  };
}

export default async function PeriodPage({ params }: PageProps<"/periods/[slug]">) {
  const { slug } = await params;
  const period = getPeriodBySlug(slug);

  if (!period) {
    notFound();
  }

  return (
    <div className="container">
      <BackLink href="/periods" label="Back to Periods" />

      <div className={styles.header}>
        <span className={styles.range}>{period.range}</span>
        <h1 className={styles.name}>{period.name}</h1>
      </div>

      <div className={styles.prose}>
        <p>{period.description}</p>
        <p className={styles.placeholder}>
          A full account of the {period.name} is coming soon.
        </p>
      </div>
    </div>
  );
}
