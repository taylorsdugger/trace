import Link from "next/link";
import { TraceLogo } from "@/components/ui";

const TABS = [
  { id: "today", icon: "◐", label: "today", href: "/" },
  { id: "write", icon: "✎", label: "a trace", href: "/trail/new" },
  { id: "rings", icon: "◇", label: "rings", href: "/rings" },
  { id: "trail", icon: "○", label: "trail", href: "/trail" },
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
        borderRight: "1px solid var(--hairline)",
        background: "var(--paper)",
      }}
    >
      <div style={{ padding: "8px 8px 20px" }}>
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <TraceLogo size={28} />
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
            color: "var(--ink)",
            textDecoration: "none",
            font: "500 14px var(--font-sans), sans-serif",
            letterSpacing: 0.2,
          }}
        >
          <span style={{ font: "18px var(--font-sans), sans-serif", color: "var(--ink-soft)" }}>
            {t.icon}
          </span>
          <span>{t.label}</span>
        </Link>
      ))}
    </aside>
  );
}
