import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ImagePlaceholder from "@/components/ImagePlaceholder/ImagePlaceholder";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import StoryCard from "@/components/StoryCard/StoryCard";
import {
  getAssociatedPeople,
  getPeople,
  getPersonBySlug,
  getStoriesFeaturing,
  type AssociatedPerson,
} from "@/lib/content/public";
import type { Citation, CitationType, Pronoun } from "@/lib/content/types";
import { pageMetadata } from "@/lib/site";
import { ChevronIcon, FactIcon, HomeIcon, PinIcon, SourceIcon, UserIcon } from "./icons";
import styles from "./person.module.css";

export const revalidate = 60;

const WHY_HEADING: Record<Pronoun, string> = {
  he: "Why He Matters",
  she: "Why She Matters",
  they: "Why They Matter",
};

const SOURCE_LABELS: Record<CitationType, string> = {
  book: "Book",
  archive: "Archive",
  academic: "Academic source",
  website: "Website",
  document: "Historical document",
  institution: "Museum / institution",
  other: "Reference",
};

export async function generateStaticParams() {
  return (await getPeople()).map((person) => ({ slug: person.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/people/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const person = await getPersonBySlug(slug);

  if (!person) {
    return { title: "Person not found — Alboholic" };
  }

  return pageMetadata({
    title: person.name,
    description:
      person.knownFor ?? person.summary ?? [person.category ?? person.role, person.era].filter(Boolean).join(", "),
    path: `/people/${person.slug}`,
    image: person.image ? { url: person.image, alt: person.name } : undefined,
    type: "profile",
  });
}

// A profile answers "who was this person?" at a glance. What happened lives in Stories,
// which this page links to rather than retells.
export default async function PersonPage({ params }: PageProps<"/people/[slug]">) {
  const { slug } = await params;
  const person = await getPersonBySlug(slug);

  if (!person) {
    notFound();
  }

  const [stories, associated] = await Promise.all([getStoriesFeaturing(person), getAssociatedPeople(person)]);

  const tags = [...new Set([person.category, person.role].filter((tag): tag is string => Boolean(tag)))];
  const introduction = person.summary ?? person.knownFor;
  const hasArchive = associated.length > 0 || person.relatedPlaces.length > 0 || person.sources.length > 0;

  return (
    <article>
      <header className={styles.hero}>
        <div className={styles.heroMedia}>
          <ImagePlaceholder
            tone={person.imageTone}
            aiImage
            src={person.image}
            alt={person.name}
            sizes="(min-width: 960px) 62vw, 100vw"
            eager
          />
        </div>

        <div className={`container ${styles.heroInner}`}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/" aria-label="Home">
              <HomeIcon />
            </Link>
            <ChevronIcon />
            <Link href="/people">People</Link>
            <ChevronIcon />
            <span aria-current="page">{person.name}</span>
          </nav>

          <div className={styles.identity}>
            <h1 className={styles.name}>{person.name}</h1>
            {person.era && <p className={styles.era}>{person.era}</p>}
            {tags.length > 0 && (
              <ul className={styles.tags}>
                {tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}
            {introduction && <p className={styles.summary}>{introduction}</p>}
            {person.birthplace && (
              <p className={styles.birthplace}>
                <PinIcon />
                {person.birthplace}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className={`container ${styles.body}`}>
        {person.facts.length > 0 && (
          <section aria-label="At a glance">
            <dl className={styles.facts}>
              {person.facts.map((fact, index) => (
                <div key={index} className={styles.fact}>
                  <dt>
                    <FactIcon label={fact.label} />
                    {fact.label}
                  </dt>
                  <dd>
                    {fact.value}
                    {fact.detail && <span>{fact.detail}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {(person.significance.length > 0 || person.timeline.length > 0) && (
          <div className={styles.columns}>
            {person.significance.length > 0 && (
              <section className={styles.column}>
                <SectionHeading title={WHY_HEADING[person.pronoun]} />
                <ol className={styles.points}>
                  {person.significance.map((point, index) => (
                    <li key={index} className={styles.point}>
                      <span className={styles.pointNumber} aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className={styles.itemTitle}>{point.title}</h3>
                        <p className={styles.itemText}>{point.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {person.timeline.length > 0 && (
              <section className={styles.column}>
                <SectionHeading title="Key Moments" />
                <ol className={styles.timeline}>
                  {person.timeline.map((moment, index) => (
                    <li key={index} className={styles.moment}>
                      <span className={styles.momentDate}>{moment.date}</span>
                      <div>
                        <h3 className={styles.itemTitle}>{moment.title}</h3>
                        {moment.text && <p className={styles.itemText}>{moment.text}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        )}

        <section className={styles.section}>
          <SectionHeading title={`Stories featuring ${person.name}`} href="/stories" linkLabel="All stories" />
          {stories.length > 0 ? (
            <div className={styles.stories}>
              {stories.map((story) => (
                <StoryCard key={story.slug} story={story} />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>
              No published story features {person.name} yet. New stories appear here as they are published.
            </p>
          )}
        </section>

        {hasArchive && (
          <div className={`${styles.section} ${styles.archive}`}>
            {associated.length > 0 && (
              <section>
                <SectionHeading compact title="Associated People" href="/people" />
                <ul className={styles.entities}>
                  {associated.map((item) => (
                    <li key={item.name}>
                      <AssociatedPersonRow item={item} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {person.relatedPlaces.length > 0 && (
              <section>
                <SectionHeading compact title="Associated Places" />
                <ul className={styles.entities}>
                  {person.relatedPlaces.map((place) => (
                    <li key={place.name} className={styles.entity}>
                      <span className={styles.entityIcon}>
                        <PinIcon size={18} />
                      </span>
                      <span>
                        <span className={styles.entityName}>{place.name}</span>
                        {place.kind && <span className={styles.entityMeta}>{place.kind}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {person.sources.length > 0 && (
              <section>
                <SectionHeading compact title="Sources" href="/sources" linkLabel="Methodology" />
                <ul className={styles.sources}>
                  {person.sources.map((source, index) => (
                    <li key={index} className={styles.source}>
                      <SourceIcon type={source.type} />
                      <span>
                        <SourceTitle source={source} />
                        <span className={styles.entityMeta}>
                          {[SOURCE_LABELS[source.type], source.detail].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// Links to the person's own profile once one is published; until then it is a plain name.
function AssociatedPersonRow({ item }: { item: AssociatedPerson }) {
  const { profile } = item;
  const role = item.role || profile?.category || profile?.role;
  const text = (
    <span>
      <span className={styles.entityName}>{item.name}</span>
      {role && <span className={styles.entityMeta}>{role}</span>}
    </span>
  );

  if (!profile) {
    return (
      <div className={styles.entity}>
        <span className={styles.entityIcon}>
          <UserIcon size={18} />
        </span>
        {text}
      </div>
    );
  }

  return (
    <Link href={`/people/${profile.slug}`} className={styles.entity}>
      <span className={styles.entityThumb}>
        <ImagePlaceholder tone={profile.imageTone} src={profile.image} alt="" sizes="44px" />
      </span>
      {text}
    </Link>
  );
}

function SourceTitle({ source }: { source: Citation }) {
  // Only real web addresses become links; anything else in the field stays plain text.
  if (!/^https?:\/\//i.test(source.url)) {
    return <span className={styles.entityName}>{source.title}</span>;
  }

  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer" className={styles.entityName}>
      {source.title}
    </a>
  );
}
