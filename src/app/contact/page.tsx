import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage/InfoPage";

export const metadata: Metadata = {
  title: "Contact — Alboholic",
  description: "Get in touch with Alboholic.",
};

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="Contact"
      paragraphs={[
        "Have a correction, a source to suggest, or a story you think we should cover? We'd like to hear from you.",
        "A contact form is coming soon.",
      ]}
    />
  );
}
