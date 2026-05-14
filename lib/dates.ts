export const TZ_COOKIE = "trace_tz";

export function dayKey(d: Date | string, tz?: string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (tz) {
    // en-CA formats YYYY-MM-DD
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfLocalDay(d: Date = new Date()): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function endOfLocalDay(d: Date = new Date()): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

export function formatShortDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date
    .toLocaleDateString(undefined, { month: "short", day: "numeric" })
    .toUpperCase();
}

export function formatLongDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
