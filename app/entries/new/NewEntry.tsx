"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Screen,
  TopBar,
  Card,
  Heading,
  Body,
  Meta,
  Btn,
  Chip,
  IconBtn,
  MoodDot,
  TabBar,
} from "@/components/ui";
import {
  QUADRANT_COLORS,
  CONTEXT_TAG_OPTIONS,
  type Quadrant,
} from "@/lib/emotions";
import { TRAPS } from "@/lib/traps";
import { fetchJson, streamText } from "@/lib/fetch";

function readSession<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

type Mode = "quick" | "detailed";

type StoredMood = {
  emotion: string;
  valence: number;
  energy: number;
  quadrant: Quadrant;
  at: number;
};

const DRAFT_KEY = "trace.draft";

type Draft = {
  mode: Mode;
  note: string;
  sleep: string;
  contextTags: string[];
  situation: string;
  automatic: string;
  evidenceFor: string;
  evidenceAgainst: string;
  reframe: string;
  traps: string[];
};

const TRAP_HINTS: { keyword: RegExp; trap: string }[] = [
  { keyword: /\bthey'?ll think|they think|she'?s upset|he'?s mad|judging me|will think/i, trap: "mind reading" },
  { keyword: /\bworst|disaster|catastroph|ruin|never recover|end of/i, trap: "catastrophizing" },
  { keyword: /\balways|never|every time|completely|totally|nothing/i, trap: "all-or-nothing" },
  { keyword: /\bshould|must|have to|ought to/i, trap: "should statements" },
  { keyword: /\bmy fault|because of me|i caused/i, trap: "personalization" },
];

function detectTrap(text: string): string | null {
  for (const { keyword, trap } of TRAP_HINTS) if (keyword.test(text)) return trap;
  return null;
}

export function NewEntry() {
  const router = useRouter();
  const params = useSearchParams();
  const initialMode = (params.get("mode") as Mode) || "quick";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [mood, setMood] = useState<StoredMood | null>(null);
  const [sleep, setSleep] = useState<string>();
  const [contextTags, setContextTags] = useState<Set<string>>(new Set([]));

  // Quick fields
  const [note, setNote] = useState("");
  const [aiPrompt, setAiPrompt] = useState<string>("What part of this feels biggest right now?");
  const [aiLoading, setAiLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [transcript, setTranscript] = useState<{ role: "assistant" | "user"; content: string }[]>([]);

  function saveAnswerToNote() {
    if (!answer.trim()) return;
    const block = `\n\n> ${aiPrompt}\n\n${answer.trim()}\n`;
    setNote((prev) => (prev ? prev + block : block.trimStart()));
    setTranscript((prev) => [
      ...prev,
      { role: "assistant", content: aiPrompt },
      { role: "user", content: answer.trim() },
    ]);
    setAnswer("");
    setShowAnswer(false);
  }

  // Detailed fields
  const [situation, setSituation] = useState("");
  const [automatic, setAutomatic] = useState("");
  const [evidenceFor, setEvidenceFor] = useState("");
  const [evidenceAgainst, setEvidenceAgainst] = useState("");
  const [reframe, setReframe] = useState("");

  // Traps the user picked on /traps (slugs)
  const [selectedTraps, setSelectedTraps] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const noteRef = useRef<HTMLTextAreaElement | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);

  useEffect(() => () => aiAbortRef.current?.abort(), []);

  useEffect(() => {
    const d = readSession<Partial<Draft>>(DRAFT_KEY);
    if (d) {
      if (d.mode === "quick" || d.mode === "detailed") setMode(d.mode);
      if (typeof d.note === "string") setNote(d.note);
      if (typeof d.sleep === "string") setSleep(d.sleep);
      if (Array.isArray(d.contextTags)) setContextTags(new Set(d.contextTags));
      if (typeof d.situation === "string") setSituation(d.situation);
      if (typeof d.automatic === "string") setAutomatic(d.automatic);
      if (typeof d.evidenceFor === "string") setEvidenceFor(d.evidenceFor);
      if (typeof d.evidenceAgainst === "string") setEvidenceAgainst(d.evidenceAgainst);
      if (typeof d.reframe === "string") setReframe(d.reframe);
      if (Array.isArray(d.traps)) setSelectedTraps(d.traps);
    }
    const m = readSession<StoredMood>("trace.mood");
    if (m) setMood(m);
    // trace.traps is the handoff from the picker — apply it and clear so subsequent
    // mounts don't re-overwrite state with a stale handoff.
    const t = readSession<string[]>("trace.traps");
    if (t && Array.isArray(t)) {
      setSelectedTraps(t);
      sessionStorage.removeItem("trace.traps");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const handle = setTimeout(() => {
      const d: Draft = {
        mode,
        note,
        sleep,
        contextTags: [...contextTags],
        situation,
        automatic,
        evidenceFor,
        evidenceAgainst,
        reframe,
        traps: selectedTraps,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    }, 300);
    return () => clearTimeout(handle);
  }, [hydrated, mode, note, sleep, contextTags, situation, automatic, evidenceFor, evidenceAgainst, reframe, selectedTraps]);

  const detectedTrap = useMemo(() => detectTrap(automatic), [automatic]);

  function toggleTag(tag: string) {
    setContextTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function pickMood() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("trace.mood");
    }
    router.push(`/check-in?next=${encodeURIComponent(`/entries/new?mode=${mode}`)}`);
  }

  function pickTraps() {
    router.push(`/traps?next=${encodeURIComponent(`/entries/new?mode=${mode}`)}`);
  }

  function toggleTrap(slug: string) {
    setSelectedTraps((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  const selectedTrapObjs = selectedTraps
    .map((slug) => TRAPS.find((t) => t.slug === slug))
    .filter(Boolean) as typeof TRAPS;

  async function regenerateAiPrompt() {
    const context = mode === "quick" ? note : `${situation}\n\n${automatic}`;
    if (!context.trim()) return;
    setAiLoading(true);
    setAiPrompt("…");
    aiAbortRef.current?.abort();
    const ac = new AbortController();
    aiAbortRef.current = ac;
    try {
      await streamText(
        "/api/ai/socratic",
        {
          context: `Daily check-in. ${mood ? `Feeling ${mood.emotion}.` : ""}\n${context}`,
          turns: [
            { role: "user", content: "Ask me one short Socratic question (under 15 words) to gently dig deeper." },
          ],
        },
        setAiPrompt,
        ac.signal,
      );
    } catch {
      setAiPrompt("What part of this feels biggest right now?");
    } finally {
      if (aiAbortRef.current === ac) setAiLoading(false);
    }
  }

  async function save() {
    if (!mood) {
      setError("Pick how you're feeling first.");
      return;
    }
    setSaving(true);
    setError(null);

    const pendingAnswer = showAnswer && answer.trim() ? `\n\n> ${aiPrompt}\n\n${answer.trim()}` : "";

    const body_md =
      mode === "quick"
        ? [note, pendingAnswer].join("").trim()
        : [
            `## Situation\n${situation}`,
            `## Automatic thought\n${automatic}`,
            `## Evidence for\n${evidenceFor}`,
            `## Evidence against\n${evidenceAgainst}`,
            `## Reframe\n${reframe}`,
          ]
            .filter(Boolean)
            .join("\n\n");

    const kind = mode === "quick" ? "check_in" : "thought_record";
    const tags = contextTags.size ? Array.from(contextTags) : [];
    if (mode === "quick") tags.unshift("check-in");
    // Surface traps as `trap:<slug>` tag entries so the detail page can render them as chips.
    for (const t of selectedTrapObjs) tags.push(`trap:${t.slug}`);
    const trapNames = selectedTrapObjs.map((t) => t.name);

    const today = new Date().toLocaleDateString();
    const res = await fetchJson<{ id: string }>("/api/entries", {
      body: {
        title: mode === "quick" ? `Daily note ${today}` : `Thought record ${today}`,
        body_md,
        mood: mood.valence,
        kind,
        tags,
        check_in: {
          emotion: mood.emotion,
          valence: mood.valence,
          energy: mood.energy,
          sleep_hours: sleep === "" ? null : Number(sleep),
          context_tags: Array.from(contextTags),
          seed: mode === "quick" ? note : automatic,
          transcript:
            showAnswer && answer.trim()
              ? [...transcript, { role: "assistant", content: aiPrompt }, { role: "user", content: answer.trim() }]
              : transcript,
        },
        thought_record:
          mode === "detailed"
            ? {
                situation,
                automatic_thoughts: automatic,
                distortions: trapNames,
                balanced_thought: reframe,
              }
            : undefined,
      },
    });
    setSaving(false);
    if (!res.ok || !res.data) {
      setError(res.text || "save failed");
      return;
    }
    sessionStorage.removeItem("trace.mood");
    sessionStorage.removeItem("trace.traps");
    sessionStorage.removeItem(DRAFT_KEY);
    router.push(`/entries/${res.data.id}`);
  }

  const moodColor = mood ? QUADRANT_COLORS[mood.quadrant] : "var(--color-ink-line)";

  return (
    <Screen scroll={mode === "detailed"}>
      <TopBar
        left={<IconBtn onClick={() => router.push("/")}>✕</IconBtn>}
        title="new entry"
        right={
          <IconBtn
            onClick={save}
            disabled={saving}
            style={{ color: "var(--color-ink)", font: "500 13px var(--font-geist-sans), sans-serif" }}
          >
            {saving ? "saving…" : "save"}
          </IconBtn>
        }
      />

      {/* mode toggle */}
      <div
        style={{
          background: "var(--color-surface-soft)",
          borderRadius: 999,
          padding: 3,
          display: "flex",
          gap: 2,
        }}
      >
        {(["quick", "detailed"] as const).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "7px 0",
                background: active ? "var(--color-surface)" : "transparent",
                borderRadius: 999,
                border: "none",
                color: active ? "var(--color-ink)" : "var(--color-ink-soft)",
                font: "500 13px var(--font-geist-sans), sans-serif",
                cursor: "pointer",
                boxShadow: active ? "0 1px 2px rgba(26,23,20,0.06)" : "none",
              }}
            >
              {m === "quick" ? "Quick · daily" : "Detailed"}
            </button>
          );
        })}
      </div>

      {error && (
        <Card>
          <Body size={13} style={{ color: "var(--color-accent)" }}>
            {error}
          </Body>
        </Card>
      )}

      {/* mood + sleep row — same layout in both modes */}
      <div style={{ display: "flex", gap: 10 }}>
        <Card
          onClick={pickMood}
          style={{
            flex: 1.4,
            padding: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <MoodDot color={moodColor} size={20} ring={!!mood} />
          <div style={{ flex: 1 }}>
            <Meta>MOOD</Meta>
            <Heading style={{ marginTop: 2 }}>{mood?.emotion ?? "pick one"}</Heading>
          </div>
          <div
            style={{
              font: "14px var(--font-geist-sans), sans-serif",
              color: "var(--color-ink-soft)",
            }}
          >
            ›
          </div>
        </Card>
        <Card style={{ flex: 1, padding: 12 }}>
          <Meta>SLEEP</Meta>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginTop: 2 }}>
            <input
              type="number"
              step="0.5"
              min={0}
              max={24}
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              placeholder="7.5"
              style={{
                width: 56,
                border: "none",
                outline: "none",
                background: "transparent",
                font: "500 22px var(--font-geist-sans), sans-serif",
                color: "var(--color-ink)",
                padding: 0,
              }}
            />
            <Body soft size={11}>
              h
            </Body>
          </div>
        </Card>
      </div>

      {/* selected traps (carried back from /traps) */}
      {selectedTrapObjs.length > 0 && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <Meta>THINKING TRAPS</Meta>
            <IconBtn
              onClick={pickTraps}
              style={{
                color: "var(--color-ink-soft)",
                font: "500 10px var(--font-jetbrains-mono), monospace",
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              EDIT
            </IconBtn>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
            {selectedTrapObjs.map((t) => (
              <Chip key={t.slug} active onClick={() => toggleTrap(t.slug)}>
                {t.name} ✕
              </Chip>
            ))}
          </div>
        </Card>
      )}

      {mode === "quick" ? (
        <>
          <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Meta>NOTE</Meta>
            <textarea
              ref={noteRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Woke up tense again…"
              style={{
                marginTop: 8,
                width: "100%",
                flex: 1,
                minHeight: 140,
                border: "none",
                outline: "none",
                resize: "none",
                background: "transparent",
                color: "var(--color-ink)",
                font: "400 14px/1.55 var(--font-geist-sans), sans-serif",
              }}
            />
          </Card>

          <Card accent>
            <Meta accent>✦ TRACE</Meta>
            <Body size={13} style={{ marginTop: 6, lineHeight: 1.45 }}>
              {aiPrompt}
            </Body>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <Btn small onClick={() => setShowAnswer((v) => !v)}>
                answer ↓
              </Btn>
              <Btn small ghost onClick={regenerateAiPrompt} disabled={aiLoading}>
                {aiLoading ? "thinking…" : "another prompt ↻"}
              </Btn>
              <Btn small ghost onClick={pickTraps}>
                traps →
              </Btn>
            </div>
            {showAnswer && (
              <>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your response…"
                  style={{
                    marginTop: 10,
                    width: "100%",
                    minHeight: 60,
                    border: "1px solid var(--color-ink-line)",
                    outline: "none",
                    borderRadius: 12,
                    padding: 10,
                    background: "transparent",
                    color: "var(--color-ink)",
                    font: "400 13px/1.45 var(--font-geist-sans), sans-serif",
                    resize: "vertical",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 8 }}>
                  <Btn small ghost onClick={() => { setAnswer(""); setShowAnswer(false); }}>
                    cancel
                  </Btn>
                  <Btn small primary onClick={saveAnswerToNote} disabled={!answer.trim()}>
                    add to note ↑
                  </Btn>
                </div>
              </>
            )}
          </Card>

          <div>
            <Meta style={{ marginBottom: 6 }}>CONTEXT</Meta>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {CONTEXT_TAG_OPTIONS.map((t) => (
                <Chip key={t} active={contextTags.has(t)} onClick={() => toggleTag(t)}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>

          <TabBar active={1} />
        </>
      ) : (
        <>
          <DetailField label="SITUATION" value={situation} onChange={setSituation} placeholder="Thursday team review. I'm presenting roadmap." />
          <DetailField
            label="AUTOMATIC THOUGHT"
            value={automatic}
            onChange={setAutomatic}
            placeholder="They'll think I haven't done enough this quarter."
          />

          {detectedTrap && selectedTrapObjs.length === 0 && (
            <Card accent>
              <Meta accent>✦ TRACE NOTICED</Meta>
              <Body size={13} style={{ marginTop: 6, lineHeight: 1.45 }}>
                This reads like{" "}
                <Link
                  href={`/traps?trap=${encodeURIComponent(detectedTrap)}&next=${encodeURIComponent(`/entries/new?mode=${mode}`)}`}
                  style={{
                    borderBottom: "1px dashed var(--color-accent)",
                    color: "var(--color-accent)",
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  {detectedTrap}
                </Link>
                . Tap to look at the trap →
              </Body>
            </Card>
          )}

          <div>
            <Meta>EVIDENCE</Meta>
            <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
              <DetailMini label="FOR" value={evidenceFor} onChange={setEvidenceFor} placeholder="Two roadmap items slipped." />
              <DetailMini
                label="AGAINST"
                value={evidenceAgainst}
                onChange={setEvidenceAgainst}
                placeholder="Shipped onboarding rewrite + cut p99 latency in half."
              />
            </div>
          </div>

          <DetailField label="REFRAME" value={reframe} onChange={setReframe} placeholder="The roadmap is mixed — but I can name the wins clearly." />
        </>
      )}
    </Screen>
  );
}

function DetailField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Meta>{label}</Meta>
      <Card style={{ marginTop: 5, padding: 10 }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--color-ink)",
            font: "400 13px/1.45 var(--font-geist-sans), sans-serif",
            resize: "vertical",
          }}
        />
      </Card>
    </div>
  );
}

function DetailMini({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Card style={{ flex: 1, padding: 10 }}>
      <Meta>{label}</Meta>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        style={{
          marginTop: 4,
          width: "100%",
          border: "none",
          outline: "none",
          background: "transparent",
          color: "var(--color-ink)",
          font: "400 12px/1.4 var(--font-geist-sans), sans-serif",
          resize: "vertical",
        }}
      />
    </Card>
  );
}
