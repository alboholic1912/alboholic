import type { Metadata, Viewport } from "next";
import { unstable_cache } from "next/cache";
import BattleMap from "@/components/BattleMap/BattleMap";
import { getBattles } from "@/lib/content/public";
import { pageMetadata } from "@/lib/site";

export const revalidate = 60;

// Reading ?battle= for link previews makes this page render per visit, so the battles
// themselves are cached here to keep the map as quick as before.
const getCachedBattles = unstable_cache(getBattles, ["battles"], { revalidate: 60 });

const DEFAULT_METADATA = {
  title: "Battles",
  description: "A map of the battles in Albanian history: where they were fought, who fought and how they ended.",
  path: "/battles",
};

/** A shared link to one battle (/battles?battle=slug) previews that battle, not the whole map. */
export async function generateMetadata({ searchParams }: PageProps<"/battles">): Promise<Metadata> {
  const { battle: slug } = await searchParams;
  const battle =
    typeof slug === "string" ? (await getCachedBattles()).find((item) => item.slug === slug) : undefined;

  if (!battle) {
    return pageMetadata(DEFAULT_METADATA);
  }

  return pageMetadata({
    title: battle.name,
    description: battle.summary || [battle.date, battle.location].filter(Boolean).join(" · ") || DEFAULT_METADATA.description,
    path: `/battles?battle=${encodeURIComponent(battle.slug)}`,
    image: battle.image ? { url: battle.image, alt: battle.name } : undefined,
  });
}

// The map runs edge to edge on phones, so the page lays itself out around the notch and home bar.
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#050303",
};

export default async function MapPage() {
  const battles = await getCachedBattles();

  return <BattleMap battles={battles} />;
}
