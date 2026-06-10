// ─────────────────────────────────────────────────────────────
// ConstructaIQ — Mock Service Layer
//
// Each function returns a resolved Promise<ApiResponse<T>>
// using data from mockData.ts.  When FastAPI is ready, swap
// these implementations for apiClient calls — the hook layer
// (usePageData.ts) requires no changes.
// ─────────────────────────────────────────────────────────────

import type {
  ApiResponse,
  DashboardData,
  ProjectIntelligenceData,
  RiskIntelligenceData,
  RecoveryStrategy,
  ChangeImpactData,
  AgentInsightsData,
  AgentActivityItem,
  RecommendationItem,
  AgentInfo,
  AgentTimelineEvent,
} from "../types";

import {
  kpiData,
  projectHealthTrend,
  riskDistribution,
  recentAgentActivities,
  recentRecommendations,
  projectData,
  riskData,
  recoveryStrategies,
  changeImpactData,
  agentData,
  agentTimeline,
} from "../data/mockData";

// ── Utility ───────────────────────────────────────────────────

const delay = (ms = 300) =>
  new Promise<void>((r) => setTimeout(r, ms + Math.random() * 100));

function ok<T>(data: T): ApiResponse<T> {
  return { data, status: "success", timestamp: new Date().toISOString() };
}

// ── Dashboard ─────────────────────────────────────────────────

export async function fetchDashboard(): Promise<ApiResponse<DashboardData>> {
  await delay();
  return ok<DashboardData>({
    kpi: {
      activeProjects: kpiData.activeProjects,
      riskProjects: kpiData.riskProjects,
      onTimeProjects: kpiData.onTimeProjects,
      totalBudget: kpiData.totalBudget,
      openRisks: kpiData.openRisks,
      recoveryPlans: kpiData.recoveryPlans,
    },
    healthTrend: projectHealthTrend,
    riskDistribution: riskDistribution,
    recentActivities: recentAgentActivities as AgentActivityItem[],
    recentRecommendations: recentRecommendations as RecommendationItem[],
  });
}

// ── Project Intelligence ──────────────────────────────────────

export async function fetchProjectIntelligence(): Promise<
//   _projectId: string,
  ApiResponse<ProjectIntelligenceData>
> {
  await delay();
  return ok<ProjectIntelligenceData>({
    name: projectData.name,
    projectId: projectData.projectId,
    client: projectData.client,
    location: projectData.location,
    budget: projectData.budget,
    duration: projectData.duration,
    startDate: projectData.startDate,
    endDate: projectData.endDate,
    floors: projectData.floors,
    complexity: projectData.complexity as ProjectIntelligenceData["complexity"],
    type: projectData.type,
    squareFootage: projectData.squareFootage,
    requiredPermits:
      projectData.requiredPermits as ProjectIntelligenceData["requiredPermits"],
    crewRequirements:
      projectData.crewRequirements as ProjectIntelligenceData["crewRequirements"],
    phases: projectData.phases as ProjectIntelligenceData["phases"],
  });
}

// ── Risk Intelligence ─────────────────────────────────────────

export async function fetchRiskIntelligence(): Promise<
//   _projectId: string,
  ApiResponse<RiskIntelligenceData>
> {
  await delay();
  return ok<RiskIntelligenceData>({
    overallScore: riskData.overallScore,
    trend: riskData.trend as RiskIntelligenceData["trend"],
    topRisks: riskData.topRisks as unknown as RiskIntelligenceData["topRisks"],
    heatmap: riskData.heatmap,
    reasoningChain:
      riskData.reasoningChain as RiskIntelligenceData["reasoningChain"],
  });
}

// ── Recovery Strategies ───────────────────────────────────────
//
// RecoveryCenter.tsx accesses: data.riskScore, data.strategies,
// data.aiConfidence — it treats the response as a wrapper object.
// We return a typed wrapper that satisfies both the page and the
// existing RecoveryStrategy[] hook signature via unknown cast.

export interface RecoveryCenterData {
  riskScore: number;
  aiConfidence: number;
  strategies: RecoveryStrategy[];
}

export async function fetchRecoveryStrategies(): Promise<ApiResponse<unknown>> {
//   _projectId: string,
  await delay();
  const wrapper: RecoveryCenterData = {
    riskScore: riskData.overallScore,
    aiConfidence: 85,
    strategies: recoveryStrategies.map((s) => ({
      ...s,
      risk: s.recommended ? "Low" : "Medium",
      confidence: s.aiConfidence,
      cost: s.costImpact,
      scheduleImpact: s.timeSaved,
      steps: s.details,
    })) as unknown as RecoveryStrategy[],
  };
  return ok(wrapper);
}

// Activate a strategy — fires-and-forgets in mock mode
export async function activateRecoveryStrategy(): Promise<
//   _projectId: string,
//   _strategyId: string,
  ApiResponse<{ activated: boolean }>
> {
  await delay(800);
  return ok({ activated: true });
}

// ── Change Impact ─────────────────────────────────────────────

export async function analyzeChangeImpact(): Promise<
//   _projectId: string,
//   _scenario: { type: string; value: number },
  ApiResponse<ChangeImpactData>
> {
  await delay(500);
  return ok<ChangeImpactData>({
    scenario: changeImpactData.scenario,
    description: changeImpactData.description,
    before: changeImpactData.before,
    after: changeImpactData.after,
    impacts: changeImpactData.impacts as ChangeImpactData["impacts"],
    dependencies:
      changeImpactData.dependencies as ChangeImpactData["dependencies"],
  });
}

// ── Agent Insights ────────────────────────────────────────────

export async function fetchAgentInsights(): Promise<
//   _projectId: string,
  ApiResponse<AgentInsightsData>
> {
  await delay();
  return ok<AgentInsightsData>({
    agents: agentData as unknown as AgentInfo[],
    timeline: agentTimeline as unknown as AgentTimelineEvent[],
    summary: {
      totalRuns: agentData.length,
      avgConfidence: Math.round(
        agentData.reduce((sum, a) => sum + a.confidence, 0) / agentData.length,
      ),
      totalFindings: agentData.reduce(
        (sum, a) => sum + a.latestFindings.length,
        0,
      ),
      processingTime: "18m 22s",
    },
  });
}

// ── Project Upload ────────────────────────────────────────────

export async function uploadProjectFiles(): Promise<
//   _contracts: unknown,
//   _blueprints: unknown,
  ApiResponse<{ sessionId: string; projectId: string }>
> {
  await delay(1200);
  return ok({ sessionId: "mock-session-001", projectId: "tower-a" });
}
