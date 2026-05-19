"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Body, Btn, Card, CedarSprig, Meta, TextArea } from "@/components/ui";
import { fetchJson, streamText } from "@/lib/fetch";

type Props = {
  entryId: string;
  context: string;
  currentBody: string;
};

type Msg = { role: "cedar" | "you"; content: string };

const LENSES = [
  "what came right before this — situation, time, who else was there",
  "the assumption inside this thought that hasn't been examined",
  "what i seem to be expecting will happen, and how likely that actually is",
  "a tangle (catastrophizing, mind reading, all-or-nothing, should-ing, fortune telling) you notice",
  "what i'm avoiding saying out loud here",
  "what a steadier version of this might sound like",
  "what part of this is actually mine vs. someone else's voice",
  "the cost of believing this thought, and the cost of not",
  "what i'd say to a friend who wrote this exact thing",
  "what's changed (or hasn't) since the last time this came up",
];

function makeStarter(seenQuestions: string[]): string {
  const lens = LENSES[Math.floor(Math.random() * LENSES.length)];
  const avoid = seenQuestions.length
    ? `\n\nDo not ask any of these (or a paraphrase): ${seenQuestions.map((q) => `"${q}"`).join("; ")}.`
    : "";
  return `Open a real turn on this trace, focused on: ${lens}. Say what you actually notice — quote a phrase from what i wrote, name the tangle or assumption you see, take a position. End with one specific question only if it earns its place. Don't just lob a question back; give me something to sit with.${avoid}`;
}

const DIFFERENT_INSTRUCTION =
  "Take a different angle than your last turn — situation, body, assumption, tangle, value, time, what i'm avoiding, what i'd tell a friend. Say what you notice in a few real sentences before any question. Do not paraphrase your previous question.";

