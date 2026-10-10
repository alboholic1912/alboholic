import Link from "next/link";
import InfoPage from "@/components/InfoPage/InfoPage";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Sources & Methodology",
  description: "How Alboholic sources and fact-checks its history content.",
  path: "/sources",
});

export default function SourcesPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="Sources & Methodology"
      paragraphs={[
        "Alboholic aims to draw on peer-reviewed history, primary documents and established reference works for every story, profile and battle on the site.",
        <>
          <strong>Where to find them.</strong> Profiles and battles list their references under “Sources” on the page
          itself: books, archives, academic work, historical documents and institutions.
        </>,
        <>
          <strong>Disputed and incomplete records.</strong> Much of this history is contested, and some of it is thinly
          documented. Where accounts disagree or the record runs out, we aim to say so rather than pick a side
          silently.
        </>,
        <>
          <strong>Images.</strong> Images marked as AI-generated are illustrative only and are not authentic
          historical photography.
        </>,
        <>
          <strong>Corrections.</strong> If you find an error, or know a better source, please{" "}
          <Link href="/contact">tell us</Link>. We correct mistakes when they are pointed out.
        </>,
      ]}
    />
  );
}
