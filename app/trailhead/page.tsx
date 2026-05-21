import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { TZ_COOKIE, dayKey } from "@/lib/dates";
import { weekDays, shiftWeek } from "@/lib/week";
import { loadDayMeta } from "@/lib/dayMeta";
import type { Step } from "@/lib/steps";
import { Trailhead } from "./Trailhead";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ week?: string }>;

export default async function TrailheadPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const tz = (await cookies()).get(TZ_COOKIE)?.value;
  const today = dayKey(new Date(), tz);

  // Resolve which week to show. ?week=YYYY-MM-DD pins the Monday; otherwise this week.
  const baseDate = sp.week ? new Date(`${sp.week}T12:00:00Z`) : new Date();
  const days = weekDays(baseDate, tz);
  const from = days[0];
  const to = days[days.length - 1];

  const sb = supabase();
  const [plantedRes, unplantedRes, dayMeta] = await Promise.all([
    sb
      .from("steps")
      .select("*")
      .gte("due_date", from)
      .lte("due_date", to)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    sb
      .from("steps")
      .select("*")
      .is("due_date", null)
      .neq("status", "let_rest")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    loadDayMeta(days, tz),
  ]);

  return (
    <Trailhead
      today={today}
      days={days}
      prevWeek={shiftWeek(from, -1)}
      nextWeek={shiftWeek(from, 1)}
      initialPlanted={(plantedRes.data ?? []) as Step[]}
      initialUnplanted={(unplantedRes.data ?? []) as Step[]}
      dayMeta={dayMeta}
    />
  );
}
