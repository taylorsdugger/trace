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

const ENTRY_KINDS = ["journal", "check_in", "thought_record"] as const;
type EntryKind = (typeof ENTRY_KINDS)[number];

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
  const kind: EntryKind = (ENTRY_KINDS as readonly string[]).includes(body.kind ?? "")
    ? (body.kind as EntryKind)
    : "journal";

  const sb = supabase();
  const warnings: string[] = [];
  const { data, error } = await sb
    .from("entries")
    .insert({
      title: body.title ?? null,
      body_md: body.body_md ?? "",
      mood: body.mood ?? null,
      kind,
      tags: body.tags ?? [],
    })
    .select("id")
    .single();
  if (error || !data) return NextResponse.json({ error: error?.message ?? "insert failed" }, { status: 500 });

  if (kind === "check_in" && body.check_in) {
    const ci = body.check_in;
    const { data: ciRow, error: ciErr } = await sb
      .from("check_ins")
      .insert({
        mood: body.mood ?? null,
        prompt: ci.seed ?? null,
        transcript: ci.transcript ?? [],
        entry_id: data.id,
      })
      .select("id")
      .single();
    if (ciErr) warnings.push(`check_ins: ${ciErr.message}`);

    const { error: msErr } = await sb.from("mood_scores").insert({
      entry_id: data.id,
      check_in_id: ciRow?.id ?? null,
      emotion: ci.emotion,
      valence: ci.valence,
      energy: ci.energy,
      sleep_hours: ci.sleep_hours ?? null,
      context_tags: ci.context_tags ?? [],
    });
    if (msErr) warnings.push(`mood_scores: ${msErr.message}`);
  }

  if (kind === "thought_record" && body.thought_record) {
    const tr = body.thought_record;
    const { error: trErr } = await sb.from("thought_records").insert({
      entry_id: data.id,
      situation: tr.situation ?? null,
      automatic_thoughts: tr.automatic_thoughts ?? null,
      distortions: tr.distortions ?? [],
      balanced_thought: tr.balanced_thought ?? null,
      outcome: tr.outcome ?? null,
    });
    if (trErr) warnings.push(`thought_records: ${trErr.message}`);
  }

  if ((body.body_md ?? "").trim()) {
    reembedEntry(data.id, body.body_md ?? "").catch((e) => console.error("embed failed", e));
  }
  return NextResponse.json(warnings.length ? { id: data.id, warnings } : { id: data.id });
}
