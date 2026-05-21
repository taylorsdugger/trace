import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Step, StepPatch } from "@/lib/steps";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as StepPatch;
  const sb = supabase();

  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.status !== undefined) {
    patch.status = body.status;
    patch.walked_at = body.status === "walked" ? new Date().toISOString() : null;
  }
  if (body.due_date !== undefined) patch.due_date = body.due_date;
  if (body.position !== undefined) patch.position = body.position;
  if (body.estimate !== undefined) patch.estimate = body.estimate;
  if (body.tag !== undefined) patch.tag = body.tag;
  if (body.notes_md !== undefined) patch.notes_md = body.notes_md;

  const { data, error } = await sb
    .from("steps")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "update failed" }, { status: 500 });
  }
  return NextResponse.json({ step: data as Step });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = supabase();
  const { error } = await sb.from("steps").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
