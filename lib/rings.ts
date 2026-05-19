import { supabase } from "@/lib/supabase";
import { chat } from "@/lib/openrouter";
import { THEMES_SYSTEM, THEMES_MERGE_SYSTEM } from "@/lib/prompts";
import { dayKey } from "@/lib/dates";

export type RingWindow = "7d" | "30d" | "since-last";
export type RingSource = "auto" | "manual";

export type GenerateRingResult =
  | { ok: true; id: string; entries: number }
  | { ok: true; skipped: string }
  | { ok: false; error: string };

export async function generateRing(opts: {
  window?: RingWindow;
  source?: RingSource;
}): Promise<GenerateRingResult> {
  const window: RingWindow = opts.window ?? "since-last";
  const source: RingSource = opts.source ?? "auto";

  const sb = supabase();
  const end = new Date();

  const { data: lastTheme } = await sb
    .from("themes")
    .select("generated_at")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const start = computeStart(window, end, lastTheme?.generated_at ?? null);
  const windowDays = window === "7d" ? 7 : window === "30d" ? 30 : null;

  const { data: entries, error } = await sb
    .from("entries")
    .select("created_at,title,body_md,kind")
    .gte("created_at", start.toISOString())
    .order("created_at", { ascending: true });
  if (error) return { ok: false, error: error.message };
  if (!entries || entries.length === 0) {
    return { ok: true, skipped: "no entries in window" };
  }

  const corpus = entries
    .map(
      (e) =>
        `### ${new Date(e.created_at).toLocaleDateString()} — ${e.title ?? "(untitled)"} [${e.kind}]\n${e.body_md}`,
    )
    .join("\n\n---\n\n");

  const summary = await chat(
    [
      { role: "system", content: THEMES_SYSTEM },
      { role: "user", content: corpus.slice(0, 24000) },
    ],
    { temperature: 0.4 },
  );

  const top_distortions = extractDistortions(summary);

  const { data: inserted, error: insertErr } = await sb
    .from("themes")
    .insert({
      period_start: dayKey(start),
      period_end: dayKey(end),
      summary_md: summary,
      top_distortions: top_distortions.slice(0, 10),
      source,
      window_days: windowDays,
    })
    .select("id")
    .single();
  if (insertErr) return { ok: false, error: insertErr.message };

  return { ok: true, id: inserted.id, entries: entries.length };
}

function computeStart(window: RingWindow, end: Date, lastGeneratedAt: string | null): Date {
  const sevenDaysAgo = new Date(end.getTime() - 7 * 86400 * 1000);
  if (window === "7d") return sevenDaysAgo;
  if (window === "30d") return new Date(end.getTime() - 30 * 86400 * 1000);
  // since-last: cover "since last ring" OR "last 7d", whichever is wider.
  const lastAnchor = lastGeneratedAt ? new Date(lastGeneratedAt) : null;
  return lastAnchor && lastAnchor < sevenDaysAgo ? lastAnchor : sevenDaysAgo;
}

export async function hideRing(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase()
    .from("themes")
    .update({ hidden_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function mergeRings(
  ids: string[],
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const sb = supabase();
  const { data: rings, error } = await sb
    .from("themes")
    .select("id,period_start,period_end,summary_md,top_distortions,window_days")
    .in("id", ids);
  if (error) return { ok: false, error: error.message };
  if (!rings || rings.length < 2) return { ok: false, error: "rings not found" };

  // All inputs must share the same date range — merge is meant for
  // duplicate/overlapping walks, not for combining different windows.
  const periodStart = rings[0].period_start;
  const periodEnd = rings[0].period_end;
  for (const r of rings) {
    if (r.period_start !== periodStart || r.period_end !== periodEnd) {
      return { ok: false, error: "rings cover different date ranges" };
    }
  }

  const corpus = rings
    .map((r, i) => `### ring ${i + 1}\n${r.summary_md}`)
    .join("\n\n---\n\n");

  const summary = await chat(
    [
      { role: "system", content: THEMES_MERGE_SYSTEM },
      { role: "user", content: corpus.slice(0, 24000) },
    ],
    { temperature: 0.4 },
  );

  const top_distortions = extractDistortions(summary);
  const mergedDistortions = top_distortions.length
    ? top_distortions
    : Array.from(new Set(rings.flatMap((r) => r.top_distortions ?? [])));
  const windowDays = rings.find((r) => r.window_days)?.window_days ?? null;

  const { data: inserted, error: insertErr } = await sb
    .from("themes")
    .insert({
      period_start: periodStart,
      period_end: periodEnd,
      summary_md: summary,
      top_distortions: mergedDistortions.slice(0, 10),
      source: "manual",
      window_days: windowDays,
    })
    .select("id")
    .single();
  if (insertErr) return { ok: false, error: insertErr.message };

  const now = new Date().toISOString();
  const { error: hideErr } = await sb
    .from("themes")
    .update({ hidden_at: now })
    .in("id", ids);
  if (hideErr) return { ok: false, error: hideErr.message };

  return { ok: true, id: inserted.id };
}

function extractDistortions(summary: string): string[] {
  const match = summary.match(/distortion[s]?:?[\s\S]*?(?:\n\n|$)/i);
  if (!match) return [];
  const out: string[] = [];
  for (const line of match[0].split("\n")) {
    const m = line.match(/^\s*[-*]\s*([^—:(]+)/);
    if (m) out.push(m[1].trim().toLowerCase());
  }
  return out;
}
