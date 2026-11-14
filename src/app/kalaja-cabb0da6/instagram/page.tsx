import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/supabase/dal";
import { getConnectedAccount, listInstagramPosts } from "@/lib/instagram/data";
import { connectInstagram, disconnectInstagram } from "@/lib/instagram/actions";
import type { InstagramStatus } from "@/lib/instagram/types";
import BackLink from "@/components/BackLink/BackLink";
import SubmitButton from "@/components/SubmitButton/SubmitButton";
import LocalTime from "@/components/Instagram/LocalTime";
import NewPostForm from "@/components/Instagram/NewPostForm";
import PostList from "@/components/Instagram/PostList";
import ig from "@/components/Instagram/Instagram.module.css";
import styles from "../studio.module.css";

export const metadata: Metadata = {
  title: "Instagram — Studio",
  robots: { index: false, follow: false },
};

const FILTERS: { key: InstagramStatus | "all"; label: string }[] = [
  { key: "scheduled", label: "Upcoming" },
  { key: "draft", label: "Drafts" },
  { key: "published", label: "Posted" },
  { key: "failed", label: "Failed" },
  { key: "all", label: "All" },
];

export default async function InstagramPage({ searchParams }: PageProps<"/kalaja-cabb0da6/instagram">) {
  await requireUser();
  const { status: statusParam, error } = await searchParams;
  const filter = FILTERS.find((f) => f.key === statusParam)?.key ?? "scheduled";

  const [posts, account] = await Promise.all([
    listInstagramPosts({ status: filter === "all" ? undefined : filter }),
    getConnectedAccount(),
  ]);

  return (
    <div className={styles.wrap}>
      <div className={styles.backRow}>
        <BackLink href="/kalaja-cabb0da6" label="Studio" />
      </div>

      <div className={styles.toolbar}>
        <h1 className={styles.title}>Instagram</h1>
      </div>

      <div className={styles.form} style={{ maxWidth: 860 }}>
        {typeof error === "string" && <div className={styles.error}>{error}</div>}
        {posts === null && (
          <div className={styles.error}>
            The Instagram tables aren&apos;t set up yet. Run <code>supabase/instagram.sql</code> in the Supabase SQL editor.
          </div>
        )}

        <p className={styles.help}>
          The usual way to make a post is from a story, person or battle: open it and choose the{" "}
          <strong>Prepare Insta Post</strong> tab. Everything scheduled shows up here.
        </p>

        <div className={styles.toolbar} style={{ marginBottom: 0 }}>
          <div className={styles.tabs}>
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={`/kalaja-cabb0da6/instagram?status=${f.key}`}
                className={`${styles.tab} ${filter === f.key ? styles.tabActive : ""}`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        {posts && (posts.length > 0 ? <PostList posts={posts} /> : <p className={styles.empty}>Nothing here yet.</p>)}

        <details className={styles.section}>
          <summary className={styles.sectionTitle} style={{ cursor: "pointer" }}>
            Stand-alone post (not tied to a story, person or battle)
          </summary>
          <NewPostForm />
        </details>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Connected account</div>
          {account ? (
            <>
              <p>
                Posting as <strong>@{account.username || account.igUserId}</strong>.
                {account.expiresAt && (
                  <>
                    {" "}
                    The access token is valid until <LocalTime iso={account.expiresAt} /> and renews itself weekly
                    while the scheduler runs.
                  </>
                )}
              </p>
              <form action={disconnectInstagram}>
                <SubmitButton className={`${styles.button} ${styles.buttonDanger}`} pendingText="Disconnecting…">
                  Disconnect
                </SubmitButton>
              </form>
            </>
          ) : (
            <>
              <ol className={ig.steps}>
                <li>The Instagram account must be a Professional account (Business or Creator). Switch in the Instagram app under Settings → Account type.</li>
                <li>
                  At developers.facebook.com, create an app, add the <strong>Instagram</strong> product and choose
                  &ldquo;API setup with Instagram login&rdquo;.
                </li>
                <li>Under &ldquo;Generate access tokens&rdquo;, add the Alboholic Instagram account and press Generate token. Copy it.</li>
                <li>Paste it below. It is stored only in the database and never shown again.</li>
              </ol>
              <form action={connectInstagram} className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="token">Access token</label>
                  <input id="token" name="token" type="text" autoComplete="off" spellCheck={false} placeholder="IGAA…" />
                </div>
                <div className={styles.actions}>
                  <SubmitButton className={`${styles.button} ${styles.buttonPrimary}`} pendingText="Connecting…">
                    Connect account
                  </SubmitButton>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
