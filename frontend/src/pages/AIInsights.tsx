import { useEffect, useMemo } from "react";
import { Bot, Building2, Clock, Activity, AlertCircle } from "lucide-react";
import Badge from "../components/Badge";
import { useAppContext } from "../context/AppContext";
import { useLoading } from "../context/LoadingContext";
import { useProjectAgents, useProjects } from "../hooks/usePageData";
import { ContentSkeleton } from "../components/Loader";
import {
  isBackendProjectId,
  PIPELINE_AGENT_NAMES,
} from "../services/projectApi";
import {
  aggregateAgentUsage,
  countCompletedAgents,
  latestByAgent,
  summarizeOutputJson,
} from "../utils/agentHelpers";
import { useStaggeredAnimation } from "../hooks/useScrollAnimation";

const statusCfg = {
  complete: { label: "Completed", variant: "green" as const },
  completed: { label: "Completed", variant: "green" as const },
  success: { label: "Completed", variant: "green" as const },
  running: { label: "Running", variant: "blue" as const },
  error: { label: "Error", variant: "red" as const },
  failed: { label: "Error", variant: "red" as const },
};

interface KpiDef {
  key: string;
  icon: typeof Building2;
  label: string;
  value: string | number;
  mono?: boolean;
}

export default function AIInsights() {
  const { activeProjectId, setActiveProjectId } = useAppContext();
  const { setLoading } = useLoading();
  const { projects, loading: projectsLoading } = useProjects();

  const backendProjects = projects.filter((p) => isBackendProjectId(p.id));
  const selectedId =
    (isBackendProjectId(activeProjectId) ? activeProjectId : null) ??
    backendProjects[0]?.id ??
    "";

  const project = projects.find((p) => p.id === selectedId);

  const {
    data: executions = [],
    loading: agentsLoading,
    error,
  } = useProjectAgents(selectedId);

  const executionList = executions ?? [];
  const byAgent = useMemo(() => latestByAgent(executionList), [executionList]);
  const completedCount = countCompletedAgents(byAgent);
  const usage = aggregateAgentUsage(executionList);

  const handleProjectChange = (id: string) => {
    setActiveProjectId(id);
  };

  useEffect(() => {
    setLoading("ai-insights", agentsLoading && isBackendProjectId(selectedId),
      agentsLoading && isBackendProjectId(selectedId) ? { message: "Loading agent executions" } : undefined,
    );
  }, [agentsLoading, selectedId, setLoading]);

  const kpis: KpiDef[] = useMemo(() => [
    { key: "projects", icon: Building2, label: "Projects loaded", value: projectsLoading ? "—" : projects.length },
    { key: "agents", icon: Bot, label: "Pipeline agents", value: PIPELINE_AGENT_NAMES.length },
    { key: "executions", icon: Activity, label: "Executions logged", value: executionList.length },
    { key: "tokens", icon: Clock, label: "Tokens used", value: usage.totalTokens.toLocaleString(), mono: true },
  ], [projectsLoading, projects.length, executionList.length, usage.totalTokens]);

  const kpiAnim = useStaggeredAnimation(kpis.length, { baseDelay: 100 });
  const agentAnim = useStaggeredAnimation(PIPELINE_AGENT_NAMES.length, { baseDelay: 80 });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold gradient-text">AI Insights</h2>
          <p className="text-sm mt-0.5 text-stone-500">
            Agent execution audit for the active project pipeline
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {backendProjects.length > 0 && (
            <select
              value={selectedId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="text-sm border border-stone-200 rounded-xl px-3 py-2 bg-white min-w-48 outline-none transition-all duration-200 focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
            >
              {backendProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <Badge variant="blue" dot>
            {completedCount}/{PIPELINE_AGENT_NAMES.length} agents run
          </Badge>
        </div>
      </div>

      <div ref={kpiAnim.containerRef} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={kpi.key} className="kpi-card p-4" style={kpiAnim.itemStyles[i]}>
            <div className="flex items-center gap-2 mb-2 text-stone-400 text-xs">
              <kpi.icon size={13} />
              {kpi.label}
            </div>
            <div className={`font-bold text-stone-900 ${kpi.mono ? "text-sm truncate font-mono" : "text-xl"}`}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {!isBackendProjectId(selectedId) && (
        <div className="glass-card p-10 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Bot size={24} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-700">No project selected</p>
              <p className="text-xs text-stone-400 mt-1">
                Create and analyze a project to view agent execution history.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="glass-card p-4 flex items-start gap-3 text-sm bg-red-50/50 border border-red-200">
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {agentsLoading && isBackendProjectId(selectedId) && (
        <div className="pt-2">
          <ContentSkeleton variant="card" count={3} />
        </div>
      )}

      {isBackendProjectId(selectedId) && !agentsLoading && (
        <>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>
              Viewing: <strong>{project?.name ?? selectedId}</strong>
            </span>
            <span className="text-stone-300">·</span>
            <span>avg duration {usage.avgDuration}s</span>
          </div>
          <div ref={agentAnim.containerRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {PIPELINE_AGENT_NAMES.map((name, i) => {
              const run = byAgent[name];
              const statusKey = (run?.status ?? "pending").toLowerCase();
              const cfg =
                statusCfg[statusKey as keyof typeof statusCfg] ?? {
                  label: run ? statusKey : "Not run",
                  variant: "gray" as const,
                };

              return (
                <div key={name} className="agent-card p-5 flex flex-col gap-3" style={agentAnim.itemStyles[i]}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900">{name}</h3>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  {run ? (
                    <dl className="text-xs text-stone-500 space-y-1">
                      {run.agent_version && (
                        <div>
                          <dt className="inline font-semibold">Version: </dt>
                          <dd className="inline">{run.agent_version}</dd>
                        </div>
                      )}
                      {run.duration_seconds != null && (
                        <div>
                          <dt className="inline font-semibold">Duration: </dt>
                          <dd className="inline">{run.duration_seconds}s</dd>
                        </div>
                      )}
                      {run.tokens_used != null && run.tokens_used > 0 && (
                        <div>
                          <dt className="inline font-semibold">Tokens: </dt>
                          <dd className="inline">
                            {run.tokens_used.toLocaleString()}
                          </dd>
                        </div>
                      )}
                      {run.completed_at && (
                        <div>
                          <dt className="inline font-semibold">Completed: </dt>
                          <dd className="inline">
                            {new Date(run.completed_at).toLocaleString()}
                          </dd>
                        </div>
                      )}
                      {run.output_json && (
                        <div className="mt-2 p-2 bg-stone-50 rounded-lg text-[10px] text-stone-600 leading-relaxed">
                          {summarizeOutputJson(run.output_json, 200)}
                        </div>
                      )}
                      {run.error_message && (
                        <div className="text-red-600">{run.error_message}</div>
                      )}
                    </dl>
                  ) : (
                    <p className="text-xs text-stone-400">
                      No execution recorded for this agent yet.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
