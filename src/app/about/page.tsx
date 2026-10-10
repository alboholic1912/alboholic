import Link from "next/link";
import InfoPage from "@/components/InfoPage/InfoPage";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "About",
  description: "About Alboholic, a modern, readable home for Albanian history.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="About Alboholic"
      paragraphs={[
        "Alboholic is a modern, readable home for Albanian history: the people, battles and defining moments of a nation, from its ancient roots to the modern era, brought together in one place.",
        <>
          <Link href="/stories">Stories</Link> are the heart of the site, each one a full account of an event or a life.{" "}
          <Link href="/people">People</Link> are short profiles that answer who someone was and why they matter, and
          link to the stories they appear in. The <Link href="/battles">Battles map</Link> shows where the fighting
          took place, who fought and how it ended.
        </>,
        <>
          The site is young and growing, with new stories, profiles and battles added as they are researched. How we
          choose and check what we publish is set out under <Link href="/sources">Sources &amp; Methodology</Link>.
        </>,
        <>
          Spotted a mistake, or know a story we should tell? <Link href="/contact">Get in touch</Link>.
        </>,
      ]}
    />
  );
}
