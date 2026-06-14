<<<<<<< HEAD
import { useEffect, useMemo } from "react";
import { Bot, Building2, Clock, Activity, AlertCircle } from "lucide-react";
=======
import { useEffect, useMemo, useState } from "react";
import { Bot, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
>>>>>>> 6e84e374aae6fa0583c5dc8c7c9abceff753715d
import Badge from "../components/Badge";
import AgentDetailPanel from "../components/agentInsights/AgentDetailPanel";
import AgentExecutionTimeline from "../components/agentInsights/AgentExecutionTimeline";
import AgentInsightsKpiRow from "../components/agentInsights/AgentInsightsKpiRow";
import AgentMasterList from "../components/agentInsights/AgentMasterList";
import AgentPipelineStrip from "../components/agentInsights/AgentPipelineStrip";
import { useAppContext } from "../context/AppContext";
<<<<<<< HEAD
import { useLoading } from "../context/LoadingContext";
import { useProjectAgents, useProjects } from "../hooks/usePageData";
import { ContentSkeleton } from "../components/Loader";
=======
import { useAgentInsights, useProjects } from "../hooks/usePageData";
>>>>>>> 6e84e374aae6fa0583c5dc8c7c9abceff753715d
import {
  isBackendProjectId,
  PIPELINE_AGENT_NAMES,
} from "../services/projectApi";
import {
  aggregateAgentUsage,
  countCompletedAgents,
  countErrorAgents,
  isAgentComplete,
  lastCompletedAt,
  latestByAgent,
} from "../utils/agentHelpers";
import { useStaggeredAnimation } from "../hooks/useScrollAnimation";

function defaultSelectedAgent(
  byAgent: Record<string, import("../types").AgentExecutionRead>,
): string {
  const completed = PIPELINE_AGENT_NAMES.find((name) =>
    isAgentComplete(byAgent[name]?.status),
  );
  return completed ?? PIPELINE_AGENT_NAMES[0];
}

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
    data,
    loading: insightsLoading,
    error,
  } = useAgentInsights(selectedId);

  const executions = data?.executions ?? [];
  const executionList = executions;
  const byAgent = useMemo(() => latestByAgent(executionList), [executionList]);
  const completedCount = countCompletedAgents(byAgent);
  const usage = aggregateAgentUsage(executionList);
  const errorCount = countErrorAgents(byAgent);
  const lastRun = lastCompletedAt(executionList);

  const [selectedAgent, setSelectedAgent] = useState<string>(PIPELINE_AGENT_NAMES[0]);

  useEffect(() => {
    setSelectedAgent(defaultSelectedAgent(byAgent));
  }, [selectedId, byAgent]);

  const handleProjectChange = (id: string) => {
    setActiveProjectId(id);
  };

<<<<<<< HEAD
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
=======
  const selectedRun = byAgent[selectedAgent];
>>>>>>> 6e84e374aae6fa0583c5dc8c7c9abceff753715d

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold gradient-text">AI Insights</h2>
          <p className="text-sm mt-0.5 text-stone-500">
            Agent execution audit for the active project pipeline
            {!projectsLoading && projects.length > 0 && (
              <span className="text-stone-400"> · {projects.length} projects loaded</span>
            )}
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
<<<<<<< HEAD
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
=======
          {isBackendProjectId(selectedId) && (
            <Link
              to={`/projects/${selectedId}`}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-[#F5C518]/20 border border-stone-200 rounded-xl px-3 py-2 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View project
            </Link>
          )}
        </div>
>>>>>>> 6e84e374aae6fa0583c5dc8c7c9abceff753715d
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

<<<<<<< HEAD
      {agentsLoading && isBackendProjectId(selectedId) && (
        <div className="pt-2">
          <ContentSkeleton variant="card" count={3} />
        </div>
=======
      {insightsLoading && isBackendProjectId(selectedId) && (
        <div className="text-sm text-stone-500">Loading agent executions…</div>
>>>>>>> 6e84e374aae6fa0583c5dc8c7c9abceff753715d
      )}

      {isBackendProjectId(selectedId) && !insightsLoading && (
        <>
<<<<<<< HEAD
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
=======
          <AgentPipelineStrip
            byAgent={byAgent}
            selectedAgent={selectedAgent}
            onSelect={setSelectedAgent}
          />

          <AgentInsightsKpiRow
            completedCount={completedCount}
            totalDurationSeconds={usage.totalDuration}
            lastRun={lastRun}
            errorCount={errorCount}
          />

          <p className="text-xs text-stone-500">
            Viewing: <strong>{project?.name ?? selectedId}</strong>
            {usage.avgDuration > 0 && ` · avg duration ${usage.avgDuration}s per run`}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 space-y-4">
              <AgentMasterList
                byAgent={byAgent}
                selectedAgent={selectedAgent}
                onSelect={setSelectedAgent}
              />
              <AgentExecutionTimeline executions={executionList} />
            </div>
            <div className="lg:col-span-8">
              <AgentDetailPanel agentName={selectedAgent} run={selectedRun} />
            </div>
>>>>>>> 6e84e374aae6fa0583c5dc8c7c9abceff753715d
          </div>

          {executionList.length === 0 && (
            <div className="glass-card p-6 text-center text-sm text-stone-500 flex items-center justify-center gap-2">
              <Bot className="w-4 h-4 text-stone-400" />
              No agent executions logged for this project yet.
            </div>
          )}
        </>
      )}
    </div>
  );
}
