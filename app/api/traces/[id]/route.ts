import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { reembedEntry } from "@/lib/embeddings";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const sb = supabase();
  const patch: Record<string, unknown> = {};
  if ("title" in body) patch.title = body.title;
  if ("body_md" in body) patch.body_md = body.body_md ?? "";
  if ("mood" in body) patch.mood = body.mood;
  if ("tags" in body) patch.tags = body.tags ?? [];
  const { error } = await sb.from("entries").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (typeof body.body_md === "string" && body.body_md.trim()) {
    reembedEntry(id, body.body_md).catch((e) => console.error("embed failed", e));
  }
  return NextResponse.json({ id });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase().from("entries").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
