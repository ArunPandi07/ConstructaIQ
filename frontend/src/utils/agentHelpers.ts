import type { AgentExecutionRead } from '../types'
import { PIPELINE_AGENT_NAMES } from '../services/projectApi'
import { buildOutputSummaryText } from './agentOutputSummaries'

const COMPLETE = new Set(['complete', 'completed', 'success'])
const ERROR = new Set(['error', 'failed'])
const RUNNING = new Set(['running'])

export function latestByAgent(
  agents: AgentExecutionRead[],
): Record<string, AgentExecutionRead> {
  const map: Record<string, AgentExecutionRead> = {}
  for (const row of agents) {
    const name = row.agent_name
    if (!name) continue
    const prev = map[name]
    if (!prev || (row.execution_id ?? 0) > (prev.execution_id ?? 0)) {
      map[name] = row
    }
  }
  return map
}

export function agentStatusLabel(status: string | null | undefined): string {
  const s = (status ?? '').toLowerCase()
  if (COMPLETE.has(s)) return 'VERIFIED'
  if (ERROR.has(s)) return 'ERROR'
  if (RUNNING.has(s)) return 'RUNNING'
  return (status ?? 'PENDING').toUpperCase()
}

export function agentStatusStyle(status: string | null | undefined) {
  const s = (status ?? '').toLowerCase()
  if (COMPLETE.has(s)) {
    return {
      backgroundColor: '#F5C51820',
      color: '#F5C518',
      border: '1px solid #F5C51830',
    }
  }
  if (ERROR.has(s)) {
    return {
      backgroundColor: '#ef444420',
      color: '#ef4444',
      border: '1px solid #ef444430',
    }
  }
  if (RUNNING.has(s)) {
    return {
      backgroundColor: '#0ea5e920',
      color: '#0ea5e9',
      border: '1px solid #0ea5e930',
    }
  }
  return {
    backgroundColor: '#78716c20',
    color: '#a8a29e',
    border: '1px solid #78716c30',
  }
}

export function countErrorAgents(byAgent: Record<string, AgentExecutionRead>): number {
  return PIPELINE_AGENT_NAMES.filter((name) => {
    const s = byAgent[name]?.status?.toLowerCase()
    return s != null && ERROR.has(s)
  }).length
}

export function lastCompletedAt(agents: AgentExecutionRead[]): string | null {
  let latest: string | null = null
  for (const a of agents) {
    const t = a.completed_at ?? a.started_at
    if (!t) continue
    if (!latest || new Date(t) > new Date(latest)) latest = t
  }
  return latest
}

export function isAgentComplete(status: string | null | undefined): boolean {
  const s = (status ?? '').toLowerCase()
  return COMPLETE.has(s)
}

export function countCompletedAgents(byAgent: Record<string, AgentExecutionRead>): number {
  return PIPELINE_AGENT_NAMES.filter((name) => isAgentComplete(byAgent[name]?.status)).length
}

export function aggregateAgentUsage(agents: AgentExecutionRead[]) {
  const totalDuration = agents.reduce((sum, a) => sum + (a.duration_seconds ?? 0), 0)
  const totalTokens = agents.reduce((sum, a) => sum + (a.tokens_used ?? 0), 0)
  const totalRuns = agents.length
  const avgDuration =
    totalRuns > 0 ? Math.round(totalDuration / totalRuns) : 0
  return { totalDuration, totalTokens, totalRuns, avgDuration }
}

const AGENT_ICONS: Record<string, string> = {
  ContractAgent: '📜',
  BlueprintAgent: '📐',
  PermitAgent: '🏛️',
  ScheduleAgent: '🗓️',
  SupplierAgent: '🚚',
  CrewAgent: '👷',
}

export function agentIcon(name: string): string {
  return AGENT_ICONS[name] ?? '🤖'
}

export function summarizeOutputJson(raw: string | null | undefined, max = 120): string {
  return buildOutputSummaryText(raw, max)
}
