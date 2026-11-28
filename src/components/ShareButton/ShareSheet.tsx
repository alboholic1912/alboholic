"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import { copyText } from "./copyText";
import styles from "./ShareSheet.module.css";

/** How long the sheet takes to slide away (see .sheet in the CSS). */
const CLOSE_MS = 280;

// Each picture is made once per visit, so reopening the sheet shows it straight away.
const pictures = new Map<string, Promise<Blob>>();
function loadPicture(src: string) {
  let picture = pictures.get(src);
  if (!picture) {
    picture = fetch(src).then((response) => {
      if (!response.ok) throw new Error(`Story picture: ${response.status}`);
      return response.blob();
    });
    picture.catch(() => pictures.delete(src));
    pictures.set(src, picture);
  }
  return picture;
}

/** A phone or tablet whose share menu takes pictures, and so can reach Instagram. */
function canSharePictures() {
  if (!window.matchMedia("(pointer: coarse)").matches || typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [new File([""], "story.jpg", { type: "image/jpeg" })] });
  } catch {
    return false;
  }
}

type Note = "copied" | "ig-copied" | "share-failed" | null;

export type Format = "story" | "post" | "reel";

/** The three Instagram pictures, in the order the picker shows them. */
const FORMATS: Record<
  Format,
  { label: string; heading: string; share: string; width: number; ratio: string; phone: string; computer: string }
> = {
  story: {
    label: "Story",
    heading: "Instagram Story",
    share: "Share to Story",
    width: 96,
    ratio: "9 / 16",
    phone:
      "Posts this picture to your story and copies the link. In Instagram, add a Link sticker and paste it, so people can tap through.",
    computer: "Save the picture and post it from your phone. Add a Link sticker with the page’s link, so people can tap through.",
  },
  post: {
    label: "Post",
    heading: "Instagram post",
    share: "Share as post",
    width: 136,
    ratio: "4 / 5",
    phone: "Opens your share menu with this picture. Pick Instagram, then Post. The picture says where to read the rest.",
    computer: "Save the picture and post it from your phone. The picture says where to read the rest.",
  },
  reel: {
    label: "Reel",
    heading: "Instagram reel",
    share: "Share as reel",
    width: 96,
    ratio: "9 / 16",
    phone: "Opens your share menu with this picture. Pick Instagram, then Reel. The picture says where to read the rest.",
    computer: "Save the picture and post it as a reel from your phone. The picture says where to read the rest.",
  },
};

/**
 * The share options for a page: post a ready-made picture of it to an Instagram Story, post
 * or reel, or share or copy its link. A bottom sheet on phones, a small dialog on computers.
 *
 * Instagram never takes a link from a website, so sharing to a Story also copies the page's
 * address, ready to paste into a Link sticker. A website can't choose between Story, post and
 * reel either: the person picks that in Instagram, so each gets its own button and picture.
 * The picture is fetched before it is needed, because a phone only lets a page share in direct
 * response to a tap.
 */
