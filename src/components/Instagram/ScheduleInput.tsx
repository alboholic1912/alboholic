"use client";

import { useEffect, useRef } from "react";

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * A date-time picker in the editor's own time zone. The form receives the moment as an ISO
 * string in `name`, so the server never has to guess the time zone.
 */
export default function ScheduleInput({ id, name, defaultIso }: { id: string; name: string; defaultIso: string | null }) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLSpanElement>(null);

  const sync = () => {
    const local = pickerRef.current?.value;
    if (valueRef.current) valueRef.current.value = local ? new Date(local).toISOString() : "";
  };

  useEffect(() => {
    // Default: the saved time, or tomorrow at 18:00, a good hour for engagement.
    const start = defaultIso ? new Date(defaultIso) : new Date();
    if (!defaultIso) {
      start.setDate(start.getDate() + 1);
      start.setHours(18, 0, 0, 0);
    }
    if (pickerRef.current) {
      pickerRef.current.value = toLocalInput(start);
      pickerRef.current.min = toLocalInput(new Date());
    }
    sync();
    if (zoneRef.current) zoneRef.current.textContent = `Your time zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
  }, [defaultIso]);

  return (
    <>
      <input ref={pickerRef} id={id} type="datetime-local" onChange={sync} />
      <input ref={valueRef} type="hidden" name={name} />
      <span ref={zoneRef} />
    </>
  );
}
