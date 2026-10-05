import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ImagePlaceholder from "@/components/ImagePlaceholder/ImagePlaceholder";
import { getAllStories, getStoryBySlug } from "@/lib/content/public";
import styles from "./story.module.css";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getAllStories()).map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/stories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);

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
  const story = await getStoryBySlug(slug);

  if (!story) {
    notFound();
  }

  const related = (await getAllStories())
    .filter((item) => item.slug !== story.slug)
    .slice(0, 3);

  return (
    <article>
      <header className={styles.hero}>
        <div className={styles.heroMedia}>
          <ImagePlaceholder
            tone={story.imageTone}
            aiImage={story.aiImage}
            src={story.image}
            alt={story.title}
            sizes="(min-width: 960px) 60vw, 100vw"
          />
          {story.credit && <span className={styles.credit}>{story.credit}</span>}
        </div>

        <div className={`container ${styles.heroInner}`}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/" aria-label="Home">
              <HomeIcon />
            </Link>
            <ChevronIcon />
            <Link href="/stories">Stories</Link>
            <ChevronIcon />
            <span aria-current="page">{story.title}</span>
          </nav>

          <div className={styles.heroText}>
            <div className={styles.kicker}>
              <span className={styles.category}>{story.category}</span>
              <span>{story.date}</span>
            </div>
            <h1 className={styles.title}>{story.title}</h1>
            <p className={styles.excerpt}>{story.excerpt}</p>
            <span className={styles.metaItem}>
              <ClockIcon />
              {story.readTime}
            </span>
          </div>
        </div>
      </header>

      <div className={styles.paper}>
        <div className={`container ${styles.layout}`}>
          <div className={styles.prose}>
            {story.body ? (
              story.body.map((block, index) => <BodyBlock key={index} text={block} />)
            ) : (
              <p className={styles.placeholder}>
                The full text of this story is still being written. Check back soon for the
                complete account.
              </p>
            )}
          </div>

          <aside className={styles.aside}>
            <dl className={styles.details}>
              <div>
                <dt>Category</dt>
                <dd>{story.category}</dd>
              </div>
              <div>
                <dt>Published</dt>
                <dd>{story.date}</dd>
              </div>
              <div>
                <dt>Reading time</dt>
                <dd>{story.readTime}</dd>
              </div>
            </dl>

            {related.length > 0 && (
              <section className={styles.related}>
                <h2 className={styles.relatedHeading}>More Stories</h2>
                {related.map((item) => (
                  <Link key={item.slug} href={`/stories/${item.slug}`} className={styles.relatedItem}>
                    <div className={styles.relatedThumb}>
                      <ImagePlaceholder tone={item.imageTone} src={item.image} alt="" sizes="96px" />
                    </div>
                    <div>
                      <span className={styles.relatedCategory}>{item.category}</span>
                      <span className={styles.relatedTitle}>{item.title}</span>
                    </div>
                  </Link>
                ))}
              </section>
            )}
          </aside>
        </div>
      </div>
    </article>
  );
}

// Body lines are plain paragraphs, except "## " starts a section heading and "> " a pull quote.
function BodyBlock({ text }: { text: string }) {
  if (text.startsWith("## ")) {
    return <h2>{text.slice(3)}</h2>;
  }

  if (text.startsWith("> ")) {
    return <blockquote>{text.slice(2)}</blockquote>;
  }

  return <p>{text}</p>;
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3 2 12h3v8h5v-6h4v6h5v-8h3L12 3z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
