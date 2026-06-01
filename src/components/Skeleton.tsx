import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const roundedMap = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 }

export function Skeleton({ className, style, rounded = 'md' }: SkeletonProps) {
  return (
    <div
      className={clsx('animate-pulse', className)}
      style={{
        background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer-light 1.5s infinite',
        borderRadius: roundedMap[rounded],
        ...style,
      }}
    />
  )
}

export function KPICardSkeleton() {
  return (
    <div
      className="kpi-card"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ background: '#e2e8f0' }}
      />
      <div className="flex items-start justify-between mb-4">
        <Skeleton style={{ width: 40, height: 40 }} rounded="xl" />
        <Skeleton style={{ width: 70, height: 20 }} rounded="full" />
      </div>
      <Skeleton style={{ width: '55%', height: 28 }} rounded="md" />
      <Skeleton style={{ width: '80%', height: 12, marginTop: 8 }} rounded="md" />
      <Skeleton style={{ width: '55%', height: 11, marginTop: 6 }} rounded="md" />
    </div>
  )
}

// ── Card Skeleton ──────────────────── ─────────────────────────

interface CardSkeletonProps {
  lines?: number
  showHeader?: boolean
  className?: string
}

export function CardSkeleton({ lines = 4, showHeader = true, className }: CardSkeletonProps) {
  return (
    <div className={clsx('glass-card p-5', className)}>
      {showHeader && (
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-1.5">
            <Skeleton style={{ width: 160, height: 16 }} rounded="md" />
            <Skeleton style={{ width: 110, height: 11 }} rounded="md" />
          </div>
          <Skeleton style={{ width: 60, height: 22 }} rounded="full" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            style={{ width: `${85 - (i % 3) * 10}%`, height: 14 }}
            rounded="md"
          />
        ))}
      </div>
    </div>
  )
}

// ── Agent Card Skeleton ───────────────────────────────────────

export function AgentCardSkeleton() {
  return (
    <div className="agent-card" style={{ pointerEvents: 'none' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton style={{ width: 40, height: 40 }} rounded="xl" />
          <div className="space-y-1.5">
            <Skeleton style={{ width: 110, height: 14 }} />
            <Skeleton style={{ width: 80, height: 11 }} />
          </div>
        </div>
        <Skeleton style={{ width: 70, height: 20 }} rounded="full" />
      </div>
      <Skeleton style={{ width: '100%', height: 6, marginBottom: 16 }} rounded="full" />
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[0, 1, 2].map(i => (
          <Skeleton key={i} style={{ height: 48 }} rounded="lg" />
        ))}
      </div>
      <Skeleton style={{ width: '100%', height: 36, marginBottom: 12 }} rounded="lg" />
      <div className="space-y-2">
        {[0, 1, 2].map(i => (
          <Skeleton key={i} style={{ width: `${90 - i * 8}%`, height: 11 }} />
        ))}
      </div>
    </div>
  )
}

// ── Risk Card Skeleton ────────────────────────────────────────

export function RiskCardSkeleton() {
  return (
    <div className="rounded-xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <div className="flex items-center gap-3">
        <Skeleton style={{ width: 40, height: 40 }} rounded="xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton style={{ width: '60%', height: 14 }} />
          <Skeleton style={{ width: '85%', height: 11 }} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton style={{ width: 60, height: 6 }} rounded="full" />
          <Skeleton style={{ width: 18, height: 18 }} rounded="md" />
        </div>
      </div>
    </div>
  )
}

// ── Timeline Skeleton ─────────────────────────────────────────

export function TimelineSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
        >
          <Skeleton style={{ width: 62, height: 11, flexShrink: 0 }} rounded="md" />
          <Skeleton style={{ width: 8, height: 8, flexShrink: 0 }} rounded="full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton style={{ width: '40%', height: 12 }} />
            <Skeleton style={{ width: '70%', height: 11 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Strategy Card Skeleton ────────────────────────────────────

export function StrategyCardSkeleton() {
  return (
    <div className="strategy-card" style={{ pointerEvents: 'none' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton style={{ width: 32, height: 32 }} rounded="xl" />
          <Skeleton style={{ width: 120, height: 14 }} />
        </div>
        <Skeleton style={{ width: 36, height: 36 }} rounded="lg" />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[0, 1, 2].map(i => <Skeleton key={i} style={{ height: 44 }} rounded="lg" />)}
      </div>
      <Skeleton style={{ width: '100%', height: 11, marginBottom: 6 }} />
      <Skeleton style={{ width: '80%', height: 11, marginBottom: 12 }} />
      <Skeleton style={{ width: '100%', height: 6 }} rounded="full" />
    </div>
  )
}

// ── Error State ───────────────────────────────────────────────

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center"
      style={{ color: '#64748b' }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
      >
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="text-sm font-bold mb-1" style={{ color: '#dc2626' }}>
        Failed to load data
      </h3>
      <p className="text-xs max-w-xs leading-relaxed" style={{ color: '#64748b' }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}
        >
          Retry
        </button>
      )}
    </div>
  )
}

// ── shimmer keyframe (injected once) ─────────────────────────

const shimmerStyle = document.createElement('style')
shimmerStyle.textContent = `
  @keyframes shimmer-light {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
`
if (!document.head.querySelector('[data-buildmind-skeleton]')) {
  shimmerStyle.setAttribute('data-buildmind-skeleton', 'true')
  document.head.appendChild(shimmerStyle)
}
