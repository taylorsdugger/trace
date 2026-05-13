import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Screen, TopBar, Card, Display, Heading, Body, Meta, MoodDot, TabBar, TraceLogo } from "@/components/ui";
import { QUADRANT_COLORS } from "@/lib/emotions";
import { dayKey } from "@/lib/dates";
import { MemoryCard } from "@/components/MemoryCard";
import { StreakCard } from "@/components/StreakCard";

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
  for (const r of datesRes.data ?? []) datesSet.add(dayKey(r.created_at));

  // Streak: consecutive days ending today (or yesterday if today blank)
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (datesSet.has(dayKey(d))) streak++;
    else if (i === 0) continue;
    else break;
  }

  const now = new Date();
  const monthStart = dayKey(new Date(now.getFullYear(), now.getMonth(), 1));
  let thisMonth = 0;
  for (const day of datesSet) if (day >= monthStart) thisMonth++;

  return {
    latestTheme: themesRes.data?.[0] ?? null,
    streak,
    thisMonth,
    activeDays: Array.from(datesSet),
  };
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

  return (
    <Screen>
      <TopBar left={<TraceLogo size={20} />} />

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
      <StreakCard
        streak={data?.streak ?? 0}
        thisMonth={data?.thisMonth ?? 0}
        activeDays={data?.activeDays ?? []}
      />

      {/* mood pulse */}
      <Link href="/check-in" style={{ textDecoration: "none" }}>
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
      <MemoryCard theme={data?.latestTheme ?? null} />

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
