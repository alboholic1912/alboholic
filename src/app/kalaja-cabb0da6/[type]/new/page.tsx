import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/dal";
import { generateContent } from "@/lib/content/actions";
import { CONTENT_CONFIG } from "@/lib/content/config";
import { isContentType } from "@/lib/content/types";
import BackLink from "@/components/BackLink/BackLink";
import styles from "../../studio.module.css";

export async function generateMetadata({
  params,
}: PageProps<"/kalaja-cabb0da6/[type]/new">): Promise<Metadata> {
  const { type } = await params;
  const config = isContentType(type) ? CONTENT_CONFIG[type] : null;
  return {
    title: config ? `Generate ${config.label} — Studio` : "Studio",
    robots: { index: false, follow: false },
  };
}

export default async function NewContentPage({
  params,
}: PageProps<"/kalaja-cabb0da6/[type]/new">) {
  await requireUser();

  const { type } = await params;
  if (!isContentType(type)) notFound();
  const config = CONTENT_CONFIG[type];

  return (
    <div className={styles.wrap}>
      <div className={styles.backRow}>
        <BackLink href={`/kalaja-cabb0da6/${type}`} label={config.labelPlural} />
      </div>

      <h1 className={styles.title} style={{ marginBottom: "var(--space-6)" }}>
        Generate a new {config.label.toLowerCase()}
      </h1>

      <form action={generateContent} className={styles.form}>
        <input type="hidden" name="type" value={type} />

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Sources</div>
          <p className={styles.help}>
            The AI will use only what you give it here — books, papers, notes, PDFs, and YouTube
            videos. It will not invent facts that aren&apos;t in these sources.
          </p>

          <div className={styles.field}>
            <label htmlFor="rawText">Raw text / notes / excerpts</label>
            <textarea id="rawText" name="rawText" rows={8} placeholder="Paste text from books, papers, or your own notes here..." />
          </div>

          <div className={styles.field}>
            <label htmlFor="youtubeUrls">YouTube URLs</label>
            <textarea
              id="youtubeUrls"
              name="youtubeUrls"
              rows={3}
              placeholder={"One per line, e.g.\nhttps://www.youtube.com/watch?v=..."}
            />
            <span className={styles.help}>The AI watches the full video — one URL per line.</span>
          </div>

          <div className={styles.field}>
            <label htmlFor="files">PDFs / documents</label>
            <input id="files" name="files" type="file" accept=".pdf,.txt,application/pdf,text/plain" multiple />
          </div>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`}>
            Generate {config.label.toLowerCase()}
          </button>
        </div>
        <p className={styles.help}>This can take up to a minute, especially with video sources.</p>
      </form>
    </div>
  );
}
