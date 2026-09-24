import type { Metadata } from "next";
import PageIntro from "@/components/PageIntro/PageIntro";
import PersonCard from "@/components/PersonCard/PersonCard";
import { people } from "@/lib/mockData";
import styles from "./people.module.css";

export const metadata: Metadata = {
  title: "People — Alboholic",
  description: "The military leaders, statesmen, humanitarians and writers who shaped Albanian history.",
};

export default function PeoplePage() {
  return (
    <div className="container">
      <PageIntro
        eyebrow="Explore"
        title="People"
        description="The figures whose lives are woven into Albania's history, from medieval resistance to the modern era."
      />
      <div className={styles.grid}>
        {people.map((person) => (
          <PersonCard key={person.slug} person={person} />
        ))}
      </div>
    </div>
  );
}
