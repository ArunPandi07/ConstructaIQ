import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'blue' | 'green' | 'red' | 'orange' | 'yellow' | 'purple' | 'gray'
  size?: 'sm' | 'md'
  dot?: boolean
  pulse?: boolean
  className?: string
}

const variantStyles = {
  blue:   { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  green:  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  red:    { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  orange: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  yellow: { bg: '#fefce8', color: '#ca8a04', border: '#fde68a' },
  purple: { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
  gray:   { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
}

export default function Badge({
  children, variant = 'blue', size = 'sm', dot = false, pulse = false, className,
}: BadgeProps) {
  const s = variantStyles[variant]
  return (
    <span
      className={`status-badge ${className ?? ''}`}
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        fontSize: size === 'sm' ? '0.68rem' : '0.75rem',
      }}
    >
      {dot && (
        <span
          className={`status-dot ${pulse ? 'animate-pulse' : ''}`}
          style={{ background: s.color }}
        />
      )}
      {children}
    </span>
  )
}
