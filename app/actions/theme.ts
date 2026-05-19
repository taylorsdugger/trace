"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { normalizeTheme, THEME_COOKIE } from "@/lib/theme";

export async function toggleTheme() {
  const jar = await cookies();
  const current = normalizeTheme(jar.get(THEME_COOKIE)?.value);
  const next = current === "dark" ? "light" : "dark";
  jar.set(THEME_COOKIE, next, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
