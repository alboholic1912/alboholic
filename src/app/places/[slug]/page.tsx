import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BackLink from "@/components/BackLink/BackLink";
import ImagePlaceholder from "@/components/ImagePlaceholder/ImagePlaceholder";
import { getPlaceBySlug, getPlaces } from "@/lib/content/public";
import styles from "./place.module.css";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getPlaces()).map((place) => ({ slug: place.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/places/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);

  if (!place) {
    return { title: "Place not found — Alboholic" };
  }

  return {
    title: `${place.name} — Alboholic`,
    description: place.description,
  };
}

export default async function PlacePage({ params }: PageProps<"/places/[slug]">) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);

  if (!place) {
    notFound();
  }

  return (
    <div className="container">
      <BackLink href="/places" label="Back to Places" />

      <div className={styles.media}>
        <ImagePlaceholder tone={place.imageTone} aiImage src={place.image} alt={place.name} />
      </div>

      <div className={styles.prose}>
        <span className={styles.region}>{place.region}</span>
        <h1 className={styles.name}>{place.name}</h1>
        <p>{place.description}</p>
        <p className={styles.placeholder}>A full guide to {place.name} is coming soon.</p>
      </div>
    </div>
  );
}
