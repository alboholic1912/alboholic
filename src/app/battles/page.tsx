import type { Viewport } from "next";
import BattleMap from "@/components/BattleMap/BattleMap";
import { getBattles } from "@/lib/content/public";
import { pageMetadata } from "@/lib/site";

export const revalidate = 60;

export const metadata = pageMetadata({
  title: "Battles",
  description: "A map of the battles in Albanian history: where they were fought, who fought and how they ended.",
  path: "/battles",
});

// The map runs edge to edge on phones, so the page lays itself out around the notch and home bar.
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#050303",
};

export default async function MapPage() {
  const battles = await getBattles();

  return <BattleMap battles={battles} />;
}
