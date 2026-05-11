import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { reembedEntry } from "@/lib/embeddings";

type CheckInPayload = {
  emotion: string;
  valence: number;
  energy: number;
  sleep_hours?: number | null;
  context_tags?: string[];
  seed?: string;
  transcript?: unknown[];
};

type ThoughtRecordPayload = {
  situation?: string | null;
  automatic_thoughts?: string | null;
  distortions?: string[];
  balanced_thought?: string | null;
  outcome?: string | null;
};

type EntryRequest = {
  title?: string | null;
  body_md?: string;
  mood?: number | null;
  kind?: string;
  tags?: string[];
  check_in?: CheckInPayload;
  thought_record?: ThoughtRecordPayload;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as EntryRequest;
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

  if (body.kind === "check_in" && body.check_in) {
    const ci = body.check_in;
    const { data: ciRow, error: ciErr } = await sb
      .from("check_ins")
      .insert({
        mood: ci.valence ?? null,
        prompt: ci.seed ?? null,
        transcript: ci.transcript ?? [],
        entry_id: data.id,
      })
      .select("id")
      .single();
    if (ciErr) console.error("check_ins insert failed", ciErr);

    const { error: msErr } = await sb.from("mood_scores").insert({
      entry_id: data.id,
      check_in_id: ciRow?.id ?? null,
      emotion: ci.emotion,
      valence: ci.valence,
      energy: ci.energy,
      sleep_hours: ci.sleep_hours ?? null,
      context_tags: ci.context_tags ?? [],
    });
    if (msErr) console.error("mood_scores insert failed", msErr);
  }

  if (body.kind === "thought_record" && body.thought_record) {
    const tr = body.thought_record;
    const { error: trErr } = await sb.from("thought_records").insert({
      entry_id: data.id,
      situation: tr.situation ?? null,
      automatic_thoughts: tr.automatic_thoughts ?? null,
      distortions: tr.distortions ?? [],
      balanced_thought: tr.balanced_thought ?? null,
      outcome: tr.outcome ?? null,
    });
    if (trErr) console.error("thought_records insert failed", trErr);
  }

  // Fire-and-forget embeddings; don't block the user.
  if ((body.body_md ?? "").trim()) {
    reembedEntry(data.id, body.body_md ?? "").catch((e) => console.error("embed failed", e));
  }
  return NextResponse.json({ id: data.id });
}
