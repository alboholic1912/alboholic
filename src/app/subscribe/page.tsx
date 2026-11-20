import Link from "next/link";
import InfoPage from "@/components/InfoPage/InfoPage";
import SubscribeForm from "@/components/SubscribeForm/SubscribeForm";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Subscribe",
  description: "Subscribe to Alboholic for new stories on Albanian history.",
  path: "/subscribe",
});

export default function SubscribePage() {
  return (
    <InfoPage
      eyebrow="Newsletter"
      title="Subscribe"
      paragraphs={[
        "Get new stories, profiles and history deep-dives from Alboholic sent straight to your inbox.",
        <>
          We only use your address to send you Alboholic updates, and you can ask to be removed at any time. See our{" "}
          <Link href="/privacy">privacy page</Link>.
        </>,
      ]}
    >
      <SubscribeForm />
    </InfoPage>
  );
}
