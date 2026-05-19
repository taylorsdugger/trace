import { toggleTheme } from "@/app/actions/theme";
import type { Theme } from "@/lib/theme";

export function ThemeToggle({ theme }: { theme: Theme }) {
  const isDark = theme === "dark";
  return (
    <form
      action={toggleTheme}
      className="fixed z-20 right-4 md:right-6 bottom-[calc(80px+env(safe-area-inset-bottom))] md:bottom-6"
    >
      <button
        type="submit"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "switch to light" : "switch to dark"}
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          background: "var(--surface)",
          border: "1px solid var(--hairline)",
          boxShadow:
            "0 1px 0 rgba(42,43,34,0.04), 0 6px 18px rgba(42,43,34,0.08)",
          color: "var(--ink)",
          font: "16px var(--font-sans), sans-serif",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isDark ? "☀" : "☾"}
      </button>
    </form>
  );
}
