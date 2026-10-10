import BattlesSection from "@/components/BattlesSection/BattlesSection";
import Hero from "@/components/Hero/Hero";
import JoinStrip from "@/components/JoinStrip/JoinStrip";
import LatestStories from "@/components/LatestStories/LatestStories";
import PeopleSection from "@/components/PeopleSection/PeopleSection";

export const revalidate = 60;

export default function Home() {
  return (
    <>
      <Hero />
      <LatestStories />
      <PeopleSection />
      <BattlesSection />
      <JoinStrip />
    </>
  );
}
