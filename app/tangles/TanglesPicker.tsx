"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Screen, TopBar, Card, Body, Btn, IconBtn } from "@/components/ui";
import { TRAPS } from "@/lib/traps";

export function TanglesPicker() {
  const router = useRouter();
  const params = useSearchParams();
  const preselected = params.get("trap");
  const next = params.get("next");

  const initial = new Set<string>();
  if (preselected) {
    const match = TRAPS.find(
      (t) => t.slug === preselected || t.name.toLowerCase() === preselected.toLowerCase(),
    );
    if (match) initial.add(match.slug);
  }
  const [selected, setSelected] = useState<Set<string>>(initial);

  function leave() {
    if (next) router.push(next);
    else router.back();
  }

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function confirm() {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("trace.tangles", JSON.stringify(Array.from(selected)));
    }
    leave();
  }

  return (
    <Screen>
      <TopBar
        left={<IconBtn onClick={leave}>← back</IconBtn>}
        title="tangles"
        right="?"
      />

      <Body soft size={13}>
        what&apos;s caught in the underbrush. tap any that fit.
      </Body>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          flex: 1,
          alignContent: "flex-start",
          minHeight: 0,
          overflow: "auto",
        }}
      >
        {TRAPS.map((t) => {
          const picked = selected.has(t.slug);
          return (
            <Card
              key={t.slug}
              as="button"
              onClick={() => toggle(t.slug)}
              style={{
                padding: 12,
                minHeight: 86,
                background: picked ? "var(--ink)" : "var(--surface)",
                color: picked ? "var(--surface)" : "var(--ink)",
                border: picked
                  ? "1px solid var(--ink)"
                  : "1px solid var(--hairline)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  font: "18px var(--font-serif), serif",
                  color: "var(--moss)",
                  opacity: picked ? 1 : 0.85,
                }}
              >
                {t.icon}
              </div>
              <div
                style={{
                  font: "500 13px var(--font-sans), sans-serif",
                  color: picked ? "var(--surface)" : "var(--ink)",
                  marginTop: "auto",
                }}
              >
                {t.name}
              </div>
              <div
                style={{
                  font: "11px/1.3 var(--font-sans), sans-serif",
                  color: picked ? "rgba(247,242,232,0.65)" : "var(--ink-soft)",
                }}
              >
                {t.desc}
              </div>
            </Card>
          );
        })}
      </div>

      <Btn primary onClick={confirm} disabled={selected.size === 0} style={{ width: "100%" }}>
        Continue · {selected.size} selected
      </Btn>
    </Screen>
  );
}
