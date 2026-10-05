import BattlesSection from "@/components/BattlesSection/BattlesSection";
import Hero from "@/components/Hero/Hero";
import LatestStories from "@/components/LatestStories/LatestStories";
import PeopleSection from "@/components/PeopleSection/PeopleSection";
import { getFeaturedStories } from "@/lib/content/public";

export const revalidate = 60;

export default async function Home() {
  const featuredStories = await getFeaturedStories();

  return (
    <>
      <Hero stories={featuredStories} />
      <LatestStories />
      <PeopleSection />
      <BattlesSection />
    </>
  );
}
