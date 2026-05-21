import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type ReorderItem = { id: string; due_date: string | null; position: number };

// POST /api/steps/reorder  { items: ReorderItem[] }
// Applies all updates atomically-enough: we do them in one call but Supabase
// doesn't expose a real transaction here. The set is small (one day at a time
// in practice), so loss-of-one is recoverable on next drag.
export async function POST(req: NextRequest) {
  const { items } = (await req.json()) as { items: ReorderItem[] };
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "items required" }, { status: 400 });
  }
  const sb = supabase();
  for (const it of items) {
    const { error } = await sb
      .from("steps")
      .update({ due_date: it.due_date, position: it.position })
      .eq("id", it.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
