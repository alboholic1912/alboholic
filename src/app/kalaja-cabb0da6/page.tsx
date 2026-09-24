import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/supabase/dal";
import { countsByStatus, listContent } from "@/lib/content/data";
import { CONTENT_CONFIG } from "@/lib/content/config";
import { CONTENT_TYPES } from "@/lib/content/types";
import { signOut } from "./actions";
import styles from "./studio.module.css";

export const metadata: Metadata = {
  title: "Studio — Alboholic",
  robots: { index: false, follow: false },
};

export default async function StudioPage() {
  const user = await requireUser();
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

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Studio</h1>
          <p className={styles.meta}>Signed in as {user.email}</p>
        </div>
        <form action={signOut}>
          <button className={styles.signOut} type="submit">
            Sign out
          </button>
        </form>
      </div>

      <div className={styles.grid}>
        {CONTENT_TYPES.map((type) => {
          const config = CONTENT_CONFIG[type];
          const c = counts[type];
          return (
            <Link key={type} href={`/kalaja-cabb0da6/${type}`} className={styles.cardLink}>
              <div className={styles.card}>
                <h2>{config.labelPlural}</h2>
                <div className={styles.counts}>
                  <div>
                    <div className={styles.count}>{c.review}</div>
                    <div className={styles.countLabel}>In review</div>
                  </div>
                  <div>
                    <div className={styles.count}>{c.published}</div>
                    <div className={styles.countLabel}>Published</div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        <Link href="/kalaja-cabb0da6/ideas" className={styles.cardLink}>
          <div className={styles.card}>
            <h2>Ideas</h2>
            <p>Future stories and plans, parked for later.</p>
          </div>
        </Link>
      </div>

      <div style={{ marginTop: "var(--space-8)" }}>
        <h2 className={styles.sectionTitle} style={{ marginBottom: "var(--space-4)" }}>
          Waiting for review
        </h2>
        {pendingReview.length === 0 ? (
          <p className={styles.empty}>Nothing waiting on you right now.</p>
        ) : (
          <div className={styles.list}>
            {pendingReview.map(({ type, item }) => {
              const config = CONTENT_CONFIG[type];
              const title = String(
                (item as unknown as Record<string, unknown>)[config.titleField] ?? "Untitled"
              );
              return (
                <Link
                  key={`${type}-${item.id}`}
                  href={`/kalaja-cabb0da6/${type}/${item.id}`}
                  className={styles.listRow}
                >
                  <div>
                    <div className={styles.listRowTitle}>{title}</div>
                    <div className={styles.listRowMeta}>{config.label}</div>
                  </div>
                  <span className={`${styles.badge} ${styles.badgeReview}`}>Review</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
