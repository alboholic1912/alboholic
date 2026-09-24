import type { Metadata } from "next";
import PageIntro from "@/components/PageIntro/PageIntro";
import styles from "./map.module.css";

export const metadata: Metadata = {
  title: "Map — Alboholic",
  description: "An interactive map of Albanian history is coming to Alboholic.",
};

export default function MapPage() {
  return (
    <div className="container">
      <PageIntro
        eyebrow="Explore"
        title="Map"
        description="An interactive map plotting stories, people, places and periods across Albania."
      />

      <div className={styles.panel}>
        <span className={styles.tag}>Planned</span>
        <h2 className={styles.taskName}>Build the Interactive History Map</h2>
        <p className={styles.description}>
          This page will hold a pannable, zoomable map that plots Places, and links out to related
          Stories, People and Periods for each location. It needs a mapping library, real
          coordinates for the entries in Places, and a decision on hosting map tiles — none of
          which exist yet, so it&apos;s tracked as its own task rather than built as a stub.
        </p>
      </div>
    </div>
  );
}
