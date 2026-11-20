"use client";

import { useEffect, useRef } from "react";

const FORMAT: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };

/** A time shown in the viewer's own time zone. The server renders it in UTC until the browser takes over. */
export default function LocalTime({ iso }: { iso: string }) {
  const ref = useRef<HTMLTimeElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.textContent = new Date(iso).toLocaleString(undefined, FORMAT);
  }, [iso]);

  return (
    <time ref={ref} dateTime={iso}>
      {new Date(iso).toLocaleString("en-GB", { ...FORMAT, timeZone: "UTC" })} UTC
    </time>
  );
}
