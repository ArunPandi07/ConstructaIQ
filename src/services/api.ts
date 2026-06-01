// ─────────────────────────────────────────────────────────────
// BuildMind AI — Mock API Service Layer
//
// Each function mirrors the exact FastAPI endpoint signature.
// To switch to real backend: replace the mock body with
//   return apiClient.get<T>(path)
// Everything else (hooks, components) stays identical.
// ─────────────────────────────────────────────────────────────

import type {
  DashboardData, ProjectIntelligenceData, RiskIntelligenceData,
  RecoveryStrategy, ChangeImpactData, AgentInsightsData,
  UploadSessionResponse, ApiResponse,
} from '../types'
import {
  kpiData, projectHealthTrend, riskDistribution,
  recentAgentActivities, recentRecommendations,
  projectData, riskData, recoveryStrategies,
  changeImpactData, agentData, agentTimeline,
} from '../data/mockData'

// ── Utility: simulate network latency ────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function mockResponse<T>(data: T, delayMs = 800): Promise<ApiResponse<T>> {
  return delay(delayMs).then(() => ({
    data,
    status: 'success' as const,
    timestamp: new Date().toISOString(),
  }))
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD  →  GET /api/v1/dashboard
// FastAPI route: @router.get("/dashboard", response_model=DashboardData)
// ─────────────────────────────────────────────────────────────

export async function fetchDashboard(): Promise<ApiResponse<DashboardData>> {
  // TODO: return apiClient.get<DashboardData>('/dashboard')
  return mockResponse<DashboardData>({
    kpi: kpiData,
    healthTrend: projectHealthTrend,
    riskDistribution,
    recentActivities: recentAgentActivities as any,
    recentRecommendations: recentRecommendations as any,
  }, 900)
}

// ─────────────────────────────────────────────────────────────
// PROJECT UPLOAD  →  POST /api/v1/projects/upload
// FastAPI route: @router.post("/projects/upload")
// ─────────────────────────────────────────────────────────────

export async function uploadProjectFiles(
  _contractFile: File | null,
  _blueprintFile: File | null,
): Promise<ApiResponse<UploadSessionResponse>> {
  // Real implementation:
  // const form = new FormData()
  // if (contractFile)  form.append('contract',  contractFile)
  // if (blueprintFile) form.append('blueprint', blueprintFile)
  // return apiClient.postForm<UploadSessionResponse>('/projects/upload', form)

  await delay(1200)
  return {
    data: {
      sessionId: `sess-${Math.random().toString(36).slice(2, 10)}`,
      projectId: 'proj-tower-a-2024',
      status: 'processing',
      overallPct: 0,
      agentSteps: [
        { id: 'contract',  name: 'Contract Agent',  description: 'Extracting clauses & obligations',      duration: 2400, status: 'pending' },
        { id: 'blueprint', name: 'Blueprint Agent', description: 'Analyzing structural drawings',          duration: 4800, status: 'pending' },
        { id: 'permit',    name: 'Permit Agent',    description: 'Cross-referencing permit requirements',  duration: 1800, status: 'pending' },
        { id: 'risk',      name: 'Risk Agent',      description: 'Computing risk vectors & probabilities', duration: 6200, status: 'pending' },
        { id: 'recovery',  name: 'Recovery Agent',  description: 'Generating recovery strategies',         duration: 3400, status: 'pending' },
      ],
    },
    status: 'success',
    timestamp: new Date().toISOString(),
  }
}

// ─────────────────────────────────────────────────────────────
// UPLOAD STATUS  →  GET /api/v1/projects/upload/{sessionId}/status
// FastAPI: @router.get("/projects/upload/{session_id}/status")
// ─────────────────────────────────────────────────────────────

export async function fetchUploadStatus(
  _sessionId: string,
): Promise<ApiResponse<UploadSessionResponse>> {
  // TODO: return apiClient.get<UploadSessionResponse>(`/projects/upload/${sessionId}/status`)
  return mockResponse({ } as UploadSessionResponse, 300)
}

// ─────────────────────────────────────────────────────────────
// PROJECT INTELLIGENCE  →  GET /api/v1/projects/{projectId}/intelligence
// FastAPI: @router.get("/projects/{project_id}/intelligence")
// ─────────────────────────────────────────────────────────────

export async function fetchProjectIntelligence(
  _projectId: string,
): Promise<ApiResponse<ProjectIntelligenceData>> {
  // TODO: return apiClient.get<ProjectIntelligenceData>(`/projects/${projectId}/intelligence`)
  return mockResponse(projectData as ProjectIntelligenceData, 950)
}

// ─────────────────────────────────────────────────────────────
// RISK INTELLIGENCE  →  GET /api/v1/projects/{projectId}/risks
// FastAPI: @router.get("/projects/{project_id}/risks")
// ─────────────────────────────────────────────────────────────

export async function fetchRiskIntelligence(
  _projectId: string,
): Promise<ApiResponse<RiskIntelligenceData>> {
  // TODO: return apiClient.get<RiskIntelligenceData>(`/projects/${projectId}/risks`)
  return mockResponse(riskData as RiskIntelligenceData, 1100)
}

// ─────────────────────────────────────────────────────────────
// RECOVERY STRATEGIES  →  GET /api/v1/projects/{projectId}/recovery
// FastAPI: @router.get("/projects/{project_id}/recovery")
// ─────────────────────────────────────────────────────────────

export async function fetchRecoveryStrategies(
  _projectId: string,
): Promise<ApiResponse<RecoveryStrategy[]>> {
  // TODO: return apiClient.get<RecoveryStrategy[]>(`/projects/${projectId}/recovery`)
  return mockResponse(recoveryStrategies as RecoveryStrategy[], 850)
}

// ─────────────────────────────────────────────────────────────
// CHANGE IMPACT  →  POST /api/v1/projects/{projectId}/change-impact
// FastAPI: @router.post("/projects/{project_id}/change-impact")
// ─────────────────────────────────────────────────────────────

export async function analyzeChangeImpact(
  _projectId: string,
  _scenario: { type: string; value: unknown },
): Promise<ApiResponse<ChangeImpactData>> {
  // TODO: return apiClient.post<ChangeImpactData>(`/projects/${projectId}/change-impact`, scenario)
  return mockResponse(changeImpactData as ChangeImpactData, 1400)
}

// ─────────────────────────────────────────────────────────────
// AGENT INSIGHTS  →  GET /api/v1/projects/{projectId}/agents
// FastAPI: @router.get("/projects/{project_id}/agents")
// ─────────────────────────────────────────────────────────────

export async function fetchAgentInsights(
  _projectId: string,
): Promise<ApiResponse<AgentInsightsData>> {
  // TODO: return apiClient.get<AgentInsightsData>(`/projects/${projectId}/agents`)
  return mockResponse({
    agents: agentData as any,
    timeline: agentTimeline as any,
    summary: {
      totalRuns: 1247,
      avgConfidence: 90.2,
      totalFindings: 482,
      processingTime: '18m 12s',
    },
  } as AgentInsightsData, 750)
}

// ─────────────────────────────────────────────────────────────
// ACTIVATE RECOVERY STRATEGY  →  POST /api/v1/projects/{projectId}/recovery/activate
// ─────────────────────────────────────────────────────────────

export async function activateRecoveryStrategy(
  _projectId: string,
  strategyId: string,
): Promise<ApiResponse<{ activated: boolean; strategyId: string }>> {
  // TODO: return apiClient.post(`/projects/${projectId}/recovery/activate`, { strategyId })
  return mockResponse({ activated: true, strategyId }, 600)
}
