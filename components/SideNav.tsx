import Link from "next/link";
import type { ReactNode } from "react";
import { TraceLogo } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { formatShortDate } from "@/lib/dates";

// Quiet line icons drawn in currentColor so they pick up the hover/active palette.
const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconToday() {
  // Sun rising over a horizon — present moment.
  return (
    <svg {...ICON_PROPS} aria-hidden="true">
      <path d="M4 17h16" />
      <path d="M7.5 17a4.5 4.5 0 0 1 9 0" />
      <path d="M12 7.5V5" />
      <path d="M5.6 10.6 4 9" />
      <path d="M18.4 10.6 20 9" />
    </svg>
  );
}

function IconWrite() {
  // Quill / pen nib angled, with a leaf vein down the spine.
  return (
    <svg {...ICON_PROPS} aria-hidden="true">
      <path d="M5 19l3.5-1 9.5-9.5a2.121 2.121 0 0 0-3-3L5.5 15 4.5 18.5z" />
      <path d="M8 17l1-3" />
      <path d="M13.5 7.5l3 3" />
    </svg>
  );
}

function IconRings() {
  // Three concentric circles — a tree's cross-section.
  return (
    <svg {...ICON_PROPS} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconTrailhead() {
  // A signpost at a forking trail — where tomorrow's walk begins.
  return (
    <svg {...ICON_PROPS} aria-hidden="true">
      <path d="M12 21V11" />
      <path d="M6 7h11l2 -2 -2 -2H6z" />
      <circle cx="12" cy="21" r="0.6" fill="currentColor" />
    </svg>
  );
}

function IconTrail() {
  // A winding path with three steps along it.
  return (
    <svg {...ICON_PROPS} aria-hidden="true">
      <path d="M5 19c2-2 2-4 4-4s2 2 4 0 2-4 4-4 2-2 2-2" />
      <circle cx="5" cy="19" r="1" fill="currentColor" />
      <circle cx="12" cy="15" r="1" fill="currentColor" />
      <circle cx="19" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}

type Tab = { id: string; icon: ReactNode; label: string; href: string };

const TABS: readonly Tab[] = [
  { id: "today", icon: <IconToday />, label: "today", href: "/" },
  { id: "trailhead", icon: <IconTrailhead />, label: "trailhead", href: "/trailhead" },
  { id: "write", icon: <IconWrite />, label: "a trace", href: "/trail/new" },
  { id: "rings", icon: <IconRings />, label: "rings", href: "/rings" },
  { id: "trail", icon: <IconTrail />, label: "trail", href: "/trail" },
];

type RecentEntry = {
  id: string;
  title: string | null;
  body_md: string;
  created_at: string;
};

async function loadRecent(): Promise<RecentEntry[]> {
  try {
    const sb = supabase();
    const { data } = await sb
      .from("entries")
      .select("id,title,body_md,created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    return (data ?? []) as RecentEntry[];
  } catch {
    return [];
  }
}

function excerpt(md: string, max = 90): string {
  // Strip cedar quote lines, markdown headings, and pick the first real prose paragraph.
  const lines = md
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith(">") && !l.startsWith("#"));
  const text = lines.join(" ").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function headline(e: RecentEntry): string {
  const t = e.title?.trim();
  if (t) return t;
  const first = excerpt(e.body_md, 50);
  return first || "a trace";
}

export async function SideNav() {
  const recent = await loadRecent();

  return (
    <aside
      className="hidden md:flex"
      style={{
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        height: "100dvh",
        width: 260,
        flexShrink: 0,
        flexDirection: "column",
        gap: 8,
        padding: "20px 16px",
        borderRight: "1px solid var(--hairline)",
        background: "var(--nav)",
        overflowY: "auto",
      }}
    >
      <div style={{ padding: "8px 8px 20px" }}>
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <TraceLogo size={28} />
        </Link>
      </div>
      {TABS.map((t) => (
        <div key={t.id} style={{ display: "flex", flexDirection: "column" }}>
          <Link
            href={t.href}
            className="nav-tab"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 12,
              color: "var(--ink)",
              textDecoration: "none",
              font: "500 16px var(--font-sans), sans-serif",
              letterSpacing: 0.2,
            }}
          >
            <span
              className="nav-tab-icon"
              style={{
                color: "var(--ink-soft)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
              }}
            >
              {t.icon}
            </span>
            <span>{t.label}</span>
          </Link>
          {t.id === "trail" && recent.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 6,
                marginLeft: 6,
                marginRight: 2,
              }}
            >
              <span
                style={{
                  font: "500 10px var(--font-mono), monospace",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: "var(--ink-soft)",
                  padding: "4px 8px 2px",
                }}
              >
                recent
              </span>
              {recent.map((e) => (
                <Link
                  key={e.id}
                  href={`/trail/${e.id}`}
                  className="nav-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "var(--surface)",
                    border: "1px solid var(--hairline)",
                    color: "var(--ink)",
                    textDecoration: "none",
                  }}
                >
                  <span
                    style={{
                      font: "500 9px var(--font-mono), monospace",
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      color: "var(--ink-soft)",
                    }}
                  >
                    {formatShortDate(e.created_at)}
                  </span>
                  <span
                    style={{
                      font: "500 13px/1.3 var(--font-serif), serif",
                      color: "var(--ink)",
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {headline(e)}
                  </span>
                  <span
                    style={{
                      font: "400 11px/1.4 var(--font-sans), sans-serif",
                      color: "var(--ink-soft)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {excerpt(e.body_md, 80)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </aside>
  );
}
