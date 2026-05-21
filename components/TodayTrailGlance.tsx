import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { dayKey } from "@/lib/dates";
import type { Step } from "@/lib/steps";
import { TodayTrailQuickAdd } from "@/components/TodayTrailQuickAdd";

async function loadTodaySteps(today: string): Promise<Step[]> {
  try {
    const sb = supabase();
    const { data } = await sb
      .from("steps")
      .select("*")
      .eq("due_date", today)
      .neq("status", "let_rest")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    return (data ?? []) as Step[];
  } catch {
    return [];
  }
}

export async function TodayTrailGlance({ tz }: { tz?: string }) {
  const today = dayKey(new Date(), tz);
  const steps = await loadTodaySteps(today);

  const cardStyle: React.CSSProperties = {
    display: "block",
    background: "var(--surface)",
    border: "1px solid var(--hairline)",
    borderRadius: 16,
    padding: "14px 16px",
  };

  if (steps.length === 0) {
    return (
      <div style={cardStyle}>
        <Link
          href="/trailhead"
          style={{
            display: "block",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span
                style={{
                  font: "500 12px var(--font-mono)",
                  color: "var(--ink-soft)",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                }}
              >
                today&apos;s trail
              </span>
              <span style={{ font: "italic 400 13px var(--font-serif)", color: "var(--ink-soft)" }}>
                nothing planted yet.
              </span>
            </div>
            <span style={{ font: "500 12px var(--font-sans)", color: "var(--moss)" }}>trailhead →</span>
          </div>
        </Link>
        <div style={{ marginTop: 12 }}>
          <TodayTrailQuickAdd dueDate={today} />
        </div>
      </div>
    );
  }

  const walked = steps.filter((s) => s.status === "walked").length;
  const next = steps.find((s) => s.status === "open");

  return (
    <div style={cardStyle}>
      <Link
        href="/trailhead"
        style={{
          display: "block",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span
                style={{
                  font: "500 12px var(--font-mono)",
                  color: "var(--ink-soft)",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                }}
              >
                today&apos;s trail
              </span>
              <span style={{ font: "500 12px var(--font-mono)", color: "var(--ink)", letterSpacing: 0.3 }}>
                {walked} of {steps.length} walked
              </span>
            </div>
            <span style={{ font: "500 12px var(--font-sans)", color: "var(--moss)" }}>trailhead →</span>
          </div>

          {/* Step ribbon */}
          <div style={{ display: "flex", gap: 6 }}>
            {steps.map((s) => {
              const w = s.status === "walked";
              return (
                <div
                  key={s.id}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "6px 8px",
                    borderRadius: 8,
                    background: w ? "var(--ink)" : "transparent",
                    border: w ? "none" : "1px solid var(--hairline)",
                    color: w ? "var(--paper)" : "var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: w ? "var(--moss)" : "transparent",
                      border: w ? "none" : "1.2px solid var(--hairline)",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {w && (
                      <svg width="6" height="6" viewBox="0 0 10 10" aria-hidden="true">
                        <path
                          d="M2 5.2 L4.2 7.4 L8 3"
                          fill="none"
                          stroke="var(--paper)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    style={{
                      font: "500 11px var(--font-sans)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      opacity: w ? 0.75 : 1,
                    }}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Next-up line */}
          {next && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  font: "500 9.5px var(--font-mono)",
                  color: "var(--ink-mute)",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                next
              </span>
              <span style={{ font: "italic 400 13px var(--font-serif)", color: "var(--ink-soft)" }}>
                {next.title}
                {next.estimate ? ` · ${next.estimate}` : ""}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Quick add */}
      <div style={{ marginTop: 12 }}>
        <TodayTrailQuickAdd dueDate={today} />
      </div>
    </div>
  );
}
