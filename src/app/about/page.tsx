import Link from "next/link";
import InfoPage from "@/components/InfoPage/InfoPage";
import { INSTAGRAM_URL, pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "About",
  description:
    "About Alboholic, a modern, readable home for Albanian history that connects Albanians and friends of Albania all over the world.",
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
          <strong>Our mission.</strong> We want to raise awareness of the strength and spirit of the Albanian people,
          a small nation that has stood its ground through centuries of empires, wars and change. Every story we tell
          is a reminder of what Albanians have achieved, endured and given to the world.
        </>,
        <>
          <strong>A place to connect.</strong> Albanians live in every corner of the world, and so do people who love
          Albania. Alboholic is here to bring them together, to share memories and experiences, and to keep this
          history alive from one generation to the next.
        </>,
        <>
          <Link href="/stories">Stories</Link> are the heart of the site, each one a full account of an event or a life.{" "}
          <Link href="/people">People</Link> are short profiles that answer who someone was and why they matter, and
          link to the stories they appear in. The <Link href="/battles">Battles map</Link> shows where the fighting
          took place, who fought and how it ended.
        </>,
        <>
          The site is young and growing, with new stories, profiles and battles added all the time. How we research
          what we publish is set out under <Link href="/sources">Sources &amp; Methodology</Link>.
        </>,
        <>
          <strong>Be part of it.</strong>{" "}
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
            Follow us on Instagram
          </a>
          , <Link href="/subscribe">subscribe</Link> for new stories, and be a
          part of our mission. Spotted a mistake, or know a story we should tell?{" "}
          <Link href="/contact">Get in touch</Link>.
        </>,
      ]}
    />
  );
}
