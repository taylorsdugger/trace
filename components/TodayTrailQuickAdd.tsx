"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function TodayTrailQuickAdd({ dueDate }: { dueDate: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function submit() {
    const title = value.trim();
    if (!title) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      await fetch("/api/steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, due_date: dueDate }),
      });
      setValue("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          width: "100%",
          background: "transparent",
          border: "1px dashed var(--hairline)",
          borderRadius: 10,
          textAlign: "left",
          cursor: "text",
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: "1.2px solid var(--moss-line)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--moss)",
            font: "400 12px var(--font-sans)",
            flexShrink: 0,
          }}
        >
          +
        </span>
        <span
          style={{
            font: "italic 400 12.5px var(--font-serif)",
            color: "var(--ink-mute)",
          }}
        >
          plant a step on today…
        </span>
      </button>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        background: "var(--surface)",
        border: "1px solid var(--moss-line)",
        borderRadius: 10,
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "1.2px solid var(--moss-line)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--moss)",
          font: "400 12px var(--font-sans)",
          flexShrink: 0,
        }}
      >
        +
      </span>
      <input
        ref={inputRef}
        value={value}
        disabled={busy}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            setValue("");
            setOpen(false);
          }
        }}
        onBlur={() => {
          if (!value.trim() && !busy) setOpen(false);
        }}
        placeholder="what are you planting?"
        style={{
          flex: 1,
          minWidth: 0,
          background: "transparent",
          border: "none",
          outline: "none",
          font: "400 13px var(--font-sans)",
          color: "var(--ink)",
        }}
      />
    </div>
  );
}
