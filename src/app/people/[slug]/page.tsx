import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BackLink from "@/components/BackLink/BackLink";
import ImagePlaceholder from "@/components/ImagePlaceholder/ImagePlaceholder";
import { getPersonBySlug, getPeople } from "@/lib/content/public";
import styles from "./person.module.css";

export const revalidate = 60;

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

  return {
    title: `${person.name} — Alboholic`,
    description: person.bio ?? `${person.role}, ${person.era}`,
  };
}

export default async function PersonPage({ params }: PageProps<"/people/[slug]">) {
  const { slug } = await params;
  const person = await getPersonBySlug(slug);

  if (!person) {
    notFound();
  }

  return (
    <div className="container">
      <BackLink href="/people" label="Back to People" />

      <div className={styles.header}>
        <div className={styles.media}>
          <ImagePlaceholder tone={person.imageTone} aiImage src={person.image} alt={person.name} />
        </div>
        <div className={styles.info}>
          <h1 className={styles.name}>{person.name}</h1>
          <span className={styles.role}>{person.role}</span>
          <span className={styles.era}>{person.era}</span>
        </div>
      </div>

      <div className={styles.prose}>
        {person.bio ? (
          <p>{person.bio}</p>
        ) : (
          <p className={styles.placeholder}>A full profile for {person.name} is coming soon.</p>
        )}
      </div>
    </div>
  );
}
