"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TopBar,
  TraceLogo,
  Meta,
  Display,
  SleepHorizon,
  MoodDot,
  CedarWhisper,
  TabBar,
} from "@/components/ui";
import type { Step } from "@/lib/steps";
import type { DayMeta, DesignQuadrant } from "@/lib/dayMeta";
import { weekdayShort, dayOfMonth } from "@/lib/week";

type Props = {
  today: string;
  days: string[];
  prevWeek: string;
  nextWeek: string;
  initialPlanted: Step[];
  initialUnplanted: Step[];
  dayMeta: Record<string, DayMeta>;
};

const Q_COLORS: Record<DesignQuadrant, string> = {
  calm: "var(--q-calm)",
  bright: "var(--q-bright)",
  low: "var(--q-low)",
  sharp: "var(--q-sharp)",
};

function fmtMonthRange(days: string[]): string {
  const a = days[0];
  const b = days[days.length - 1];
  const [ya, ma, da] = a.split("-").map(Number);
  const [, mb, db] = b.split("-").map(Number);
  const monthA = new Date(Date.UTC(ya, ma - 1, da)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const monthB = new Date(Date.UTC(ya, mb - 1, db)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  if (ma === mb) return `WEEK OF ${monthA.toUpperCase()} ${da} — ${db}`;
  return `WEEK OF ${monthA.toUpperCase()} ${da} — ${monthB.toUpperCase()} ${db}`;
}

function fmtDayLong(iso: string): { meta: string; long: string } {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const weekday = dt.toLocaleString("en-US", { weekday: "long", timeZone: "UTC" });
  const month = dt.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  return {
    meta: `${weekday.slice(0, 3).toUpperCase()} · ${month.toUpperCase()} ${d}`,
    long: weekday,
  };
}

// ──────────────────────────────────────────────────────────────────
// Step row
// ──────────────────────────────────────────────────────────────────
function StepRow({
  step,
  dense,
  onMutate,
  onDragStart,
  onDragEnd,
}: {
  step: Step;
  dense?: boolean;
  onMutate: (id: string, patch: Partial<Step>) => void;
  onDragStart: (id: string, fromBucket: string | null) => void;
  onDragEnd: () => void;
}) {
  const walked = step.status === "walked";
  const rested = step.status === "let_rest";

  function toggleWalked() {
    onMutate(step.id, { status: walked ? "open" : "walked" });
  }
  function letRest() {
    onMutate(step.id, { status: "let_rest" });
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/step-id", step.id);
        onDragStart(step.id, step.due_date);
      }}
      onDragEnd={onDragEnd}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: dense ? "6px 0" : "9px 0",
        borderBottom: "1px solid rgba(42,43,34,0.06)",
        opacity: rested ? 0.45 : 1,
        cursor: "grab",
      }}
    >
      <button
        type="button"
        onClick={toggleWalked}
        aria-label={walked ? "mark open" : "mark walked"}
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: walked ? "none" : "1.4px solid var(--hairline)",
          background: walked ? "var(--moss)" : "transparent",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          cursor: "pointer",
        }}
      >
        {walked && (
          <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
            <path
              d="M2 5.2 L4.2 7.4 L8 3"
              fill="none"
              stroke="var(--paper)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        <div
          style={{
            font: `500 ${dense ? 12.5 : 13.5}px var(--font-sans)`,
            color: "var(--ink)",
            textDecorationLine: walked || rested ? "line-through" : "none",
            textDecorationColor: "var(--hairline)",
            textDecorationStyle: "solid",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {step.title}
        </div>
        {(step.tag || step.estimate) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              font: "400 10.5px var(--font-mono)",
              color: "var(--ink-soft)",
              letterSpacing: 0.3,
            }}
          >
            {step.tag && <span style={{ textTransform: "lowercase" }}>{step.tag}</span>}
            {step.tag && step.estimate && <span style={{ opacity: 0.4 }}>·</span>}
            {step.estimate && <span>{step.estimate}</span>}
          </div>
        )}
      </div>

      {!rested && !walked && (
        <button
          type="button"
          onClick={letRest}
          aria-label="let rest"
          title="let rest"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--ink-mute)",
            cursor: "pointer",
            padding: "2px 4px",
            font: "400 14px var(--font-sans)",
          }}
        >
          ⌁
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Carry-forward — steps left open from earlier in the week
// ──────────────────────────────────────────────────────────────────
function CarryForward({
  steps,
  onReplant,
  onLetRest,
  compact,
}: {
  steps: Step[];
  onReplant: (id: string) => void;
  onLetRest: (id: string) => void;
  compact?: boolean;
}) {
  if (steps.length === 0) return null;
  return (
    <div
      style={{
        margin: compact ? "4px 0 10px" : "4px 0 14px",
        padding: compact ? "8px 10px" : "10px 12px",
        background: "var(--nav)",
        border: "1px solid var(--hairline)",
        borderRadius: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            font: `italic 400 ${compact ? 11.5 : 12.5}px var(--font-serif)`,
            color: "var(--ink-soft)",
          }}
        >
          left from earlier
        </span>
        <span
          style={{
            font: "500 9.5px var(--font-mono)",
            color: "var(--ink-mute)",
            letterSpacing: 0.4,
          }}
        >
          {steps.length}
        </span>
      </div>
      {steps.map((s) => (
        <div
          key={s.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: compact ? "4px 0" : "6px 0",
            borderTop: "1px solid rgba(42,43,34,0.05)",
          }}
        >
          <span
            style={{
              font: "500 9px var(--font-mono)",
              color: "var(--ink-mute)",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              flexShrink: 0,
              width: 22,
            }}
          >
            {s.due_date ? weekdayShort(s.due_date).slice(0, 3) : ""}
          </span>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              font: `500 ${compact ? 12 : 13}px var(--font-sans)`,
              color: "var(--ink)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {s.title}
          </span>
          <button
            type="button"
            onClick={() => onReplant(s.id)}
            title="replant on today"
            aria-label="replant on today"
            style={{
              background: "transparent",
              border: "1px solid var(--moss-line)",
              color: "var(--moss)",
              borderRadius: 6,
              padding: compact ? "2px 6px" : "3px 8px",
              font: `500 ${compact ? 10 : 11}px var(--font-sans)`,
              cursor: "pointer",
            }}
          >
            replant
          </button>
          <button
            type="button"
            onClick={() => onLetRest(s.id)}
            title="let rest"
            aria-label="let rest"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--ink-mute)",
              padding: "2px 4px",
              font: `400 ${compact ? 13 : 14}px var(--font-sans)`,
              cursor: "pointer",
            }}
          >
            ⌁
          </button>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Quick add
// ──────────────────────────────────────────────────────────────────
function QuickAdd({
  bucket,
  bucketLabel,
  onAdd,
}: {
  bucket: string | null;
  bucketLabel: string;
  onAdd: (title: string, bucket: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit() {
    const v = value.trim();
    if (!v) {
      setOpen(false);
      return;
    }
    onAdd(v, bucket);
    setValue("");
    // Keep open for rapid entry; user can blur or Esc to close.
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          width: "100%",
          background: "var(--surface)",
          border: "1px solid var(--hairline)",
          borderRadius: 12,
          textAlign: "left",
          cursor: "text",
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "1.4px solid var(--moss-line)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--moss)",
            font: "400 14px var(--font-sans)",
            flexShrink: 0,
          }}
        >
          +
        </span>
        <span
          style={{
            font: "italic 400 14px var(--font-serif)",
            color: "var(--ink-mute)",
          }}
        >
          plant a step on {bucketLabel}…
        </span>
      </button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 12px",
        background: "var(--surface)",
        border: "1px solid var(--moss-line)",
        borderRadius: 12,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "1.4px solid var(--moss-line)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--moss)",
          font: "400 14px var(--font-sans)",
          flexShrink: 0,
        }}
      >
        +
      </span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          else if (e.key === "Escape") {
            setValue("");
            setOpen(false);
          }
        }}
        onBlur={() => {
          if (!value.trim()) setOpen(false);
        }}
        placeholder="what are you planting?"
        style={{
          flex: 1,
          minWidth: 0,
          background: "transparent",
          border: "none",
          outline: "none",
          font: "400 14px var(--font-sans)",
          color: "var(--ink)",
        }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Day strip (mobile)
// ──────────────────────────────────────────────────────────────────
function DayStrip({
  days,
  today,
  activeDay,
  setActiveDay,
  countsByDay,
  overdueByDay,
  dayMeta,
}: {
  days: string[];
  today: string;
  activeDay: string;
  setActiveDay: (d: string) => void;
  countsByDay: Record<string, number>;
  overdueByDay: Record<string, number>;
  dayMeta: Record<string, DayMeta>;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 4,
        padding: "8px 14px 12px",
        borderBottom: "1px solid rgba(42,43,34,0.06)",
      }}
    >
      {days.map((d) => {
        const active = d === activeDay;
        const isToday = d === today;
        const meta = dayMeta[d];
        const count = countsByDay[d] ?? 0;
        const overdue = (overdueByDay[d] ?? 0) > 0;
        return (
          <button
            type="button"
            key={d}
            onClick={() => setActiveDay(d)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "6px 0 4px",
              borderRadius: 10,
              background: active ? "var(--nav)" : "transparent",
              border: active ? "1px solid var(--hairline)" : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                font: "500 9px var(--font-mono)",
                color: "var(--ink-soft)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              {weekdayShort(d).charAt(0)}
            </div>
            <div
              style={{
                font: `${active ? 500 : 400} 13px var(--font-serif)`,
                color: overdue ? "var(--q-sharp)" : isToday ? "var(--moss)" : "var(--ink)",
                display: "inline-flex",
                alignItems: "baseline",
                gap: 2,
              }}
            >
              {dayOfMonth(d)}
              {overdue && (
                <span
                  aria-label={`${overdueByDay[d]} step${overdueByDay[d] === 1 ? "" : "s"} left open`}
                  style={{
                    font: "600 11px var(--font-sans)",
                    color: "var(--q-sharp)",
                  }}
                >
                  !
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3, height: 10 }}>
              {meta?.mood && <MoodDot color={Q_COLORS[meta.mood]} size={6} />}
              {meta?.sleep_hours != null && <SleepHorizon hours={meta.sleep_hours} width={18} height={3} />}
            </div>
            <div
              style={{
                font: "500 9px var(--font-mono)",
                color: "var(--ink-mute)",
                letterSpacing: 0.4,
              }}
            >
              {count > 0 ? `${count}` : "·"}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Trailhead — composite
// ──────────────────────────────────────────────────────────────────
export function Trailhead(props: Props) {
  const router = useRouter();
  const [planted, setPlanted] = useState<Step[]>(props.initialPlanted);
  const [unplanted, setUnplanted] = useState<Step[]>(props.initialUnplanted);
  const [activeDay, setActiveDay] = useState<string>(
    props.days.includes(props.today) ? props.today : props.days[0]
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverBucket, setDragOverBucket] = useState<string | null>(null);

  const stepsByDay = useMemo(() => {
    const m: Record<string, Step[]> = {};
    for (const d of props.days) m[d] = [];
    for (const s of planted) {
      if (s.due_date && m[s.due_date]) m[s.due_date].push(s);
    }
    return m;
  }, [planted, props.days]);

  const countsByDay = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of props.days) c[d] = stepsByDay[d].length;
    return c;
  }, [stepsByDay, props.days]);

  // A day is "overdue" when it's strictly before today and still has open steps.
  // Today itself never flags — you have until midnight to walk it.
  const overdueByDay = useMemo(() => {
    const o: Record<string, number> = {};
    for (const d of props.days) {
      if (d >= props.today) {
        o[d] = 0;
        continue;
      }
      o[d] = stepsByDay[d].filter((s) => s.status === "open").length;
    }
    return o;
  }, [stepsByDay, props.days, props.today]);

  // Steps left open on earlier days of the visible week. Only meaningful when
  // today falls inside the visible week — past/future weeks are read-only here.
  const todayInWeek = props.days.includes(props.today);
  const leftBehind = useMemo(() => {
    if (!todayInWeek) return [];
    return planted.filter(
      (s) =>
        s.status === "open" &&
        s.due_date != null &&
        s.due_date < props.today &&
        props.days.includes(s.due_date)
    );
  }, [planted, props.days, props.today, todayInWeek]);

  function replantOnToday(id: string) {
    const target = props.today;
    const newPosition = (stepsByDay[target] ?? []).length;
    mutateStep(id, { due_date: target, position: newPosition });
  }
  function letRest(id: string) {
    mutateStep(id, { status: "let_rest" });
  }

  async function addStep(title: string, bucket: string | null) {
    const res = await fetch("/api/steps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, due_date: bucket }),
    });
    if (!res.ok) return;
    const { step } = (await res.json()) as { step: Step };
    if (bucket === null) setUnplanted((u) => [...u, step]);
    else setPlanted((p) => [...p, step]);
  }

  async function mutateStep(id: string, patch: Partial<Step>) {
    // Optimistic
    const apply = (s: Step) => (s.id === id ? { ...s, ...patch } : s);
    setPlanted((p) => p.map(apply));
    setUnplanted((u) => u.map(apply));
    await fetch(`/api/steps/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    // If status became let_rest, drop from view buckets next refresh.
    if (patch.status === "let_rest") {
      // Soft remove from local lists too.
      setUnplanted((u) => u.filter((s) => s.id !== id));
    }
  }

  function onDragStart(id: string) {
    setDragId(id);
  }
  function onDragEnd() {
    setDragId(null);
    setDragOverBucket(null);
  }

  async function dropOn(bucket: string | null) {
    if (!dragId) return;
    const id = dragId;
    setDragId(null);
    setDragOverBucket(null);
    // Determine new position: append to end of target bucket.
    const targetItems = bucket === null
      ? unplanted
      : (stepsByDay[bucket] ?? []);
    const newPosition = targetItems.length;

    // Optimistic move
    const moved = [...planted, ...unplanted].find((s) => s.id === id);
    if (!moved) return;
    const updated: Step = { ...moved, due_date: bucket, position: newPosition };
    setPlanted((p) => {
      const without = p.filter((s) => s.id !== id);
      return bucket === null ? without : [...without, updated];
    });
    setUnplanted((u) => {
      const without = u.filter((s) => s.id !== id);
      return bucket === null ? [...without, updated] : without;
    });

    await fetch(`/api/steps/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ due_date: bucket, position: newPosition }),
    });
  }

  const activeDayMeta = props.dayMeta[activeDay];
  const activeDayInfo = fmtDayLong(activeDay);
  const activeSteps = stepsByDay[activeDay] ?? [];

  // ─────────────── Desktop layout ───────────────
  const desktop = (
    <div className="hidden md:flex" style={{ flex: 1, flexDirection: "column", minWidth: 0 }}>
      {/* Header */}
      <div
        style={{
          padding: "24px 32px 18px",
          borderBottom: "1px solid var(--hairline)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div>
          <Meta>{fmtMonthRange(props.days)}</Meta>
          <Display size={32} style={{ marginTop: 6 }}>
            the week ahead.
          </Display>
          <div
            style={{
              marginTop: 6,
              font: "italic 400 15px var(--font-serif)",
              color: "var(--ink-soft)",
            }}
          >
            plant a step. walk it when you walk it.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href={`/trailhead?week=${props.prevWeek}`}
            style={{ font: "500 13px var(--font-sans)", color: "var(--ink-soft)", textDecoration: "none" }}
          >
            ← prev
          </Link>
          <Link
            href="/trailhead"
            style={{ font: "500 13px var(--font-sans)", color: "var(--moss)", textDecoration: "none" }}
          >
            this week
          </Link>
          <Link
            href={`/trailhead?week=${props.nextWeek}`}
            style={{ font: "500 13px var(--font-sans)", color: "var(--ink-soft)", textDecoration: "none" }}
          >
            next →
          </Link>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {/* Unplanted rail */}
        <aside
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverBucket("__unplanted__");
          }}
          onDrop={(e) => {
            e.preventDefault();
            dropOn(null);
          }}
          style={{
            width: 260,
            flexShrink: 0,
            borderRight: "1px solid var(--hairline)",
            background: "var(--paper)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            outline: dragOverBucket === "__unplanted__" ? "2px solid var(--moss-line)" : undefined,
          }}
        >
          <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid rgba(42,43,34,0.06)" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <Meta>unplanted</Meta>
              <span style={{ font: "500 10px var(--font-mono)", color: "var(--ink-mute)", letterSpacing: 0.3 }}>
                {unplanted.length}
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <QuickAdd bucket={null} bucketLabel="any day" onAdd={addStep} />
            </div>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "4px 16px" }}>
            {unplanted.map((s) => (
              <div
                key={s.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/step-id", s.id);
                  onDragStart(s.id);
                }}
                onDragEnd={onDragEnd}
                style={{
                  padding: "10px 10px",
                  margin: "6px 0",
                  borderRadius: 10,
                  background: "var(--surface)",
                  border: "1px solid var(--hairline)",
                  cursor: "grab",
                  opacity: s.status === "walked" ? 0.55 : 1,
                }}
              >
                <div style={{ font: "500 13px var(--font-sans)", color: "var(--ink)" }}>{s.title}</div>
                {s.tag && (
                  <div
                    style={{
                      marginTop: 4,
                      font: "400 10.5px var(--font-mono)",
                      color: "var(--ink-soft)",
                      textTransform: "lowercase",
                    }}
                  >
                    {s.tag}
                  </div>
                )}
              </div>
            ))}
            {unplanted.length === 0 && (
              <div
                style={{
                  padding: "20px 4px",
                  font: "italic 400 13px var(--font-serif)",
                  color: "var(--ink-mute)",
                }}
              >
                nothing waiting to be planted.
              </div>
            )}
          </div>
        </aside>

        {/* Week grid */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", overflow: "hidden" }}>
          {props.days.map((d, i) => {
            const isToday = d === props.today;
            const meta = props.dayMeta[d];
            const dayInfo = fmtDayLong(d);
            const steps = stepsByDay[d];
            const overdueCount = overdueByDay[d] ?? 0;
            const isOverdue = overdueCount > 0;
            return (
              <div
                key={d}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverBucket(d);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  dropOn(d);
                }}
                style={{
                  borderRight: i < 6 ? "1px solid rgba(42,43,34,0.06)" : "none",
                  background: isToday ? "var(--moss-soft)" : "transparent",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  outline: dragOverBucket === d ? "2px solid var(--moss-line)" : undefined,
                }}
              >
                {/* Day header */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    padding: "14px 12px 10px",
                    borderBottom: `1px solid ${isToday ? "var(--moss-line)" : "rgba(42,43,34,0.06)"}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <span
                      style={{
                        font: "500 10px var(--font-mono)",
                        color: isToday ? "var(--moss-deep)" : "var(--ink-soft)",
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                      }}
                    >
                      {dayInfo.long.slice(0, 3)}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "baseline",
                        gap: 4,
                        font: "400 17px var(--font-serif)",
                        color: isOverdue
                          ? "var(--q-sharp)"
                          : isToday
                            ? "var(--moss-deep)"
                            : "var(--ink)",
                      }}
                    >
                      {isOverdue && (
                        <span
                          aria-label={`${overdueCount} step${overdueCount === 1 ? "" : "s"} left open`}
                          title={`${overdueCount} step${overdueCount === 1 ? "" : "s"} left open`}
                          style={{
                            font: "600 13px var(--font-sans)",
                            color: "var(--q-sharp)",
                          }}
                        >
                          !
                        </span>
                      )}
                      {dayOfMonth(d)}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, height: 12 }}>
                    {meta?.mood && <MoodDot color={Q_COLORS[meta.mood]} size={8} />}
                    {meta?.sleep_hours != null && (
                      <>
                        <SleepHorizon hours={meta.sleep_hours} width={24} height={5} />
                        <span
                          style={{
                            font: "500 9.5px var(--font-mono)",
                            color: "var(--ink-mute)",
                            letterSpacing: 0.3,
                          }}
                        >
                          {meta.sleep_hours}h
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Steps */}
                <div style={{ padding: "6px 12px", flex: 1, overflow: "auto" }}>
                  {isToday && leftBehind.length > 0 && (
                    <CarryForward
                      steps={leftBehind}
                      onReplant={replantOnToday}
                      onLetRest={letRest}
                      compact
                    />
                  )}
                  {steps.map((s) => (
                    <StepRow
                      key={s.id}
                      step={s}
                      dense
                      onMutate={mutateStep}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                </div>

                {/* Per-column quick-add */}
                <div style={{ padding: "6px 10px 12px" }}>
                  <CompactQuickAdd bucket={d} onAdd={addStep} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ─────────────── Mobile layout ───────────────
  const mobile = (
    <div
      className="flex md:hidden"
      style={{
        flexDirection: "column",
        flex: 1,
        minHeight: "100dvh",
        background: "var(--paper)",
        paddingBottom: "calc(72px + env(safe-area-inset-bottom))",
      }}
    >
      <div style={{ padding: "8px 18px 0" }}>
        <TopBar
          left={<TraceLogo size={22} />}
          title={<Meta>trailhead</Meta>}
          right={null}
        />
      </div>

      <DayStrip
        days={props.days}
        today={props.today}
        activeDay={activeDay}
        setActiveDay={setActiveDay}
        countsByDay={countsByDay}
        overdueByDay={overdueByDay}
        dayMeta={props.dayMeta}
      />

      {/* Day header */}
      <div style={{ padding: "14px 18px 8px" }}>
        <Meta>{activeDayInfo.meta}</Meta>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 4 }}>
          <Display size={26}>{activeDayInfo.long.toLowerCase()}</Display>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {activeDayMeta?.sleep_hours != null && (
              <>
                <SleepHorizon hours={activeDayMeta.sleep_hours} width={36} height={6} />
                <span
                  style={{
                    font: "500 11px var(--font-mono)",
                    color: "var(--ink-soft)",
                    letterSpacing: 0.3,
                  }}
                >
                  {activeDayMeta.sleep_hours}h
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Steps list */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          dropOn(activeDay);
        }}
        style={{ flex: 1, overflow: "auto", padding: "0 18px" }}
      >
        {activeDay === props.today && leftBehind.length > 0 && (
          <CarryForward steps={leftBehind} onReplant={replantOnToday} onLetRest={letRest} />
        )}
        {activeSteps.length === 0 && (
          <CedarWhisper style={{ marginTop: 4 }}>
            nothing planted yet. plant the first step below.
          </CedarWhisper>
        )}
        {activeSteps.map((s) => (
          <StepRow
            key={s.id}
            step={s}
            onMutate={mutateStep}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "10px 18px 96px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={() => router.push("#unplanted")}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverBucket("__unplanted__");
          }}
          onDrop={(e) => {
            e.preventDefault();
            dropOn(null);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: "var(--nav)",
            borderRadius: 10,
            border: dragOverBucket === "__unplanted__" ? "1px solid var(--moss-line)" : "1px solid transparent",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                font: "500 11px var(--font-mono)",
                color: "var(--ink-soft)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              unplanted
            </span>
            <span style={{ font: "500 11px var(--font-mono)", color: "var(--ink)" }}>
              · {unplanted.length}
            </span>
          </div>
          <span style={{ font: "500 12px var(--font-sans)", color: "var(--moss)" }}>open →</span>
        </button>
        <QuickAdd
          bucket={activeDay}
          bucketLabel={activeDayInfo.long.toLowerCase()}
          onAdd={addStep}
        />
      </div>

      <div id="unplanted" />
      {unplanted.length > 0 && (
        <details
          style={{
            margin: "0 18px 96px",
            background: "var(--surface)",
            border: "1px solid var(--hairline)",
            borderRadius: 12,
            padding: "10px 14px",
          }}
        >
          <summary
            style={{
              font: "500 12px var(--font-sans)",
              color: "var(--ink-soft)",
              cursor: "pointer",
              listStyle: "none",
            }}
          >
            <Meta>unplanted · {unplanted.length}</Meta>
          </summary>
          <div style={{ marginTop: 8 }}>
            {unplanted.map((s) => (
              <StepRow
                key={s.id}
                step={s}
                onMutate={mutateStep}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            ))}
          </div>
        </details>
      )}
      <TabBar active={1} />
    </div>
  );

  return (
    <>
      {mobile}
      {desktop}
    </>
  );
}

// Compact quick-add for desktop columns
function CompactQuickAdd({
  bucket,
  onAdd,
}: {
  bucket: string;
  onAdd: (title: string, bucket: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          font: "italic 400 11.5px var(--font-serif)",
          color: "var(--ink-mute)",
          padding: "6px 8px",
          border: "1px dashed var(--hairline)",
          borderRadius: 8,
          textAlign: "center",
          background: "transparent",
          cursor: "pointer",
        }}
      >
        + plant
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const v = value.trim();
          if (v) {
            onAdd(v, bucket);
            setValue("");
          } else setOpen(false);
        } else if (e.key === "Escape") {
          setValue("");
          setOpen(false);
        }
      }}
      onBlur={() => {
        if (!value.trim()) setOpen(false);
      }}
      placeholder="what are you planting?"
      style={{
        width: "100%",
        font: "400 12px var(--font-sans)",
        padding: "6px 8px",
        border: "1px solid var(--moss-line)",
        borderRadius: 8,
        background: "var(--surface)",
        outline: "none",
        color: "var(--ink)",
      }}
    />
  );
}
