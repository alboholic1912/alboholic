import PageIntro from "@/components/PageIntro/PageIntro";
import styles from "./InfoPage.module.css";

export default function InfoPage({
  eyebrow,
  title,
  description,
  paragraphs,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  paragraphs: string[];
}) {
  return (
    <div className="container">
      <PageIntro eyebrow={eyebrow} title={title} description={description} />
      <div className={styles.prose}>
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
