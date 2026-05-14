import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Returns the most recent non-null sleep_hours from check-ins whose entry was
// created within the [start, end] window (passed as ISO timestamps representing
// the user's local day boundaries).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ error: "start and end required" }, { status: 400 });
  }
  const sb = supabase();
  const { data, error } = await sb
    .from("entries")
    .select("id, created_at, mood_scores(sleep_hours)")
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sleep_hours: number | null = null;
  for (const row of (data ?? []) as Array<{ mood_scores: { sleep_hours: number | null }[] | null }>) {
    const ms = row.mood_scores;
    if (!ms || ms.length === 0) continue;
    const v = ms[0]?.sleep_hours;
    if (v != null) {
      sleep_hours = v;
      break;
    }
  }
  return NextResponse.json({ sleep_hours });
}
