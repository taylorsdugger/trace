import { supabase } from "@/lib/supabase";
import { dayKey } from "@/lib/dates";
import type { Quadrant } from "@/lib/emotions";

export type DesignQuadrant = "calm" | "bright" | "low" | "sharp";

const QUADRANT_MAP: Record<Quadrant, DesignQuadrant> = {
  red: "sharp",
  yellow: "bright",
  blue: "low",
  green: "calm",
};

export type DayMeta = {
  date: string; // YYYY-MM-DD
  mood: DesignQuadrant | null;
  sleep_hours: number | null;
};

// Pull mood + sleep for a window of days. Looks up mood_scores joined to
// entries by created_at within each local-day boundary. For each day we
// take the latest mood and the latest non-null sleep_hours.
export async function loadDayMeta(days: string[], tz: string | undefined): Promise<Record<string, DayMeta>> {
  if (days.length === 0) return {};
  const first = days[0];
  const last = days[days.length - 1];
  // Build [startISO, endISO+1day) bounds for the window.
  const start = new Date(`${first}T00:00:00Z`).toISOString();
  const endDay = new Date(`${last}T00:00:00Z`);
  endDay.setUTCDate(endDay.getUTCDate() + 1);
  const end = endDay.toISOString();

  const sb = supabase();
  const { data, error } = await sb
    .from("mood_scores")
    .select("created_at, emotion, valence, energy, sleep_hours")
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: true });
  if (error) return {};

  const byDay: Record<string, DayMeta> = {};
  for (const d of days) byDay[d] = { date: d, mood: null, sleep_hours: null };

  for (const row of (data ?? []) as Array<{
    created_at: string;
    valence: number;
    energy: number;
    sleep_hours: number | null;
  }>) {
    const k = dayKey(row.created_at, tz);
    if (!byDay[k]) continue;
    // Derive quadrant from valence/energy: valence>=5 pleasant, energy>=5 high.
    const pleasant = row.valence >= 5;
    const high = row.energy >= 5;
    const q: Quadrant = pleasant ? (high ? "yellow" : "green") : high ? "red" : "blue";
    byDay[k].mood = QUADRANT_MAP[q];
    if (row.sleep_hours != null) byDay[k].sleep_hours = row.sleep_hours;
  }
  return byDay;
}
