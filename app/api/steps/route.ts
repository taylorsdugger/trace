import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Step, StepInput } from "@/lib/steps";

export const dynamic = "force-dynamic";

// GET /api/steps?from=YYYY-MM-DD&to=YYYY-MM-DD&include=unplanted
// Returns steps in [from, to] (inclusive on due_date). If include=unplanted,
// also returns steps with null due_date.
export async function GET(req: NextRequest) {
  const sb = supabase();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const includeUnplanted = searchParams.get("include") === "unplanted";

  const plantedQuery = sb
    .from("steps")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (from) plantedQuery.gte("due_date", from);
  if (to) plantedQuery.lte("due_date", to);

  const planted = await plantedQuery;
  if (planted.error) {
    return NextResponse.json({ error: planted.error.message }, { status: 500 });
  }
  let unplanted: Step[] = [];
  if (includeUnplanted) {
    const u = await sb
      .from("steps")
      .select("*")
      .is("due_date", null)
      .neq("status", "let_rest")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (u.error) return NextResponse.json({ error: u.error.message }, { status: 500 });
    unplanted = (u.data ?? []) as Step[];
  }
  return NextResponse.json({
    planted: (planted.data ?? []) as Step[],
    unplanted,
  });
}

// POST /api/steps  { title, due_date?, estimate?, tag?, notes_md? }
export async function POST(req: NextRequest) {
  const body = (await req.json()) as StepInput;
  const title = (body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const sb = supabase();
  // Append: position = max(position)+1 in the same bucket (due_date or null).
  const bucket = body.due_date ?? null;
  const maxQuery = sb.from("steps").select("position").order("position", { ascending: false }).limit(1);
  if (bucket === null) maxQuery.is("due_date", null);
  else maxQuery.eq("due_date", bucket);
  const maxRes = await maxQuery;
  const nextPos = ((maxRes.data?.[0]?.position as number | undefined) ?? -1) + 1;

  const { data, error } = await sb
    .from("steps")
    .insert({
      title,
      due_date: bucket,
      estimate: body.estimate ?? null,
      tag: body.tag ?? null,
      notes_md: body.notes_md ?? null,
      position: nextPos,
    })
    .select("*")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "insert failed" }, { status: 500 });
  }
  return NextResponse.json({ step: data as Step });
}
