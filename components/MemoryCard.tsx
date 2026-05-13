"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Meta, Body, IconBtn } from "@/components/ui";
import { formatShortDate } from "@/lib/dates";
import { fetchJson } from "@/lib/fetch";

type Theme = {
  period_end?: string | null;
  summary_md?: string | null;
} | null;

export function MemoryCard({ theme }: { theme: Theme }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = working || pending;
  const firstLine =
    theme?.summary_md
      ?.split("\n")
      .map((l) => l.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim())
      .find((l) => l.length > 0) ?? null;

  async function regenerate() {
    setError(null);
    setWorking(true);
    const r = await fetchJson<{ ok: boolean; skipped?: string; error?: string }>(
      "/api/ai/themes",
      { method: "POST" },
    );
    setWorking(false);
    if (!r.ok) {
      setError(r.data?.error ?? `Failed (${r.status})`);
      return;
    }
    if (r.data?.skipped) {
      setError(r.data.skipped);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <Card accent>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Meta accent>
          ✦ FROM MEMORY
          {theme?.period_end ? ` · ${formatShortDate(theme.period_end)}` : ""}
        </Meta>
        <IconBtn onClick={regenerate} disabled={busy}>
          <Meta accent>{busy ? "THINKING…" : "↻ REGENERATE"}</Meta>
        </IconBtn>
      </div>
      <Body size={14} style={{ marginTop: 6, lineHeight: 1.45 }}>
        {firstLine ?? "Your reflections will surface here once you've journaled a few days."}
      </Body>
      {firstLine && (
        <div style={{ marginTop: 10 }}>
          <Link
            href="/themes"
            style={{ textDecoration: "none", color: "var(--color-accent)" }}
          >
            <Meta accent>see more →</Meta>
          </Link>
        </div>
      )}
      {error && (
        <Body soft size={12} style={{ marginTop: 8 }}>
          {error}
        </Body>
      )}
    </Card>
  );
}
