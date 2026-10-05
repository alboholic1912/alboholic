import styles from "./PageBanner.module.css";

type PageBannerProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export default function PageBanner({ eyebrow, title, description }: PageBannerProps) {
  return (
    <header className={styles.banner}>
      <div className={`container ${styles.bannerInner}`}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </div>
    </header>
  );
}
