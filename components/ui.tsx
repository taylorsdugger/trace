import { CSSProperties, ReactNode, MouseEventHandler } from "react";
import Link from "next/link";

type Div = { children?: ReactNode; style?: CSSProperties; className?: string };

export function Screen({ children, scroll, style, className }: Div & { scroll?: boolean }) {
  return (
    <div
      className={`app-frame flex flex-col gap-[14px] pt-2 px-[18px] pb-[calc(72px+env(safe-area-inset-bottom))] md:px-8 md:pb-8 ${className ?? ""}`}
      style={{
        minHeight: "100dvh",
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
    font: "500 15px var(--font-geist-sans), sans-serif",
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
          font: "500 15px var(--font-geist-sans), sans-serif",
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
    font: `500 ${small ? 14 : 16}px var(--font-geist-sans), sans-serif`,
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

export function IconBtn({
  children,
  onClick,
  disabled,
  style,
  type = "button",
}: {
  children?: ReactNode;
  onClick?: MouseEventHandler;
  disabled?: boolean;
  style?: CSSProperties;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "none",
        border: "none",
        color: "inherit",
        font: "inherit",
        cursor: disabled ? "default" : "pointer",
        padding: 0,
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
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

export function TreeRing({
  size = 28,
  style,
  showHeart = true,
}: {
  size?: number;
  style?: CSSProperties;
  showHeart?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 78 78"
      role="img"
      aria-label="Trace"
      style={{ display: "inline-block", color: "var(--ink)", ...style }}
    >
      <circle cx="39" cy="39" r="34" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.30" />
      <circle cx="39" cy="39" r="26" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.55" />
      <circle cx="39" cy="39" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="39" cy="39" r="10" fill="none" stroke="currentColor" strokeWidth="1.7" />
      {showHeart && <circle cx="39" cy="39" r="3.6" fill="var(--moss)" />}
    </svg>
  );
}

export function TraceLogo({
  size = 26,
  style,
}: {
  size?: number;
  style?: CSSProperties;
}) {
  // Tree-ring identity + Lora wordmark. Earth + dusk; heart in moss.
  const wordSize = Math.round(size * 1.35);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(size * 0.38),
        color: "var(--ink)",
        ...style,
      }}
    >
      <TreeRing size={size} />
      <span
        style={{
          font: `400 ${wordSize}px/1 var(--font-serif)`,
          letterSpacing: -0.8,
        }}
      >
        trace
      </span>
    </div>
  );
}

export function CedarSprig({
  size = 18,
  style,
}: {
  size?: number;
  style?: CSSProperties;
}) {
  // Cedar's voice glyph. Only beside Cedar's words — never decorative.
  const w = Math.round(size * (28 / 44));
  return (
    <svg
      width={w}
      height={size}
      viewBox="0 0 28 44"
      role="img"
      aria-label="Cedar"
      style={{ display: "inline-block", flexShrink: 0, ...style }}
    >
      <line x1="14" y1="2" x2="14" y2="42" stroke="var(--bark)" strokeWidth="1.4" strokeLinecap="round" />
      <g stroke="var(--moss)" strokeWidth="1.2" strokeLinecap="round">
        <line x1="14" y1="9" x2="6" y2="13" />
        <line x1="14" y1="9" x2="22" y2="13" />
        <line x1="14" y1="18" x2="4" y2="24" />
        <line x1="14" y1="18" x2="24" y2="24" />
        <line x1="14" y1="28" x2="6" y2="34" />
        <line x1="14" y1="28" x2="22" y2="34" />
      </g>
    </svg>
  );
}

export function TabBar({ active = 0 }: { active?: 0 | 1 | 2 | 3 }) {
  const tabs: { id: string; icon: string; label: string; href: string }[] = [
    { id: "today", icon: "◐", label: "today", href: "/" },
    { id: "write", icon: "✎", label: "a trace", href: "/trail/new" },
    { id: "rings", icon: "◇", label: "rings", href: "/rings" },
    { id: "trail", icon: "○", label: "trail", href: "/trail" },
  ];
  return (
    <div
      className="flex md:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        marginLeft: "auto",
        marginRight: "auto",
        width: "100%",
        maxWidth: 600,
        justifyContent: "space-around",
        paddingTop: 10,
        paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
        paddingLeft: 18,
        paddingRight: 18,
        background: "var(--color-paper)",
        borderTop: "1px solid var(--color-ink-line)",
        zIndex: 10,
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
                font: "20px var(--font-geist-sans), sans-serif",
                opacity: isActive ? 1 : 0.6,
              }}
            >
              {t.icon}
            </div>
            <div
              style={{
                font: "500 12px var(--font-geist-sans), sans-serif",
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
