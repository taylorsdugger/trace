"use client";

import { useFormStatus } from "react-dom";
import { Btn } from "@/components/ui";
import { hideRing, mergeRings } from "../actions";

export function HideRingButton({ id }: { id: string }) {
  return (
    <form action={hideRing}>
      <input type="hidden" name="id" value={id} />
      <HideSubmit />
    </form>
  );
}

function HideSubmit() {
  const { pending } = useFormStatus();
  return (
    <Btn
      type="submit"
      ghost
      small
      disabled={pending}
      style={pending ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
    >
      {pending ? "hiding…" : "hide"}
    </Btn>
  );
}

export function MergeRingsButton({ ids, count }: { ids: string[]; count: number }) {
  return (
    <form action={mergeRings}>
      {ids.map((id) => (
        <input key={id} type="hidden" name="id" value={id} />
      ))}
      <MergeSubmit count={count} />
    </form>
  );
}

function MergeSubmit({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <Btn
      type="submit"
      small
      disabled={pending}
      style={pending ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
    >
      {pending ? "merging…" : `merge ${count}`}
    </Btn>
  );
}
