"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SocraticPanel } from "./SocraticPanel";

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
};

export function Editor({ entry }: { entry: EditorEntry }) {
  const router = useRouter();
  const [title, setTitle] = useState(entry.title ?? "");
  const [body, setBody] = useState(entry.body_md);
  const [mood, setMood] = useState<number | "">(entry.mood ?? "");
  const [tags, setTags] = useState(entry.tags.join(", "));
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const ta = useRef<HTMLTextAreaElement | null>(null);

  function insertTemplate() {
    setBody((b) => (b.trim() ? b + "\n\n" + THOUGHT_RECORD_TEMPLATE : THOUGHT_RECORD_TEMPLATE));
    setTimeout(() => ta.current?.focus(), 0);
  }

  async function save() {
    setSaveError(null);
    const payload = {
      title: title || null,
      body_md: body,
      mood: mood === "" ? null : Number(mood),
      kind: entry.kind,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
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

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-lg font-medium"
        />
        <div className="flex items-center gap-3 text-sm">
          <label className="text-neutral-500">Mood</label>
          <input
            type="number"
            min={1}
            max={10}
            value={mood}
            onChange={(e) => setMood(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-20 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tags, comma separated"
            className="flex-1 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1"
          />
        </div>
        <textarea
          ref={ta}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full min-h-[420px] rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 font-mono text-sm leading-relaxed"
        />
        <div className="flex items-center gap-2">
          <button onClick={insertTemplate} type="button" className="text-xs rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1">
            Insert CBT thought record
          </button>
          <div className="flex-1" />
          {entry.id && (
            <button onClick={remove} type="button" className="text-xs text-red-500 hover:underline">Delete</button>
          )}
          <button
            onClick={save}
            disabled={pending}
            className="rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
        {saveError && <p className="text-sm text-red-500">{saveError}</p>}
      </div>
      <aside>
        <SocraticPanel context={`Title: ${title}\n\n${body}`} />
      </aside>
    </div>
  );
}
