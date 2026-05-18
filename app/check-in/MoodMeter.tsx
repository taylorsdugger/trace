"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EMOTIONS,
  EMOTION_GRID,
  EMOTION_GRID_POSITIONS,
  QUADRANT_COLORS,
  valenceOf,
  energyOf,
  type Emotion,
} from "@/lib/emotions";
import { Screen, TopBar, Body, Meta } from "@/components/ui";

const BUBBLE_SIZE = 108;
const GRID_PX_WIDTH = BUBBLE_SIZE * EMOTION_GRID.cols;
const GRID_PX_HEIGHT = BUBBLE_SIZE * EMOTION_GRID.rows;

function fontSizeFor(word: string) {
  if (word.length >= 11) return 11;
  if (word.length >= 9) return 12;
  if (word.length >= 7) return 13;
  return 14;
}

function clamp01(n: number) {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

function Bubble({
  emotion,
  selected,
  focused,
  onPick,
  col,
  row,
}: {
  emotion: Emotion;
  selected: boolean;
  focused: boolean;
  onPick: (e: Emotion) => void;
  col: number;
  row: number;
}) {
  const scale = selected ? 1.22 : focused ? 1.18 : 1;
  const shadow = selected
    ? `0 0 0 3px var(--color-paper), 0 0 0 5px var(--color-ink), 0 12px 28px rgba(26,23,20,0.18)`
    : focused
      ? `0 0 0 2px var(--color-paper), 0 10px 24px rgba(26,23,20,0.16)`
      : "0 1px 2px rgba(26,23,20,0.06)";
  return (
    <button
      type="button"
      onClick={() => onPick(emotion)}
      aria-pressed={selected}
      data-word={emotion.word}
      style={{
        gridColumnStart: col + 1,
        gridRowStart: row + 1,
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
        boxShadow: shadow,
        transform: `scale(${scale})`,
        transition: "transform 180ms cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 180ms ease",
        willChange: "transform",
        zIndex: selected ? 3 : focused ? 2 : 1,
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
        padding: "2px 6px",
        borderRadius: 999,
        border: "1px solid var(--color-ink-line)",
        zIndex: 4,
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
  const next = params.get("next") ?? "/trail/new?mode=quick";
  const [selected, setSelected] = useState<Emotion | null>(null);
  const [focusedWord, setFocusedWord] = useState<string | null>(null);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const focusRafRef = useRef<number | null>(null);
  const [gutter, setGutter] = useState({ x: 128, y: 128 });

  // Size the scrollable gutters so any bubble — including the top/bottom
  // rows and far columns — can be dragged to the viewport center. Measured
  // per-axis because the viewport isn't always square. Re-measure on resize.
  useLayoutEffect(() => {
    const v = viewportRef.current;
    if (!v) return;
    function measure() {
      const node = viewportRef.current;
      if (!node) return;
      const nx = Math.max(16, Math.ceil(node.clientWidth / 2 - BUBBLE_SIZE / 2));
      const ny = Math.max(16, Math.ceil(node.clientHeight / 2 - BUBBLE_SIZE / 2));
      setGutter((prev) => (prev.x === nx && prev.y === ny ? prev : { x: nx, y: ny }));
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(v);
    return () => ro.disconnect();
  }, []);

  // Center the grid on (0.5, 0.5) whenever the gutter changes so we always
  // start at the origin and stay centered after a resize.
  useLayoutEffect(() => {
    const v = viewportRef.current;
    if (!v) return;
    v.scrollLeft = (v.scrollWidth - v.clientWidth) / 2;
    v.scrollTop = (v.scrollHeight - v.clientHeight) / 2;
  }, [gutter]);

  // Highlight the emotion closest to the viewport center while panning/scrolling.
  useEffect(() => {
    const v = viewportRef.current;
    const g = gridRef.current;
    if (!v || !g) return;

    function computeFocus() {
      focusRafRef.current = null;
      const view = viewportRef.current;
      const grid = gridRef.current;
      if (!view || !grid) return;
      const vr = view.getBoundingClientRect();
      const cx = vr.left + vr.width / 2;
      const cy = vr.top + vr.height / 2;
      const RADIUS = BUBBLE_SIZE * 0.9;
      let bestWord: string | null = null;
      let bestDist = RADIUS;
      const nodes = grid.querySelectorAll<HTMLButtonElement>("button[data-word]");
      for (const node of nodes) {
        const r = node.getBoundingClientRect();
        const bx = r.left + r.width / 2;
        const by = r.top + r.height / 2;
        const d = Math.hypot(bx - cx, by - cy);
        if (d < bestDist) {
          bestDist = d;
          bestWord = node.dataset.word ?? null;
        }
      }
      setFocusedWord((prev) => (prev === bestWord ? prev : bestWord));
    }

    function schedule() {
      if (focusRafRef.current != null) return;
      focusRafRef.current = requestAnimationFrame(computeFocus);
    }

    schedule();
    v.addEventListener("scroll", schedule, { passive: true });
    return () => {
      v.removeEventListener("scroll", schedule);
      if (focusRafRef.current != null) {
        cancelAnimationFrame(focusRafRef.current);
        focusRafRef.current = null;
      }
    };
  }, []);

  // Mouse-follow panning on fine pointers only. Coarse pointers keep native touch scroll.
  useEffect(() => {
    const v = viewportRef.current;
    if (!v) return;
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(pointer: fine)");
    let attached = false;

    function tick() {
      const target = targetRef.current;
      const node = viewportRef.current;
      if (!target || !node) {
        rafRef.current = null;
        return;
      }
      const dx = target.x - node.scrollLeft;
      const dy = target.y - node.scrollTop;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        node.scrollLeft = target.x;
        node.scrollTop = target.y;
        rafRef.current = null;
        return;
      }
      node.scrollLeft += dx * 0.12;
      node.scrollTop += dy * 0.12;
      rafRef.current = requestAnimationFrame(tick);
    }

    function onMove(e: MouseEvent) {
      const node = viewportRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const fx = clamp01((e.clientX - rect.left) / rect.width);
      const fy = clamp01((e.clientY - rect.top) / rect.height);
      targetRef.current = {
        x: fx * (node.scrollWidth - node.clientWidth),
        y: fy * (node.scrollHeight - node.clientHeight),
      };
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    function onLeave() {
      targetRef.current = null;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    function attach() {
      if (attached || !v) return;
      v.addEventListener("mousemove", onMove);
      v.addEventListener("mouseleave", onLeave);
      attached = true;
    }
    function detach() {
      if (!attached || !v) return;
      v.removeEventListener("mousemove", onMove);
      v.removeEventListener("mouseleave", onLeave);
      attached = false;
      onLeave();
    }

    if (mq.matches) attach();

    function onChange(ev: MediaQueryListEvent) {
      if (ev.matches) attach();
      else detach();
    }
    mq.addEventListener("change", onChange);

    return () => {
      mq.removeEventListener("change", onChange);
      detach();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const previewWord = hoveredWord ?? focusedWord;
  const preview: Emotion | null =
    (previewWord ? EMOTIONS.find((e) => e.word === previewWord) ?? null : null) ?? selected;

  function confirm() {
    if (!selected) return;
    setError(null);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "trace.mood",
        JSON.stringify({
          id: selected.id,
          emotion: selected.word,
          valence: valenceOf(selected),
          energy: energyOf(selected),
          quadrant: selected.quadrant,
          at: Date.now(),
        })
      );
    }
    router.push(next);
  }

  return (
    <Screen style={{ paddingBottom: 24, height: "100dvh", minHeight: 0, overflow: "hidden" }}>
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
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            height: "100%",
            aspectRatio: "1 / 1",
            maxWidth: "100%",
          }}
        >
        {/* Pannable viewport */}
        <div
          ref={viewportRef}
          className="mood-viewport"
          style={{
            position: "absolute",
            inset: 0,
            overflow: "auto",
            overscrollBehavior: "contain",
            touchAction: "pan-x pan-y",
            borderRadius: 36,
            border: "1px solid var(--color-ink-line)",
            background: "var(--color-paper)",
            boxShadow: "inset 0 0 0 1px rgba(26,23,20,0.02)",
            padding: `${gutter.y}px ${gutter.x}px`,
          }}
        >
          <div
            ref={gridRef}
            onPointerOver={(e) => {
              if (e.pointerType !== "mouse") return;
              const t = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-word]");
              if (t) setHoveredWord(t.dataset.word ?? null);
            }}
            onPointerLeave={(e) => {
              if (e.pointerType !== "mouse") return;
              setHoveredWord(null);
            }}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${EMOTION_GRID.cols}, ${BUBBLE_SIZE}px)`,
              gridTemplateRows: `repeat(${EMOTION_GRID.rows}, ${BUBBLE_SIZE}px)`,
              gap: 0,
              width: GRID_PX_WIDTH,
              height: GRID_PX_HEIGHT,
            }}
          >
            {EMOTIONS.map((e) => {
              const pos = EMOTION_GRID_POSITIONS[e.word];
              if (!pos) return null;
              return (
                <Bubble
                  key={e.word}
                  emotion={e}
                  selected={selected?.word === e.word}
                  focused={hoveredWord ? hoveredWord === e.word : focusedWord === e.word}
                  onPick={setSelected}
                  col={pos.col}
                  row={pos.row}
                />
              );
            })}
          </div>
        </div>

        {/* Axis labels overlay the viewport so they stay fixed while panning */}
        <AxisLabel style={{ top: 8, left: "50%", transform: "translateX(-50%)" }}>
          high energy
        </AxisLabel>
        <AxisLabel style={{ bottom: 8, left: "50%", transform: "translateX(-50%)" }}>
          low energy
        </AxisLabel>
        <AxisLabel
          style={{
            left: 8,
            top: "50%",
            transform: "translateY(-50%) rotate(-90deg)",
            transformOrigin: "center",
          }}
        >
          unpleasant
        </AxisLabel>
        <AxisLabel
          style={{
            right: 8,
            top: "50%",
            transform: "translateY(-50%) rotate(90deg)",
            transformOrigin: "center",
          }}
        >
          pleasant
        </AxisLabel>
        </div>
      </div>

      {error && (
        <Body size={13} style={{ color: "var(--color-accent)" }}>
          {error}
        </Body>
      )}

      <button
        type="button"
        onClick={confirm}
        disabled={!selected}
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
          cursor: selected ? "pointer" : "default",
          opacity: selected ? 1 : 0.55,
          textAlign: "left",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {preview ? (
            <>
              <div
                style={{
                  font: "500 16px var(--font-geist-sans), sans-serif",
                  color: QUADRANT_COLORS[preview.quadrant],
                  lineHeight: 1.2,
                }}
              >
                {preview.word}
              </div>
              {preview.definition && (
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
                  {preview.definition}
                </div>
              )}
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
          →
        </div>
      </button>
    </Screen>
  );
}
