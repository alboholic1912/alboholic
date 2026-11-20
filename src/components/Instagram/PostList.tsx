import Link from "next/link";
import type { InstagramPostRow } from "@/lib/instagram/types";
import LocalTime from "./LocalTime";
import styles from "./Instagram.module.css";

export function StatusBadge({ status }: { status: InstagramPostRow["status"] }) {
  return <span className={`${styles.status} ${styles[`status_${status}`]}`}>{status}</span>;
}

function when(post: InstagramPostRow) {
  if (post.status === "published" && post.published_at) return <>Posted <LocalTime iso={post.published_at} /></>;
  if (post.status === "scheduled" && post.scheduled_at) return <>Goes live <LocalTime iso={post.scheduled_at} /></>;
  return <>Created <LocalTime iso={post.created_at} /></>;
}

export default function PostList({ posts }: { posts: InstagramPostRow[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {posts.map((post) => {
        const first = post.images[0];
        return (
          <Link key={post.id} href={`/kalaja-cabb0da6/instagram/${post.id}`} className={styles.postRow}>
            {first ? (
              // eslint-disable-next-line @next/next/no-img-element -- small Studio-only thumbnail
              <img src={first.url} alt="" className={styles.postThumb} />
            ) : (
              <span className={styles.postThumb} />
            )}
            <div className={styles.postMain}>
              <div className={styles.postCaption}>{post.caption.split("\n")[0] || "No caption yet"}</div>
              <div className={styles.postMeta}>
                {post.images.length} image{post.images.length === 1 ? "" : "s"} · {when(post)}
              </div>
              {post.status === "failed" && post.error && (
                <div className={styles.postMeta} style={{ color: "var(--color-accent-bright)" }}>
                  {post.error}
                </div>
              )}
            </div>
            <StatusBadge status={post.status} />
          </Link>
        );
      })}
    </div>
  );
}

export function ContentTabs({ type, id, active }: { type: string; id: string; active: "edit" | "instagram" }) {
  const base = `/kalaja-cabb0da6/${type}/${id}`;
  return (
    <nav className={styles.contentTabs} aria-label="Sections">
      <Link
        href={base}
        className={active === "edit" ? styles.contentTabActive : styles.contentTab}
        aria-current={active === "edit" ? "page" : undefined}
      >
        Edit
      </Link>
      <Link
        href={`${base}/instagram`}
        className={active === "instagram" ? styles.contentTabActive : styles.contentTab}
        aria-current={active === "instagram" ? "page" : undefined}
      >
        Prepare Insta Post
      </Link>
    </nav>
  );
}
