import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage/InfoPage";

export const metadata: Metadata = {
  title: "Sources & Methodology — Alboholic",
  description: "How Alboholic sources and fact-checks its history content.",
};

export default function SourcesPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="Sources & Methodology"
      paragraphs={[
        "Alboholic aims to draw on peer-reviewed history, primary documents and established reference works for every story, profile and timeline on the site.",
        "Images marked as AI-generated are illustrative only and are not authentic historical photography.",
        "A full breakdown of sources and our editorial methodology — including how we handle disputed or incomplete historical records — will be published here as the site's content is built out.",
      ]}
    />
  );
}
