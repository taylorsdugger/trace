export const THEME_COOKIE = "trace_theme";
export type Theme = "light" | "dark";

export function normalizeTheme(raw: string | undefined): Theme {
  return raw === "dark" ? "dark" : "light";
}
