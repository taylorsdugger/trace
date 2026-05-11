"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";

type Turn = { role: "user" | "assistant"; content: string };

export default function CheckInPage() {
  const router = useRouter();
  const [mood, setMood] = useState(5);
  const [seed, setSeed] = useState("");
  const [started, setStarted] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [saving, setSaving] = useState(false);

  async function ask(next: Turn[]) {
    setStreaming(true);
    try {
      const res = await fetch("/api/ai/socratic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: `Daily check-in. Mood: ${mood}/10.\nWhat's on my mind:\n${seed}`,
          turns: next,
        }),
      });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setTurns([...next, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setTurns([...next, { role: "assistant", content: acc }]);
      }
    } finally {
      setStreaming(false);
    }
  }

  async function start() {
    setStarted(true);
    await ask([{ role: "user", content: "I'm starting today's check-in. Ask me one Socratic question to dig deeper." }]);
  }

  async function send() {
    if (!input.trim()) return;
    const next: Turn[] = [...turns, { role: "user", content: input }];
    setInput("");
    setTurns(next);
    await ask(next);
  }

  async function saveAndFinish() {
    setSaving(true);
    const transcript = [
      `Mood: ${mood}/10`,
      `What's on my mind: ${seed}`,
      "",
      ...turns.map((t) => `**${t.role === "user" ? "Me" : "Companion"}:** ${t.content}`),
    ].join("\n\n");
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Check-in ${new Date().toLocaleDateString()}`,
        body_md: transcript,
        mood,
        kind: "check_in",
        tags: ["check-in"],
      }),
    });
    setSaving(false);
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/entries/${id}`);
    }
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        <h1 className="text-2xl font-semibold">Daily check-in</h1>
        {!started ? (
          <>
            <div>
              <label className="text-sm text-neutral-500">Mood: {mood}/10</label>
              <input type="range" min={1} max={10} value={mood} onChange={(e) => setMood(Number(e.target.value))} className="w-full" />
            </div>
            <textarea
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="What's on your mind right now?"
              className="w-full min-h-[180px] rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2"
            />
            <button onClick={start} disabled={!seed.trim()} className="rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-sm font-medium disabled:opacity-50">
              Begin
            </button>
          </>
        ) : (
          <>
            <div className="space-y-2 text-sm">
              <div className="rounded border border-neutral-200 dark:border-neutral-800 p-3 whitespace-pre-wrap">{seed}</div>
              {turns.map((t, i) => (
                <div key={i} className={t.role === "user" ? "" : "text-neutral-600 dark:text-neutral-400"}>
                  <span className="font-medium">{t.role === "user" ? "You" : "Companion"}: </span>
                  <span className="whitespace-pre-wrap">{t.content}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder="Reply…"
                className="flex-1 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1 text-sm"
              />
              <button onClick={send} disabled={streaming} className="text-xs rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2 py-1 disabled:opacity-50">Send</button>
            </div>
            <button onClick={saveAndFinish} disabled={saving} className="rounded border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm disabled:opacity-50">
              {saving ? "Saving…" : "Save check-in"}
            </button>
          </>
        )}
      </main>
    </>
  );
}
