"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EMOTIONS,
  QUADRANT_COLORS,
  type Emotion,
} from "@/lib/emotions";
import { Screen, TopBar, Body, Meta } from "@/components/ui";

// Curated (x, y) plot positions in 0..1 space. (0,0) = top-left, (1,1) = bottom-right.
// Top = high energy, bottom = low energy. Left = unpleasant, right = pleasant.
// Hand-tuned to avoid bubble overlap while keeping each in the correct quadrant.
const POSITIONS: Record<string, { x: number; y: number }> = {
  // red — high energy, unpleasant (top-left)
  angry: { x: 0.12, y: 0.08 },
  overwhelmed: { x: 0.13, y: 0.27 },
  stressed: { x: 0.33, y: 0.14 },
  anxious: { x: 0.34, y: 0.34 },
  frustrated: { x: 0.21, y: 0.45 },
  // yellow — high energy, pleasant (top-right)
  excited: { x: 0.9, y: 0.06 },
  joyful: { x: 0.7, y: 0.18 },
  energized: { x: 0.87, y: 0.25 },
  hopeful: { x: 0.66, y: 0.38 },
  proud: { x: 0.86, y: 0.43 },
  // blue — low energy, unpleasant (bottom-left)
  drained: { x: 0.12, y: 0.92 },
  sad: { x: 0.3, y: 0.78 },
  lonely: { x: 0.12, y: 0.72 },
  discouraged: { x: 0.32, y: 0.6 },
  bored: { x: 0.43, y: 0.86 },
  // green — low energy, pleasant (bottom-right)
  peaceful: { x: 0.9, y: 0.95 },
  relaxed: { x: 0.72, y: 0.78 },
  calm: { x: 0.88, y: 0.63 },
  content: { x: 0.68, y: 0.92 },
  grateful: { x: 0.6, y: 0.6 },
};

const BUBBLE_SIZE = 72;

function fontSizeFor(word: string) {
  if (word.length >= 11) return 10;
  if (word.length >= 9) return 11;
  if (word.length >= 7) return 12;
  return 13;
}

function Bubble({
  emotion,
  selected,
  onPick,
  x,
  y,
}: {
  emotion: Emotion;
  selected: boolean;
  onPick: (e: Emotion) => void;
  x: number;
  y: number;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(emotion)}
      aria-pressed={selected}
      style={{
        position: "absolute",
        left: `calc(${x * 100}% - ${BUBBLE_SIZE / 2}px)`,
        top: `calc(${y * 100}% - ${BUBBLE_SIZE / 2}px)`,
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        borderRadius: "50%",
        background: QUADRANT_COLORS[emotion.quadrant],
        color: "var(--color-ink)",
        border: "none",
        padding: 0,
        font: `500 ${fontSizeFor(emotion.word)}px var(--font-geist-sans), sans-serif`,
        letterSpacing: -0.1,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        boxShadow: selected
          ? `0 0 0 3px var(--color-paper), 0 0 0 5px var(--color-ink)`
          : "0 1px 2px rgba(26,23,20,0.06)",
        transform: selected ? "scale(1.08)" : "scale(1)",
        transition: "transform 140ms ease, box-shadow 140ms ease",
        zIndex: selected ? 2 : 1,
      }}
    >
      {emotion.word}
    </button>
  );
}

function AxisLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        font: "500 9px var(--font-jetbrains-mono), monospace",
        color: "var(--color-ink-soft)",
        letterSpacing: 0.6,
        textTransform: "uppercase",
        pointerEvents: "none",
        background: "var(--color-paper)",
        padding: "0 6px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function MoodMeter() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get("mode");
  const isLog = mode === "log";
  const next = params.get("next") ?? (isLog ? "/" : "/entries/new?mode=quick");
  const [selected, setSelected] = useState<Emotion | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!selected) return;
    if (isLog) {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Mood · ${selected.word}`,
          body_md: "",
          mood: selected.valence,
          kind: "check_in",
          tags: ["mood-log"],
          check_in: {
            emotion: selected.word,
            valence: selected.valence,
            energy: selected.energy,
            sleep_hours: null,
            context_tags: [],
            seed: "",
            transcript: [],
          },
        }),
      });
      setSaving(false);
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      router.push(next);
      router.refresh();
      return;
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "trace.mood",
        JSON.stringify({
          emotion: selected.word,
          valence: selected.valence,
          energy: selected.energy,
          quadrant: selected.quadrant,
          at: Date.now(),
        })
      );
    }
    router.push(next);
  }

  return (
    <Screen style={{ paddingBottom: 24 }}>
      <TopBar
        left={
          <button
            type="button"
            onClick={() => router.push(next)}
            style={{
              background: "var(--color-surface-soft)",
              border: "1px solid var(--color-ink-line)",
              borderRadius: 999,
              width: 32,
              height: 32,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-ink)",
              cursor: "pointer",
              font: "inherit",
              padding: 0,
            }}
            aria-label="back"
          >
            ←
          </button>
        }
        title={<Meta>HOW DO YOU FEEL</Meta>}
        right={null}
      />

      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          marginInline: -4,
        }}
      >
        {/* axes */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: 1,
            background: "var(--color-ink-line)",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "50%",
            width: 1,
            background: "var(--color-ink-line)",
          }}
        />

        {/* axis labels */}
        <AxisLabel style={{ top: -4, left: "50%", transform: "translateX(-50%)" }}>
          high energy
        </AxisLabel>
        <AxisLabel style={{ bottom: -4, left: "50%", transform: "translateX(-50%)" }}>
          low energy
        </AxisLabel>
        <AxisLabel
          style={{
            left: -4,
            top: "50%",
            transform: "translate(-50%, -50%) rotate(-90deg)",
            transformOrigin: "center",
          }}
        >
          unpleasant
        </AxisLabel>
        <AxisLabel
          style={{
            right: -4,
            top: "50%",
            transform: "translate(50%, -50%) rotate(90deg)",
            transformOrigin: "center",
          }}
        >
          pleasant
        </AxisLabel>

        {/* bubbles */}
        {EMOTIONS.map((e) => {
          const pos = POSITIONS[e.word] ?? { x: 0.5, y: 0.5 };
          return (
            <Bubble
              key={e.word}
              emotion={e}
              selected={selected?.word === e.word}
              onPick={setSelected}
              x={pos.x}
              y={pos.y}
            />
          );
        })}
      </div>

      {error && (
        <Body size={13} style={{ color: "var(--color-accent)" }}>
          {error}
        </Body>
      )}

      <button
        type="button"
        onClick={confirm}
        disabled={!selected || saving}
        style={{
          width: "100%",
          background: "var(--color-ink)",
          color: "var(--color-surface)",
          border: "none",
          borderRadius: 999,
          padding: "12px 8px 12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: selected && !saving ? "pointer" : "default",
          opacity: selected ? 1 : 0.55,
          textAlign: "left",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {selected ? (
            <>
              <div
                style={{
                  font: "500 16px var(--font-geist-sans), sans-serif",
                  color: QUADRANT_COLORS[selected.quadrant],
                  lineHeight: 1.2,
                }}
              >
                {selected.word}
              </div>
              <div
                style={{
                  font: "400 12px/1.35 var(--font-geist-sans), sans-serif",
                  color: "rgba(255,255,255,0.78)",
                  marginTop: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selected.definition}
              </div>
            </>
          ) : (
            <div
              style={{
                font: "400 14px var(--font-geist-sans), sans-serif",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              tap a feeling to continue
            </div>
          )}
        </div>
        <div
          aria-hidden
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--color-surface)",
            color: "var(--color-ink)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            font: "500 18px var(--font-geist-sans), sans-serif",
            flexShrink: 0,
          }}
        >
          {saving ? "…" : "→"}
        </div>
      </button>
    </Screen>
  );
}
