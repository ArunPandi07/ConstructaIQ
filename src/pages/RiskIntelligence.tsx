import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, ChevronDown, ChevronUp, ArrowDown, TrendingUp, Info, Zap, ArrowRight } from 'lucide-react'
import Badge from '../components/Badge'
import { RiskCardSkeleton, CardSkeleton, ErrorState, Skeleton } from '../components/Skeleton'
import { useRiskIntelligence } from '../hooks/usePageData'
import { useAppContext } from '../context/AppContext'
import type { RiskFactor } from '../types'

const heatColors = [
  '#dcfce7','#bbf7d0','#fef9c3','#fef08a',
  '#fed7aa','#fdba74','#fca5a5','#f87171','#ef4444',
]
const getHeatColor  = (v: number) => heatColors[Math.min(v - 1, heatColors.length - 1)]
const getHeatText   = (v: number) => v >= 7 ? (v >= 8 ? '#7f1d1d' : '#991b1b') : '#14532d'
const catBadge = (c: string) => ({'Regulatory':'red','Supply Chain':'orange','Workforce':'yellow','Design':'purple'} as any)[c] ?? 'blue'
const riskStyle = (s: number) =>
  s >= 80 ? { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
  : s >= 60 ? { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' }
  : s >= 40 ? { color: '#ca8a04', bg: '#fefce8', border: '#fde68a' }
  : { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }

export default function RiskIntelligence() {
  const navigate = useNavigate()
  const { activeProjectId } = useAppContext()
  const { data, loading, error, refetch } = useRiskIntelligence(activeProjectId)
  const [expandedRisk, setExpandedRisk] = useState<number | null>(0)

  if (error) return <ErrorState message={error} onRetry={refetch} />

  const ss = data ? riskStyle(data.overallScore) : riskStyle(82)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Risk Intelligence</h2>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>AI-powered risk identification, quantification, and reasoning</p>
        </div>
        {loading
          ? <Skeleton style={{ width: 100, height: 24 }} rounded="full" />
          : data && <Badge variant="red" dot pulse>{data.overallScore}/100 Critical</Badge>}
      </div>

      {/* Top row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Score gauge */}
        {loading ? <CardSkeleton lines={4} /> : data && (
          <div className="glass-card p-6 flex flex-col items-center text-center" style={{ borderColor: ss.border }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#94a3b8' }}>
              Overall Project Risk Score
            </div>
            <div className="relative mb-4">
              <svg width={120} height={120} className="transform -rotate-90">
                <circle cx={60} cy={60} r={48} fill="none" stroke="#e2e8f0" strokeWidth={10} />
                <circle cx={60} cy={60} r={48} fill="none" stroke={ss.color} strokeWidth={10} strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 48 * (data.overallScore / 100)} ${2 * Math.PI * 48}`}
                  style={{ filter: `drop-shadow(0 0 6px ${ss.color}60)` }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black" style={{ color: ss.color }}>{data.overallScore}</span>
                <span className="text-xs" style={{ color: '#94a3b8' }}>/100</span>
              </div>
            </div>
            <div className="text-sm font-bold mb-1" style={{ color: ss.color }}>Critical Risk Level</div>
            <p className="text-xs mb-4" style={{ color: '#64748b' }}>Trend: ↑ Increasing — Action required</p>
            <div className="grid grid-cols-3 gap-2 w-full mb-4">
              {[{ l:'Critical',n:7,c:'#dc2626',b:'#fef2f2',bd:'#fecaca' },
                { l:'High',n:12,c:'#ea580c',b:'#fff7ed',bd:'#fed7aa' },
                { l:'Medium',n:24,c:'#ca8a04',b:'#fefce8',bd:'#fde68a' }].map(x => (
                <div key={x.l} className="p-2 rounded-lg text-center" style={{ background: x.b, border: `1px solid ${x.bd}` }}>
                  <div className="text-lg font-bold" style={{ color: x.c }}>{x.n}</div>
                  <div style={{ color: x.c, fontSize: '0.6rem' }}>{x.l}</div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/recovery')}
              className="w-full py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
              View Recovery Plans <ArrowRight size={11} className="inline ml-1" />
            </button>
          </div>
        )}

        {/* Heatmap */}
        {loading ? <CardSkeleton lines={5} /> : data && (
          <div className="glass-card p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>Risk Heatmap</h3>
              <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Probability × Impact matrix</p>
            </div>
            <div className="flex gap-1">
              <div className="flex flex-col justify-between py-4 pr-1" style={{ width: 46 }}>
                {['V.High','High','Med','Low','V.Low'].map(l => (
                  <div key={l} className="text-right text-xs" style={{ color: '#94a3b8', fontSize: '0.6rem' }}>{l}</div>
                ))}
              </div>
              <div className="flex-1">
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(5,1fr)', gridTemplateRows: 'repeat(5,1fr)' }}>
                  {data.heatmap.map((row, ri) =>
                    row.map((val, ci) => (
                      <div key={`${ri}-${ci}`} className="heatmap-cell aspect-square"
                        style={{ background: getHeatColor(val), minHeight: 34, color: getHeatText(val) }}
                        title={`Risk: ${val}`}>
                        {val >= 7 && <span style={{ fontSize: '0.55rem', fontWeight: 700 }}>{val}</span>}
                      </div>
                    ))
                  )}
                </div>
                <div className="grid mt-1" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
                  {['V.Low','Low','Med','High','V.High'].map(l => (
                    <div key={l} className="text-center" style={{ color: '#94a3b8', fontSize: '0.6rem' }}>{l}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              {[['#16a34a','#bbf7d0','Low'],['#ca8a04','#fde68a','Medium'],['#dc2626','#fecaca','High']].map(([c,b,l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ background: b, border: `1px solid ${c}44` }} />
                  <span style={{ fontSize: '0.62rem', color: '#64748b' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning Chain */}
        {loading ? <CardSkeleton lines={8} /> : data && (
          <div className="glass-card p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>AI Reasoning Chain</h3>
              <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Causal risk propagation analysis</p>
            </div>
            <div className="space-y-1">
              {data.reasoningChain.map((node, i) => (
                <div key={i}>
                  <div className="chain-node" style={{ borderColor: `${node.color}30`, background: `${node.color}08` }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${node.color}15`, border: `1px solid ${node.color}30` }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: node.color }}>{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold" style={{ color: node.color }}>{node.event}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#94a3b8', fontSize: '0.62rem' }}>{node.description}</div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <TrendingUp size={10} style={{ color: node.color }} />
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: node.color }}>{node.confidence}%</span>
                    </div>
                  </div>
                  {i < data.reasoningChain.length - 1 && (
                    <div className="chain-arrow"><ArrowDown size={13} style={{ color: '#93c5fd' }} /></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Risks */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={15} style={{ color: '#dc2626' }} />
          <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>Top Risk Factors</h3>
          {!loading && data && (
            <span className="ml-auto text-xs" style={{ color: '#94a3b8' }}>{data.topRisks.length} identified risks</span>
          )}
        </div>
        {loading
          ? <div className="space-y-2">{Array.from({length:4}).map((_,i)=><RiskCardSkeleton key={i}/>)}</div>
          : data && (
            <div className="space-y-2">
              {data.topRisks.map((risk: RiskFactor) => {
                const isExp = expandedRisk === risk.id
                const rs = riskStyle(risk.score)
                return (
                  <div key={risk.id} className="rounded-xl overflow-hidden transition-all"
                    style={{ background: isExp ? rs.bg : '#f8fafc', border: `1px solid ${isExp ? rs.border : '#e2e8f0'}` }}>
                    <div className="flex items-center gap-3 p-4 cursor-pointer"
                      onClick={() => setExpandedRisk(isExp ? null : risk.id)}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: rs.bg, border: `1px solid ${rs.border}` }}>
                        <span className="text-base font-black" style={{ color: rs.color }}>{risk.score}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold" style={{ color: '#0f172a' }}>{risk.name}</span>
                          <Badge variant={catBadge(risk.category)}>{risk.category}</Badge>
                          <Badge variant="gray" size="sm">P: {risk.probability}</Badge>
                          <Badge variant={risk.impact === 'Critical' ? 'red' : 'orange'} size="sm">I: {risk.impact}</Badge>
                        </div>
                        <p className="text-xs mt-1 truncate" style={{ color: '#64748b' }}>{risk.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="progress-bar w-16" style={{ height: 4 }}>
                          <div className="progress-fill" style={{ width: `${risk.score}%`, background: `linear-gradient(90deg,${rs.color}77,${rs.color})` }} />
                        </div>
                        {isExp ? <ChevronUp size={14} style={{ color: '#94a3b8' }} /> : <ChevronDown size={14} style={{ color: '#94a3b8' }} />}
                      </div>
                    </div>
                    {isExp && (
                      <div className="px-4 pb-4">
                        <div className="border-t pt-3 grid grid-cols-1 md:grid-cols-2 gap-3" style={{ borderColor: rs.border }}>
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <Info size={12} style={{ color: '#2563eb' }} />
                              <span className="text-xs font-semibold" style={{ color: '#0f172a' }}>Risk Factors</span>
                            </div>
                            {risk.details.map((d, i) => (
                              <div key={i} className="flex items-start gap-2 mb-1.5">
                                <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: rs.color }} />
                                <span className="text-xs" style={{ color: '#64748b' }}>{d}</span>
                              </div>
                            ))}
                          </div>
                          <div className="p-3 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                            <div className="flex items-center gap-1.5 mb-2">
                              <Zap size={12} style={{ color: '#16a34a' }} />
                              <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>AI Mitigation</span>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>{risk.mitigation}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
      </div>
    </div>
  )
}
