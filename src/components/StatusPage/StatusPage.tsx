import type { ReactNode } from "react";
import styles from "./StatusPage.module.css";

/** A short, centred message that stands in for a page: not found, or something went wrong. */
export default function StatusPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  /** The ways out: links or buttons, styled with `statusAction` / `statusActionQuiet`. */
  children: ReactNode;
}) {
  return (
    <div className={`container ${styles.root}`}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      <div className={styles.actions}>{children}</div>
    </div>
  );
}

export const statusAction = styles.action;
export const statusActionQuiet = `${styles.action} ${styles.quiet}`;
