import Hero from "@/components/Hero/Hero";
import LatestStories from "@/components/LatestStories/LatestStories";
import PeopleSection from "@/components/PeopleSection/PeopleSection";
import PeriodsSection from "@/components/PeriodsSection/PeriodsSection";

export default function Home() {
  return (
    <>
      <Hero />
      <LatestStories />
      <PeopleSection />
      <PeriodsSection />
    </>
  );
}
