import Link from "next/link";
import { TraceLogo } from "@/components/ui";

const TABS = [
  { id: "today", icon: "◐", label: "today", href: "/" },
  { id: "write", icon: "✎", label: "write", href: "/entries/new" },
  { id: "patterns", icon: "◇", label: "patterns", href: "/reflection" },
  { id: "you", icon: "○", label: "you", href: "/entries" },
] as const;

export function SideNav() {
  return (
    <aside
      className="hidden md:flex"
      style={{
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        height: "100dvh",
        width: 220,
        flexShrink: 0,
        flexDirection: "column",
        gap: 8,
        padding: "20px 16px",
        borderRight: "1px solid var(--color-ink-line)",
        background: "var(--color-paper)",
      }}
    >
      <div style={{ padding: "8px 8px 20px" }}>
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <TraceLogo size={26} />
        </Link>
      </div>
      {TABS.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            borderRadius: 12,
            color: "var(--color-ink)",
            textDecoration: "none",
            font: "500 14px var(--font-geist-sans), sans-serif",
            letterSpacing: 0.2,
          }}
        >
          <span style={{ font: "18px var(--font-geist-sans), sans-serif", color: "var(--color-ink-soft)" }}>
            {t.icon}
          </span>
          <span>{t.label}</span>
        </Link>
      ))}
    </aside>
  );
}
