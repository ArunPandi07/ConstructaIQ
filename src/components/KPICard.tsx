import type { ReactNode } from 'react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  trend?: { value: string; positive: boolean }
  accentColor?: string
  iconBg?: string
}

export default function KPICard({
  title, value, subtitle, icon, trend,
  accentColor = '#2563eb', iconBg,
}: KPICardProps) {
  return (
    <div className="kpi-card">
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}55)` }}
      />
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg || `${accentColor}12`, border: `1px solid ${accentColor}22` }}
        >
          {icon}
        </div>
        {trend && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: trend.positive ? '#f0fdf4' : '#fef2f2',
              color:      trend.positive ? '#16a34a' : '#dc2626',
              border:     `1px solid ${trend.positive ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            {trend.value}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>{value}</div>
      <div className="text-xs font-semibold" style={{ color: '#64748b' }}>{title}</div>
      {subtitle && (
        <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{subtitle}</div>
      )}
    </div>
  )
}
