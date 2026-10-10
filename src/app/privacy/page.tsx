import Link from "next/link";
import InfoPage from "@/components/InfoPage/InfoPage";
import { CONTACT_EMAIL, pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Privacy",
  description: "What Alboholic collects about its readers, and what it doesn't.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="Privacy"
      description="The short version: you can read everything here without an account, and we don't track you."
      paragraphs={[
        <>
          <strong>Reading the site.</strong> Alboholic has no reader accounts, no advertising and no analytics or
          tracking cookies. Like any website, our hosting provider (Vercel) receives your IP address and browser
          details in order to deliver pages, and keeps short-lived technical logs.
        </>,
        <>
          <strong>The newsletter.</strong> If you <Link href="/subscribe">subscribe</Link>, we store the email address
          you give us, with the date, in our database (hosted by Supabase). We use it only to send you Alboholic
          updates. We don&rsquo;t sell it or share it with anyone else.
        </>,
        <>
          <strong>The Battles map.</strong> The map is drawn from open map data. Opening it loads map tiles directly
          from OpenFreeMap and from the Terrain Tiles open dataset (hosted on Amazon Web Services), so those services
          receive your IP address, as they would for any map you view.
        </>,
        <>
          <strong>Your choices.</strong> To be removed from the newsletter, or to ask what we hold about you,{" "}
          {CONTACT_EMAIL ? (
            <>
              write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </>
          ) : (
            <>
              <Link href="/contact">contact us</Link>.
            </>
          )}
        </>,
        "If what we collect ever changes, this page will change with it.",
      ]}
    />
  );
}
