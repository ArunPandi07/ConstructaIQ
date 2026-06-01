import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import {
  FolderOpen, ShieldAlert, CheckCircle, DollarSign,
  AlertTriangle, RefreshCw, TrendingUp, Bot, ArrowRight, Clock,
} from 'lucide-react'
import KPICard from '../components/KPICard'
import Badge from '../components/Badge'
import {
  KPICardSkeleton, CardSkeleton, ErrorState,
} from '../components/Skeleton'
import { useDashboard } from '../hooks/usePageData'

const sevConfig = {
  critical: { variant: 'red' as const, label: 'Critical' },
  warning: { variant: 'orange' as const, label: 'Warning' },
  medium: { variant: 'yellow' as const, label: 'Medium' },
  success: { variant: 'green' as const, label: 'Success' },
  info: { variant: 'blue' as const, label: 'Info' },
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-xl shadow-lg" style={{ background: '#fff', border: '1px solid #e2e8f0', minWidth: 150 }}>
      <p className="text-xs font-bold mb-1.5" style={{ color: '#0f172a' }}>{label}</p>
      {payload.map((e: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: e.color }} />
          <span style={{ color: '#64748b' }}>{e.name}:</span>
          <span className="font-semibold" style={{ color: '#0f172a' }}>{e.value}%</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useDashboard()

  // ── Error ────────────────────────────────────────────────────
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Command Center</h2>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            Real-time construction intelligence across 24 active projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <Clock size={13} style={{ color: '#2563eb' }} />
            <span className="text-xs font-medium" style={{ color: '#2563eb' }}>
              {loading ? 'Loading…' : 'Last updated: Just now'}
            </span>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading ? Array.from({ length: 6 }).map((_, i) => <KPICardSkeleton key={i} />) : data && (
          <>
            <KPICard title="Active Projects" value={data.kpi.activeProjects} subtitle="Across 8 regions"
              icon={<FolderOpen size={18} style={{ color: '#2563eb' }} />}
              trend={{ value: '+2 this month', positive: true }} accentColor="#2563eb" />
            <KPICard title="Risk Projects" value={data.kpi.riskProjects} subtitle="Need immediate action"
              icon={<ShieldAlert size={18} style={{ color: '#dc2626' }} />}
              trend={{ value: '+1 this week', positive: false }} accentColor="#dc2626" />
            <KPICard title="On-Time Projects" value={data.kpi.onTimeProjects} subtitle="67% of portfolio"
              icon={<CheckCircle size={18} style={{ color: '#16a34a' }} />}
              trend={{ value: '+3 improved', positive: true }} accentColor="#16a34a" />
            <KPICard title="Total Budget" value={data.kpi.totalBudget} subtitle="Across all projects"
              icon={<DollarSign size={18} style={{ color: '#d97706' }} />}
              accentColor="#d97706" />
            <KPICard title="Open Risks" value={data.kpi.openRisks} subtitle="18 critical, 25 high"
              icon={<AlertTriangle size={18} style={{ color: '#ea580c' }} />}
              trend={{ value: '-5 resolved', positive: true }} accentColor="#ea580c" />
            <KPICard title="Recovery Plans" value={data.kpi.recoveryPlans} subtitle="AI-generated strategies"
              icon={<RefreshCw size={18} style={{ color: '#7c3aed' }} />}
              trend={{ value: '+4 new', positive: true }} accentColor="#7c3aed" />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Area chart */}
        {loading ? (
          <CardSkeleton className="xl:col-span-2" lines={6} />
        ) : data && (
          <div className="glass-card p-5 xl:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>Project Health Trend</h3>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>6-month portfolio performance</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                {[['#2563eb', 'Health'], ['#16a34a', 'On-Time'], ['#dc2626', 'Risk']].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-3 h-1 rounded-full" style={{ background: c }} />
                    <span style={{ color: '#94a3b8' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.healthTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  {[['health', '#2563eb'], ['onTime', '#16a34a'], ['risk', '#dc2626']].map(([k, c]) => (
                    <linearGradient key={k} id={`c-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.12} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="health" name="Health" stroke="#2563eb" strokeWidth={2} fill="url(#c-health)" />
                <Area type="monotone" dataKey="onTime" name="On-Time" stroke="#16a34a" strokeWidth={2} fill="url(#c-onTime)" />
                <Area type="monotone" dataKey="risk" name="Risk" stroke="#dc2626" strokeWidth={2} fill="url(#c-risk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie */}
        {loading ? <CardSkeleton lines={5} /> : data && (
          <div className="glass-card p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>Risk Distribution</h3>
              <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>By category across portfolio</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={data.riskDistribution} cx="50%" cy="50%"
                  innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                  {data.riskDistribution.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={0} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#0f172a' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {data.riskDistribution.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    <span style={{ color: '#64748b' }}>{item.name}</span>
                  </div>
                  <span className="font-semibold" style={{ color: '#0f172a' }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Activities */}
        {loading ? <CardSkeleton lines={5} /> : data && (
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>Recent Agent Activities</h3>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Live AI agent monitoring</p>
              </div>
              <Badge variant="blue" dot pulse>Live</Badge>
            </div>
            <div className="space-y-2">
              {data.recentActivities.map((a: any) => {
                const sev = sevConfig[a.severity as keyof typeof sevConfig]
                return (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                      <Bot size={13} style={{ color: '#2563eb' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold" style={{ color: '#0f172a' }}>{a.agent}</span>
                        <Badge variant={sev.variant} size="sm">{sev.label}</Badge>
                      </div>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#64748b' }}>{a.action}</p>
                      <span className="text-xs mt-0.5 block" style={{ color: '#94a3b8' }}>{a.time}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* CTA → Agents page */}
            <button onClick={() => navigate('/agents')}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-blue-50"
              style={{ color: '#2563eb', border: '1px solid #bfdbfe' }}>
              View All Agent Activity <ArrowRight size={11} />
            </button>
          </div>
        )}

        {/* Recommendations */}
        {loading ? <CardSkeleton lines={6} /> : data && (
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>AI Recommendations</h3>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>High-priority action items</p>
              </div>
              <button onClick={() => navigate('/recovery')} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#2563eb' }}>
                View All <ArrowRight size={11} />
              </button>
            </div>
            <div className="space-y-3">
              {data.recentRecommendations.map((rec: any) => (
                <div key={rec.id} className="p-4 rounded-xl cursor-pointer transition-all hover:shadow-sm"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                  onClick={() => navigate('/risk')}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={rec.impact === 'Critical' ? 'red' : rec.impact === 'High' ? 'orange' : 'yellow'}>
                        {rec.impact}
                      </Badge>
                      <Badge variant="purple">{rec.category}</Badge>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <TrendingUp size={11} style={{ color: '#16a34a' }} />
                      <span className="text-xs font-bold" style={{ color: '#16a34a' }}>{rec.confidence}%</span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#0f172a' }}>{rec.project}</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{rec.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
