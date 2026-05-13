"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Body, Meta, Input } from "@/components/ui";
import { formatShortDate } from "@/lib/dates";

type Entry = {
  id: string;
  title: string | null;
  body_md: string;
  created_at: string;
  kind?: string;
  score?: number;
};

export function EntriesSearch({ fallback }: { fallback: Entry[] }) {
  const [q, setQ] = useState("");
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

  return (
    <>
      <Input value={q} onChange={setQ} placeholder="Search by meaning or keyword…" />
      {pending && <Meta>searching…</Meta>}
      {results.length === 0 && (
        <Card>
          <Body soft size={13}>
            No entries.
          </Body>
        </Card>
      )}
      {results.map((e) => (
        <Link key={e.id} href={`/entries/${e.id}`} style={{ textDecoration: "none" }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <Body size={14} style={{ fontWeight: 500 }}>
                {e.title || "(untitled)"}
              </Body>
              <Meta>{formatShortDate(e.created_at)}</Meta>
            </div>
            <Body soft size={13} style={{ marginTop: 6, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {e.body_md.slice(0, 200)}
            </Body>
          </Card>
        </Link>
      ))}
    </>
  );
}