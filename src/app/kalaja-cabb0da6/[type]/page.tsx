import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/dal";
import { listContent } from "@/lib/content/data";
import { CONTENT_CONFIG } from "@/lib/content/config";
import { isContentType, type Status } from "@/lib/content/types";
import BackLink from "@/components/BackLink/BackLink";
import styles from "../studio.module.css";

export async function generateMetadata({
  params,
}: PageProps<"/kalaja-cabb0da6/[type]">): Promise<Metadata> {
  const { type } = await params;
  const config = isContentType(type) ? CONTENT_CONFIG[type] : null;
  return {
    title: config ? `${config.labelPlural} — Studio` : "Studio",
    robots: { index: false, follow: false },
  };
}

export default async function ContentListPage({
  params,
  searchParams,
}: PageProps<"/kalaja-cabb0da6/[type]">) {
  await requireUser();

  const { type } = await params;
  if (!isContentType(type)) notFound();
  const config = CONTENT_CONFIG[type];

  const { status: statusParam } = await searchParams;
  const status = statusParam === "published" ? "published" : statusParam === "all" ? undefined : "review";

  const items = await listContent(type, status as Status | undefined);

  return (
    <div className={styles.wrap}>
      <div className={styles.backRow}>
        <BackLink href="/kalaja-cabb0da6" label="Studio" />
      </div>

      <div className={styles.toolbar}>
        <h1 className={styles.title}>{config.labelPlural}</h1>
        <Link href={`/kalaja-cabb0da6/${type}/new`} className={`${styles.button} ${styles.buttonPrimary}`}>
          Generate new
        </Link>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <Link
            href={`/kalaja-cabb0da6/${type}?status=review`}
            className={`${styles.tab} ${status === "review" ? styles.tabActive : ""}`}
          >
            In review
          </Link>
          <Link
            href={`/kalaja-cabb0da6/${type}?status=published`}
            className={`${styles.tab} ${status === "published" ? styles.tabActive : ""}`}
          >
            Published
          </Link>
          <Link
            href={`/kalaja-cabb0da6/${type}?status=all`}
            className={`${styles.tab} ${status === undefined ? styles.tabActive : ""}`}
          >
            All
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>Nothing here yet.</p>
      ) : (
        <div className={styles.list}>
          {items.map((item) => {
            const record = item as unknown as Record<string, unknown>;
            const title = String(record[config.titleField] ?? "Untitled");
            return (
              <Link
                key={item.id}
                href={`/kalaja-cabb0da6/${type}/${item.id}`}
                className={styles.listRow}
              >
                <div>
                  <div className={styles.listRowTitle}>{title}</div>
                  <div className={styles.listRowMeta}>/{item.slug}</div>
                </div>
                <span
                  className={`${styles.badge} ${
                    item.status === "published" ? styles.badgePublished : styles.badgeReview
                  }`}
                >
                  {item.status}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
