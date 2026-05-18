import { supabase } from "@/lib/supabase";
import { chat } from "@/lib/openrouter";
import { THEMES_SYSTEM } from "@/lib/prompts";
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
