"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Body, Meta, CedarSprig } from "@/components/ui";
import { TRAPS } from "@/lib/traps";
import { formatLongDate } from "@/lib/dates";
import { fetchJson } from "@/lib/fetch";
import { TraceExpand } from "@/components/TraceExpand";

type ReaderEntry = {
  id: string;
  title: string | null;
  body_md: string;
  kind: "journal" | "thought_record" | "check_in";
  tags: string[];
  createdAt: string;
  emotion: string | null;
  sleepHours: number | null;
};

type Block =
  | { kind: "text"; content: string }
  | { kind: "note"; question: string; answer: string };

function parseBody(md: string): Block[] {
  // Split on blank lines into paragraphs, then group consecutive `>` paragraphs
  // as one Cedar question and the following non-`>` paragraph as the reply.
  const paragraphs = md.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const blocks: Block[] = [];
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (p.startsWith(">")) {
      const cedarParts: string[] = [p.replace(/^>\s?/gm, "").trim()];
      while (i + 1 < paragraphs.length && paragraphs[i + 1].startsWith(">")) {
        i++;
        cedarParts.push(paragraphs[i].replace(/^>\s?/gm, "").trim());
      }
      const question = cedarParts.join("\n\n");
      const answer = paragraphs[i + 1] && !paragraphs[i + 1].startsWith(">")
        ? paragraphs[i + 1]
        : "";
      if (answer) i++;
      blocks.push({ kind: "note", question, answer });
    } else {
      blocks.push({ kind: "text", content: p });
    }
  }
  return blocks;
}

function trapName(slug: string): string {
  return TRAPS.find((t) => t.slug === slug)?.name ?? slug;
}

function splitTags(all: string[]): { tangles: string[]; rest: string[] } {
  const tangles: string[] = [];
  const rest: string[] = [];
  for (const t of all) {
    if (t.startsWith("trap:")) tangles.push(t.slice(5));
    else if (t !== "check-in") rest.push(t);
  }
  return { tangles, rest };
}

export function TraceReader({ entry }: { entry: ReaderEntry }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const { tangles, rest } = splitTags(entry.tags);
  const blocks = parseBody(entry.body_md);

  async function letItRest() {
    if (!confirm("let this trace rest?")) return;
    setBusy(true);
    const res = await fetchJson(`/api/traces/${entry.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      startTransition(() => {
        router.push("/trail");
        router.refresh();
      });
    }
  }

  const headline =
    entry.title?.trim() ||
    (entry.kind === "check_in" ? "a daily note" :
     entry.kind === "thought_record" ? "a thought record" : "a trace");

  return (
    <article
      style={{
        width: "100%",
        maxWidth: 640,
        marginLeft: "auto",
        marginRight: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 22,
        paddingTop: 8,
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Meta>{formatLongDate(entry.createdAt).toUpperCase()}</Meta>
        <h1
          style={{
            margin: 0,
            font: "400 32px/1.15 var(--font-serif)",
            color: "var(--ink)",
            letterSpacing: -0.4,
          }}
        >
          {headline}
        </h1>
        {(entry.emotion || entry.sleepHours != null) && (
          <Body size={13} soft>
            {entry.emotion && (
              <>feeling <span style={{ color: "var(--ink)", fontWeight: 500 }}>{entry.emotion}</span></>
            )}
            {entry.emotion && entry.sleepHours != null && " · "}
            {entry.sleepHours != null && <>slept {entry.sleepHours}h</>}
          </Body>
        )}
        {tangles.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {tangles.map((slug) => (
              <span
                key={slug}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 9px",
                  borderRadius: 999,
                  font: "500 12px var(--font-sans)",
                  background: "var(--moss-tint)",
                  color: "var(--moss-deep)",
                  border: "1px solid var(--moss-line)",
                }}
              >
                {trapName(slug)}
              </span>
            ))}
          </div>
        )}
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {blocks.map((b, i) =>
          b.kind === "text" ? (
            <p
              key={i}
              style={{
                margin: 0,
                font: "400 17px/1.65 var(--font-serif)",
                color: "var(--ink)",
                whiteSpace: "pre-wrap",
              }}
            >
              {b.content}
            </p>
          ) : (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  alignSelf: "flex-start",
                  maxWidth: "85%",
                }}
              >
                <CedarSprig size={20} style={{ marginTop: 8, flexShrink: 0 }} />
                <div
                  style={{
                    padding: "10px 14px",
                    background: "var(--moss-tint)",
                    borderRadius: 14,
                    borderLeft: "2px solid var(--moss)",
                  }}
                >
                  <Body
                    size={14}
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontStyle: "italic",
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {b.question}
                  </Body>
                </div>
              </div>
              {b.answer && (
                <div
                  style={{
                    alignSelf: "flex-end",
                    maxWidth: "85%",
                    padding: "10px 14px",
                    background: "var(--surface)",
                    border: "1px solid var(--hairline)",
                    borderRadius: 14,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <Body
                    size={14}
                    style={{
                      fontFamily: "var(--font-serif)",
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                      color: "var(--ink)",
                    }}
                  >
                    {b.answer}
                  </Body>
                </div>
              )}
            </div>
          ),
        )}
      </div>

      <TraceExpand
        entryId={entry.id}
        context={`${headline}\n\n${entry.body_md}`}
        currentBody={entry.body_md}
      />

      {rest.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
          {rest.map((t) => (
            <span
              key={t}
              style={{
                font: "500 11px var(--font-mono)",
                color: "var(--ink-soft)",
                textTransform: "lowercase",
                letterSpacing: 0.3,
              }}
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <footer
        style={{
          marginTop: 12,
          paddingTop: 18,
          borderTop: "1px solid var(--hairline)",
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          href="/"
          style={{
            font: "500 13px var(--font-sans)",
            color: "var(--ink-soft)",
            textDecoration: "none",
          }}
        >
          ← return to today
        </Link>
        <Link
          href="/rings"
          style={{
            font: "500 13px var(--font-sans)",
            color: "var(--moss)",
            textDecoration: "none",
          }}
        >
          follow this thread back →
        </Link>
        <button
          type="button"
          onClick={letItRest}
          disabled={busy || pending}
          style={{
            background: "transparent",
            border: "none",
            cursor: busy ? "default" : "pointer",
            font: "500 13px var(--font-sans)",
            color: "var(--ink-soft)",
            padding: 0,
          }}
        >
          {busy ? "deleting..." : "delete"}
        </button>
      </footer>
    </article>
  );
}
