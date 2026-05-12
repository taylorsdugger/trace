import { CSSProperties, ReactNode, MouseEventHandler } from "react";
import Link from "next/link";

type Div = { children?: ReactNode; style?: CSSProperties; className?: string };

export function Screen({ children, scroll, style, className }: Div & { scroll?: boolean }) {
  return (
    <div
      className={`app-frame ${className ?? ""}`}
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        padding: "8px 18px 14px",
        gap: 14,
        overflow: scroll ? "auto" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function TopBar({
  left,
  title,
  right,
}: {
  left?: ReactNode;
  title?: ReactNode;
  right?: ReactNode;
}) {
  const side: CSSProperties = {
    minWidth: 60,
    font: "500 13px var(--font-geist-sans), sans-serif",
    color: "var(--color-ink-soft)",
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 4,
        minHeight: 30,
      }}
    >
      <div style={side}>{left ?? ""}</div>
      <div
        style={{
          flex: 1,
          textAlign: "center",
          font: "500 13px var(--font-geist-sans), sans-serif",
          color: "var(--color-ink-soft)",
          letterSpacing: 0.5,
          textTransform: "lowercase",
        }}
      >
        {title ?? ""}
      </div>
      <div style={{ ...side, textAlign: "right" }}>{right ?? ""}</div>
    </div>
  );
}

export function Card({
  children,
  style,
  soft,
  accent,
  onClick,
  className,
  as: As = "div",
}: Div & {
  soft?: boolean;
  accent?: boolean;
  onClick?: MouseEventHandler;
  as?: "div" | "button";
}) {
  return (
    <As
      onClick={onClick}
      className={className}
      style={{
        background: soft ? "var(--color-surface-soft)" : "var(--color-surface)",
        borderRadius: 20,
        padding: 16,
        border: accent
          ? "1px dashed var(--color-accent-line)"
          : "1px solid var(--color-ink-line)",
        boxShadow: accent
          ? "none"
          : "0 1px 0 rgba(26,23,20,0.02), 0 1px 2px rgba(26,23,20,0.03)",
        textAlign: "left",
        color: "var(--color-ink)",
        ...style,
      }}
    >
      {children}
    </As>
  );
}

