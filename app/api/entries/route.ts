import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { reembedEntry } from "@/lib/embeddings";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sb = supabase();
  const { data, error } = await sb
    .from("entries")
    .insert({
      title: body.title ?? null,
      body_md: body.body_md ?? "",
      mood: body.mood ?? null,
      kind: body.kind ?? "journal",
      tags: body.tags ?? [],
    })
    .select("id")
    .single();
  if (error || !data) return NextResponse.json({ error: error?.message ?? "insert failed" }, { status: 500 });

  // Fire-and-forget embeddings; don't block the user.
  if ((body.body_md ?? "").trim()) {
    reembedEntry(data.id, body.body_md).catch((e) => console.error("embed failed", e));
  }
  return NextResponse.json({ id: data.id });
}
