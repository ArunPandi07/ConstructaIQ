import { useState } from 'react'
import { DollarSign, Clock, FileText, Users, ArrowRight, Layers } from 'lucide-react'
import Badge from '../components/Badge'
import { CardSkeleton, ErrorState } from '../components/Skeleton'
import { useChangeImpact } from '../hooks/usePageData'
import { useAppContext } from '../context/AppContext'

const iconMap = { dollar: DollarSign, clock: Clock, file: FileText, users: Users }

const sevStyle = {
  high:   { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', badge: 'red'    as const },
  medium: { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', badge: 'orange' as const },
  low:    { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badge: 'green'  as const },
}

const depColors: Record<string, string> = {
  requires: '#dc2626', triggers: '#ea580c',
  blocks:   '#7c3aed', 'may require': '#d97706',
}

export default function ChangeImpact() {
  const { activeProjectId } = useAppContext()
  const { data, loading, error, refetch } = useChangeImpact(activeProjectId)
  const [activeTab, setActiveTab] = useState<'impact'|'comparison'|'dependency'>('impact')

  if (error) return <ErrorState message={error} onRetry={refetch} />

  const tabs = [
    { id: 'impact',      label: 'Impact Cards'    },
    { id: 'comparison',  label: 'Before vs After' },
    { id: 'dependency',  label: 'Dependency Graph'},
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Change Impact Analysis</h2>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>AI-powered scenario analysis for design changes</p>
        </div>
        <Badge variant="orange" dot>Change Detected</Badge>
      </div>

      {/* Scenario banner */}
      {loading ? <CardSkeleton lines={2} showHeader={false} /> : data && (
        <div className="p-5 rounded-2xl" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#ffedd5', border: '1px solid #fed7aa' }}>
              <Layers size={20} style={{ color: '#ea580c' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>Scenario: {data.scenario}</h3>
                <Badge variant="orange">Change Request</Badge>
              </div>
              <p className="text-sm" style={{ color: '#64748b' }}>{data.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: activeTab === t.id ? '#ffffff' : 'transparent',
              color:      activeTab === t.id ? '#2563eb' : '#64748b',
              boxShadow:  activeTab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              border:     activeTab === t.id ? '1px solid #e2e8f0' : '1px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Impact Cards */}
      {activeTab === 'impact' && (
        loading
          ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({length:4}).map((_,i)=><CardSkeleton key={i} lines={4} />)}</div>
          : data && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.impacts.map(impact => {
                const Icon = iconMap[impact.icon as keyof typeof iconMap]
                const s = sevStyle[impact.severity]
                return (
                  <div key={impact.category} className="glass-card p-5" style={{ borderColor: s.border }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                          <Icon size={18} style={{ color: s.color }} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>{impact.category}</h3>
                          <Badge variant={s.badge} size="sm">{impact.severity.toUpperCase()} IMPACT</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black" style={{ color: s.color }}>{impact.value}</div>
                        <div className="text-xs font-semibold mt-0.5" style={{ color: s.color }}>{impact.percentage}</div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {impact.details.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg"
                          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: s.color }} />
                          <span className="text-xs" style={{ color: '#64748b' }}>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
      )}

      {/* Before vs After */}
      {activeTab === 'comparison' && (
        loading ? <CardSkeleton lines={8} /> : data && (
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold mb-5" style={{ color: '#0f172a' }}>Before vs After Comparison</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-3">
                <div className="text-center p-2 rounded-lg mb-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <span className="text-sm font-bold" style={{ color: '#16a34a' }}>CURRENT STATE</span>
                </div>
                {(Object.keys(data.before) as Array<keyof typeof data.before>).map(k => (
                  <div key={String(k)} className="p-3 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div className="text-xs mb-0.5 capitalize" style={{ color: '#94a3b8' }}>{String(k)}</div>
                    <div className="text-sm font-bold" style={{ color: '#0f172a' }}>{String(data.before[k])}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center pt-12 space-y-6">
                <div className="text-center p-2 rounded-lg mb-2 w-full" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <span className="text-xs font-bold" style={{ color: '#2563eb' }}>CHANGE</span>
                </div>
                {['+1 Floor','+$6.4M','+2.5 mo','+1 New','+12','+ 11%'].map((v, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <ArrowRight size={13} style={{ color: '#ea580c' }} />
                    <span className="text-xs font-bold" style={{ color: '#ea580c' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="text-center p-2 rounded-lg mb-4" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <span className="text-sm font-bold" style={{ color: '#ea580c' }}>PROPOSED STATE</span>
                </div>
                {(Object.keys(data.after) as Array<keyof typeof data.after>).map(k => (
                  <div key={String(k)} className="p-3 rounded-xl" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                    <div className="text-xs mb-0.5 capitalize" style={{ color: '#94a3b8' }}>{String(k)}</div>
                    <div className="text-sm font-bold" style={{ color: '#ea580c' }}>{String(data.after[k])}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {/* Dependency graph */}
      {activeTab === 'dependency' && (
        loading ? <CardSkeleton lines={6} /> : data && (
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold mb-5" style={{ color: '#0f172a' }}>Visual Dependency Graph</h3>
            <div className="space-y-3">
              {data.dependencies.map((dep, i) => {
                const c = depColors[dep.type] ?? '#2563eb'
                return (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="flex-1 px-3 py-2 rounded-lg text-center"
                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                      <span className="text-xs font-semibold" style={{ color: '#2563eb' }}>{dep.from}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ArrowRight size={13} style={{ color: c }} />
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${c}12`, color: c, border: `1px solid ${c}30`, fontSize: '0.65rem' }}>
                        {dep.type}
                      </span>
                      <ArrowRight size={13} style={{ color: c }} />
                    </div>
                    <div className="flex-1 px-3 py-2 rounded-lg text-center"
                      style={{ background: `${c}0d`, border: `1px solid ${c}25` }}>
                      <span className="text-xs font-semibold" style={{ color: c }}>{dep.to}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t" style={{ borderColor: '#e2e8f0' }}>
              {Object.entries(depColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className="w-3 h-1 rounded" style={{ background: color }} />
                  <span style={{ color: '#64748b', fontSize: '0.62rem' }}>{type}</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  )
}
