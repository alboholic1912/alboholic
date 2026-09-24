import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage/InfoPage";

export const metadata: Metadata = {
  title: "Subscribe — Alboholic",
  description: "Subscribe to Alboholic for new stories on Albanian history.",
};

export default function SubscribePage() {
  return (
    <InfoPage
      eyebrow="Newsletter"
      title="Subscribe"
      paragraphs={[
        "Get new stories, profiles and history deep-dives from Alboholic sent straight to your inbox.",
        "Newsletter sign-up is coming soon.",
      ]}
    />
  );
}
