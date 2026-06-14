import { useAsync } from "./useAsync";
import { useAppContext } from "../context/AppContext";
import { fetchDashboard } from '../services/api'
import { getDashboardCache, setDashboardCache } from '../services/dashboardCache'
import { fetchProjectIntelligence } from "../services/api";
import { fetchRiskIntelligence } from "../services/api";
import { fetchRecoveryStrategies } from "../services/api";
import { analyzeChangeImpact } from "../services/api";
import { buildAgentInsightsData } from "../services/api";
import { getProjectAgents, isBackendProjectId } from "../services/projectApi";
import type { RecoveryCenterData } from "../services/api";
import type {
  AgentExecutionRead,
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

const intelligenceCache = new Map<string, { data: ProjectIntelligenceData; at: number }>()
const INTEL_TTL_MS = 5 * 60_000

export function clearIntelligenceCache(projectId: string) {
  intelligenceCache.delete(projectId)
}

/** Hydrated project list from AppContext */
export function useProjects() {
  const {
    projects,
    projectsLoading,
    projectsError,
    refreshProjects,
  } = useAppContext();
  return { projects, loading: projectsLoading, error: projectsError, refreshProjects };
}

/** Dashboard KPIs, charts, and recent activity */
export function useDashboard() {
  return useAsync<DashboardData>(async () => {
    const cached = getDashboardCache()
    if (cached) {
      return { data: cached.data }
    }
    const res = await fetchDashboard({ includeProjects: true })
    const { projects, ...dashboardOnly } = res.data
    void projects
    setDashboardCache(dashboardOnly)
    return { data: dashboardOnly }
  });
}

/** Project intelligence — permits, crew, phases */
export function useProjectIntelligence(projectId: string) {
  return useAsync<ProjectIntelligenceData>(
    async () => {
      const cached = intelligenceCache.get(projectId)
      if (cached && Date.now() - cached.at < INTEL_TTL_MS) {
        return { data: cached.data }
      }
      const res = await fetchProjectIntelligence(projectId)
      intelligenceCache.set(projectId, { data: res.data, at: Date.now() })
      return res
    },
    [projectId],
  )
}

/** Risk score, heatmap, reasoning chain, top risks */
export function useRiskIntelligence(projectId: string) {
  return useAsync<RiskIntelligenceData>(
    () => fetchRiskIntelligence(projectId),
    [projectId],
  );
}

/** Recovery strategies wrapper — includes riskScore, aiConfidence, strategies[] */
export function useRecoveryStrategies(projectId: string) {
  return useAsync<RecoveryCenterData>(
    () =>
      fetchRecoveryStrategies(projectId) as Promise<{ data: RecoveryCenterData }>,
    [projectId],
  );
}

/** Change impact analysis — scenario must trigger a POST */
export function useChangeImpact(projectId: string) {
  return useAsync<ChangeImpactData>(
    () => analyzeChangeImpact(projectId, { type: "add_floor", value: 1 }),
    [projectId],
  );
}

/** Agent insights — agent cards + timeline + raw executions (single fetch) */
export function useAgentInsights(projectId: string) {
  return useAsync<{ insights: AgentInsightsData; executions: AgentExecutionRead[] }>(
    async () => {
      if (!isBackendProjectId(projectId)) {
        return {
          data: {
            insights: {
              agents: [],
              timeline: [],
              summary: {
                totalRuns: 0,
                avgConfidence: 0,
                totalFindings: 0,
                processingTime: "0s",
              },
            },
            executions: [],
          },
        };
      }
      const agentsRes = await getProjectAgents(Number(projectId));
      return {
        data: {
          insights: buildAgentInsightsData(agentsRes.agents),
          executions: agentsRes.agents,
        },
      };
    },
    [projectId],
  );
}

/** Raw agent execution rows for a project */
const agentsCache = new Map<string, { data: AgentExecutionRead[]; at: number }>()
const AGENTS_TTL_MS = 2 * 60_000

export function clearAgentsCache(projectId: string) {
  agentsCache.delete(projectId)
}

export function useProjectAgents(projectId: string) {
  return useAsync<AgentExecutionRead[]>(
    async () => {
      if (!isBackendProjectId(projectId)) return { data: [] };
      const cached = agentsCache.get(projectId)
      if (cached && Date.now() - cached.at < AGENTS_TTL_MS) {
        return { data: cached.data }
      }
      const res = await getProjectAgents(Number(projectId));
      agentsCache.set(projectId, { data: res.agents, at: Date.now() })
      return { data: res.agents };
    },
    [projectId],
  );
}
