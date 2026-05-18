import Link from "next/link";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { Screen, TopBar, Card, Display, Heading, Body, Meta, MoodDot, TabBar, TraceLogo } from "@/components/ui";
import { QUADRANT_COLORS } from "@/lib/emotions";
import { dayKey, TZ_COOKIE } from "@/lib/dates";
import { MemoryCard } from "@/components/MemoryCard";

export const dynamic = "force-dynamic";

async function loadDashboard(tz: string | undefined) {
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

  const dayCounts: Record<string, number> = {};
  for (const r of datesRes.data ?? []) {
    const k = dayKey(r.created_at, tz);
    dayCounts[k] = (dayCounts[k] ?? 0) + 1;
  }

  const today = dayKey(new Date(), tz);
  // Streak: consecutive days ending today (or yesterday if today blank)
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dayKey(d, tz);
    if (dayCounts[k]) streak++;
    else if (k === today) continue;
    else break;
  }

  const monthStart = today.slice(0, 7);
  let thisMonth = 0;
  for (const day of Object.keys(dayCounts)) if (day.startsWith(monthStart)) thisMonth++;

  return {
    latestTheme: themesRes.data?.[0] ?? null,
    streak,
    thisMonth,
    dayCounts,
  };
}

function hourInTz(date: Date, tz: string | undefined): number {
  if (!tz) return date.getHours();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const h = parts.find((p) => p.type === "hour")?.value ?? "0";
  return Number(h);
}

function greeting(hour: number): string {
  if (hour < 5) return "still up.";
  if (hour < 12) return "good morning.";
  if (hour < 17) return "good afternoon.";
  if (hour < 21) return "the light is going.";
  return "late.";
}

export default async function HomePage() {
  const tz = (await cookies()).get(TZ_COOKIE)?.value;
  let data: Awaited<ReturnType<typeof loadDashboard>> | null = null;
  let error: string | null = null;
  try {
    data = await loadDashboard(tz);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const now = new Date();
  const dayMeta = now
    .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: tz })
    .toUpperCase()
    .replace(",", " ·");
  const hour = hourInTz(now, tz);

  return (
    <Screen>
      <TopBar left={<TraceLogo size={28} />} />

      <div>
        <Meta>{dayMeta}</Meta>
        <Display size={36} style={{ marginTop: 4 }}>
          {greeting(hour)}
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

      {/* mood pulse */}
      <Link href="/check-in" style={{ textDecoration: "none" }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Heading>where are you right now?</Heading>
            <Meta>check in →</Meta>
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
                    font: "11px var(--font-sans), sans-serif",
                    color: "var(--ink-soft)",
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
          href="/trail/new?mode=quick"
          style={{ flex: 1, textDecoration: "none" }}
        >
          <Card style={{ padding: 14, textAlign: "center" }}>
            <Meta>30 SEC</Meta>
            <Heading style={{ marginTop: 4 }}>a quick trace</Heading>
          </Card>
        </Link>
        <Link
          href="/trail/new?mode=detailed"
          style={{ flex: 1, textDecoration: "none" }}
        >
          <Card style={{ padding: 14, textAlign: "center" }}>
            <Meta>3 MIN</Meta>
            <Heading style={{ marginTop: 4 }}>sit with this one</Heading>
          </Card>
        </Link>
      </div>

      <TabBar active={0} />
    </Screen>
  );
}
