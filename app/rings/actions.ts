"use server";

import { refresh, revalidatePath } from "next/cache";
import { generateRing, type RingWindow } from "@/lib/rings";

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
