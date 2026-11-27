import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/dal";
import AnalyticsDashboard from "@/components/Analytics/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Analytics — Studio",
  robots: { index: false, follow: false },
};

export default async function AnalyticsPage() {
  await requireUser();
  return <AnalyticsDashboard />;
}
