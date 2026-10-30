import Image from "next/image";
import type { ImageJob } from "@/lib/content/imageJobs";
import type { ContentType } from "@/lib/content/types";
import { saveFeaturedImage } from "@/lib/content/imageActions";
import { IMAGE_MODE_LABELS } from "@/lib/ai/imagePrompts";
import { getImageModel } from "@/lib/ai/models";
import { mediaUrl } from "@/lib/supabase/storage";
import FeaturedImageFields from "./FeaturedImageFields";
import ImageJobRunner from "./ImageJobRunner";
import styles from "./FeaturedImage.module.css";

type Props = {
  type: ContentType;
  id: string;
  image: string | null;
  job: ImageJob | null;
  error?: string;
  /** Class names from the Studio stylesheet, so the section matches the rest of the page. */
  sectionClassName: string;
  sectionTitleClassName: string;
  errorClassName: string;
  submitClassName: string;
};

/** The edit page's featured image: what's on file now, a running generation, and the Generate/Import form. */
export default function FeaturedImageSection({
  type,
  id,
  image,
  job,
  error,
  sectionClassName,
  sectionTitleClassName,
  errorClassName,
  submitClassName,
}: Props) {
  const shape = type === "people" ? "square" : "wide";
  const shapeClass = shape === "square" ? styles.dropSquare : styles.dropWide;
  const running = job?.status === "pending" || job?.status === "generating";
  const failure = job?.status === "failed" ? job.error : null;
  const jobCaption = job
    ? `${IMAGE_MODE_LABELS[job.mode]} · ${getImageModel(job.model)?.label ?? job.model}${
        job.reference_path ? " · from a reference" : " · from the prompt"
      }`
    : "";

  return (
    <section className={sectionClassName} style={{ marginBottom: "var(--space-6)", maxWidth: 760 }}>
      <div className={sectionTitleClassName}>Featured image</div>

      {error && <div className={errorClassName}>{error}</div>}
      {failure && <div className={errorClassName}>Image generation failed: {failure}</div>}

      {running && job ? (
        <ImageJobRunner
          jobId={job.id}
          status={job.status as "pending" | "generating"}
          since={job.status === "pending" ? job.created_at : job.updated_at}
          shape={shape}
          caption={jobCaption}
        />
      ) : image ? (
        <div className={styles.field}>
          <div className={`${styles.stage} ${shapeClass}`}>
            <Image src={image} alt="" fill sizes="(max-width: 800px) 100vw, 720px" style={{ objectFit: "cover" }} unoptimized />
          </div>
          {job?.status === "done" && job.image === image && <p className={styles.help}>Generated with AI: {jobCaption}</p>}
        </div>
      ) : (
        <div className={`${styles.stage} ${styles.stageEmpty} ${shapeClass}`}>No featured image yet</div>
      )}

      {!running && (
        <form action={saveFeaturedImage}>
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="id" value={id} />
          <FeaturedImageFields
            context="edit"
            shape={shape}
            defaultMode={job?.mode}
            defaultPrompt={job?.prompt}
            defaultModel={job?.model}
            previousReferenceUrl={job?.reference_path ? mediaUrl(job.reference_path) : null}
            submitClassName={submitClassName}
          />
        </form>
      )}
    </section>
  );
}
