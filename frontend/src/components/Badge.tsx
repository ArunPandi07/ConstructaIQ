import React from "react";

type Variant = "green" | "red" | "orange" | "yellow" | "blue" | "purple" | "gray";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, { color: string; bg: string; border: string }> = {
  green:  { color: "var(--green-primary)",  bg: "var(--green-bg)",  border: "var(--green-border)" },
  red:    { color: "var(--red-primary)",    bg: "var(--red-bg)",    border: "var(--red-border)" },
  orange: { color: "var(--orange-primary)", bg: "var(--orange-bg)", border: "var(--orange-border)" },
  yellow: { color: "#eab308",               bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.2)" },
  blue:   { color: "var(--blue-primary)",   bg: "var(--blue-bg)",   border: "var(--blue-border)" },
  purple: { color: "var(--purple-primary)", bg: "var(--purple-bg)", border: "var(--purple-border)" },
  gray:   { color: "var(--text-secondary)", bg: "rgba(255,255,255,0.04)", border: "var(--border)" },
};

interface BadgeProps {
  variant?: Variant;
  size?: Size;
  dot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
}

export default function Badge({ variant = "gray", size = "md", dot, pulse, children }: BadgeProps) {
  const v = VARIANTS[variant];
  const fontSize = size === "sm" ? "0.62rem" : "0.65rem";
  return (
    <span
      className="status-badge"
      style={{ background: v.bg, border: `1px solid ${v.border}`, color: v.color, fontSize }}
    >
      {dot && (
        <span
          className={pulse ? "animate-pulse" : ""}
          style={{ width: 5, height: 5, borderRadius: "50%", background: v.color, display: "inline-block" }}
        />
      )}
      {children}
    </span>
  );
}
