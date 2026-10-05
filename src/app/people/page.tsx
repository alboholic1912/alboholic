import type { Metadata } from "next";
import PageBanner from "@/components/PageBanner/PageBanner";
import PeopleBrowser from "@/components/PeopleBrowser/PeopleBrowser";
import { getPeople } from "@/lib/content/public";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "People — Alboholic",
  description: "The military leaders, statesmen, humanitarians and writers who shaped Albanian history.",
};

export default async function PeoplePage() {
  const people = await getPeople();

  return (
    <>
      <PageBanner
        eyebrow="People"
        title="The People of Albania"
        description="The figures whose lives are woven into Albania's history, from medieval resistance to the modern era."
      />

      <div className="container">
        <PeopleBrowser people={people} />
      </div>
    </>
  );
}
