import type { Metadata } from "next";
import PageIntro from "@/components/PageIntro/PageIntro";
import PlaceCard from "@/components/PlaceCard/PlaceCard";
import { places } from "@/lib/mockData";
import styles from "./places.module.css";

export const metadata: Metadata = {
  title: "Places — Alboholic",
  description: "The castles, ruins and cities that carry Albania's history.",
};

export default function PlacesPage() {
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
