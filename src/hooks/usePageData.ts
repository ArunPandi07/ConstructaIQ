import { useAsync } from "./useAsync";
import { fetchDashboard } from "../services/api";
import { fetchProjectIntelligence } from "../services/api";
import { fetchRiskIntelligence } from "../services/api";
import { fetchRecoveryStrategies } from "../services/api";
import { analyzeChangeImpact } from "../services/api";
import { fetchAgentInsights } from "../services/api";
import type { RecoveryCenterData } from "../services/api";
import type {
  DashboardData,
  ProjectIntelligenceData,
  RiskIntelligenceData,
  ChangeImpactData,
  AgentInsightsData,
} from "../types";

// ─────────────────────────────────────────────────────────────
// One hook per page — each wraps useAsync with the correct fetcher.
// When FastAPI is live, only the service functions need changing.
// ─────────────────────────────────────────────────────────────

/** Dashboard KPIs, charts, and recent activity */
export function useDashboard() {
  return useAsync<DashboardData>(fetchDashboard);
}

/** Project intelligence — permits, crew, phases */
export function useProjectIntelligence(projectId: string) {
  return useAsync<ProjectIntelligenceData>(
    () =>
      fetchProjectIntelligence(),
      // projectId
    [projectId],
  );
}

/** Risk score, heatmap, reasoning chain, top risks */
export function useRiskIntelligence(projectId: string) {
  return useAsync<RiskIntelligenceData>(
    () =>
      fetchRiskIntelligence(),
      // projectId
    [projectId],
  );
}

/** Recovery strategies wrapper — includes riskScore, aiConfidence, strategies[] */
export function useRecoveryStrategies(projectId: string) {
  return useAsync<RecoveryCenterData>(
    () =>
      fetchRecoveryStrategies() as Promise<{ data: RecoveryCenterData }>,
      // projectId
    [projectId],
  );
}

/** Change impact analysis — scenario must trigger a POST */
export function useChangeImpact(projectId: string) {
  return useAsync<ChangeImpactData>(
    () =>
      analyzeChangeImpact(),
      // projectId, { type: "add_floor", value: 1 }
    [projectId],
  );
}

/** Agent insights — agent cards + timeline */
export function useAgentInsights(projectId: string) {
  return useAsync<AgentInsightsData>(
    () =>
      fetchAgentInsights(),
      // projectId
    [projectId],
  );
}
