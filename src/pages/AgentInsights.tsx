import {
  FileText, Layers, ClipboardCheck, ShieldAlert, RefreshCw,
  CheckCircle, Loader2, AlertTriangle, Clock, Brain,
  TrendingUp, Activity, ChevronRight, Cpu,
} from 'lucide-react'
import Badge from '../components/Badge'
import { agentData, agentTimeline } from '../data/mockData'

const iconMap: Record<string, any> = {
  'file-text': FileText, 'layers': Layers, 'clipboard-check': ClipboardCheck,
  'shield-alert': ShieldAlert, 'refresh-cw': RefreshCw,
}

const statusCfg = {
  completed: { label: 'Completed', variant: 'green'  as const, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  running:   { label: 'Running',   variant: 'blue'   as const, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  warning:   { label: 'Warning',   variant: 'orange' as const, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  error:     { label: 'Error',     variant: 'red'    as const, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

const timelineCfg = {
  start:    { color: '#2563eb', bg: '#eff6ff', dot: '#2563eb' },
  success:  { color: '#16a34a', bg: '#f0fdf4', dot: '#16a34a' },
  complete: { color: '#16a34a', bg: '#f0fdf4', dot: '#16a34a' },
  warning:  { color: '#ea580c', bg: '#fff7ed', dot: '#ea580c' },
  critical: { color: '#dc2626', bg: '#fef2f2', dot: '#dc2626' },
  info:     { color: '#64748b', bg: '#f8fafc', dot: '#94a3b8' },
  running:  { color: '#2563eb', bg: '#f0f9ff', dot: '#2563eb' },
}

export default function AgentInsights() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Agent Insights</h2>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            Real-time AI agent monitoring and performance analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="blue" dot pulse>5 Agents Active</Badge>
          <Badge variant="green">System Healthy</Badge>
        </div>
      </div>

      {/* System overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Agent Runs', value: '1,247', icon: Cpu,       color: '#2563eb' },
          { label: 'Avg Confidence',   value: '90.2%', icon: TrendingUp, color: '#16a34a' },
          { label: 'Findings',         value: '482',   icon: Brain,      color: '#7c3aed' },
          { label: 'Processing Time',  value: '18m 12s',icon: Clock,     color: '#d97706' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={13} style={{ color }} />
              <span className="text-xs" style={{ color: '#94a3b8' }}>{label}</span>
            </div>
            <div className="text-xl font-bold" style={{ color: '#0f172a' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agentData.map(agent => {
          const AgentIcon = iconMap[agent.icon] || Brain
          const cfg = statusCfg[agent.status as keyof typeof statusCfg]
          return (
            <div key={agent.id} className="agent-card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <AgentIcon size={18} style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>{agent.name}</h3>
                    <div className="text-xs" style={{ color: '#94a3b8', fontSize: '0.62rem' }}>{agent.model}</div>
                  </div>
                </div>
                <Badge variant={cfg.variant} dot={agent.status === 'running'} pulse={agent.status === 'running'}>
                  {cfg.label}
                </Badge>
              </div>

              {/* Confidence */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: '#94a3b8' }}>Confidence Score</span>
                  <span className="text-xs font-bold" style={{ color: cfg.color }}>{agent.confidence}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${agent.confidence}%`,
                    background: agent.status === 'warning'
                      ? 'linear-gradient(90deg,#d97706,#f59e0b)'
                      : `linear-gradient(90deg,${cfg.color}88,${cfg.color})`,
                  }} />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {Object.entries(agent.metrics).map(([key, val]) => (
                  <div key={key} className="p-2 rounded-lg text-center"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="text-sm font-bold" style={{ color: '#0f172a' }}>{val}</div>
                    <div style={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time */}
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Clock size={11} style={{ color: '#cbd5e1' }} />
                <span className="text-xs" style={{ color: '#94a3b8' }}>Processing Time:</span>
                <span className="text-xs font-semibold" style={{ color: '#2563eb' }}>{agent.processingTime}</span>
              </div>

              {/* Findings */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity size={11} style={{ color: '#94a3b8' }} />
                  <span className="text-xs font-semibold" style={{ color: '#64748b' }}>Latest Findings</span>
                </div>
                <div className="space-y-1">
                  {agent.latestFindings.slice(0, 3).map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ChevronRight size={9} style={{ color: cfg.color, flexShrink: 0, marginTop: 2 }} />
                      <span className="text-xs leading-relaxed" style={{ color: '#64748b', fontSize: '0.7rem' }}>
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Timeline */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-5">
          <Activity size={15} style={{ color: '#2563eb' }} />
          <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>Agent Activity Timeline</h3>
          <Badge variant="blue" dot pulse size="sm">Live</Badge>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {agentTimeline.map((event, i) => {
            const cfg = timelineCfg[event.type as keyof typeof timelineCfg] || timelineCfg.info
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl transition-all"
                style={{ background: cfg.bg, border: `1px solid ${cfg.dot}22` }}>
                <div className="flex-shrink-0 font-mono pt-0.5"
                  style={{ color: '#94a3b8', minWidth: 62, fontSize: '0.62rem' }}>
                  {event.time}
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: cfg.dot }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: cfg.color }}>
                      {event.agent}
                    </span>
                    {event.type === 'running' && (
                      <Loader2 size={10} style={{ color: cfg.color }} className="animate-spin" />
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{event.event}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
