import PageBanner from "@/components/PageBanner/PageBanner";
import PeopleBrowser from "@/components/PeopleBrowser/PeopleBrowser";
import { getPeople } from "@/lib/content/public";
import { pageMetadata } from "@/lib/site";

export const revalidate = 60;

export const metadata = pageMetadata({
  title: "People",
  description: "The military leaders, statesmen, humanitarians and writers who shaped Albanian history.",
  path: "/people",
});

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
