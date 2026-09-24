import Link from "next/link";
import styles from "./BackLink.module.css";

export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={styles.root}>
      <ArrowIcon />
      {label}
    </Link>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
