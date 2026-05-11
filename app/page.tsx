import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Screen, TopBar, Card, Display, Heading, Body, Meta, MoodDot, TabBar } from "@/components/ui";
import { QUADRANT_COLORS } from "@/lib/emotions";

export const dynamic = "force-dynamic";

async function loadDashboard() {
  const sb = supabase();
  const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString();

  const [themesRes, datesRes] = await Promise.all([
    sb
      .from("themes")
      .select("id,period_start,period_end,summary_md,generated_at")
      .order("generated_at", { ascending: false })
      .limit(1),
    sb
      .from("entries")
      .select("created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false }),
  ]);

  const datesSet = new Set<string>();
  for (const r of datesRes.data ?? []) {
    datesSet.add(new Date(r.created_at).toISOString().slice(0, 10));
  }

  // 14-day ribbon: oldest → today
  const ribbon: boolean[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    ribbon.push(datesSet.has(d.toISOString().slice(0, 10)));
  }

  // Streak: consecutive days ending today (or yesterday if today blank)
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (datesSet.has(key)) streak++;
    else if (i === 0) continue;
    else break;
  }

  // Entries this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  let thisMonth = 0;
  for (const day of datesSet) if (day >= monthStart) thisMonth++;

  return { latestTheme: themesRes.data?.[0] ?? null, streak, thisMonth, ribbon };
}

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 5) return "Still up.";
  if (h < 12) return "Good morning.";
  if (h < 17) return "Good afternoon.";
  if (h < 21) return "Good evening.";
  return "Late night.";
}

export default async function HomePage() {
  let data: Awaited<ReturnType<typeof loadDashboard>> | null = null;
  let error: string | null = null;
  try {
    data = await loadDashboard();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const now = new Date();
  const dayMeta = now
    .toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
    .toUpperCase()
    .replace(",", " ·");

  const ribbon = data?.ribbon ?? Array(14).fill(false);

  return (
    <Screen>
      <TopBar left="trace" />

      <div>
        <Meta>{dayMeta}</Meta>
        <Display size={36} style={{ marginTop: 4 }}>
          {greeting(now)}
        </Display>
      </div>

      {error && (
        <Card>
          <Meta>ERROR</Meta>
          <Body size={13} style={{ marginTop: 4 }}>
            {error}
          </Body>
        </Card>
      )}

      {/* streak card */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <Meta>STREAK</Meta>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
              <Display size={28}>{data?.streak ?? 0}</Display>
              <Body soft size={13}>
                {data?.streak === 1 ? "day" : "days"} · {data?.thisMonth ?? 0} this month
              </Body>
            </div>
          </div>
          <Meta>14d ▾</Meta>
        </div>
        <div style={{ display: "flex", gap: 3, marginTop: 12 }}>
          {ribbon.map((f, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 22,
                borderRadius: 4,
                background: f ? "var(--color-ink)" : "var(--color-surface-soft)",
                border: f ? "none" : "1px solid var(--color-ink-line)",
                position: "relative",
              }}
            >
              {i === 13 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 4,
                    boxShadow:
                      "0 0 0 2px var(--color-paper), 0 0 0 3px var(--color-accent)",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* mood pulse */}
      <Link href="/check-in?mode=log" style={{ textDecoration: "none" }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Heading>How&apos;s the morning?</Heading>
            <Meta>quick log →</Meta>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
            {(
              [
                { color: QUADRANT_COLORS.blue, label: "low" },
                { color: QUADRANT_COLORS.green, label: "calm" },
                { color: QUADRANT_COLORS.yellow, label: "high" },
                { color: QUADRANT_COLORS.red, label: "tense", ring: true },
              ] as const
            ).map((d, i) => (
              <div
                key={i}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
              >
                <MoodDot color={d.color} size={28} ring={"ring" in d ? d.ring : false} />
                <div
                  style={{
                    font: "11px var(--font-geist-sans), sans-serif",
                    color: "var(--color-ink-soft)",
                  }}
                >
                  {d.label}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Link>

      {/* memory prompt */}
      <Card accent>
        <Meta accent>
          ✦ FROM MEMORY
          {data?.latestTheme?.period_end
            ? ` · ${new Date(data.latestTheme.period_end)
                .toLocaleDateString(undefined, { month: "short", day: "numeric" })
                .toUpperCase()}`
            : ""}
        </Meta>
        <Body size={14} style={{ marginTop: 6, lineHeight: 1.45 }}>
          {data?.latestTheme?.summary_md
            ? data.latestTheme.summary_md.split("\n")[0]
            : "Your reflections will surface here once you've journaled a few days."}
        </Body>
      </Card>

      {/* quick actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <Link
          href="/entries/new?mode=quick"
          style={{ flex: 1, textDecoration: "none" }}
        >
          <Card style={{ padding: 14, textAlign: "center" }}>
            <Meta>30 SEC</Meta>
            <Heading style={{ marginTop: 4 }}>+ daily note</Heading>
          </Card>
        </Link>
        <Link
          href="/entries/new?mode=detailed"
          style={{ flex: 1, textDecoration: "none" }}
        >
          <Card style={{ padding: 14, textAlign: "center" }}>
            <Meta>3 MIN</Meta>
            <Heading style={{ marginTop: 4 }}>+ deep entry</Heading>
          </Card>
        </Link>
      </div>

      <TabBar active={0} />
    </Screen>
  );
}
