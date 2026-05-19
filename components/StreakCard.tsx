import { Card, Display, Body, Meta } from "@/components/ui";
import { dayKey } from "@/lib/dates";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function StreakCard({
  streak,
  thisMonth,
  dayCounts,
  tz,
}: {
  streak: number;
  thisMonth: number;
  dayCounts: Record<string, number>;
  tz?: string;
}) {
  const days: { label: string; has: boolean; today: boolean }[] = [];
  const todayKey = dayKey(new Date(), tz);
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dayKey(d, tz);
    const dow = d.getDay();
    days.push({
      label: DAY_LABELS[(dow + 6) % 7],
      has: (dayCounts[k] ?? 0) > 0,
      today: k === todayKey,
    });
  }

  return (
    <Card style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Meta>streak</Meta>
        <Meta>{thisMonth} this month</Meta>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
        <Display size={32}>{streak}</Display>
        <Body soft size={13}>
          {streak === 1 ? "day in a row" : "days in a row"}
        </Body>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          height: 48,
          marginTop: "auto",
          paddingTop: 14,
        }}
      >
        {days.map((d, i) => (
          <div
            key={i}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
          >
            <div
              style={{
                width: 14,
                height: d.has ? 28 : 6,
                background: d.has ? "var(--moss)" : "var(--bone)",
                border: d.has ? "none" : "1px solid var(--hairline)",
                borderRadius: 5,
                boxShadow: d.today
                  ? "0 0 0 2px var(--surface), 0 0 0 3px var(--moss-line)"
                  : undefined,
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
  );
}
