import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage/InfoPage";

export const metadata: Metadata = {
  title: "About — Alboholic",
  description: "About Alboholic, a modern, readable home for Albanian history.",
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="About Alboholic"
      paragraphs={[
        "Alboholic is a modern, readable home for Albanian history — stories, people, places and periods brought together in one place.",
        "The site is currently in early development. Content across Stories, People, Places and Periods is placeholder copy while the core reading experience is being built.",
        "More about our mission, editorial approach and the people behind Alboholic is coming soon.",
      ]}
    />
  );
}