export default function ShareSheet({
  open,
  onClose,
  url,
  title,
  pictureSrcs,
  fileName,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
  pictureSrcs: Record<Format, string>;
  /** Without the extension; the format is added, e.g. "alboholic-besa" → "alboholic-besa-post.jpg". */
  fileName: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const noteTimer = useRef<number | undefined>(undefined);
  // Only ever drawn in the browser, after the Share button is tapped.
  const [phone] = useState(canSharePictures);
  const [picture, setPicture] = useState<{ src: string; file: File; preview: string } | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [note, setNote] = useState<Note>(null);
  const [format, setFormat] = useState<Format>("story");
  const pictureSrc = pictureSrcs[format];
  const pictureName = `${fileName}-${format}.jpg`;
  const options = FORMATS[format];

  // Open with a slide up; close by sliding away first.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      window.clearTimeout(closeTimer.current);
      if (!dialog.open) {
        document.documentElement.style.overflow = "hidden";
        dialog.showModal();
        void dialog.offsetWidth;
      }
      dialog.dataset.open = "";
    } else if (dialog.open) {
      delete dialog.dataset.open;
      closeTimer.current = window.setTimeout(() => dialog.close(), CLOSE_MS);
    }
  }, [open]);

  // Make the picture while the options are on screen. It is kept while the sheet slides
  // away and comes back, and replaced if the button moves on to another page (another battle).
  useEffect(() => {
    let current = true;
    let objectUrl: string | null = null;
    loadPicture(pictureSrc).then(
      (blob) => {
        if (!current) return;
        objectUrl = URL.createObjectURL(blob);
        setPicture({
          src: pictureSrc,
          preview: objectUrl,
          file: new File([blob], pictureName, { type: blob.type || "image/jpeg" }),
        });
      },
      () => current && setFailedSrc(pictureSrc)
    );
    return () => {
      current = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [pictureSrc, pictureName, attempt]);

  // A picture of the page this sheet was showing before is no use for this one.
  const shown = picture?.src === pictureSrc ? picture : null;
  const file = shown?.file ?? null;
  const preview = shown?.preview ?? null;
  const failed = failedSrc === pictureSrc;

  // Once the first picture is in, the other two are made too, so switching is instant.
  const { story, post, reel } = pictureSrcs;
  const firstReady = Boolean(preview);
  useEffect(() => {
    if (!open || !firstReady) return;
    for (const src of [story, post, reel]) loadPicture(src).catch(() => {});
  }, [open, firstReady, story, post, reel]);

  useEffect(
    () => () => {
      window.clearTimeout(closeTimer.current);
      window.clearTimeout(noteTimer.current);
      document.documentElement.style.overflow = "";
    },
    []
  );

  function flash(next: Note, ms = 2400) {
    setNote(next);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(null), ms);
  }

  // No awaiting before navigator.share: it must run while the tap still counts.
  function sharePicture() {
    if (!file) return;
    if (format === "story") void copyText(url).then((ok) => ok && flash("ig-copied", 6000));
    navigator.share({ files: [file] }).catch((error) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      flash("share-failed", 4000);
    });
  }

  function download() {
    if (!preview) return;
    const link = document.createElement("a");
    link.href = preview;
    link.download = pictureName;
    link.click();
    if (format === "story") void copyText(url).then((ok) => ok && flash("ig-copied", 6000));
  }

  function shareLink() {
    navigator.share({ title, url }).catch(() => {});
  }

  async function copyLink() {
    if (await copyText(url)) flash("copied");
  }

  // The sheet is drawn elsewhere in the page, but its events would still reach whatever the
  // Share button sits in (the map's draggable sheet, its Escape key), so they stop here.
  const contain = (event: SyntheticEvent) => event.stopPropagation();

  const ready = Boolean(file && preview);

  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles.sheet}
      aria-labelledby="share-sheet-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        document.documentElement.style.overflow = "";
        delete dialogRef.current?.dataset.open;
        setNote(null);
        onClose();
      }}
      // A tap on the dimmed backdrop lands on the dialog itself.
      onClick={(event) => {
        contain(event);
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={contain}
      onPointerDown={contain}
      onPointerMove={contain}
      onPointerUp={contain}
      onPointerCancel={contain}
    >
      <div className={styles.panel}>
        <span className={styles.grip} aria-hidden="true" />

        <header className={styles.head}>
          <div className={styles.headText}>
            <h2 id="share-sheet-title" className={styles.title}>
              Share
            </h2>
            <p className={styles.subject}>{title}</p>
          </div>
          <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>

        <div className={styles.formats} role="group" aria-label="Instagram picture">
          {(Object.keys(FORMATS) as Format[]).map((item) => (
            <button
              key={item}
              type="button"
              className={styles.format}
              aria-pressed={item === format}
              onClick={() => {
                setFormat(item);
                setNote(null);
              }}
            >
              {FORMATS[item].label}
            </button>
          ))}
        </div>

        <section className={styles.story} aria-label={options.heading}>
          <div className={styles.preview} style={{ width: options.width, aspectRatio: options.ratio }}>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- a picture made on the fly, shown as is
              <img key={preview} src={preview} alt={`${options.heading} picture for ${title}`} />
            ) : (
              <span className={failed ? undefined : styles.shimmer} aria-hidden="true" />
            )}
          </div>

          <div className={styles.storyText}>
            <h3 className={styles.storyTitle}>
              <InstagramIcon />
              {options.heading}
            </h3>
            <p className={styles.help}>{phone ? options.phone : options.computer}</p>

            {failed ? (
              <button
                type="button"
                className={styles.retry}
                onClick={() => {
                  setFailedSrc(null);
                  setAttempt((count) => count + 1);
                }}
              >
                Couldn’t make the picture. Try again
              </button>
            ) : (
              <button
                type="button"
                className={styles.primary}
                disabled={!ready}
                aria-busy={!ready}
                onClick={phone ? sharePicture : download}
              >
                {!ready ? (
                  <>
                    <span className={styles.spinner} aria-hidden="true" />
                    Preparing picture…
                  </>
                ) : phone ? (
                  options.share
                ) : (
                  <>
                    <DownloadIcon />
                    Save picture
                  </>
                )}
              </button>
            )}
          </div>
        </section>

        <p className={styles.note} aria-live="polite">
          {note === "ig-copied" && (
            <>
              <CheckIcon /> Link copied. Paste it into a Link sticker.
            </>
          )}
          {note === "copied" && (
            <>
              <CheckIcon /> Link copied
            </>
          )}
          {note === "share-failed" && "Sharing didn’t work. Save the picture and post it from Instagram instead."}
        </p>

        <div className={styles.links}>
          {phone && typeof navigator.share === "function" && (
            <button type="button" className={styles.secondary} onClick={shareLink}>
              <ShareIcon />
              Share link
            </button>
          )}
          <button type="button" className={styles.secondary} onClick={copyLink}>
            <LinkIcon />
            Copy link
          </button>
        </div>
      </div>
    </dialog>,
    document.body
  );
}

function Icon({ children, size = 18 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function InstagramIcon() {
  return (
    <span className={styles.igBadge}>
      <Icon size={15}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
      </Icon>
    </span>
  );
}

function CloseIcon() {
  return (
    <Icon size={20}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

function DownloadIcon() {
  return (
    <Icon>
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </Icon>
  );
}

function ShareIcon() {
  return (
    <Icon>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </Icon>
  );
}

function LinkIcon() {
  return (
    <Icon>
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
    </Icon>
  );
}

function CheckIcon() {
  return (
    <Icon size={16}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}
