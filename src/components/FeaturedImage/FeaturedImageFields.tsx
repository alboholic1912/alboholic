import SubmitButton from "@/components/SubmitButton/SubmitButton";
import Dropzone from "./Dropzone";
import styles from "./FeaturedImage.module.css";

type Props = {
  /** "new" sits inside the Generate form; "edit" is its own form with a submit button. */
  context: "new" | "edit";
  shape: "wide" | "square";
  submitClassName?: string;
};

/** The featured-image upload. */
export default function FeaturedImageFields({ context, shape, submitClassName }: Props) {
  return (
    <div className={styles.fields}>
      <Dropzone
        name="featuredImage"
        label="Image"
        emptyText="Your featured image"
        help={
          context === "new"
            ? "Uploaded exactly as it is. Leave it empty to add an image later."
            : "Uploaded exactly as it is, replacing the current image."
        }
        accept="image/*"
        shape={shape}
      />

      {context === "edit" && submitClassName && (
        <div className={styles.submitRow}>
          <SubmitButton className={submitClassName} pendingText="Uploading…">
            Upload image
          </SubmitButton>
        </div>
      )}
    </div>
  );
}
