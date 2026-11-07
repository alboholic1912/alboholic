"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ShareButton.module.css";

/**
 * Shares a page. Phones and tablets get their own share menu (WhatsApp, Instagram, Messages…);
 * computers copy the link instead and say so for a moment.
 */
export default function ShareButton({
  path,
  title,
  className,
}: {
  /** The page to share, e.g. "/stories/besa". */
  path: string;
  title: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    const touch = window.matchMedia("(pointer: coarse)").matches;

    if (touch && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Closing the share menu isn't a failure; anything else falls back to copying.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    if (await copy(url)) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button type="button" className={[styles.button, className].filter(Boolean).join(" ")} onClick={share}>
      {copied ? <CheckIcon /> : <ShareIcon />}
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers, or clipboard access blocked: copy through a hidden text field.
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  }
}

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
