import styles from "./studio.module.css";

/**
 * Shown the moment a Studio link is clicked, while the next page loads its data, so a click
 * never looks like it did nothing.
 */
export default function StudioLoading() {
  return (
    <div className={styles.wrap} aria-busy="true" aria-label="Loading">
      <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${styles.skeleton} ${styles.skeletonCard}`} />
        ))}
      </div>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className={`${styles.skeleton} ${styles.skeletonRow}`} />
      ))}
    </div>
  );
}
