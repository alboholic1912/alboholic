import AiNotice from "@/components/AiNotice/AiNotice";
import styles from "./ImagePlaceholder.module.css";

type ImagePlaceholderProps = {
  tone?: "crimson" | "amber" | "stone" | "slate";
  aiImage?: boolean;
  label?: string;
  className?: string;
};

export default function ImagePlaceholder({
  tone = "crimson",
  aiImage = false,
  label,
  className,
}: ImagePlaceholderProps) {
  return (
    <div className={[styles.root, styles[tone], className].filter(Boolean).join(" ")}>
      {aiImage && <AiNotice />}
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
