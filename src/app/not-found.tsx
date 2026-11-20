import type { Metadata } from "next";
import Link from "next/link";
import StatusPage, { statusAction, statusActionQuiet } from "@/components/StatusPage/StatusPage";

export const metadata: Metadata = {
  title: "Page not found — Alboholic",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <StatusPage
      eyebrow="404"
      title="This page is lost to history"
      description="The page you were looking for doesn't exist, or it has moved. The stories are still where you left them."
    >
      <Link href="/stories" className={statusAction}>
        Explore the Stories
      </Link>
      <Link href="/" className={statusActionQuiet}>
        Back to Home
      </Link>
    </StatusPage>
  );
}
