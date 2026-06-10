import React from "react";

interface SkeletonProps {
  style?: React.CSSProperties;
  rounded?: "sm" | "md" | "lg" | "full";
  className?: string;
}

export function Skeleton({ style, rounded = "md", className = "" }: SkeletonProps) {
  const radii = { sm: 4, md: 6, lg: 10, full: 999 };
  return (
    <div
      className={`skeleton ${className}`}
      style={{ borderRadius: radii[rounded], minHeight: 14, ...style }}
    />
  );
}

export function KPICardSkeleton() {
  return (
    <div className="kpi-card">
      <div style={{ height: 2, background: "var(--border2)" }} />
      <div style={{ padding: "10px 14px" }}>
        <Skeleton style={{ height: 22, width: "50%", marginBottom: 8 }} />
        <Skeleton style={{ height: 12, width: "70%" }} />
      </div>
    </div>
  );
}

export function CardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="glass-card p-5">
      <Skeleton style={{ height: 14, width: "40%", marginBottom: 16 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} style={{ height: 12, width: `${70 + (i % 3) * 10}%`, marginBottom: 10 }} />
      ))}
    </div>
  );
}

export function RiskCardSkeleton() {
  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12, marginBottom: 8 }}>
      <Skeleton style={{ width: 40, height: 40, borderRadius: 9, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <Skeleton style={{ height: 13, width: "60%", marginBottom: 8 }} />
        <Skeleton style={{ height: 11, width: "80%" }} />
      </div>
    </div>
  );
}

export function StrategyCardSkeleton() {
  return (
    <div className="strategy-card" style={{ marginBottom: 12 }}>
      <Skeleton style={{ height: 13, width: "50%", marginBottom: 10 }} />
      <Skeleton style={{ height: 11, width: "90%", marginBottom: 6 }} />
      <Skeleton style={{ height: 11, width: "75%" }} />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="glass-card p-8 text-center">
      <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>⚠️</div>
      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Something went wrong</div>
      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 16 }}>{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{ background: "var(--amber)", color: "#000", border: "none", borderRadius: 8, padding: "7px 18px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
