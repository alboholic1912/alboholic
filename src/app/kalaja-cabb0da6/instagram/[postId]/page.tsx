import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/dal";
import { getContentById } from "@/lib/content/data";
import { CONTENT_CONFIG } from "@/lib/content/config";
import { getConnectedAccount, getInstagramPost } from "@/lib/instagram/data";
import { deleteInstagramPost, saveInstagramPost } from "@/lib/instagram/actions";
import { INSTAGRAM_ASPECTS, MAX_IMAGES, type InstagramAspect } from "@/lib/instagram/types";
import BackLink from "@/components/BackLink/BackLink";
import SubmitButton from "@/components/SubmitButton/SubmitButton";
import CaptionField from "@/components/Instagram/CaptionField";
import LocalTime from "@/components/Instagram/LocalTime";
import ScheduleInput from "@/components/Instagram/ScheduleInput";
import { StatusBadge } from "@/components/Instagram/PostList";
import ig from "@/components/Instagram/Instagram.module.css";
import styles from "../../studio.module.css";

// "Post now" uploads and publishes a whole carousel inside the request.
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Instagram post — Studio",
  robots: { index: false, follow: false },
};

export default async function InstagramPostPage({
  params,
  searchParams,
}: PageProps<"/kalaja-cabb0da6/instagram/[postId]">) {
  await requireUser();
  const { postId } = await params;
  const { error, notice } = await searchParams;

  const post = await getInstagramPost(postId);
  if (!post) notFound();

  const [account, content] = await Promise.all([
    getConnectedAccount(),
    post.content_type && post.content_id ? getContentById(post.content_type, post.content_id) : null,
  ]);
  const contentTitle =
    content && post.content_type
      ? String((content as unknown as Record<string, unknown>)[CONTENT_CONFIG[post.content_type].titleField] ?? "")
      : "";
  const backHref =
    post.content_type && post.content_id
      ? `/kalaja-cabb0da6/${post.content_type}/${post.content_id}/instagram`
      : "/kalaja-cabb0da6/instagram";

  const locked = post.status === "published" || post.status === "publishing";
  const aspectClass = ig[`aspect_${post.aspect}`];

  return (
    <div className={styles.wrap}>
      <div className={styles.backRow}>
        <BackLink href={backHref} label={contentTitle || "Instagram"} />
      </div>

      <div className={styles.toolbar}>
        <h1 className={styles.title}>Instagram post</h1>
        <StatusBadge status={post.status} />
      </div>

      <div className={styles.form}>
        {contentTitle && post.content_type && (
          <p className={styles.help}>
            For the {CONTENT_CONFIG[post.content_type].label.toLowerCase()}{" "}
            <Link href={`/kalaja-cabb0da6/${post.content_type}/${post.content_id}`}>{contentTitle}</Link>
          </p>
        )}
        {typeof error === "string" && <div className={styles.error}>{error}</div>}
        {typeof notice === "string" && <div className={ig.notice}>{notice}</div>}
        {post.status === "failed" && post.error && error !== post.error && (
          <div className={styles.error}>Last attempt failed: {post.error}</div>
        )}

        {locked ? (
          <PublishedView post={post} aspectClass={aspectClass} />
        ) : (
          <form action={saveInstagramPost} className={styles.form}>
            <input type="hidden" name="id" value={post.id} />
            <button type="submit" name="intent" value="save" className={ig.defaultSubmit} tabIndex={-1} aria-hidden="true" />

            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Images · {post.images.length === 1 ? "single post" : `carousel of ${post.images.length}`}
              </div>
              {post.images.length > 0 && (
                <div className={ig.imageGrid}>
                  {post.images.map((image, i) => (
                    <div key={image.path} className={ig.imageCard}>
                      <div className={`${ig.preview} ${aspectClass}`}>
                        <span className={ig.imageNumber}>{i + 1}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element -- Studio preview of the exact crop */}
                        <img src={image.url} alt={image.alt} />
                      </div>
                      <div className={ig.imageTools}>
                        <SubmitButton name="intent" value={`up:${i}`} className={`${styles.button} ${ig.iconButton}`} disabled={i === 0} aria-label="Move earlier" title="Move earlier">
                          ←
                        </SubmitButton>
                        <SubmitButton name="intent" value={`down:${i}`} className={`${styles.button} ${ig.iconButton}`} disabled={i === post.images.length - 1} aria-label="Move later" title="Move later">
                          →
                        </SubmitButton>
                        <SubmitButton name="intent" value={`remove:${i}`} className={`${styles.button} ${styles.buttonDanger} ${ig.iconButton}`} aria-label="Remove image" title="Remove image">
                          ✕
                        </SubmitButton>
                      </div>
                      <div className={ig.smallField}>
                        <label htmlFor={`tags_${i}`}>Tag people</label>
                        <input id={`tags_${i}`} name={`tags_${i}`} type="text" placeholder="@username @another" defaultValue={image.tags.map((t) => `@${t}`).join(" ")} />
                      </div>
                      <div className={ig.smallField}>
                        <label htmlFor={`alt_${i}`}>Alt text</label>
                        <input id={`alt_${i}`} name={`alt_${i}`} type="text" maxLength={1000} placeholder="What the image shows" defaultValue={image.alt} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {post.images.length < MAX_IMAGES && (
                <div className={styles.field}>
                  <label htmlFor="images">Add images</label>
                  <input id="images" name="images" type="file" accept="image/*" multiple />
                  <span className={styles.help}>Added when you press any button below. Up to {MAX_IMAGES} in total.</span>
                </div>
              )}
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Shape</span>
                <div className={ig.aspectPicker}>
                  {(Object.keys(INSTAGRAM_ASPECTS) as InstagramAspect[]).map((key) => (
                    <label key={key} className={ig.aspectOption}>
                      <input type="radio" name="aspect" value={key} defaultChecked={post.aspect === key} />
                      {INSTAGRAM_ASPECTS[key].label}
                    </label>
                  ))}
                </div>
                <span className={styles.help}>
                  Every image is centre-cropped to this shape, as previewed above (save to update the preview). Portrait
                  takes up the most room in the feed.
                </span>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Caption</div>
              <div className={styles.field}>
                <CaptionField defaultValue={post.caption} className={styles.help} />
              </div>
              <div className={styles.actions}>
                <SubmitButton name="intent" value="ai-caption" className={styles.button} pendingText="Writing…">
                  ✨ Rewrite caption with AI
                </SubmitButton>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Location</div>
              <div className={styles.field}>
                <label htmlFor="locationName">Place name (for your reference)</label>
                <input id="locationName" name="locationName" type="text" placeholder="e.g. Krujë Castle" defaultValue={post.location_name} />
              </div>
              <div className={styles.field}>
                <label htmlFor="locationId">Location ID</label>
                <input id="locationId" name="locationId" type="text" inputMode="numeric" placeholder="e.g. 214413195" defaultValue={post.location_id} />
                <span className={styles.help}>
                  Instagram tags a location by the ID of its Facebook place page. Search the place on Facebook, open
                  its page and copy the number from the address or the page&apos;s About → Page transparency. Leave
                  empty for no location.
                </span>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Publish</div>
              {!account && (
                <div className={styles.error}>
                  <Link href="/kalaja-cabb0da6/instagram">Connect the Instagram account</Link> before scheduling or posting.
                </div>
              )}
              {post.status === "scheduled" && post.scheduled_at && (
                <p>
                  Scheduled for <strong><LocalTime iso={post.scheduled_at} /></strong>. It posts automatically; edits
                  you save before then are included.
                </p>
              )}
              <div className={styles.field}>
                <label htmlFor="scheduledAt">{post.status === "scheduled" ? "Change the time" : "Post at"}</label>
                <div className={ig.scheduleRow}>
                  <ScheduleInput id="scheduledAt" name="scheduledAt" defaultIso={post.scheduled_at} />
                </div>
              </div>
              <div className={styles.actions}>
                <SubmitButton name="intent" value="schedule" className={`${styles.button} ${styles.buttonPrimary}`} pendingText="Scheduling…">
                  {post.status === "scheduled" ? "Save & reschedule" : "Schedule"}
                </SubmitButton>
                <SubmitButton name="intent" value="publish" className={styles.button} pendingText="Posting… (up to a minute)">
                  Post now
                </SubmitButton>
                <SubmitButton name="intent" value="save" className={styles.button} pendingText="Saving…">
                  {post.status === "scheduled" ? "Save" : "Save draft"}
                </SubmitButton>
                {post.status === "scheduled" && (
                  <SubmitButton name="intent" value="unschedule" className={styles.button} pendingText="Saving…">
                    Unschedule
                  </SubmitButton>
                )}
              </div>
            </div>
          </form>
        )}

        {post.status !== "publishing" && (
          <form action={deleteInstagramPost}>
            <input type="hidden" name="id" value={post.id} />
            <SubmitButton className={`${styles.button} ${styles.buttonDanger}`} pendingText="Deleting…">
              {post.status === "published" ? "Remove from Studio (stays on Instagram)" : "Delete post"}
            </SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}

function PublishedView({
  post,
  aspectClass,
}: {
  post: NonNullable<Awaited<ReturnType<typeof getInstagramPost>>>;
  aspectClass: string;
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{post.status === "published" ? "On Instagram" : "Publishing now…"}</div>
      {post.status === "published" && (
        <p>
          Posted {post.published_at && <LocalTime iso={post.published_at} />}
          {post.permalink && (
            <>
              {" · "}
              <a href={post.permalink} target="_blank" rel="noreferrer">
                View on Instagram
              </a>
            </>
          )}
        </p>
      )}
      <div className={ig.imageGrid}>
        {post.images.map((image, i) => (
          <div key={image.path} className={`${ig.preview} ${aspectClass}`}>
            <span className={ig.imageNumber}>{i + 1}</span>
            {/* eslint-disable-next-line @next/next/no-img-element -- Studio preview */}
            <img src={image.url} alt={image.alt} />
          </div>
        ))}
      </div>
      <p className={ig.captionPreview}>{post.caption}</p>
    </div>
  );
}
