"use server";

import { refresh, revalidatePath } from "next/cache";
import { generateRing, type RingWindow } from "@/lib/rings";
import { mergeRings as mergeRingsLib, hideRing as hideRingLib } from "@/lib/rings";

export async function askCedarToListen(formData: FormData) {
  const raw = formData.get("window");
  const window: RingWindow =
    raw === "7d" || raw === "30d" || raw === "since-last" ? raw : "since-last";
  const result = await generateRing({ window, source: "manual" });
  if (!result.ok) throw new Error(result.error);
  // Mark the archive stale for the next visit; refresh the current router so
  // /rings re-renders immediately with the new headline.
  revalidatePath("/rings/all");
  refresh();
}

export async function hideRing(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("missing ring id");
  const result = await hideRingLib(id);
  if (!result.ok) throw new Error(result.error);
  revalidatePath("/rings");
  revalidatePath("/rings/all");
  refresh();
}

export async function mergeRings(formData: FormData) {
  const ids = formData.getAll("id").map((v) => String(v));
  if (ids.length < 2) throw new Error("need at least two rings to merge");
  const result = await mergeRingsLib(ids);
  if (!result.ok) throw new Error(result.error);
  revalidatePath("/rings");
  revalidatePath("/rings/all");
  refresh();
}
