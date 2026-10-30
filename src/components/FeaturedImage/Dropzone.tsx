"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import styles from "./FeaturedImage.module.css";

type Props = {
  name: string;
  label: string;
  /** Shown as a small tag beside the label. */
  tag?: string;
  emptyText: string;
  help?: string;
  accept: string;
  /** "wide" for 3:2 story and battle images, "square" for portraits. */
  shape: "wide" | "square";
  /** An image already on file, shown until a new one is chosen. */
  existing?: { url: string; caption: string; onRemove?: () => void } | null;
  onFileChange?: (hasFile: boolean) => void;
};

/** A file input you can click or drop onto, with a preview of the chosen image. */
export default function Dropzone({ name, label, tag, emptyText, help, accept, shape, existing, onFileChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [dragging, setDragging] = useState(false);

  // Object URLs hold the file in memory until revoked.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview.url);
  }, [preview]);

  function showFile(file: File | undefined) {
    setPreview(file ? { url: URL.createObjectURL(file), name: file.name } : null);
    onFileChange?.(Boolean(file));
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    showFile(undefined);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (!file || !inputRef.current || !file.type.startsWith("image/")) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    inputRef.current.files = transfer.files;
    showFile(file);
  }

  const shown = preview ?? (existing ? { url: existing.url, name: existing.caption } : null);
  const inputId = `dropzone-${name}`;

  return (
    <div className={styles.dropField}>
      <div className={styles.fieldHead}>
        <label htmlFor={inputId} className={styles.fieldLabel}>
          {label}
        </label>
        {tag && <span className={styles.tag}>{tag}</span>}
      </div>

      <label
        htmlFor={inputId}
        className={`${styles.dropzone} ${shape === "square" ? styles.dropSquare : styles.dropWide} ${
          dragging ? styles.dropActive : ""
        } ${shown ? styles.dropFilled : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {shown ? (
          <Image src={shown.url} alt="" fill sizes="(max-width: 700px) 100vw, 360px" className={styles.dropImage} unoptimized />
        ) : (
          <span className={styles.dropEmpty}>
            <UploadIcon />
            <span>{emptyText}</span>
            <span className={styles.dropHint}>Click to choose, or drop an image here</span>
          </span>
        )}
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept={accept}
          className={styles.fileInput}
          onChange={(event) => showFile(event.target.files?.[0])}
        />
      </label>

      {shown && (
        <div className={styles.dropMeta}>
          <span className={styles.dropName} title={shown.name}>
            {shown.name}
          </span>
          {preview ? (
            <button type="button" className={styles.linkButton} onClick={clear}>
              Remove
            </button>
          ) : (
            existing?.onRemove && (
              <button type="button" className={styles.linkButton} onClick={existing.onRemove}>
                Don&apos;t use
              </button>
            )
          )}
        </div>
      )}
      {help && <p className={styles.help}>{help}</p>}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
