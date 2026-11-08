import Link from "next/link";
import InfoPage from "@/components/InfoPage/InfoPage";
import { CONTACT_EMAIL, pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Privacy",
  description: "What Alboholic collects about its readers, why, how long we keep it, and your rights under the GDPR.",
  path: "/privacy",
});

const LAST_UPDATED = "7 November 2026";

export default function PrivacyPage() {
  const contact = CONTACT_EMAIL ? (
    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
  ) : (
    <Link href="/contact">our contact page</Link>
  );

  return (
    <InfoPage
      eyebrow="About"
      title="Privacy"
      paragraphs={[
        <>
          <strong>Who we are.</strong> Alboholic is responsible (the &ldquo;controller&rdquo;) for the personal data
          described on this page. You can reach us about anything privacy-related at {contact}. This policy is written
          to meet the EU General Data Protection Regulation (GDPR).
        </>,
        <>
          <strong>Reading the site.</strong> Alboholic has no reader accounts, no advertising and no tracking or
          marketing cookies. To deliver pages, the servers that host the site receive your IP address and basic browser
          details, and keep them briefly in technical logs used to keep the site running and secure. We also use
          Vercel Web Analytics to count visits: which pages are viewed, the referring site, country, and device and
          browser type. It sets no cookies, does not track you across sites, and only shows us aggregate numbers, never
          who you are. Our legal basis for both is our legitimate interest in operating a safe, working website and
          understanding which stories people read (GDPR Art. 6(1)(f)).
        </>,
        <>
          <strong>The newsletter.</strong> If you <Link href="/subscribe">subscribe</Link>, we store the email address
          you give us and the date you signed up. We use it only to send you Alboholic updates. Our legal basis is your
          consent (GDPR Art. 6(1)(a)), which you can withdraw at any time by asking us to unsubscribe you.
        </>,
        <>
          <strong>Messages you send us.</strong> If you email us or message us on Instagram, we use what you send only
          to read it and reply. Our legal basis is our legitimate interest in answering you (GDPR Art. 6(1)(f)). If
          you share a family story or photo, we will only publish it with your permission.
        </>,
        <>
          <strong>The Battles map.</strong> The map is drawn from open map data. Opening it loads map images directly
          from third-party open map services, which receive your IP address, as they would for any online map you
          view.
        </>,
        <>
          <strong>Cookies and storage.</strong> We don&rsquo;t set cookies for readers, so there is no cookie banner. If
          you change the reading mode settings on a story (such as text size), your choice is saved in your own
          browser&rsquo;s storage so it is remembered next time. It never leaves your device, and you can clear it at
          any time from your browser settings.
        </>,
        <>
          <strong>Who else sees your data.</strong> We never sell, rent or trade your data, and we don&rsquo;t share it
          for advertising. It is handled only by the service providers that host the site and its database, acting on
          our instructions under data processing agreements. Some of these providers may process data outside the
          European Economic Area; where they do, the transfer is protected by safeguards the GDPR recognises, such as
          the European Commission&rsquo;s Standard Contractual Clauses.
        </>,
        <>
          <strong>How long we keep it.</strong> Technical logs are kept only for a short period and then deleted
          automatically. Newsletter addresses are kept until you unsubscribe, then deleted. Messages are kept only as
          long as needed to deal with them.
        </>,
        <>
          <strong>How we protect it.</strong> We collect as little as we can. The whole site is served over an
          encrypted connection (HTTPS), access to our systems is limited to the people who run Alboholic and protected
          by authentication, and we use providers that maintain recognised security standards. If a data breach ever
          put your personal data at risk, we would notify the relevant authority and, where required, you, as the GDPR
          requires.
        </>,
        <>
          <strong>Your rights.</strong> Under the GDPR you have the right to access the personal data we hold about
          you, to have it corrected or deleted, to restrict or object to how we use it, to receive a copy of it
          (data portability), and to withdraw your consent at any time. To use any of these rights, write to us at{" "}
          {contact}. We will reply within one month. We do not make any automated decisions or profile you.
        </>,
        <>
          <strong>Complaints.</strong> If you think we have handled your data wrongly, please tell us first so we can
          put it right. You also have the right to complain to the data protection authority in the country where you
          live or work.
        </>,
        <>
          <strong>Children.</strong> Alboholic is a general history site and is not aimed at children. We do not
          knowingly collect personal data from anyone under 16.
        </>,
        <>
          <strong>Links to other sites.</strong> Pages may link to other websites, such as our Instagram profile or
          sources we mention. Those sites have their own privacy policies, which we don&rsquo;t control.
        </>,
        <>
          <strong>Changes to this policy.</strong> If what we collect or how we use it changes, this page will change
          with it. Last updated: {LAST_UPDATED}.
        </>,
      ]}
    />
  );
}
