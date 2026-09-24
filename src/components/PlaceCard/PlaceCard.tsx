import Link from "next/link";
import ImagePlaceholder from "@/components/ImagePlaceholder/ImagePlaceholder";
import type { Place } from "@/lib/mockData";
import styles from "./PlaceCard.module.css";

export default function PlaceCard({ place }: { place: Place }) {
  return (
    <Link href={`/places/${place.slug}`} className={styles.card}>
      <div className={styles.media}>
        <ImagePlaceholder tone={place.imageTone} aiImage src={place.image} alt={place.name} />
      </div>
      <div className={styles.body}>
        <span className={styles.region}>{place.region}</span>
        <h3 className={styles.name}>{place.name}</h3>
        <p className={styles.description}>{place.description}</p>
      </div>
    </Link>
  );
}
