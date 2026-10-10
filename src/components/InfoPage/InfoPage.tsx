import type { ReactNode } from "react";
import PageIntro from "@/components/PageIntro/PageIntro";
import styles from "./InfoPage.module.css";

export default function InfoPage({
  eyebrow,
  title,
  description,
  paragraphs,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  paragraphs: ReactNode[];
  /** Anything that follows the text, e.g. a form. */
  children?: ReactNode;
}) {
  return (
    <div className="container">
      <PageIntro eyebrow={eyebrow} title={title} description={description} />
      <div className={styles.prose}>
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        {children}
      </div>
    </div>
  );
}
