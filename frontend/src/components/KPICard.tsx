import React from "react";

interface KPICardProps {
  value: string | number;
  label: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
}

export default function KPICard({ value, label, color, bg, icon }: KPICardProps) {
  return (
    <div className="kpi-card">
      <div style={{ height: 2, background: color }} />
      <div style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, letterSpacing: "-0.5px" }}>{value}</div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: 5 }}>{label}</div>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
