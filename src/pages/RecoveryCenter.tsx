import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ShieldCheck, Star, Zap, Brain, ArrowRight, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import Badge from '../components/Badge'
import { StrategyCardSkeleton, CardSkeleton, ErrorState } from '../components/Skeleton'
import { useRecoveryStrategies } from '../hooks/usePageData'
import { activateRecoveryStrategy } from '../services/api'
import { useAppContext } from '../context/AppContext'
import type { RecoveryStrategy } from '../types'

export default function RecoveryCenter() {
  const navigate = useNavigate()
  const { activeProjectId } = useAppContext()
  const { data, loading, error, refetch } = useRecoveryStrategies(activeProjectId)
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>('A')
  const [activating, setActivating] = useState<string | null>(null)
  const [activated,  setActivated]  = useState<string | null>(null)

  if (error) return <ErrorState message={error} onRetry={refetch} />

  const handleActivate = async (strategyId: string) => {
    setActivating(strategyId)
    try {
      await activateRecoveryStrategy(activeProjectId, strategyId)
      setActivated(strategyId)
    } finally {
      setActivating(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Recovery Center</h2>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            AI-generated recovery strategies with confidence scoring
          </p>
        </div>
        {!loading && data && <Badge variant="green" dot>{data.length} Strategies Ready</Badge>}
      </div>

      {/* Activation success */}
      {activated && (
        <div className="flex items-center justify-between p-4 rounded-xl"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} style={{ color: '#16a34a' }} />
            <span className="text-sm font-semibold" style={{ color: '#16a34a' }}>
              Strategy {activated} activated — recovery plan is now in motion
            </span>
          </div>
          <button onClick={() => navigate('/agents')} className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: '#2563eb' }}>
            Track Agent Progress <ArrowRight size={11} />
          </button>
        </div>
      )}

      {/* Executive summary */}
      {loading ? <CardSkeleton lines={3} /> : data && (
        <div className="p-6 rounded-2xl" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', boxShadow: '0 0 0 3px rgba(37,99,235,0.05)' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
              <Brain size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>Executive AI Recommendation</h3>
                <Badge variant="blue" dot>Recommended Strategy {data.find(s => s.recommended)?.id}</Badge>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
                Based on multi-factor analysis, BuildMind AI recommends{' '}
                <strong style={{ color: '#2563eb' }}>Strategy A: Accelerated Parallel Path</strong>.
                Recovers <strong style={{ color: '#16a34a' }}>6.5 weeks</strong> at{' '}
                <strong style={{ color: '#d97706' }}>+$2.1M</strong> — highest ROI with{' '}
                <strong style={{ color: '#7c3aed' }}>89% AI confidence</strong>.
              </p>
            </div>
            <div className="flex-shrink-0 text-center">
              <div className="text-3xl font-black" style={{ color: '#2563eb' }}>89%</div>
              <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>AI Confidence</div>
            </div>
          </div>
        </div>
      )}

      {/* Strategy cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading
          ? Array.from({length: 3}).map((_,i) => <StrategyCardSkeleton key={i} />)
          : data?.map((strategy: RecoveryStrategy) => {
              const isExp = expandedStrategy === strategy.id
              return (
                <div key={strategy.id}
                  className={`strategy-card ${strategy.recommended ? 'recommended' : ''}`}
                  onClick={() => setExpandedStrategy(isExp ? null : strategy.id)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm"
                        style={{
                          background: strategy.recommended ? 'linear-gradient(135deg,#2563eb,#4f46e5)' : '#f1f5f9',
                          color:      strategy.recommended ? 'white' : '#475569',
                          border:     strategy.recommended ? 'none' : '1px solid #e2e8f0',
                        }}>
                        {strategy.id}
                      </div>
                      <div>
                        <div className="text-xs font-bold" style={{ color: '#0f172a' }}>{strategy.name}</div>
                        {strategy.recommended && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star size={9} style={{ color: '#d97706' }} />
                            <span style={{ fontSize: '0.58rem', color: '#d97706', fontWeight: 700 }}>RECOMMENDED</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{
                        color: strategy.aiConfidence >= 80 ? '#16a34a' : strategy.aiConfidence >= 70 ? '#2563eb' : '#ea580c'
                      }}>{strategy.aiConfidence}%</div>
                      <div style={{ fontSize: '0.58rem', color: '#94a3b8' }}>confidence</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { l:'Cost',      v:strategy.costImpact,    pos: !strategy.costImpact.startsWith('+') },
                      { l:'Time Saved',v:strategy.timeSaved,     pos: true },
                      { l:'Risk ↓',   v:strategy.riskReduction,  pos: true },
                    ].map(({ l, v, pos }) => (
                      <div key={l} className="text-center p-2 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div className="text-xs font-bold" style={{ color: pos ? '#16a34a' : '#ea580c' }}>{v}</div>
                        <div style={{ fontSize: '0.58rem', color: '#94a3b8' }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: '#64748b' }}>{strategy.description}</p>
                  <div className="progress-bar mb-1.5">
                    <div className="progress-fill" style={{
                      width: `${strategy.aiConfidence}%`,
                      background: strategy.recommended
                        ? 'linear-gradient(90deg,#2563eb,#4f46e5)'
                        : 'linear-gradient(90deg,#94a3b8,#cbd5e1)',
                    }} />
                  </div>
                  <div className="flex items-center justify-center mt-3 pt-3 border-t" style={{ borderColor: '#e2e8f0' }}>
                    <button className="flex items-center gap-1 text-xs font-medium" style={{ color: '#2563eb' }}
                      onClick={e => { e.stopPropagation(); setExpandedStrategy(isExp ? null : strategy.id) }}>
                      {isExp ? 'Collapse' : 'View Details'}
                      {isExp ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  </div>
                </div>
              )
            })}
      </div>

      {/* Expanded detail */}
      {!loading && data && expandedStrategy && (() => {
        const strategy = data.find(s => s.id === expandedStrategy)
        if (!strategy) return null
        const isActivated = activated === strategy.id
        const isActivating = activating === strategy.id
        return (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>
                Strategy {strategy.id}: {strategy.name} — Action Plan
              </h3>
              <Badge variant={strategy.recommended ? 'blue' : 'gray'}>{strategy.aiConfidence}% Confidence</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={13} style={{ color: '#2563eb' }} />
                  <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>Implementation Steps</span>
                </div>
                <div className="space-y-2">
                  {strategy.details.map((d, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white"
                        style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)', fontSize: '0.62rem', fontWeight: 700 }}>
                        {i + 1}
                      </div>
                      <span className="text-xs leading-relaxed" style={{ color: '#475569' }}>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={13} style={{ color: '#16a34a' }} />
                    <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>Advantages</span>
                  </div>
                  <div className="space-y-1.5">
                    {strategy.pros.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#16a34a' }} />
                        <span className="text-xs" style={{ color: '#374151' }}>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={13} style={{ color: '#ea580c' }} />
                    <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>Considerations</span>
                  </div>
                  <div className="space-y-1.5">
                    {strategy.cons.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#ea580c' }} />
                        <span className="text-xs" style={{ color: '#374151' }}>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleActivate(strategy.id)}
                  disabled={isActivating || isActivated}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                  style={{ background: isActivated ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
                  {isActivating ? <><Loader2 size={14} className="animate-spin" /> Activating…</>
                   : isActivated ? <><CheckCircle size={14} /> Activated!</>
                   : <><Zap size={14} /> Activate Strategy {strategy.id} <ArrowRight size={13} /></>}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
