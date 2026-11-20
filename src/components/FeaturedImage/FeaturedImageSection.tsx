import Image from "next/image";
import type { ContentType } from "@/lib/content/types";
import { saveFeaturedImage } from "@/lib/content/imageActions";
import FeaturedImageFields from "./FeaturedImageFields";
import styles from "./FeaturedImage.module.css";

type Props = {
  type: ContentType;
  id: string;
  image: string | null;
  error?: string;
  /** Class names from the Studio stylesheet, so the section matches the rest of the page. */
  sectionClassName: string;
  sectionTitleClassName: string;
  errorClassName: string;
  submitClassName: string;
};

/** The edit page's featured image: what's on file now, and the upload form. */
export default function FeaturedImageSection({
  type,
  id,
  image,
  error,
  sectionClassName,
  sectionTitleClassName,
  errorClassName,
  submitClassName,
}: Props) {
  const shape = type === "people" ? "square" : "wide";
  const shapeClass = shape === "square" ? styles.dropSquare : styles.dropWide;

  return (
    <section className={sectionClassName} style={{ marginBottom: "var(--space-6)", maxWidth: 760 }}>
      <div className={sectionTitleClassName}>Featured image</div>

      {error && <div className={errorClassName}>{error}</div>}

      {image ? (
        <div className={`${styles.stage} ${shapeClass}`}>
          <Image src={image} alt="" fill sizes="(max-width: 800px) 100vw, 720px" style={{ objectFit: "cover" }} unoptimized />
        </div>
      ) : (
        <div className={`${styles.stage} ${styles.stageEmpty} ${shapeClass}`}>No featured image yet</div>
      )}

      <form action={saveFeaturedImage}>
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="id" value={id} />
        <FeaturedImageFields context="edit" shape={shape} submitClassName={submitClassName} />
      </form>
    </section>
  );
}
