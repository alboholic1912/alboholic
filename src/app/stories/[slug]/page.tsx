import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BackLink from "@/components/BackLink/BackLink";
import ImagePlaceholder from "@/components/ImagePlaceholder/ImagePlaceholder";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import StoryCard from "@/components/StoryCard/StoryCard";
import { getAllStories, getStoryBySlug } from "@/lib/mockData";
import styles from "./story.module.css";

export function generateStaticParams() {
  return getAllStories().map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/stories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const story = getStoryBySlug(slug);

  if (!story) {
    return { title: "Story not found — Alboholic" };
  }

  return {
    title: `${story.title} — Alboholic`,
    description: story.excerpt,
  };
}

export default async function StoryPage({ params }: PageProps<"/stories/[slug]">) {
  const { slug } = await params;
  const story = getStoryBySlug(slug);

  if (!story) {
    notFound();
  }

  const related = getAllStories()
    .filter((item) => item.slug !== story.slug)
    .slice(0, 3);

  return (
    <article>
      <div className="container">
        <BackLink href="/stories" label="Back to Stories" />

        <div className={styles.media}>
          <ImagePlaceholder tone={story.imageTone} aiImage={story.aiImage} src={story.image} alt={story.title} />
          {story.credit && <span className={styles.credit}>{story.credit}</span>}
        </div>

        <div className={styles.prose}>
          <span className={styles.category}>{story.category}</span>
          <h1 className={styles.title}>{story.title}</h1>

          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <CalendarIcon />
              {story.date}
            </span>
            <span className={styles.metaItem}>
              <ClockIcon />
              {story.readTime}
            </span>
          </div>

          <p className={styles.excerpt}>{story.excerpt}</p>

          {story.body ? (
            story.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)
          ) : (
            <p className={styles.placeholder}>
              The full text of this story is still being written. Check back soon for the
              complete account.
            </p>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className={styles.related}>
          <div className="container">
            <SectionHeading title="More Stories" href="/stories" />
            <div className={styles.relatedGrid}>
              {related.map((item) => (
                <StoryCard key={item.slug} story={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
