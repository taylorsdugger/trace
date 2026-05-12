"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SocraticPanel } from "./SocraticPanel";
import { Card, Display, Body, Meta, Btn, Input, TextArea, Chip } from "@/components/ui";
import { TRAPS } from "@/lib/traps";

const THOUGHT_RECORD_TEMPLATE = `## Situation
(What happened? Where? Who was involved?)

## Automatic thoughts
(What went through your mind?)

## Emotions (0-100)
-

## Cognitive distortions
-

## Balanced thought
(A more accurate, compassionate reframe.)

## Outcome
(How do you feel now? What will you do?)
`;

export type EditorEntry = {
  id?: string;
  title: string | null;
  body_md: string;
  mood: number | null;
  kind: "journal" | "thought_record" | "check_in";
  tags: string[];
  createdAt?: string;
  emotion?: string | null;
  sleepHours?: number | null;
};

function prettyDate(s?: string): string {
  if (!s) return "";
  return new Date(s).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function defaultHeadline(entry: EditorEntry): string {
  if (entry.kind === "check_in") return "Daily note";
  if (entry.kind === "thought_record") return "Thought record";
  return "Entry";
}

function splitTags(all: string[]): { traps: string[]; regular: string[] } {
  const traps: string[] = [];
  const regular: string[] = [];
  for (const t of all) {
    if (t.startsWith("trap:")) traps.push(t.slice(5));
    else regular.push(t);
  }
  return { traps, regular };
}

function trapName(slug: string): string {
  return TRAPS.find((t) => t.slug === slug)?.name ?? slug;
}

export function Editor({ entry }: { entry: EditorEntry }) {
  const router = useRouter();
  const initial = splitTags(entry.tags);
  const [title, setTitle] = useState(entry.title ?? "");
  const [body, setBody] = useState(entry.body_md);
  const [tags, setTags] = useState(initial.regular.join(", "));
  const [trapSlugs, setTrapSlugs] = useState<string[]>(initial.traps);
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const ta = useRef<HTMLTextAreaElement | null>(null);

  function insertTemplate() {
    setBody((b) => (b.trim() ? b + "\n\n" + THOUGHT_RECORD_TEMPLATE : THOUGHT_RECORD_TEMPLATE));
    setTimeout(() => ta.current?.focus(), 0);
  }

  async function save() {
    setSaveError(null);
    const regular = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const trapTags = trapSlugs.map((s) => `trap:${s}`);
    const payload = {
      title: title || null,
      body_md: body,
      mood: entry.mood,
      kind: entry.kind,
      tags: [...regular, ...trapTags],
    };
    const url = entry.id ? `/api/entries/${entry.id}` : "/api/entries";
    const method = entry.id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setSaveError(await res.text());
      return;
    }
    const data = await res.json();
    startTransition(() => {
      router.push(`/entries/${data.id}`);
      router.refresh();
    });
  }

  async function remove() {
    if (!entry.id) return;
    if (!confirm("Delete this entry?")) return;
    const res = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    if (res.ok) {
      startTransition(() => {
        router.push("/entries");
        router.refresh();
      });
    }
  }

  const headline = title.trim() || defaultHeadline(entry);
  const showMetaRow = !!(entry.emotion || entry.sleepHours || entry.createdAt);

  return (
    <>
      {/* Header — read-only summary instead of a raw title input */}
      <div>
        {entry.createdAt && <Meta>{prettyDate(entry.createdAt).toUpperCase()}</Meta>}
        <Display size={28} style={{ marginTop: 4 }}>
          {headline}
        </Display>
        {showMetaRow && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {entry.emotion && (
              <Body size={13} soft>
                feeling <span style={{ color: "var(--color-ink)", fontWeight: 500 }}>{entry.emotion}</span>
              </Body>
            )}
            {entry.sleepHours != null && (
              <Body size={13} soft>
                · slept {entry.sleepHours}h
              </Body>
            )}
          </div>
        )}
        {trapSlugs.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <Meta>THINKING TRAPS</Meta>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
              {trapSlugs.map((slug) => (
                <Chip
                  key={slug}
                  active
                  onClick={() => setTrapSlugs((prev) => prev.filter((s) => s !== slug))}
                >
                  {trapName(slug)} ✕
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editable title — collapsible feel */}
      <Card style={{ padding: 10 }}>
        <Meta>TITLE</Meta>
        <Input
          value={title}
          onChange={setTitle}
          placeholder={defaultHeadline(entry)}
          style={{
            marginTop: 4,
            background: "transparent",
            border: "none",
            padding: 0,
            font: "500 15px var(--font-geist-sans), sans-serif",
          }}
        />
      </Card>

      <Card style={{ padding: 10 }}>
        <Meta>TAGS</Meta>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="comma, separated"
          style={{
            width: "100%",
            marginTop: 4,
            border: "none",
            outline: "none",
            background: "transparent",
            font: "400 14px var(--font-geist-sans), sans-serif",
            color: "var(--color-ink)",
            padding: 0,
          }}
        />
      </Card>

      <TextArea
        value={body}
        onChange={setBody}
        placeholder="What's on your mind?"
        rows={14}
        style={{
          font: "400 14px/1.6 var(--font-geist-sans), sans-serif",
          minHeight: 320,
        }}
      />

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <Btn small onClick={insertTemplate}>
          insert thought record
        </Btn>
        <div style={{ flex: 1 }} />
        {entry.id && (
          <Btn small ghost onClick={remove} style={{ color: "var(--color-accent)" }}>
            delete
          </Btn>
        )}
        <Btn primary small onClick={save} disabled={pending}>
          {pending ? "saving…" : "save"}
        </Btn>
      </div>

      {saveError && (
        <Body size={13} style={{ color: "var(--color-accent)" }}>
          {saveError}
        </Body>
      )}

      <SocraticPanel context={`Title: ${title}\n\n${body}`} />
    </>
  );
}
