// ─────────────────────────────────────────────────────────────
// ConstructaIQ — API service layer (backend-backed)
// ─────────────────────────────────────────────────────────────

import type {
  AgentExecutionRead,
  AgentInsightsData,
  ApiResponse,
  ChangeImpactData,
  DashboardApiResponse,
  DashboardData,
  ProjectIntelligenceData,
  ProjectListItem,
  RecoveryStrategy,
  RiskIntelligenceData,
} from '../types'
import { apiClient } from './apiClient'
import {
  getProjectAgents,
  getProjectSummary,
  isBackendProjectId,
  listProjects,
  mapProjectListToUI,
  PIPELINE_AGENT_NAMES,
} from './projectApi'
import { ApiError } from './apiClient'

function ok<T>(data: T): ApiResponse<T> {
  return { data, status: 'success', timestamp: new Date().toISOString() }
}

/** Build insights view-model from already-fetched execution rows (no extra network). */
export function buildAgentInsightsData(agents: AgentExecutionRead[]): AgentInsightsData {
  const totalRuns = agents.length
  const totalDuration = agents.reduce(
    (sum, a) => sum + (a.duration_seconds ?? 0),
    0,
  )
  const totalTokens = agents.reduce((sum, a) => sum + (a.tokens_used ?? 0), 0)
  const completed = agents.filter((a) => {
    const s = (a.status ?? '').toLowerCase()
    return s === 'complete' || s === 'completed' || s === 'success'
  }).length

  return {
    agents: PIPELINE_AGENT_NAMES.map((name) => {
      const latest = [...agents]
        .filter((a) => a.agent_name === name)
        .sort((a, b) => (b.execution_id ?? 0) - (a.execution_id ?? 0))[0]
      return {
        id: name,
        name,
        icon: 'Bot',
        status: (latest?.status?.toLowerCase() === 'error'
          ? 'error'
          : latest?.status?.toLowerCase() === 'running'
            ? 'running'
            : 'complete') as 'complete' | 'running' | 'error' | 'warning',
        confidence: latest ? 85 : 0,
        processingTime: latest?.duration_seconds
          ? `${latest.duration_seconds}s`
          : '—',
        model: latest?.agent_version ?? 'default',
        latestFindings: latest?.error_message
          ? [latest.error_message]
          : latest?.output_json
            ? [latest.output_json.slice(0, 200)]
            : [],
        metrics: {
          tokens: latest?.tokens_used ?? 0,
          duration: latest?.duration_seconds ?? 0,
        },
      }
    }),
    timeline: agents.slice(0, 20).map((a) => ({
      time: a.completed_at ?? a.started_at ?? '',
      agent: a.agent_name ?? 'Agent',
      event: a.status ?? 'unknown',
      type: (a.status?.toLowerCase() === 'error' ? 'critical' : 'success') as
        | 'success'
        | 'critical',
    })),
    summary: {
      totalRuns,
      avgConfidence: completed > 0 ? Math.round((completed / PIPELINE_AGENT_NAMES.length) * 100) : 0,
      totalFindings: totalTokens,
      processingTime: totalDuration > 0 ? `${totalDuration}s` : '0s',
    },
  }
}

function mapDashboardResponse(raw: DashboardApiResponse): DashboardData {
  return {
    kpi: {
      activeProjects: raw.kpi.active_projects,
      riskProjects: raw.kpi.risk_projects,
      onTimeProjects: raw.kpi.on_time_projects,
      totalBudget: raw.kpi.total_budget,
      openRisks: raw.kpi.open_risks,
      recoveryPlans: raw.kpi.recovery_plans,
    },
    healthTrend: raw.health_trend ?? [],
    riskDistribution: raw.risk_distribution ?? [],
    recentActivities: (raw.recent_activities ?? []).map((a) => ({
      id: a.id,
      agent: a.agent,
      action: a.action,
      time: a.time,
      severity: a.severity,
      icon: 'Bot',
    })),
    recentRecommendations: (raw.recent_recommendations ?? []).map((r) => ({
      id: r.id,
      project: r.project,
      recommendation: r.recommendation,
      confidence: r.confidence,
      impact: r.impact,
      category: r.category,
    })),
    totalTokensRecent: raw.total_tokens_recent ?? 0,
    meanProgress: undefined,
  }
}

