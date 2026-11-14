import { createInstagramPost } from "@/lib/instagram/actions";
import { MAX_IMAGES } from "@/lib/instagram/types";
import SubmitButton from "@/components/SubmitButton/SubmitButton";
import studio from "@/app/kalaja-cabb0da6/studio.module.css";
import styles from "./Instagram.module.css";

/** Step one of a post: pick the images. Caption, tags, location and timing come on the next screen. */
export default function NewPostForm({
  type,
  contentId,
  featuredImage,
}: {
  type?: string;
  contentId?: string;
  featuredImage?: string | null;
}) {
  return (
    <form action={createInstagramPost} className={studio.section}>
      <div className={studio.sectionTitle}>Prepare a new post</div>
      {type && contentId && (
        <>
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="contentId" value={contentId} />
        </>
      )}

      {featuredImage && (
        <label className={styles.featuredPick}>
          <input type="checkbox" name="includeFeatured" defaultChecked />
          {/* eslint-disable-next-line @next/next/no-img-element -- small Studio-only thumbnail */}
          <img src={featuredImage} alt="" />
          <span>Use the featured image as the first slide</span>
        </label>
      )}

      <div className={studio.field}>
        <label htmlFor="images">{featuredImage ? "More images" : "Images"}</label>
        <input id="images" name="images" type="file" accept="image/*" multiple />
        <span className={studio.help}>
          One image for a single post, or several for a carousel (up to {MAX_IMAGES}). Any format works; they are
          converted to JPEG. You can reorder, add and remove them on the next screen.
        </span>
      </div>

      <div className={studio.actions}>
        <SubmitButton className={`${studio.button} ${studio.buttonPrimary}`} pendingText="Uploading…">
          Continue to caption &amp; schedule
        </SubmitButton>
      </div>
      {type && <span className={studio.help}>The caption starts as a draft written from this entry.</span>}
    </form>
  );
}
