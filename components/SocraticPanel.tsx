"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Body, Meta, Btn, Input, CedarSprig } from "@/components/ui";
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
      <Meta accent>a question from cedar</Meta>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        <Btn small onClick={() => send("what tangles are caught in what i just wrote?")}>
          find tangles
        </Btn>
        <Btn small ghost onClick={() => send("is that the whole story?")}>
          push back
        </Btn>
        <Btn small ghost onClick={() => send("help me write a steadier version of this.")}>
          reframe
        </Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12, maxHeight: 320, overflowY: "auto" }}>
        {turns.length === 0 && (
          <Body soft size={13}>
            write something, then ask cedar to sit with it.
          </Body>
        )}
        {turns.map((t, i) => {
          const isCedar = t.role === "assistant";
          return (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              {isCedar ? <CedarSprig size={20} style={{ marginTop: 2 }} /> : null}
              <div style={{ flex: 1 }}>
                <Meta>{isCedar ? "cedar" : "you"}</Meta>
                <Body
                  size={isCedar ? 14 : 13}
                  style={{
                    marginTop: 3,
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.5,
                    color: isCedar ? "var(--ink)" : "var(--ink-soft)",
                    fontFamily: isCedar ? "var(--font-serif)" : undefined,
                  }}
                >
                  {t.content}
                </Body>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <Input
          value={input}
          onChange={setInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="ask…"
          style={{ flex: 1, padding: "8px 12px", font: "400 13px var(--font-sans)" }}
        />
        <Btn small primary onClick={() => send()} disabled={streaming}>
          send
        </Btn>
      </div>
    </Card>
  );
}
