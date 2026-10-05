import Image from "next/image";
import AiNotice from "@/components/AiNotice/AiNotice";
import styles from "./ImagePlaceholder.module.css";

type ImagePlaceholderProps = {
  tone?: "crimson" | "amber" | "stone" | "slate";
  aiImage?: boolean;
  label?: string;
  className?: string;
  src?: string;
  alt?: string;
  /** Rendered width of the slot, so the browser requests a large enough file. */
  sizes?: string;
};

export default function ImagePlaceholder({
  tone = "crimson",
  aiImage = false,
  label,
  className,
  src,
  alt = "",
  sizes = "(min-width: 960px) 33vw, (min-width: 640px) 50vw, 100vw",
}: ImagePlaceholderProps) {
  return (
    <div className={[styles.root, !src && styles[tone], className].filter(Boolean).join(" ")}>
      {src && <Image src={src} alt={alt} fill sizes={sizes} quality={90} className={styles.image} />}
      {aiImage && <AiNotice />}
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
