"use client";

import { useMemo, useState } from "react";
import { Card, Display, Body, Meta } from "@/components/ui";
import { dayKey } from "@/lib/dates";

const WINDOWS = [7, 14, 28] as const;
type Window = (typeof WINDOWS)[number];

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
  const [window, setWindow] = useState<Window>(14);
  const [open, setOpen] = useState(false);

  const ribbon = useMemo(() => {
    const out: number[] = [];
    for (let i = window - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push(dayCounts[dayKey(d, tz)] ?? 0);
    }
    return out;
  }, [window, dayCounts, tz]);

  const maxCount = Math.max(1, ...ribbon);
  const BAR_MAX = 32;
  const BAR_MIN = 6;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <Meta>STREAK</Meta>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <Display size={28}>{streak}</Display>
            <Body soft size={13}>
              {streak === 1 ? "day" : "days"} · {thisMonth} this month
            </Body>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            aria-haspopup="listbox"
            aria-expanded={open}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              font: "11px var(--font-geist-sans), sans-serif",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-ink-soft)",
            }}
          >
            {window}d ▾
          </button>
          {open && (
            <ul
              role="listbox"
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                margin: 0,
                padding: 4,
                listStyle: "none",
                background: "var(--color-paper)",
                border: "1px solid var(--color-ink-line)",
                borderRadius: 6,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                zIndex: 10,
                minWidth: 64,
              }}
            >
              {WINDOWS.map((w) => (
                <li key={w}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={w === window}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setWindow(w);
                      setOpen(false);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: w === window ? "var(--color-surface-soft)" : "transparent",
                      border: "none",
                      padding: "6px 10px",
                      cursor: "pointer",
                      borderRadius: 4,
                      font: "12px var(--font-geist-sans), sans-serif",
                      color: "var(--color-ink)",
                    }}
                  >
                    {w} days
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 3,
          marginTop: 12,
          alignItems: "flex-end",
          height: BAR_MAX,
        }}
      >
        {ribbon.map((count, i) => {
          const isLast = i === ribbon.length - 1;
          const hasEntry = count > 0;
          const height = hasEntry
            ? BAR_MIN + ((BAR_MAX - BAR_MIN) * count) / maxCount
            : BAR_MIN;
          return (
            <div
              key={i}
              title={`${count} ${count === 1 ? "entry" : "entries"}`}
              style={{
                flex: 1,
                height,
                borderRadius: 4,
                background: hasEntry ? "var(--color-ink)" : "var(--color-surface-soft)",
                border: hasEntry ? "none" : "1px solid var(--color-ink-line)",
                position: "relative",
              }}
            >
              {isLast && (
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
          );
        })}
      </div>
    </Card>
  );
}
