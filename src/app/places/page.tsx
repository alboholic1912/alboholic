import type { Metadata } from "next";
import PageIntro from "@/components/PageIntro/PageIntro";
import PlaceCard from "@/components/PlaceCard/PlaceCard";
import { getPlaces } from "@/lib/content/public";
import styles from "./places.module.css";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Places — Alboholic",
  description: "The castles, ruins and cities that carry Albania's history.",
};

export default async function PlacesPage() {
  const places = await getPlaces();

  return (
    <div className="container">
      <PageIntro
        eyebrow="Explore"
        title="Places"
        description="From hilltop fortresses to ancient ruins, the places where Albanian history was made."
      />
      <div className={styles.grid}>
        {places.map((place) => (
          <PlaceCard key={place.slug} place={place} />
        ))}
      </div>
    </div>
  );
}
