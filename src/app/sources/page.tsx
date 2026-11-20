import Link from "next/link";
import InfoPage from "@/components/InfoPage/InfoPage";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Sources & Methodology",
  description: "Where Alboholic's stories, battles and profiles come from, and how we research them.",
  path: "/sources",
});

export default function SourcesPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="Sources & Methodology"
      paragraphs={[
        "Everything on Alboholic, from the stories and battles to the profiles of the people who shaped Albanian history, is built from publicly available sources.",
        <>
          <strong>Where it comes from.</strong> Our research draws on published books, academic papers, historical
          documents and records, and articles from established publications. We read across these sources, compare
          what they say, and retell it in our own words so it is clear and easy to follow.
        </>,
        <>
          <strong>Why sources aren&rsquo;t listed on every page.</strong> Most pieces are put together from many
          sources at once, so we don&rsquo;t attach a reference list to every story, battle or profile. Where a page
          does list its sources, you&rsquo;ll find them at the bottom of that page.
        </>,
        <>
          <strong>Disputed and incomplete records.</strong> Much of this history is contested, and some of it is thinly
          documented. Dates, numbers and names can differ between sources. Where accounts disagree or the record runs
          out, we aim to say so rather than pick a side silently.
        </>,
        <>
          <strong>Images.</strong> Images marked as AI-generated are illustrative only and are not authentic
          historical photography.
        </>,
        <>
          <strong>Corrections.</strong> If you find an error, or know a source we should read, please{" "}
          <Link href="/contact">tell us</Link>. We correct mistakes when they are pointed out.
        </>,
      ]}
    />
  );
}
