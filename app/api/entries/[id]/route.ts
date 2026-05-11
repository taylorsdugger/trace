import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { reembedEntry } from "@/lib/embeddings";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const sb = supabase();
  const { error } = await sb
    .from("entries")
    .update({
      title: body.title ?? null,
      body_md: body.body_md ?? "",
      mood: body.mood ?? null,
      tags: body.tags ?? [],
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if ((body.body_md ?? "").trim()) {
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
