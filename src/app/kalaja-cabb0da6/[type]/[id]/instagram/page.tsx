import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/dal";
import { getContentById } from "@/lib/content/data";
import { CONTENT_CONFIG } from "@/lib/content/config";
import { isContentType } from "@/lib/content/types";
import { getConnectedAccount, listInstagramPosts } from "@/lib/instagram/data";
import BackLink from "@/components/BackLink/BackLink";
import NewPostForm from "@/components/Instagram/NewPostForm";
import PostList, { ContentTabs } from "@/components/Instagram/PostList";
import Link from "next/link";
import styles from "../../../studio.module.css";

export const metadata: Metadata = {
  title: "Instagram — Studio",
  robots: { index: false, follow: false },
};

export default async function ContentInstagramPage({
  params,
  searchParams,
}: PageProps<"/kalaja-cabb0da6/[type]/[id]/instagram">) {
  await requireUser();

  const { type, id } = await params;
  if (!isContentType(type)) notFound();
  const config = CONTENT_CONFIG[type];
  const { error } = await searchParams;

  const item = await getContentById(type, id);
  if (!item) notFound();
  const record = item as unknown as Record<string, unknown>;

  const [posts, account] = await Promise.all([
    listInstagramPosts({ contentType: type, contentId: id }),
    getConnectedAccount(),
  ]);

  return (
    <div className={styles.wrap}>
      <div className={styles.backRow}>
        <BackLink href={`/kalaja-cabb0da6/${type}`} label={config.labelPlural} />
      </div>

      <div className={styles.toolbar}>
        <h1 className={styles.title}>{String(record[config.titleField] ?? "Untitled")}</h1>
      </div>

      <ContentTabs type={type} id={id} active="instagram" />

      <div className={styles.form}>
        {posts === null && (
          <div className={styles.error}>
            The Instagram tables aren&apos;t set up yet. Run <code>supabase/instagram.sql</code> in the Supabase SQL editor.
          </div>
        )}
        {!account && posts !== null && (
          <div className={styles.error}>
            No Instagram account is connected yet. You can prepare posts now;{" "}
            <Link href="/kalaja-cabb0da6/instagram">connect the account</Link> before scheduling.
          </div>
        )}
        {typeof error === "string" && <div className={styles.error}>{error}</div>}

        <NewPostForm
          type={type}
          contentId={id}
          featuredImage={typeof record.image === "string" && record.image ? record.image : null}
        />

        {posts && posts.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Posts for this {config.label.toLowerCase()}</div>
            <PostList posts={posts} />
          </div>
        )}
      </div>
    </div>
  );
}
