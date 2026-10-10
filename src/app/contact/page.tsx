import InfoPage from "@/components/InfoPage/InfoPage";
import { CONTACT_EMAIL, pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Contact",
  description: "Get in touch with Alboholic.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="Contact"
      paragraphs={[
        "Have a correction, a source to suggest, or a story you think we should cover? We'd like to hear from you.",
        "For a correction, tell us which page it is on and, if you can, point us to a source. It makes the fix much quicker.",
        ...(CONTACT_EMAIL
          ? [
              <>
                Write to us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              </>,
            ]
          : []),
      ]}
    />
  );
}
