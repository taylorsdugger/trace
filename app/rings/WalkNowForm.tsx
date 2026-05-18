"use client";

import { useFormStatus } from "react-dom";
import { Btn } from "@/components/ui";
import { askCedarToListen } from "./actions";

export function WalkNowForm() {
  return (
    <form
      action={askCedarToListen}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginTop: 10,
        flexWrap: "wrap",
      }}
    >
      <WindowSelect />
      <SubmitButton />
    </form>
  );
}

function WindowSelect() {
  const { pending } = useFormStatus();
  return (
    <select
      name="window"
      defaultValue="since-last"
      disabled={pending}
      style={{
        font: "500 14px var(--font-sans), sans-serif",
        color: "var(--ink)",
        background: "transparent",
        border: "1px solid var(--hairline)",
        borderRadius: 999,
        padding: "7px 12px",
        cursor: pending ? "not-allowed" : "pointer",
        opacity: pending ? 0.6 : 1,
      }}
    >
      <option value="since-last">since last walk</option>
      <option value="7d">last 7 days</option>
      <option value="30d">last 30 days</option>
    </select>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Btn
      type="submit"
      primary
      small
      disabled={pending}
      style={pending ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
    >
      {pending ? "cedar is listening…" : "walk now"}
    </Btn>
  );
}
