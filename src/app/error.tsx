"use client";

import { useEffect } from "react";
import Link from "next/link";
import StatusPage, { statusAction, statusActionQuiet } from "@/components/StatusPage/StatusPage";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      eyebrow="Something went wrong"
      title="We couldn't load this page"
      description="This is a problem on our side, and it is usually a brief one. Try again in a moment."
    >
      <button type="button" className={statusAction} onClick={() => retry()}>
        Try again
      </button>
      <Link href="/" className={statusActionQuiet}>
        Back to Home
      </Link>
    </StatusPage>
  );
}
