import type { Metadata } from "next";
import PeopleBrowser from "@/components/PeopleBrowser/PeopleBrowser";
import { getPeople } from "@/lib/content/public";
import styles from "./people.module.css";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "People — Alboholic",
  description: "The military leaders, statesmen, humanitarians and writers who shaped Albanian history.",
};

export default async function PeoplePage() {
  const people = await getPeople();

  return (
    <>
      <header className={styles.banner}>
        <div className={`container ${styles.bannerInner}`}>
          <span className={styles.eyebrow}>People</span>
          <h1 className={styles.title}>The People of Albania</h1>
          <p className={styles.description}>
            The figures whose lives are woven into Albania&apos;s history, from medieval resistance to the modern era.
          </p>
        </div>
      </header>

      <div className="container">
        <PeopleBrowser people={people} />
      </div>
    </>
  );
}
