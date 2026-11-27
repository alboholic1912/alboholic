import Link from "next/link";
import InfoPage from "@/components/InfoPage/InfoPage";
import AnalyticsOptOut from "@/components/AnalyticsOptOut/AnalyticsOptOut";
import { pageMetadata } from "@/lib/site";

export const metadata = {
  ...pageMetadata({
    title: "Visitor counting",
    description: "Choose whether your visits to Alboholic are counted in our anonymous visitor numbers.",
    path: "/analytics-opt-out",
  }),
  robots: { index: false, follow: true },
};

export default function AnalyticsOptOutPage() {
  return (
    <InfoPage
      eyebrow="Privacy"
      title="Visitor counting"
      paragraphs={[
        <>
          We count visits to see which stories people read and where they find us. It&rsquo;s anonymous: no
          cookies, no accounts, and nothing that tells us who you are. Our <Link href="/privacy">privacy page</Link>{" "}
          explains exactly what is recorded.
        </>,
        <>
          If you&rsquo;d still rather not be counted, use the switch below. It applies to this browser on this device,
          so you&rsquo;d set it again on another phone or computer, or after clearing your browser&rsquo;s data.
        </>,
      ]}
    >
      <AnalyticsOptOut />
    </InfoPage>
  );
}
