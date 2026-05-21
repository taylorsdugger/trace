import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Screen, TopBar, Card, Display, Body, Meta, TabBar } from "@/components/ui";
import { dayKey } from "@/lib/dates";
import { WalkNowForm } from "./WalkNowForm";

export const dynamic = "force-dynamic";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function stripMd(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}\d+\.\s+/gm, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .trim();
}

async function loadRings() {
  const sb = supabase();
  const since = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const [themesRes, entriesRes] = await Promise.all([
    sb
      .from("themes")
      .select("id,period_start,period_end,summary_md,top_distortions,generated_at")
      .is("hidden_at", null)
      .order("generated_at", { ascending: false })
      .limit(1),
    sb.from("entries").select("created_at").gte("created_at", since),
  ]);

  // 7-day pattern presence
  const days: { label: string; has: boolean }[] = [];
  const dateSet = new Set<string>();
  for (const r of entriesRes.data ?? []) dateSet.add(dayKey(r.created_at));
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dow = d.getDay(); // 0 = Sun
    const label = DAY_LABELS[(dow + 6) % 7];
    days.push({ label, has: dateSet.has(dayKey(d)) });
  }
  const entryCount = days.filter((d) => d.has).length;
  return { theme: themesRes.data?.[0] ?? null, days, entryCount };
}

export default async function RingsPage() {
  let data: Awaited<ReturnType<typeof loadRings>> | null = null;
  let error: string | null = null;
  try {
    data = await loadRings();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const cleanedLines = data?.theme?.summary_md
    ? stripMd(data.theme.summary_md)
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
    : null;
  const headline = cleanedLines
    ? cleanedLines.slice(0, 3).join("\n")
    : "nothing has come back yet.\nleave a few traces\nand cedar will listen.";
  const commonThread =
    cleanedLines?.slice(3).join(" ").trim() ||
    "common threads surface after a week of traces.";
  const days = data?.days ?? Array(7).fill({ label: "·", has: false });

  return (
    <Screen>
      <TopBar
        left={<Link href="/" style={{ color: "inherit", textDecoration: "none" }}>← back</Link>}
        title="rings"
        right={
          <Link href="/rings/all" style={{ color: "inherit", textDecoration: "none" }}>
            all ↗
          </Link>
        }
      />

      <div>
        <Meta accent>what keeps coming back</Meta>
        <Display size={20} style={{ marginTop: 6, lineHeight: 1.1, whiteSpace: "pre-line" }}>
          {headline}
        </Display>
      </div>

      {error && (
        <Card>
          <Body size={13}>{error}</Body>
        </Card>
      )}

      {/* week timeline */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Meta>last 7 days</Meta>
          <Meta>{data?.entryCount ?? 0} traces</Meta>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            height: 60,
            marginTop: 12,
          }}
        >
          {days.map((d, i) => (
            <div
              key={i}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
            >
              <div
                style={{
                  width: 16,
                  height: d.has ? 36 : 6,
                  background: d.has ? "var(--moss)" : "var(--bone)",
                  border: d.has ? "none" : "1px solid var(--hairline)",
                  borderRadius: 6,
                }}
              />
              <div
                style={{
                  font: "500 10px var(--font-mono), monospace",
                  color: "var(--ink-soft)",
                }}
              >
                {d.label}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Meta>common thread</Meta>
        <Body size={14} style={{ marginTop: 6, lineHeight: 1.45 }}>
          {commonThread}
        </Body>
      </Card>

      <Card>
        <Meta>ask cedar to listen</Meta>
        <WalkNowForm />
      </Card>

      <Card accent>
        <Meta accent>a question from cedar</Meta>
        <Body size={13} style={{ marginTop: 6, lineHeight: 1.45 }}>
          {data?.theme?.top_distortions?.length
            ? `when ${data.theme.top_distortions[0]} shows up next, what's underneath it?`
            : "no question yet. cedar listens until there's a thread to pull."}
        </Body>
      </Card>

      <TabBar active={3} />
    </Screen>
  );
}