export function Display({
  children,
  size = 30,
  style,
}: {
  children?: ReactNode;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <h1
      style={{
        margin: 0,
        font: `400 ${size}px/1.05 var(--font-instrument-serif), Georgia, serif`,
        color: "var(--color-ink)",
        letterSpacing: -0.4,
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

export function Heading({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        font: "500 14px var(--font-geist-sans), sans-serif",
        color: "var(--color-ink)",
        letterSpacing: -0.1,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Body({
  children,
  size = 14,
  soft,
  style,
}: {
  children?: ReactNode;
  size?: number;
  soft?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        font: `400 ${size}px/1.45 var(--font-geist-sans), sans-serif`,
        color: soft ? "var(--color-ink-soft)" : "var(--color-ink)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Meta({
  children,
  accent,
  style,
}: {
  children?: ReactNode;
  accent?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        font: "500 10px var(--font-jetbrains-mono), monospace",
        color: accent ? "var(--color-accent)" : "var(--color-ink-soft)",
        letterSpacing: 0.6,
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

type BtnProps = {
  children?: ReactNode;
  primary?: boolean;
  ghost?: boolean;
  small?: boolean;
  style?: CSSProperties;
  type?: "button" | "submit";
  onClick?: MouseEventHandler;
  disabled?: boolean;
  href?: string;
};

export function Btn({
  children,
  primary,
  ghost,
  small,
  style,
  href,
  type = "button",
  ...rest
}: BtnProps) {
  const variant: CSSProperties = primary
    ? { background: "var(--color-ink)", color: "var(--color-surface)" }
    : ghost
      ? {
          background: "transparent",
          color: "var(--color-ink-soft)",
          padding: small ? "4px 8px" : "6px 10px",
        }
      : {
          background: "transparent",
          color: "var(--color-ink)",
          border: "1px solid var(--color-ink-line)",
        };
  const base: CSSProperties = {
    cursor: "pointer",
    font: `500 ${small ? 13 : 14}px var(--font-geist-sans), sans-serif`,
    letterSpacing: 0.1,
    padding: small ? "7px 12px" : "11px 18px",
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    border: "none",
    ...variant,
    ...style,
  };
  if (href) {
    return (
      <Link href={href} style={base}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} style={base} {...rest}>
      {children}
    </button>
  );
}

type InputProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  style?: CSSProperties;
};

export function Input({ value, onChange, placeholder, type = "text", autoFocus, onKeyDown, style }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onKeyDown={onKeyDown}
      style={{
        width: "100%",
        background: "var(--color-surface)",
        border: "1px solid var(--color-ink-line)",
        borderRadius: 12,
        padding: "10px 14px",
        font: "400 14px var(--font-geist-sans), sans-serif",
        color: "var(--color-ink)",
        ...style,
      }}
    />
  );
}

type TextAreaProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  style?: CSSProperties;
};

export function TextArea({ value, onChange, placeholder, rows = 6, style }: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        background: "var(--color-surface)",
        border: "1px solid var(--color-ink-line)",
        borderRadius: 14,
        padding: "12px 14px",
        font: "400 14px/1.55 var(--font-geist-sans), sans-serif",
        color: "var(--color-ink)",
        resize: "vertical",
        ...style,
      }}
    />
  );
}

export function Chip({
  children,
  active,
  onClick,
  style,
}: {
  children?: ReactNode;
  active?: boolean;
  onClick?: MouseEventHandler;
  style?: CSSProperties;
}) {
  const role = onClick ? "button" : undefined;
  return (
    <span
      role={role}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "5px 10px",
        borderRadius: 999,
        font: "500 12px var(--font-geist-sans), sans-serif",
        background: active ? "var(--color-ink)" : "transparent",
        color: active ? "var(--color-surface)" : "var(--color-ink)",
        border: active ? "1px solid var(--color-ink)" : "1px solid var(--color-ink-line)",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function MoodDot({
  color,
  size = 14,
  ring,
}: {
  color: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        boxShadow: ring
          ? `0 0 0 3px var(--color-surface), 0 0 0 4px ${color}66`
          : undefined,
      }}
    />
  );
}

export function TraceLogo({
  size = 22,
  style,
}: {
  size?: number;
  style?: CSSProperties;
}) {
  // Dots: blue / green / yellow / red — same as the mood quadrant palette.
  const dot = Math.round(size * 0.32);
  const gap = Math.round(size * 0.18);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: Math.round(size * 0.42),
        color: "var(--color-ink)",
        ...style,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap,
          transform: `translateY(-${Math.round(size * 0.12)}px)`,
        }}
      >
        {["#6D8FB9", "#7BB191", "#D9A94B", "#C97A6E"].map((c) => (
          <span
            key={c}
            style={{
              width: dot,
              height: dot,
              borderRadius: "50%",
              background: c,
              display: "inline-block",
            }}
          />
        ))}
      </span>
      <span
        style={{
          font: `400 ${size}px var(--font-instrument-serif), Georgia, serif`,
          letterSpacing: -0.5,
          lineHeight: 1,
        }}
      >
        trace
      </span>
    </div>
  );
}

export function TabBar({ active = 0 }: { active?: 0 | 1 | 2 | 3 }) {
  const tabs: { id: string; icon: string; label: string; href: string }[] = [
    { id: "today", icon: "◐", label: "today", href: "/" },
    { id: "write", icon: "✎", label: "write", href: "/entries/new" },
    { id: "patterns", icon: "◇", label: "patterns", href: "/reflection" },
    { id: "you", icon: "○", label: "you", href: "/entries" },
  ];
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-around",
        paddingTop: 10,
        borderTop: "1px solid var(--color-ink-line)",
        marginTop: "auto",
      }}
    >
      {tabs.map((t, i) => {
        const isActive = i === active;
        return (
          <Link
            key={t.id}
            href={t.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              color: isActive ? "var(--color-ink)" : "var(--color-ink-soft)",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                font: "16px var(--font-geist-sans), sans-serif",
                opacity: isActive ? 1 : 0.6,
              }}
            >
              {t.icon}
            </div>
            <div
              style={{
                font: "500 10px var(--font-geist-sans), sans-serif",
                letterSpacing: 0.3,
              }}
            >
              {t.label}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
