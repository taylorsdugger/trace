import { dayKey } from "./dates";

// Returns YYYY-MM-DD for the Monday of the week containing `date` (in `tz`),
// and an array of 7 day keys starting from that Monday.
export function weekDays(date: Date, tz?: string): string[] {
  // Find Monday in the user's tz. Use Intl to read weekday in tz.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  });
  // We walk backwards day-by-day until we hit Monday.
  // (Cheap: at most 6 iterations.)
  const probe = new Date(date);
  for (let i = 0; i < 7; i++) {
    if (fmt.format(probe) === "Mon") break;
    probe.setUTCDate(probe.getUTCDate() - 1);
  }
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(probe);
    d.setUTCDate(d.getUTCDate() + i);
    out.push(dayKey(d, tz));
  }
  return out;
}

export function shiftWeek(weekStartIso: string, delta: number): string {
  const [y, m, d] = weekStartIso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta * 7);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function rangeBounds(days: string[]): { from: string; to: string } {
  return { from: days[0], to: days[days.length - 1] };
}

// ISO date → "Mon", "Tue", etc. (UTC parsed, displayed as the actual weekday).
export function weekdayShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(dt);
}

export function dayOfMonth(iso: string): number {
  return Number(iso.split("-")[2]);
}
