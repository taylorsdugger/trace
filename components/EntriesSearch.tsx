"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, Body, Meta, Input, Chip } from "@/components/ui";
import { formatShortDate } from "@/lib/dates";

type Quadrant = "red" | "yellow" | "blue" | "green";

type Entry = {
  id: string;
  title: string | null;
  body_md: string;
  created_at: string;
  kind?: string;
  score?: number;
  quadrant?: Quadrant | null;
};

const QUAD_VAR: Record<Quadrant, string> = {
  red: "var(--q-sharp)",
  yellow: "var(--q-bright)",
  blue: "var(--q-low)",
  green: "var(--q-calm)",
};

type Range = "all" | "week" | "month" | "season";

const RANGE_LABEL: Record<Range, string> = {
  all: "all",
  week: "this week",
  month: "this month",
  season: "this season",
};

function withinRange(iso: string, range: Range): boolean {
  if (range === "all") return true;
  const t = new Date(iso).getTime();
  const days = range === "week" ? 7 : range === "month" ? 30 : 90;
  return Date.now() - t <= days * 86_400_000;
}

function firstLine(body: string): string {
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const l of lines) {
    if (l.startsWith(">") || l.startsWith("#")) continue;
    return l.replace(/^[*_]+|[*_]+$/g, "");
  }
  return body.slice(0, 120);
}

export function EntriesSearch({ fallback }: { fallback: Entry[] }) {
  const [q, setQ] = useState("");
  const [range, setRange] = useState<Range>("all");
  const [results, setResults] = useState<Entry[]>(fallback);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setResults(fallback);
        return;
      }
      setPending(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setPending(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, fallback]);

  const filtered = useMemo(
    () => results.filter((e) => withinRange(e.created_at, range)),
    [results, range],
  );

  return (
    <>
      <Input value={q} onChange={setQ} placeholder="follow the trail…" />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {(["all", "week", "month", "season"] as const).map((r) => (
          <Chip key={r} active={range === r} onClick={() => setRange(r)}>
            {RANGE_LABEL[r]}
          </Chip>
        ))}
      </div>

      {pending && <Meta>walking back…</Meta>}
      {filtered.length === 0 && (
        <Card>
          <Body soft size={13}>
            no traces yet. the trail starts here.
          </Body>
        </Card>
      )}
      {filtered.map((e) => {
        const tint = e.quadrant ? QUAD_VAR[e.quadrant] : "var(--hairline)";
        return (
          <Link key={e.id} href={`/trail/${e.id}`} style={{ textDecoration: "none" }}>
            <Card style={{ position: "relative", paddingLeft: 18 }}>
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  top: 10,
                  bottom: 10,
                  width: 3,
                  borderRadius: 3,
                  background: tint,
                  opacity: e.quadrant ? 0.65 : 0.3,
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <Body
                  size={16}
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontWeight: 400,
                    lineHeight: 1.35,
                    flex: 1,
                  }}
                >
                  {e.title || firstLine(e.body_md)}
                </Body>
                <Meta>{formatShortDate(e.created_at)}</Meta>
              </div>
              {e.title && (
                <Body
                  soft
                  size={13}
                  style={{
                    marginTop: 6,
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {firstLine(e.body_md)}
                </Body>
              )}
            </Card>
          </Link>
        );
      })}
    </>
  );
}
