import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { chat } from "@/lib/openrouter";
import { THEMES_SYSTEM } from "@/lib/prompts";
import { dayKey } from "@/lib/dates";

export async function POST() {
  return run();
}

export async function GET() {
  return run();
}

async function run() {
  const sb = supabase();
  const end = new Date();

  const { data: lastTheme } = await sb
    .from("themes")
    .select("period_end,generated_at")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sevenDaysAgo = new Date(end.getTime() - 7 * 86400 * 1000);
  const lastAnchor = lastTheme?.generated_at
    ? new Date(lastTheme.generated_at)
    : null;
  // Window covers "since the last time I themed" OR "last 7 days", whichever is wider.
  const start = lastAnchor && lastAnchor < sevenDaysAgo ? lastAnchor : sevenDaysAgo;

  const { data: entries, error } = await sb
    .from("entries")
    .select("created_at,title,body_md,mood,kind")
    .gte("created_at", start.toISOString())
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!entries || entries.length === 0) {
    return NextResponse.json({ ok: true, skipped: "no entries in window" });
  }

  const corpus = entries
    .map((e) => `### ${new Date(e.created_at).toLocaleDateString()} — ${e.title ?? "(untitled)"} [mood ${e.mood ?? "?"}/10, kind ${e.kind}]\n${e.body_md}`)
    .join("\n\n---\n\n");

  const summary = await chat(
    [
      { role: "system", content: THEMES_SYSTEM },
      { role: "user", content: corpus.slice(0, 24000) },
    ],
    { temperature: 0.4 },
  );

  const distortionMatch = summary.match(/distortion[s]?:?[\s\S]*?(?:\n\n|$)/i);
  const top_distortions: string[] = [];
  if (distortionMatch) {
    for (const line of distortionMatch[0].split("\n")) {
      const m = line.match(/^\s*[-*]\s*([^—:(]+)/);
      if (m) top_distortions.push(m[1].trim().toLowerCase());
    }
  }

  const { error: insertErr } = await sb.from("themes").insert({
    period_start: dayKey(start),
    period_end: dayKey(end),
    summary_md: summary,
    top_distortions: top_distortions.slice(0, 10),
  });
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, entries: entries.length });
}