export function TraceExpand({ entryId, context, currentBody }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [bodySoFar, setBodySoFar] = useState(currentBody);
  const [savedThrough, setSavedThrough] = useState(0);
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const dirtyRef = useRef(false);

  function apiTurns(localMsgs: Msg[]) {
    // Use the most recent cedar question as the implicit "starter" so the
    // server-side conversation reflects what the user is actually replying to.
    const firstCedar = localMsgs.find((m) => m.role === "cedar")?.content ?? "";
    return [
      {
        role: "user" as const,
        content: firstCedar
          ? `Continue this thread. Build on my replies; never repeat a question you already asked.`
          : "Walk with me on this trace.",
      },
      ...localMsgs.map((m) => ({
        role: m.role === "cedar" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
    ];
  }

  async function streamCedar(turns: { role: "user" | "assistant"; content: string }[]) {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setThinking(true);
    setMsgs((prev) => [...prev, { role: "cedar", content: "…" }]);
    try {
      await streamText(
        "/api/ai/socratic",
        { context, turns },
        (acc) => {
          setMsgs((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "cedar", content: acc };
            return next;
          });
        },
        ac.signal,
      );
    } catch {
      setMsgs((prev) => {
        const next = [...prev];
        if (next[next.length - 1]?.content === "…") {
          next[next.length - 1] = {
            role: "cedar",
            content: "what part of this feels biggest now, looking back?",
          };
        }
        return next;
      });
    } finally {
      if (abortRef.current === ac) setThinking(false);
    }
  }

  function priorCedarQuestions(): string[] {
    // Pull existing cedar `> question` lines out of the trace body so the model
    // can avoid repeating questions already rooted into this trace.
    const re = /^>\s?(.+)$/gm;
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(currentBody))) {
      const q = m[1].trim();
      if (q && !out.includes(q)) out.push(q);
    }
    return out.slice(-6);
  }

  async function openWithCedar() {
    setOpen(true);
    setMsgs([]);
    setInput("");
    setBodySoFar(currentBody);
    setSavedThrough(0);
    dirtyRef.current = false;
    const starter = makeStarter(priorCedarQuestions());
    await streamCedar([{ role: "user", content: starter }]);
  }

  async function askDifferent() {
    // Keep the prior cedar question in the turn list so the model knows what
    // to NOT repeat. Drop it from the local view so the new one replaces it.
    const previousQ =
      [...msgs].reverse().find((m) => m.role === "cedar")?.content?.trim() ?? "";
    setMsgs((prev) => {
      const trimmed = [...prev];
      if (trimmed[trimmed.length - 1]?.role === "cedar") trimmed.pop();
      return trimmed;
    });
    const turns: { role: "user" | "assistant"; content: string }[] = [
      { role: "user", content: "Walk with me on this trace." },
    ];
    if (previousQ) turns.push({ role: "assistant", content: previousQ });
    const avoidLine = previousQ
      ? `\n\nYour previous question was: "${previousQ}". Do not repeat or paraphrase it.`
      : "";
    turns.push({ role: "user", content: DIFFERENT_INSTRUCTION + avoidLine });
    await streamCedar(turns);
  }

  function openFreeWrite() {
    setOpen(true);
    setMsgs([]);
    setInput("");
    setBodySoFar(currentBody);
    setSavedThrough(0);
    dirtyRef.current = false;
  }

  function close() {
    abortRef.current?.abort();
    setOpen(false);
    setMsgs([]);
    setInput("");
    setSavedThrough(0);
    setThinking(false);
    if (dirtyRef.current) {
      dirtyRef.current = false;
      startTransition(() => router.refresh());
    }
  }

  async function submitReply() {
    const answer = input.trim();
    if (!answer || busy) return;
    setBusy(true);
    setInput("");
    const nextMsgs: Msg[] = [...msgs, { role: "you", content: answer }];
    setMsgs(nextMsgs);
    await streamCedar(apiTurns(nextMsgs));
    setBusy(false);
  }

  function buildAppendix(): string {
    let appendix = "";
    let i = savedThrough;
    while (i < msgs.length) {
      const m = msgs[i];
      if (m.role === "cedar") {
        const next = msgs[i + 1];
        if (next && next.role === "you") {
          // Prefix every line of Cedar's reply with `>` so multi-paragraph
          // messages stay grouped as one quoted block when parsed back.
          const quoted = m.content
            .trim()
            .split("\n")
            .map((line) => (line.length ? `> ${line}` : ">"))
            .join("\n");
          appendix += `\n\n${quoted}\n\n${next.content.trim()}`;
          i += 2;
        } else {
          // unanswered cedar question — don't save it
          break;
        }
      } else {
        // free-write 'you' message with no cedar preceding
        appendix += `\n\n${m.content.trim()}`;
        i += 1;
      }
    }
    return appendix;
  }

  function unsavedCount(): number {
    let count = 0;
    let i = savedThrough;
    while (i < msgs.length) {
      const m = msgs[i];
      if (m.role === "cedar") {
        const next = msgs[i + 1];
        if (next && next.role === "you") {
          count += 1;
          i += 2;
        } else break;
      } else {
        count += 1;
        i += 1;
      }
    }
    return count;
  }

  async function saveToTrace() {
    if (saving) return;
    const appendix = buildAppendix();
    if (!appendix) return;
    setSaving(true);
    const base = bodySoFar.trimEnd();
    const appended = base + appendix;
    const res = await fetchJson(`/api/traces/${entryId}`, {
      method: "PUT",
      body: { body_md: appended },
    });
    setSaving(false);
    if (res.ok) {
      setBodySoFar(appended);
      // Mark every "complete" message as saved (skip a trailing unanswered cedar).
      let through = savedThrough;
      let i = savedThrough;
      while (i < msgs.length) {
        const m = msgs[i];
        if (m.role === "cedar") {
          const next = msgs[i + 1];
          if (next && next.role === "you") {
            through = i + 2;
            i += 2;
          } else break;
        } else {
          through = i + 1;
          i += 1;
        }
      }
      setSavedThrough(through);
      dirtyRef.current = true;
    }
  }

  if (!open) {
    return (
      <Card accent>
        <Meta accent>keep tracing</Meta>
        <Body soft size={13} style={{ marginTop: 8 }}>
          return to this trace. cedar can offer a question to follow it deeper,
          or add a new ring on your own.
        </Body>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
          <Btn small onClick={openWithCedar}>
            ask cedar a question
          </Btn>
          <Btn small ghost onClick={openFreeWrite}>
            just add a note
          </Btn>
        </div>
      </Card>
    );
  }

  const pending = unsavedCount();
  const hasCedar = msgs.some((m) => m.role === "cedar");

  return (
    <Card accent>
      <Meta accent>keep tracing</Meta>

      {msgs.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginTop: 12,
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {msgs.map((m, i) => {
            const isCedar = m.role === "cedar";
            const isSaved = i < savedThrough;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  alignSelf: isCedar ? "flex-start" : "flex-end",
                  maxWidth: "90%",
                  opacity: isSaved ? 0.55 : 1,
                }}
              >
                {isCedar && <CedarSprig size={20} style={{ marginTop: 2, flexShrink: 0 }} />}
                <div>
                  <Meta>
                    {isCedar ? "cedar" : "you"}
                    {isSaved ? " · rooted" : ""}
                  </Meta>
                  <Body
                    size={isCedar ? 14 : 13}
                    style={{
                      marginTop: 3,
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.55,
                      color: isCedar ? "var(--ink)" : "var(--ink-soft)",
                      fontFamily: isCedar ? "var(--font-serif)" : undefined,
                      fontStyle: isCedar ? "italic" : undefined,
                    }}
                  >
                    {m.content}
                  </Body>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <TextArea
          value={input}
          onChange={setInput}
          placeholder={hasCedar ? "reply. cedar will reply back." : "what's returned about this?"}
          rows={4}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          justifyContent: "flex-end",
          marginTop: 12,
        }}
      >
        {hasCedar && (
          <Btn small ghost onClick={askDifferent} disabled={busy || thinking}>
            another question
          </Btn>
        )}
        <Btn small ghost onClick={close} disabled={busy || saving}>
          close
        </Btn>
        <Btn small ghost onClick={saveToTrace} disabled={saving || pending === 0}>
          {saving ? "rooting…" : pending > 0 ? `save to trace (${pending})` : "save to trace"}
        </Btn>
        <Btn small primary onClick={submitReply} disabled={busy || !input.trim()}>
          {busy ? "…" : "reply"}
        </Btn>
      </div>
    </Card>
  );
}
