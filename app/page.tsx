import Link from "next/link";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { Screen, TopBar, Card, Display, Heading, Body, Meta, MoodDot, TabBar, TraceLogo } from "@/components/ui";
import { QUADRANT_COLORS } from "@/lib/emotions";
import { dayKey, TZ_COOKIE } from "@/lib/dates";
import { MemoryCard } from "@/components/MemoryCard";
import { StreakCard } from "@/components/StreakCard";
import { TodayTrailGlance } from "@/components/TodayTrailGlance";

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

      {/* streak + mood pulse */}
      <div className="flex flex-col md:flex-row gap-[14px]">
        <div className="md:flex-1 md:min-w-0">
          <StreakCard
            streak={data?.streak ?? 0}
            thisMonth={data?.thisMonth ?? 0}
            dayCounts={data?.dayCounts ?? {}}
            tz={tz}
          />
        </div>
        <div className="md:flex-1 md:min-w-0">
          <Card style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Heading>where are you right now?</Heading>
              <Link href="/check-in" style={{ textDecoration: "none", color: "inherit" }}>
                <Meta>check in →</Meta>
              </Link>
            </div>
            <div style={{ display: "flex", justifyContent: "space-evenly", marginTop: "auto", paddingTop: 14 }}>
              {(
                [
                  { quadrant: "blue", color: QUADRANT_COLORS.blue, label: "low" },
                  { quadrant: "green", color: QUADRANT_COLORS.green, label: "calm" },
                  { quadrant: "yellow", color: QUADRANT_COLORS.yellow, label: "high" },
                  { quadrant: "red", color: QUADRANT_COLORS.red, label: "tense" },
                ] as const
              ).map((d, i) => (
                <Link
                  key={i}
                  href={`/check-in?q=${d.quadrant}`}
                  className="mood-cell"
                  style={
                    {
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      textDecoration: "none",
                      color: "inherit",
                      "--dot": d.color,
                    } as React.CSSProperties
                  }
                >
                  <MoodDot className="mood-dot" color={d.color} size={36} />
                  <div
                    className="mood-cell-label"
                    style={{
                      font: "11px var(--font-sans), sans-serif",
                      color: "var(--ink-soft)",
                    }}
                  >
                    {d.label}
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* today's trail */}
      <TodayTrailGlance tz={tz} />

      {/* memory prompt */}
      <MemoryCard theme={data?.latestTheme ?? null} />

      {/* quick actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <Link
          href="/trail/new?mode=quick"
          className="group flex-1 no-underline"
        >
          <Card
            className="quick-action"
            style={{ padding: 40, textAlign: "center" }}
          >
            <Meta>30 SEC</Meta>
            <Heading style={{ marginTop: 4 }}>a quick trace</Heading>
          </Card>
        </Link>
        <Link
          href="/trail/new?mode=detailed"
          className="group flex-1 no-underline"
        >
          <Card
            className="quick-action"
            style={{ padding: 40, textAlign: "center" }}
          >
            <Meta>3 MIN</Meta>
            <Heading style={{ marginTop: 4 }}>sit with this one</Heading>
          </Card>
        </Link>
      </div>

      <TabBar active={0} />
    </Screen>
  );
}
