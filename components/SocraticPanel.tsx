"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Body, Meta, Btn, Input } from "@/components/ui";
import { streamText } from "@/lib/fetch";

type Turn = { role: "user" | "assistant"; content: string };

export function SocraticPanel({ context }: { context: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(starter?: string) {
    const userText = starter ?? input;
    if (!userText.trim()) return;
    const next: Turn[] = [...turns, { role: "user", content: userText }];
    setTurns([...next, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await streamText(
        "/api/ai/socratic",
        { context, turns: next },
        (acc) => setTurns([...next, { role: "assistant", content: acc }]),
        ac.signal,
      );
    } catch {
      // aborted or network error — leave whatever streamed in place
    } finally {
      if (abortRef.current === ac) setStreaming(false);
    }
  }

  return (
    <Card accent>
      <Meta accent>✦ SOCRATIC COMPANION</Meta>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        <Btn small onClick={() => send("Help me find distortions in what I just wrote.")}>
          find distortions
        </Btn>
        <Btn small ghost onClick={() => send("Challenge my most painful thought above.")}>
          challenge me
        </Btn>
        <Btn small ghost onClick={() => send("Help me write a balanced reframe.")}>
          reframe
        </Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, maxHeight: 320, overflowY: "auto" }}>
        {turns.length === 0 && (
          <Body soft size={13}>
            Write something, then ask for a question, challenge, or reframe.
          </Body>
        )}
        {turns.map((t, i) => (
          <div key={i}>
            <Meta>{t.role === "user" ? "YOU" : "COMPANION"}</Meta>
            <Body size={13} style={{ marginTop: 3, whiteSpace: "pre-wrap", lineHeight: 1.5, color: t.role === "user" ? "var(--color-ink)" : "var(--color-ink-soft)" }}>
              {t.content}
            </Body>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <Input
          value={input}
          onChange={setInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Ask…"
          style={{ flex: 1, padding: "8px 12px", font: "400 13px var(--font-geist-sans), sans-serif" }}
        />
        <Btn small primary onClick={() => send()} disabled={streaming}>
          send
        </Btn>
      </div>
    </Card>
  );
}
