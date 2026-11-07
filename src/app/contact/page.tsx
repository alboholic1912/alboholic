import InfoPage from "@/components/InfoPage/InfoPage";
import { CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL, pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Contact",
  description: "Get in touch with Alboholic: corrections, story ideas, family memories and collaborations.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="Contact"
      description="Have something to share? We'd love to hear from you."
      paragraphs={[
        CONTACT_EMAIL ? (
          <>
            <strong>Email.</strong> Write to us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </>
        ) : null,
        <>
          <strong>Instagram.</strong> Follow us and send us a message at{" "}
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
            {INSTAGRAM_HANDLE}
          </a>
          . It&rsquo;s the best place to see new stories as they come out.
        </>,
        <>
          <strong>Corrections and sources.</strong> Found a mistake? Tell us which page it is on and, if you can, point
          us to a source. It makes the fix much quicker.
        </>,
        <>
          <strong>Story ideas.</strong> Is there a person, battle or moment in Albanian history you think we should
          cover? Send it our way.
        </>,
        <>
          <strong>Family stories and memories.</strong> Did someone in your family take part in this history? Do you
          have old photos, letters or a story from your village? We&rsquo;d love to hear it and help keep it alive.
        </>,
        <>
          <strong>Collaborations.</strong> Historians, writers, translators, creators and other Albanian pages are
          welcome to reach out about working together.
        </>,
        <>
          <strong>Images.</strong> If you believe an image on the site belongs to you, let us know and we&rsquo;ll
          credit it or take it down.
        </>,
        "You can write to us in English or Albanian. We read every message and usually reply within a few days.",
      ].filter(Boolean)}
    />
  );
}
