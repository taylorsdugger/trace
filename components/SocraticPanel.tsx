"use client";

import { useState } from "react";

type Turn = { role: "user" | "assistant"; content: string };

export function SocraticPanel({ context }: { context: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  async function send(starter?: string) {
    const userText = starter ?? input;
    if (!userText.trim()) return;
    const next: Turn[] = [...turns, { role: "user", content: userText }];
    setTurns(next);
    setInput("");
    setStreaming(true);
    try {
      const res = await fetch("/api/ai/socratic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, turns: next }),
      });
      if (!res.body) {
        setStreaming(false);
        return;
      }
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

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 space-y-3 sticky top-4">
      <div className="text-xs uppercase tracking-wide text-neutral-500">Socratic companion</div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => send("Help me find distortions in what I just wrote.")} className="text-xs rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1">Find distortions</button>
        <button onClick={() => send("Challenge my most painful thought above.")} className="text-xs rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1">Challenge me</button>
        <button onClick={() => send("Help me write a balanced reframe.")} className="text-xs rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1">Reframe</button>
      </div>
      <div className="max-h-80 overflow-y-auto space-y-2 text-sm">
        {turns.length === 0 && <p className="text-neutral-500">Write something, then ask for a question, challenge, or reframe.</p>}
        {turns.map((t, i) => (
          <div key={i} className={t.role === "user" ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-600 dark:text-neutral-400"}>
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
          placeholder="Ask…"
          className="flex-1 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1 text-sm"
        />
        <button onClick={() => send()} disabled={streaming} className="text-xs rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2 py-1 disabled:opacity-50">
          Send
        </button>
      </div>
    </div>
  );
}
