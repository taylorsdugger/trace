import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Screen, TopBar, Card, Display, Body, Meta, Btn, TabBar } from "@/components/ui";

export const dynamic = "force-dynamic";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

async function loadReflection() {
  const sb = supabase();
  const since = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const [themesRes, entriesRes] = await Promise.all([
    sb
      .from("themes")
      .select("id,period_start,period_end,summary_md,top_distortions,generated_at")
      .order("generated_at", { ascending: false })
      .limit(1),
    sb.from("entries").select("created_at").gte("created_at", since),
  ]);

  // 7-day pattern presence
  const days: { label: string; has: boolean }[] = [];
  const dateSet = new Set<string>();
  for (const r of entriesRes.data ?? []) dateSet.add(new Date(r.created_at).toISOString().slice(0, 10));
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dow = d.getDay(); // 0 = Sun
    const label = DAY_LABELS[(dow + 6) % 7];
    days.push({ label, has: dateSet.has(d.toISOString().slice(0, 10)) });
  }
  const entryCount = days.filter((d) => d.has).length;
  return { theme: themesRes.data?.[0] ?? null, days, entryCount };
}

export default async function ReflectionPage() {
  let data: Awaited<ReturnType<typeof loadReflection>> | null = null;
  let error: string | null = null;
  try {
    data = await loadReflection();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const headline = data?.theme?.summary_md
    ? data.theme.summary_md.split("\n").slice(0, 3).join("\n")
    : "Trace will surface a pattern here\nonce you've journaled for\na few days.";
  const commonThread =
    data?.theme?.summary_md
      ?.split("\n")
      .slice(3)
      .join(" ")
      .trim() ||
    "Common threads will appear once a weekly summary has been generated.";
  const days = data?.days ?? Array(7).fill({ label: "·", has: false });

  return (
    <Screen>
      <TopBar
        left={<Link href="/" style={{ color: "inherit", textDecoration: "none" }}>← back</Link>}
        title="reflection"
        right="↗"
      />

      <div>
        <Meta accent>✦ A PATTERN</Meta>
        <Display size={32} style={{ marginTop: 6, lineHeight: 1.1, whiteSpace: "pre-line" }}>
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
          <Meta>LAST 7 DAYS</Meta>
          <Meta>{data?.entryCount ?? 0} ENTRIES</Meta>
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
                  background: d.has ? "var(--color-accent)" : "var(--color-surface-soft)",
                  border: d.has ? "none" : "1px solid var(--color-ink-line)",
                  borderRadius: 6,
                }}
              />
              <div
                style={{
                  font: "500 10px var(--font-jetbrains-mono), monospace",
                  color: "var(--color-ink-soft)",
                }}
              >
                {d.label}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Meta>COMMON THREAD</Meta>
        <Body size={14} style={{ marginTop: 6, lineHeight: 1.45 }}>
          {commonThread}
        </Body>
      </Card>

      <Card accent>
        <Meta accent>✦ A SMALL EXPERIMENT</Meta>
        <Body size={13} style={{ marginTop: 6, lineHeight: 1.45 }}>
          {data?.theme?.top_distortions?.length
            ? `Next time you notice ${data.theme.top_distortions[0]}, pause for 30 seconds and name what you're actually observing.`
            : "Pick one small experiment for the week — Trace will weigh in once it has more entries to read."}
        </Body>
      </Card>

      <div style={{ display: "flex", gap: 8 }}>
        <Btn style={{ flex: 1 }}>Not really</Btn>
        <Btn primary style={{ flex: 1 }}>
          Try this
        </Btn>
      </div>

      <TabBar active={2} />
    </Screen>
  );
}
