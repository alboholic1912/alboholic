import type { Metadata } from "next";
import type { JSX } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/supabase/dal";
import { countsByStatus, listContent } from "@/lib/content/data";
import { CONTENT_CONFIG } from "@/lib/content/config";
import { CONTENT_TYPES, type ContentType } from "@/lib/content/types";
import { BookIcon, UsersIcon, ClockIcon, PinIcon, BulbIcon, PlusIcon } from "@/components/StudioShell/icons";
import styles from "./studio.module.css";

export const metadata: Metadata = {
  title: "Studio — Alboholic",
  robots: { index: false, follow: false },
};

const TYPE_ICONS: Record<ContentType, () => JSX.Element> = {
  stories: BookIcon,
  people: UsersIcon,
  periods: ClockIcon,
  places: PinIcon,
};

export default async function StudioPage() {
  await requireUser();
  const counts = await countsByStatus();

  const reviewQueues = await Promise.all(
    CONTENT_TYPES.map(async (type) => ({
      type,
      items: (await listContent(type, "review")).slice(0, 5),
    }))
  );
  const pendingReview = reviewQueues.flatMap((q) =>
    q.items.map((item) => ({ type: q.type, item }))
  );

  const totalReview = CONTENT_TYPES.reduce((sum, type) => sum + counts[type].review, 0);
  const totalPublished = CONTENT_TYPES.reduce((sum, type) => sum + counts[type].published, 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.dashHeader}>
        <div>
          <p className={styles.eyebrow}>Overview</p>
          <h1 className={styles.title}>Dashboard</h1>
        </div>
        <div className={styles.quickActions}>
          {CONTENT_TYPES.map((type) => (
            <Link key={type} href={`/kalaja-cabb0da6/${type}/new`} className={styles.quickAction}>
              <PlusIcon />
              {CONTENT_CONFIG[type].label}
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.statGrid}>
        {CONTENT_TYPES.map((type) => {
          const config = CONTENT_CONFIG[type];
          const c = counts[type];
          const total = c.review + c.published;
          const publishedPct = total === 0 ? 0 : Math.round((c.published / total) * 100);
          const Icon = TYPE_ICONS[type];
          return (
            <Link key={type} href={`/kalaja-cabb0da6/${type}`} className={styles.statCard}>
              <div className={styles.statCardTop}>
                <span className={styles.statIcon}>
                  <Icon />
                </span>
                <span className={styles.statCardTitle}>{config.labelPlural}</span>
              </div>
              <div className={styles.statNumbers}>
                <div>
                  <div className={styles.statValue}>{c.review}</div>
                  <div className={styles.statLabel}>In review</div>
                </div>
                <div>
                  <div className={styles.statValue}>{c.published}</div>
                  <div className={styles.statLabel}>Published</div>
                </div>
              </div>
              <div className={styles.statBar}>
                <div className={styles.statBarFill} style={{ width: `${publishedPct}%` }} />
              </div>
            </Link>
          );
        })}

        <Link href="/kalaja-cabb0da6/ideas" className={`${styles.statCard} ${styles.statCardIdeas}`}>
          <div className={styles.statCardTop}>
            <span className={styles.statIcon}>
              <BulbIcon />
            </span>
            <span className={styles.statCardTitle}>Ideas</span>
          </div>
          <p className={styles.statCardText}>Future stories and plans, parked for later.</p>
        </Link>
      </div>

      <div className={styles.panelGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.sectionTitle}>Waiting for review</h2>
            {pendingReview.length > 0 && (
              <span className={styles.panelCount}>{pendingReview.length}</span>
            )}
          </div>
          {pendingReview.length === 0 ? (
            <p className={styles.empty}>Nothing waiting on you right now.</p>
          ) : (
            <div className={styles.list}>
              {pendingReview.map(({ type, item }) => {
                const config = CONTENT_CONFIG[type];
                const Icon = TYPE_ICONS[type];
                const title = String(
                  (item as unknown as Record<string, unknown>)[config.titleField] ?? "Untitled"
                );
                return (
                  <Link
                    key={`${type}-${item.id}`}
                    href={`/kalaja-cabb0da6/${type}/${item.id}`}
                    className={styles.listRow}
                  >
                    <div className={styles.listRowMain}>
                      <span className={styles.listRowIcon}>
                        <Icon />
                      </span>
                      <div>
                        <div className={styles.listRowTitle}>{title}</div>
                        <div className={styles.listRowMeta}>{config.label}</div>
                      </div>
                    </div>
                    <span className={`${styles.badge} ${styles.badgeReview}`}>Review</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.sectionTitle}>Totals</h2>
          </div>
          <div className={styles.totalsList}>
            <div className={styles.totalsRow}>
              <span>In review</span>
              <span className={styles.totalsValue}>{totalReview}</span>
            </div>
            <div className={styles.totalsRow}>
              <span>Published</span>
              <span className={styles.totalsValue}>{totalPublished}</span>
            </div>
            <div className={styles.totalsRow}>
              <span>Content types</span>
              <span className={styles.totalsValue}>{CONTENT_TYPES.length}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