function buildDashboardFromProjects(): DashboardData {
  return {
    kpi: {
      activeProjects: 0,
      riskProjects: 0,
      onTimeProjects: 0,
      totalBudget: '$0',
      openRisks: 0,
      recoveryPlans: 0,
    },
    healthTrend: [],
    riskDistribution: [],
    recentActivities: [],
    recentRecommendations: [],
    totalTokensRecent: 0,
  }
}

export async function fetchDashboard(
  options?: { includeProjects?: boolean },
): Promise<ApiResponse<DashboardData & { projects?: ProjectListItem[] }>> {
  try {
    const params: Record<string, string> = {}
    if (options?.includeProjects) params.include_projects = 'true'
    const res = await apiClient.get<DashboardApiResponse>('/dashboard', params)
    const mapped = mapDashboardResponse(res.data)
    return ok({
      ...mapped,
      projects: res.data.projects,
    })
  } catch {
    try {
      const items = await listProjects()
      const projects = mapProjectListToUI(items)
      const active = projects.filter((p) => p.status === 'LIVE')
      let total = 0
      active.forEach((p) => {
        const num = parseFloat(p.budget.replace(/[^0-9.]/g, ''))
        if (!isNaN(num)) total += num
      })
      const meanProgress =
        active.length === 0
          ? 0
          : Math.round(
              active.reduce((acc, p) => acc + p.progress, 0) / active.length,
            )
      return ok({
        ...buildDashboardFromProjects(),
        kpi: {
          activeProjects: active.length,
          riskProjects: 0,
          onTimeProjects: active.length,
          totalBudget: `$${total.toFixed(1)}M`,
          openRisks: 0,
          recoveryPlans: 0,
        },
        meanProgress,
      })
    } catch {
      return ok(buildDashboardFromProjects())
    }
  }
}

export async function fetchProjectIntelligence(
  projectId: string,
): Promise<ApiResponse<ProjectIntelligenceData>> {
  if (!isBackendProjectId(projectId)) {
    throw new ApiError('Invalid project id', 400)
  }
  const summary = await getProjectSummary(Number(projectId))
  return ok(summary.intelligence)
}

export async function fetchRiskIntelligence(
  _projectId: string,
): Promise<ApiResponse<RiskIntelligenceData>> {
  throw new ApiError('Risk intelligence is not available in the 6-agent pipeline.', 501)
}

export interface RecoveryCenterData {
  riskScore: number
  aiConfidence: number
  strategies: RecoveryStrategy[]
}

export async function fetchRecoveryStrategies(
  projectId: string,
): Promise<ApiResponse<unknown>> {
  if (isBackendProjectId(projectId)) {
    const res = await apiClient.get<any>(`/projects/${projectId}/recovery-strategies`);
    return { data: res.data, status: 'success', timestamp: new Date().toISOString() };
  }
  return { data: { strategies: [] }, status: 'success', timestamp: new Date().toISOString() };
}

export async function activateRecoveryStrategy(
  _projectId: string,
  _strategyId: string,
): Promise<ApiResponse<{ activated: boolean }>> {
  return { data: { activated: true }, status: 'success', timestamp: new Date().toISOString() };
}

export async function analyzeChangeImpact(
  projectId: string,
  scenario: { type: string; value: number },
): Promise<ApiResponse<ChangeImpactData>> {
  if (isBackendProjectId(projectId)) {
    const res = await apiClient.post<any>(`/projects/${projectId}/change-impact`, scenario);
    return { data: res.data.impact, status: 'success', timestamp: new Date().toISOString() };
  }
  return { data: null as any, status: 'success', timestamp: new Date().toISOString() };
}

export async function fetchAgentInsights(
  projectId: string,
): Promise<ApiResponse<AgentInsightsData>> {
  if (!isBackendProjectId(projectId)) {
    throw new ApiError('Invalid project id', 400)
  }
  const res = await getProjectAgents(Number(projectId))
  return ok(buildAgentInsightsData(res.agents))
}

export async function uploadProjectFiles(): Promise<
  ApiResponse<{ sessionId: string; projectId: string }>
> {
  throw new ApiError('Use New Project modal for upload and analyze.', 400)
}
